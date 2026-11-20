// controllers/order.controller.js

const mongoose = require('mongoose');

// Importation des modèles nécessaires pour les opérations sur les commandes et produits
const Order = require('../models/order.model');
const Product = require('../models/product.model');
const User = require('../models/user.model');
const { sendOrderConfirmationEmail } = require('../utils/email');
const { releaseStock } = require('../utils/stock');


const addOrderItems = async (req, res) => {
    /**
     * Créer une commande pour l'utilisateur connecté.
     *
     * RÈGLE DE SÉCURITÉ : on ne fait JAMAIS confiance aux prix envoyés par le
     * frontend. Le client n'envoie que "quel produit" et "combien" ; le nom, le
     * prix unitaire, le total et le stock sont lus et calculés ici, depuis la
     * base de données. Sinon n'importe qui pourrait payer une commande 1 DA en
     * modifiant la requête (le montant envoyé à la passerelle de paiement vient
     * de order.totalPrice).
     *
     * Étapes :
     *      1. Vérifier que le panier est un tableau non vide.
     *      2. Pour chaque article : valider l'identifiant et la quantité, puis
     *         RÉSERVER le stock en une seule opération atomique (décrément
     *         conditionnel : deux clients ne peuvent plus acheter le dernier
     *         article en même temps).
     *      3. Calculer le total à partir des prix de la base.
     *      4. Enregistrer la commande. Si une étape échoue, le stock déjà
     *         réservé est remis en place.
     *
     * Stock et paiement par carte : le stock est réservé dès la création. Si le
     * client n'achève jamais le paiement, utils/orderCleanup.js annule la
     * commande après un délai et remet le stock.
     *
     * @desc Créer une commande pour l'utilisateur connecté.
     * @route POST /api/orders
     */

    // On ignore volontairement itemsPrice / taxPrice / shippingPrice /
    // totalPrice envoyés par le frontend : ils sont recalculés plus bas.
    const { orderItems, shippingAddress, paymentMethod } = req.body;

    // Articles dont le stock est déjà réservé, pour pouvoir tout annuler.
    const reserved = [];
    let orderSaved = false;

    // Remet le stock réservé en place puis répond avec l'erreur.
    const fail = async (status, message) => {
        await releaseStock(reserved);
        return res.status(status).json({ message });
    };

    try {
        if (!Array.isArray(orderItems) || orderItems.length === 0) {
            return res.status(400).json({ message: 'Aucun article dans la commande' });
        }

        const verifiedItems = [];
        let itemsPrice = 0;

        for (const item of orderItems) {
            if (!item.product || !mongoose.isValidObjectId(item.product)) {
                return await fail(400, 'Chaque article doit avoir un identifiant de produit valide.');
            }
            if (!Number.isInteger(item.quantity) || item.quantity < 1) {
                return await fail(400, 'La quantité de chaque article doit être un entier supérieur ou égal à 1.');
            }

            // Réservation atomique : le décrément n'a lieu que s'il reste assez
            // de stock au moment précis de l'opération.
            const product = await Product.findOneAndUpdate(
                { _id: item.product, countInStock: { $gte: item.quantity } },
                { $inc: { countInStock: -item.quantity } },
                { new: true }
            );

            if (!product) {
                // Produit introuvable ou stock insuffisant : on précise lequel.
                const existing = await Product.findById(item.product);
                if (!existing) {
                    return await fail(404, `Produit introuvable (${item.product}).`);
                }
                return await fail(400, `Stock insuffisant pour "${existing.name}" (${existing.countInStock} disponible(s), ${item.quantity} demandé(s)).`);
            }

            reserved.push({ product: product._id, quantity: item.quantity });
            itemsPrice += product.price * item.quantity;
            verifiedItems.push({
                product: product._id,
                name: product.name,
                quantity: item.quantity,
                image: product.images && product.images[0] ? product.images[0] : item.image,
                price: product.price, // prix de la base, pas celui du frontend
            });
        }

        // Pas de TVA ni de frais de livraison pour l'instant (comme dans le
        // récapitulatif affiché côté frontend). Si ça change, c'est ICI.
        const taxPrice = 0;
        const shippingPrice = 0;
        const totalPrice = itemsPrice + taxPrice + shippingPrice;

        const order = new Order({
            orderItems: verifiedItems,
            user: req.user.id, // ID de l'utilisateur connecté (ajouté par le middleware d'auth)
            shippingAddress,
            paymentMethod,
            itemsPrice,
            taxPrice,
            shippingPrice,
            totalPrice,
        });

        const createdOrder = await order.save();
        orderSaved = true;

        res.status(201).json(createdOrder);

        // Email de confirmation — uniquement pour "Paiement à la livraison",
        // confirmé immédiatement. Pour la carte, l'email part après la
        // confirmation réelle du paiement (voir chargily.controller.js ->
        // chargilyWebhook). Placé APRÈS la réponse et sans "await" : un email
        // lent ou en échec ne doit jamais faire échouer la commande.
        if (createdOrder.paymentMethod === 'Paiement à la livraison') {
            User.findById(req.user.id)
                .then(user => {
                    if (user) {
                        sendOrderConfirmationEmail({
                            to: user.email,
                            userName: user.firstName,
                            order: createdOrder,
                        });
                    }
                })
                .catch(err => console.error("[email] Impossible de récupérer l'utilisateur pour l'email de confirmation:", err.message));
        }

    } catch (error) {
        // La commande n'a pas été enregistrée : on libère le stock réservé.
        if (!orderSaved) {
            await releaseStock(reserved).catch(err => console.error('[stock] Impossible de remettre le stock en place:', err.message));
        }
        res.status(500).json({
            message: 'Erreur lors de la création de la commande',
            error: error.message
        });
    }
};


const getOrderById = async (req, res) => {
    /**
     * Fonction pour récupérer une commande par son ID.
     *
     * Étapes :
     * Tout d'abord essayer:
     *      1. Rechercher la commande par son ID et peupler les informations de l'utilisateur.
     *
     * Si la commande existe:
     *      2. Vérifier que l'utilisateur connecté est le propriétaire de la commande ou qu'il est admin.
     *
     * Si l'utilisateur n'a pas la permission:
     *      3. Renvoyer un status 403 avec un message d'accès refusé.
     *
     * Sinon, si l'utilisateur a la permission:
     *      4. Renvoyer la commande trouvée.
     *
     * Si la commande n'existe pas:
     *      5. Renvoyer un status 404 avec un message de commande non trouvée.
     *
     * Sinon en cas d'erreur serveur:
     *      6. Afficher l'erreur en console pour le développement.
     *      7. Renvoyer une réponse 500 avec un message d'erreur.
     *
     * @desc Récupérer une commande spécifique.
     * @route GET /api/orders/:id
     */

    try {
        // Recherche de la commande par ID et population des informations utilisateur
        const order = await Order.findById(req.params.id).populate('user', 'firstName lastName email');

        if (order) {
            // Vérification des permissions : seul l'utilisateur propriétaire ou un admin peut voir la commande
            if (order.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
                return res.status(403).json({ message: 'Accès refusé pour cette commande' });
            }

            // Retour de la commande trouvée
            res.json(order);
        } else {
            // Commande non trouvée
            res.status(404).json({ message: 'Commande non trouvée' });
        }
    } catch (error) {
        // Log de l'erreur pour le développement et réponse d'erreur serveur
        console.error("Erreur lors de la récupération de la commande:", error);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};


const getUserOrders = async (req, res) => {
    /**
     * Fonction pour récupérer l'historique des commandes de l'utilisateur connecté.
     *
     * Étapes :
     * Tout d'abord essayer:
     *      1. Rechercher toutes les commandes de l'utilisateur connecté, trier par date décroissante.
     *
     * Si l'utilisateur n'a pas de commande:
     *      2. Renvoyer un message indiquant qu'il n'a pas encore passé de commande avec un tableau vide.
     *
     * Sinon, si des commandes existent:
     *      3. Renvoyer une réponse avec le nombre de commandes et la liste des commandes.
     *
     * Sinon en cas d'erreur serveur:
     *      4. Afficher l'erreur en console pour le développement.
     *      5. Renvoyer une réponse 500 avec un message d'erreur.
     *
     * @desc Récupérer les commandes de l'utilisateur connecté.
     * @route GET /api/orders/myorders
     */

    try {
        // Recherche des commandes de l'utilisateur, triées par date décroissante
        const orders = await Order.find({ user: req.user.id })
            .populate('user', 'firstName lastName email') // Population des infos utilisateur
            .sort('-createdAt'); // Tri par date de création décroissante

        // Vérification si l'utilisateur a des commandes
        if (!orders || orders.length === 0) {
            return res.status(200).json({
                message: "Vous n'avez pas encore passé de commande.",
                orders: []
            });
        }

        // Retour des commandes avec le nombre total
        res.status(200).json({
            count: orders.length,
            orders: orders
        });

    } catch (error) {
        // Gestion des erreurs
        res.status(500).json({
            message: 'Erreur lors de la récupération de votre historique',
            error: error.message
        });
    }
};


const getAllOrders = async (req, res) => {
    /**
     * Fonction pour récupérer toutes les commandes (administrateur uniquement).
     *
     * Étapes :
     * Tout d'abord essayer:
     *      1. Rechercher toutes les commandes dans la base de données.
     *      2. Peupler les informations utilisateur pour chaque commande.
     *      3. Trier les commandes par date décroissante.
     *
     * Si tout se passe bien:
     *      4. Renvoyer le nombre total de commandes et les commandes trouvées.
     *
     * Sinon en cas d'erreur serveur:
     *      5. Afficher l'erreur en console pour le développement.
     *      6. Renvoyer une réponse 500 avec un message d'erreur.
     *
     * @desc Récupérer toutes les commandes pour l'administration.
     * @route GET /api/orders
     */

    try {
        // Recherche de toutes les commandes avec population des infos utilisateur
        const orders = await Order.find({})
            .populate('user', 'firstName lastName email')
            .sort('-createdAt'); // Tri par date décroissante

        // Retour de toutes les commandes avec le nombre total
        res.status(200).json({
            count: orders.length,
            orders: orders
        });
    } catch (error) {
        // Gestion des erreurs
        res.status(500).json({
            message: 'Erreur lors de la récupération globale des commandes',
            error: error.message
        });
    }
};


const updateOrderToPaid = async (req, res) => {
    /**
     * Fonction pour marquer une commande comme payée (réservée aux administrateurs).
     *
     * Pour le paiement par carte CIB/Edahabia, la commande est marquée payée
     * AUTOMATIQUEMENT par le contrôleur dédié (voir controllers/payment.controller.js
     * -> cibReturn, qui vérifie le vrai statut auprès de SATIM). Cette route-ci
     * sert de confirmation MANUELLE pour "Paiement à la livraison" (l'admin
     * confirme après avoir encaissé), ou en secours si jamais la vérification
     * automatique CIB n'aboutissait pas.
     *
     * Étapes :
     * Tout d'abord essayer:
     *      1. Rechercher la commande par son ID.
     *
     * Si la commande existe:
     *      2. Mettre à jour les champs de paiement (isPaid, paidAt, status).
     *      3. Enregistrer la commande mise à jour.
     *      4. Renvoyer la commande mise à jour.
     *
     * Sinon, si la commande n'existe pas:
     *      5. Renvoyer un status 404 avec un message de commande non trouvée.
     *
     * Sinon en cas d'erreur serveur:
     *      6. Renvoyer une réponse 500 avec un message d'erreur.
     *
     * @desc Mettre à jour une commande comme payée.
     * @route PUT /api/orders/:id/pay
     * @access Administrateur authentifié
     */

    try {
        // Recherche de la commande par ID
        const order = await Order.findById(req.params.id);

        if (order) {
            // Mise à jour du statut de paiement
            order.isPaid = true;
            order.paidAt = Date.now(); // Date du paiement
            order.status = 'Confirmée'; // Changement du statut général

            // Sauvegarde de la commande mise à jour
            const updatedOrder = await order.save();
            res.json(updatedOrder);
        } else {
            // Commande non trouvée
            res.status(404).json({ message: 'Commande non trouvée' });
        }
    } catch (error) {
        // Gestion des erreurs
        console.error("Erreur lors de la mise à jour du paiement:", error);
        res.status(500).json({ message: 'Erreur lors de la mise à jour du paiement', error: error.message });
    }
};


const updateOrderToDelivered = async (req, res) => {
    /**
     * Fonction pour marquer une commande comme livrée (réservée aux administrateurs).
     *
     * Étapes :
     * Tout d'abord essayer:
     *      1. Rechercher la commande par son ID.
     *
     * Si la commande existe:
     *      2. Mettre à jour les champs de livraison (isDelivered, deliveredAt, status).
     *      3. Enregistrer la commande mise à jour.
     *      4. Renvoyer la commande mise à jour.
     *
     * Sinon, si la commande n'existe pas:
     *      5. Renvoyer un status 404 avec un message de commande non trouvée.
     *
     * Sinon en cas d'erreur serveur:
     *      6. Renvoyer une réponse 500 avec un message d'erreur.
     *
     * @desc Mettre à jour une commande comme livrée.
     * @route PUT /api/orders/:id/deliver
     */
    
    try {
        // Recherche de la commande par ID
        const order = await Order.findById(req.params.id);

        if (order) {
            // Mise à jour du statut de livraison
            order.isDelivered = true;
            order.deliveredAt = Date.now(); // Date de livraison
            order.status = 'Livrée'; // Changement du statut général

            // Sauvegarde de la commande mise à jour
            const updatedOrder = await order.save();
            res.json(updatedOrder);
        } else {
            // Commande non trouvée
            res.status(404).json({ message: 'Commande non trouvée' });
        }
    } catch (error) {
        // Gestion des erreurs
        res.status(500).json({ message: 'Erreur lors de la mise à jour de la livraison' });
    }
};

// Exportation des fonctions du contrôleur pour utilisation dans les routes
module.exports = {
    addOrderItems,
    getOrderById,
    getUserOrders,
    getAllOrders,
    updateOrderToPaid,
    updateOrderToDelivered
};
