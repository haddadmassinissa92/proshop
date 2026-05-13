// routes/product.routes.js

// Importation de express.js.
const express = require('express')

// Création d'un routeur express pour les routes liées aux produits.
const router = express.Router()

// Importation des fonctions du controller.
const { 
    createProduct,
    getAllProducts,
    getProductById,
    updateProduct,
    deleteProduct,
    createProductReview,
    getCategories
} = require('../controllers/product.controller')

// Importation des middlewares d'authentification et d'administration et d'upload de fichiers.
const upload = require('../middlewares/multer.config');
const auth = require('../middlewares/auth.middleware')
const admin = require('../middlewares/admin.middleware')

/**
 * Routes pour la gestion des produits dans l'application.
 * 
 * Routes publiques (accessible sans authentification) :
 *      method: GET
 *              1. http://localhost:3000/api/products/ (Récupérer tous les produits)
 *              2. http://localhost:3000/api/products/:id (Récupérer un produit par son ID)
 * 
 * Routes protégées (authentification requise) :
 *      method: POST
 *              3. http://localhost:3000/api/products/:id/reviews (Ajouter un avis sur un produit spécifique)
 * 
 * Routes réservées aux administrateurs (authentification + rôle admin) :
 *      method: POST
 *              4. http://localhost:3000/api/products/ (Ajouter un nouveau produit)
 *      method: PUT
 *              5. http://localhost:3000/api/products/edit-product/:id (Mettre à jour un produit existant)
 *      method: DELETE
 *              6. http://localhost:3000/api/products/delete-product/:id (Supprimer un produit existant)
 */

// ROUTES PUBLIQUES
router.get('/categories', getCategories) // Route pour recuperer tous les categories enumerer dans le champ category de notre model.
router.get('/', getAllProducts) // Route pour recuperer tous les produits.
router.get('/:id', getProductById) // Route pour recuperer un produit par son ID et afficher les details.



// ROUTES PROTEGEES (authentification requise) :
router.post('/:id/reviews', auth, createProductReview) // Route pour ajouter un avis sur un produit specifique.

// ROUTES ADMIN (authentification + role admin requis) :
router.post('/', auth, admin, upload, createProduct) // Route pour ajouter un produit.
router.put('/edit-product/:id', auth, admin, updateProduct) // Route pour mettre à jour un produit existant.
router.delete('/delete-product/:id', auth, admin, deleteProduct) // Route pour supprimer un produit existant.

// Exportation du routeur pour l'utiliser dans le fichier principal de l'application (server.js).
module.exports = router