// controllers/chargily.controller.js
//
// Paiement en ligne par carte EDAHABIA / CIB via Chargily Pay.
//
// Flux :
//   1. Le frontend crée la commande (POST /api/orders), puis appelle
//      createChargilyCheckout -> on reçoit l'URL de la page de paiement.
//   2. Le client paie sur la page Chargily, puis revient sur le site.
//   3. Chargily appelle NOTRE webhook (chargilyWebhook) : c'est lui, et lui
//      seul, qui marque la commande comme payée. Le retour du navigateur
//      (success_url) ne prouve rien : n'importe qui peut ouvrir cette URL.

const Order = require('../models/order.model');
const User = require('../models/user.model');
const { sendOrderConfirmationEmail } = require('../utils/email');
const chargily = require('../utils/chargily');

// Cartes acceptées côté Chargily (valeurs attendues par leur API).
const ALLOWED_CARDS = ['edahabia', 'cib'];

// @desc    Crée une session de paiement Chargily pour une commande et renvoie
//          l'URL de la page de paiement.
// @route   POST /api/payments/chargily/checkout/:orderId
// @access  Utilisateur authentifié (propriétaire de la commande)
const createChargilyCheckout = async (req, res) => {
    try {
        if (!chargily.isConfigured()) {
            return res.status(503).json({ message: "Le paiement en ligne n'est pas configuré sur ce serveur." });
        }

        const order = await Order.findById(req.params.orderId);
        if (!order) {
            return res.status(404).json({ message: 'Commande non trouvée' });
        }
        if (order.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Accès refusé pour cette commande' });
        }
        if (order.isPaid) {
            return res.status(400).json({ message: 'Cette commande est déjà payée.' });
        }
        if (order.paymentMethod !== 'Carte CIB/Edahabia') {
            return res.status(400).json({ message: "Cette commande n'est pas à régler par carte." });
        }

        // Le montant vient TOUJOURS de la base de données, jamais du frontend.
        const amount = Math.round(order.totalPrice);
        if (!Number.isFinite(amount) || amount <= 0) {
            return res.status(400).json({ message: 'Montant de commande invalide.' });
        }

        const card = ALLOWED_CARDS.includes(req.body?.card) ? req.body.card : 'edahabia';

        const checkout = await chargily.createCheckout({
            amount,
            currency: 'dzd',
            payment_method: card,
            success_url: `${process.env.CLIENT_URL}/order/${order._id}?new=1`,
            failure_url: `${process.env.CLIENT_URL}/place-order?payment=failed`,
            locale: 'fr',
            // true = les frais Chargily sont ajoutés à la facture du client.
            pass_fees_to_customer: process.env.CHARGILY_PASS_FEES === 'true',
            description: `Commande ProShop #${order._id.toString().slice(-6)}`,
            metadata: { order_id: order._id.toString() },
        });

        // On garde l'ID de la session : c'est lui qui permettra au webhook de
        // retrouver la commande.
        order.paymentResult = {
            id: checkout.id,
            status: 'pending',
            update_time: new Date().toISOString(),
        };
        await order.save();

        res.status(200).json({ checkoutUrl: checkout.checkout_url });
    } catch (error) {
        console.error('Erreur Chargily (checkout):', error.message, error.details || '');
        res.status(502).json({ message: "Impossible de lancer le paiement pour l'instant. Réessayez dans un instant." });
    }
};

// @desc    Webhook appelé par Chargily à chaque changement d'état d'un paiement.
// @route   POST /api/payments/chargily/webhook
// @access  Public, mais protégé par la vérification de signature.
// ATTENTION : cette route reçoit le corps BRUT (Buffer) via express.raw,
// montée dans app.js AVANT express.json().
const chargilyWebhook = async (req, res) => {
    try {
        if (!chargily.isConfigured()) return res.sendStatus(503);

        // 1) Authenticité : la requête vient bien de Chargily.
        if (!chargily.verifyWebhookSignature(req.body, req.get('signature'))) {
            console.warn('[chargily] webhook rejeté : signature absente ou invalide');
            return res.sendStatus(403);
        }

        let event;
        try {
            event = JSON.parse(req.body.toString('utf8'));
        } catch {
            return res.sendStatus(400);
        }

        const checkoutId = event?.data?.id;
        console.log(`[chargily] webhook reçu : ${event?.type} (${checkoutId})`);
        if (!checkoutId) return res.sendStatus(200);

        // 2) Paiement réussi.
        if (event.type === 'checkout.paid') {
            const order = await Order.findOne({ 'paymentResult.id': checkoutId });
            if (!order) {
                console.warn(`[chargily] aucune commande pour la session ${checkoutId}`);
                return res.sendStatus(200);
            }

            // Double vérification : on relit le statut chez Chargily plutôt que
            // de croire le contenu du webhook. En cas d'erreur réseau on répond
            // 500 pour que Chargily réessaie plus tard.
            const remote = await chargily.getCheckout(checkoutId);
            if (remote.status !== 'paid') {
                console.warn(`[chargily] session ${checkoutId} non payée côté Chargily (${remote.status})`);
                return res.sendStatus(200);
            }
            // Le client ne doit pas avoir payé MOINS que le total de la commande
            // (il peut payer plus si les frais lui sont facturés).
            if (Number(remote.amount) < Math.round(order.totalPrice)) {
                console.error(`[chargily] montant insuffisant pour la commande ${order._id}`);
                return res.sendStatus(200);
            }

            // Mise à jour atomique : si le webhook arrive deux fois, une seule
            // des deux requêtes trouve la commande avec isPaid:false.
            const paidOrder = await Order.findOneAndUpdate(
                { _id: order._id, isPaid: false },
                {
                    $set: {
                        isPaid: true,
                        paidAt: new Date(),
                        status: 'Confirmée',
                        'paymentResult.status': 'paid',
                        'paymentResult.update_time': new Date().toISOString(),
                    },
                },
                { new: true }
            );

            if (paidOrder) {
                // Sans "await" : n'empêche jamais de répondre 200 à Chargily.
                User.findById(paidOrder.user)
                    .then((user) => {
                        if (user) {
                            sendOrderConfirmationEmail({
                                to: user.email,
                                userName: user.firstName,
                                order: paidOrder,
                            });
                        }
                    })
                    .catch((err) => console.error('[email] utilisateur introuvable pour la confirmation :', err.message));
            }
            return res.sendStatus(200);
        }

        // 3) Paiement échoué, annulé ou expiré : on garde une trace, sans toucher
        //    à une commande déjà payée.
        if (['checkout.failed', 'checkout.canceled', 'checkout.expired'].includes(event.type)) {
            await Order.updateOne(
                { 'paymentResult.id': checkoutId, isPaid: false },
                {
                    $set: {
                        'paymentResult.status': 'failed',
                        'paymentResult.update_time': new Date().toISOString(),
                    },
                }
            );
        }

        // Tout autre événement est ignoré, mais acquitté.
        res.sendStatus(200);
    } catch (error) {
        console.error('Erreur Chargily (webhook):', error.message);
        res.sendStatus(500);
    }
};

module.exports = {
    createChargilyCheckout,
    chargilyWebhook,
};