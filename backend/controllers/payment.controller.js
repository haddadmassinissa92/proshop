// controllers/payment.controller.js
//
// Intégration du paiement par carte CIB / Edahabia, via SATIM (l'opérateur
// monétique interbancaire algérien). SATIM gère les deux cartes (CIB des
// banques et Edahabia d'Algérie Poste) avec la MÊME passerelle : une fois
// que ton contrat est validé, le client choisit sa carte directement sur la
// page de paiement SATIM — pas besoin d'une intégration séparée pour chacune.
//
// IMPORTANT — à lire avant de mettre en production :
//
// Ce module nécessite une démarche administrative AVANT de fonctionner :
//   1. Immatriculation de l'activité (registre de commerce).
//   2. Contrat "Vente à Distance" (VAD) avec une banque partenaire SATIM
//      (BNA, BEA, CPA...) — ou directement avec Algérie Poste pour Edahabia.
//   3. Certification technique par SATIM (délai : quelques semaines).
// SATIM te fournit alors de vrais identifiants marchands (SATIM_USERNAME /
// SATIM_PASSWORD) et une URL d'environnement de test avant la mise en prod.
//
// Le code ci-dessous suit le format d'API le plus couramment documenté pour
// la passerelle SATIM (endpoints register.do / getOrderStatus.do). À
// VÉRIFIER contre la documentation officielle transmise par SATIM une fois
// le contrat signé : certains noms de champs peuvent légèrement varier
// d'une intégration à l'autre.

const Order = require('../models/order.model');
const User = require('../models/user.model');
const { sendOrderConfirmationEmail } = require('../utils/email');

// Récupère une commande et vérifie que l'utilisateur connecté en est bien
// le propriétaire (ou un admin) avant de lancer un paiement dessus.
const getOwnedOrder = async (req) => {
    const order = await Order.findById(req.params.orderId);
    if (!order) return { error: { status: 404, message: 'Commande non trouvée' } };
    if (order.user.toString() !== req.user.id && req.user.role !== 'admin') {
        return { error: { status: 403, message: 'Accès refusé pour cette commande' } };
    }
    if (order.isPaid) {
        return { error: { status: 400, message: 'Cette commande est déjà payée.' } };
    }
    return { order };
};

// @desc    Enregistre la commande auprès de SATIM et renvoie l'URL du
//          formulaire de paiement CIB/Edahabia vers laquelle rediriger
//          le client.
// @route   POST /api/payments/cib/register/:orderId
// @access  Utilisateur authentifié (propriétaire de la commande)
const createCibPayment = async (req, res) => {
    try {
        if (!process.env.SATIM_USERNAME || !process.env.SATIM_PASSWORD) {
            return res.status(503).json({
                message: "Le paiement par carte CIB/Edahabia n'est pas encore configuré. " +
                    "Il faut d'abord un contrat VAD avec une banque partenaire SATIM (ou Algérie Poste) et les identifiants qu'elle te fournira."
            });
        }

        const { order, error } = await getOwnedOrder(req);
        if (error) return res.status(error.status).json({ message: error.message });

        const base = process.env.SATIM_URL || 'https://test.satim.dz';
        // SATIM attend le montant dans la plus petite unité (centimes de DA).
        const amount = Math.round(order.totalPrice * 100);

        const params = new URLSearchParams({
            userName: process.env.SATIM_USERNAME,
            password: process.env.SATIM_PASSWORD,
            orderNumber: order._id.toString(),
            amount: amount.toString(),
            currency: '012', // code devise DZD (ISO 4217 numérique)
            returnUrl: `${process.env.SERVER_URL}/api/payments/cib/return?orderId=${order._id}`,
            failUrl: `${process.env.SERVER_URL}/api/payments/cib/fail?orderId=${order._id}`,
            language: 'FR',
        });

        const response = await fetch(`${base}/payment/rest/register.do?${params.toString()}`, { method: 'POST' });
        const data = await response.json();

        if (data.errorCode && data.errorCode !== '0') {
            console.error('Erreur SATIM register.do:', data);
            return res.status(502).json({ message: data.errorMessage || 'Erreur lors de l\'enregistrement du paiement CIB/Edahabia.' });
        }

        // On garde une trace de l'ID de transaction SATIM pour pouvoir
        // vérifier le statut au retour du client.
        order.paymentResult = { id: data.orderId, status: 'pending', update_time: new Date().toISOString() };
        await order.save();

        res.status(200).json({ formUrl: data.formUrl });
    } catch (error) {
        console.error('Erreur CIB/SATIM (register):', error);
        res.status(500).json({ message: 'Erreur lors de la création du paiement CIB/Edahabia', error: error.message });
    }
};

// @desc    Point de retour après paiement CIB/Edahabia réussi côté SATIM.
//          SATIM redirige le navigateur du client ici ; on vérifie le VRAI
//          statut auprès de SATIM (jamais confiance aux seuls paramètres
//          d'URL, qui pourraient être falsifiés) puis on redirige vers la
//          page de confirmation du frontend.
// @route   GET /api/payments/cib/return
// @access  Public (appelé par le navigateur du client, pas par SATIM en direct)
const cibReturn = async (req, res) => {
    try {
        const { orderId } = req.query;
        const order = await Order.findById(orderId);
        if (!order) return res.redirect(`${process.env.CLIENT_URL}/`);

        const base = process.env.SATIM_URL || 'https://test.satim.dz';
        const params = new URLSearchParams({
            userName: process.env.SATIM_USERNAME,
            password: process.env.SATIM_PASSWORD,
            orderId: order.paymentResult?.id || '',
        });

        const response = await fetch(`${base}/payment/rest/getOrderStatus.do?${params.toString()}`);
        const data = await response.json();

        // orderStatus === 2 signifie "paiement déposé avec succès" côté SATIM.
        if (data.orderStatus === 2 && !order.isPaid) {
            order.isPaid = true;
            order.paidAt = Date.now();
            order.status = 'Confirmée';
            order.paymentResult = {
                id: order.paymentResult?.id,
                status: 'paid',
                update_time: new Date().toISOString(),
            };
            await order.save();

            // Email de confirmation envoyé maintenant que le paiement est
            // réellement confirmé (pas avant, contrairement au paiement à
            // la livraison qui est confirmé dès la création — voir
            // order.controller.js -> addOrderItems). Sans "await" : ne
            // retarde jamais la redirection du client vers sa commande.
            User.findById(order.user)
                .then(user => {
                    if (user) {
                        sendOrderConfirmationEmail({
                            to: user.email,
                            userName: user.firstName,
                            order,
                        });
                    }
                })
                .catch(err => console.error("[email] Impossible de récupérer l'utilisateur pour l'email de confirmation:", err.message));
        }

        res.redirect(`${process.env.CLIENT_URL}/order/${order._id}?new=1`);
    } catch (error) {
        console.error('Erreur CIB/SATIM (return):', error);
        res.redirect(`${process.env.CLIENT_URL}/place-order`);
    }
};

// @desc    Point de retour après échec/annulation du paiement CIB/Edahabia.
// @route   GET /api/payments/cib/fail
// @access  Public
const cibFail = async (req, res) => {
    res.redirect(`${process.env.CLIENT_URL}/place-order?payment=failed`);
};

module.exports = {
    createCibPayment,
    cibReturn,
    cibFail,
};
