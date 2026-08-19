// routes/order.routes.js

// Importation de express.js.
const express = require('express');

// Création d'un routeur express pour les routes liées aux commandes.
const router = express.Router();

// Importation des fonctions du controller.
const { 
    addOrderItems, 
    getOrderById, 
    getUserOrders,
    getAllOrders,
    updateOrderToPaid,
    updateOrderToDelivered
} = require('../controllers/order.controller');

// Importation des middlewares d'authentification et d'administration.
const protect = require('../middlewares/auth.middleware');
const admin = require('../middlewares/admin.middleware');

// ROUTES PUBLIQUES Et proteger par l'authentification
router.post('/', protect, addOrderItems);
router.get('/user', protect, getUserOrders) // recuperer les commandes de l'utilisateur
router.get('/admin', protect, admin, getAllOrders) // route pour recuperer tous le commandes de l'admin
router.get('/:id', protect, getOrderById);

// ROUTES proteger par l'authentification et le role doit etre admin
// (marquer payé/livré sont des actions de gestion : seul un admin doit pouvoir
// les déclencher, jamais le client — sinon n'importe quel utilisateur connecté
// pourrait marquer sa propre commande, ou une autre, comme payée.)
router.put('/:id/pay', protect, admin, updateOrderToPaid)
router.put('/:id/deliver', protect, admin, updateOrderToDelivered)


// Exportation du routeur pour l'utiliser dans le fichier principal de l'application (server.js).
module.exports = router;
