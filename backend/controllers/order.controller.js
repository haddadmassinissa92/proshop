// controllers/order.controller.js

// Importation des modèles nécessaires pour les opérations sur les commandes et produits
const Order = require('../models/order.model');
const Product = require('../models/product.model');


const addOrderItems = async (req, res) => {
    /**
     * Fonction pour créer une nouvelle commande avec les articles du panier.
     *
     * Étapes :
     * Tout d'abord essayer:
     *      1. Extraire les données de la commande depuis le corps de la requête (orderItems, shippingAddress, paymentMethod, itemsPrice, taxPrice, shippingPrice, totalPrice).
     *      2. Vérifier que le panier n'est pas vide.
     *
     * Si le panier est vide:
     *      3. Renvoyer un status 400 avec un message indiquant qu'aucun article n'est présent dans la commande.
     *
     * Sinon, si le panier contient des articles:
     *      4. Créer une nouvelle commande avec l'utilisateur connecté et les données fournies.
     *      5. Enregistrer la commande dans la base de données.
     *      6. Mettre à jour le stock des produits commandés en décrémentant countInStock.
     *      7. Renvoyer la commande créée avec un status 201.
     *
     * Sinon en cas d'erreur serveur:
     *      8. Afficher l'erreur dans la console pour le développement.
     *      9. Renvoyer une réponse 500 avec un message d'erreur.
     *
     * @desc Créer une commande pour l'utilisateur connecté.
     * @route POST /api/orders
     */

    // Extraction des données de la commande depuis le corps de la requête
    const {
        orderItems,      // Tableau des articles commandés
        shippingAddress, // Adresse de livraison
        paymentMethod,   // Méthode de paiement
        itemsPrice,      // Prix des articles
        taxPrice,        // Montant de la TVA
        shippingPrice,   // Frais de livraison
        totalPrice,      // Prix total
    } = req.body;

    try {
        // Vérification que le panier n'est pas vide
        if (!orderItems || orderItems.length === 0) {
            return res.status(400).json({ message: 'Aucun article dans la commande' });
        }

        // Création d'une nouvelle instance de commande avec les données fournies
        const order = new Order({
            orderItems,
            user: req.user.id, // ID de l'utilisateur connecté (ajouté par le middleware d'auth)
            shippingAddress,
            paymentMethod,
            itemsPrice,
            taxPrice,
            shippingPrice,
            totalPrice,
        });

        // Sauvegarde de la commande dans la base de données
        const createdOrder = await order.save();

        // MISE À JOUR DU STOCK (Optionnel mais recommandé)
        // Réduction de la quantité en stock pour chaque article commandé
        for (const item of orderItems) {
            await Product.findByIdAndUpdate(item._id, {
                $inc: { countInStock: -item.quantity } // Décrémente le stock de la quantité commandée
            });
        }

        // Réponse avec la commande créée et un statut 201 (Created)
        res.status(201).json(createdOrder);

    } catch (error) {
        // Gestion des erreurs avec un message et le détail de l'erreur
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
     * Fonction pour marquer une commande comme payée.
     *
     * Étapes :
     * Tout d'abord essayer:
     *      1. Rechercher la commande par son ID.
     *
     * Si la commande existe:
     *      2. Mettre à jour les champs de paiement (isPaid, paidAt, status, paymentResult).
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
     */

    try {
        // Recherche de la commande par ID
        const order = await Order.findById(req.params.id);

        if (order) {
            // Mise à jour du statut de paiement
            order.isPaid = true;
            order.paidAt = Date.now(); // Date du paiement
            order.status = 'Confirmée'; // Changement du statut général

            // Stockage des détails du paiement (pour paiements en ligne comme Stripe/PayPal)
            order.paymentResult = {
                id: req.body.id,
                status: req.body.status,
                update_time: req.body.update_time,
                email_address: req.body.payer.email_address,
            };

            // Sauvegarde de la commande mise à jour
            const updatedOrder = await order.save();
            res.json(updatedOrder);
        } else {
            // Commande non trouvée
            res.status(404).json({ message: 'Commande non trouvée' });
        }
    } catch (error) {
        // Gestion des erreurs
        res.status(500).json({ message: 'Erreur lors de la mise à jour du paiement' });
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
