// routes/user.routes.js

// Importation des dépendances nécessaires pour la création des routes utilisateur.
const express = require('express')

// Création du routeur Express pour gérer les routes liées aux utilisateurs.
const router = express.Router()

// Importation des fonctions de contrôle pour les utilisateurs (signup, login, logout, getUserProfile).
const { 
    signup, 
    login,
    logout,
    getUserProfile,
    updateUserProfile,
    deleteUserProfile
} = require('../controllers/user.controller')

// Importation du middleware d'authentification et d'upload d'images.
const auth = require('../middlewares/auth.middleware')
const upload = require('../middlewares/multer.config');


/**
 * Routes d'inscription et de connexion pour les utilisateurs, avec les méthodes HTTP appropriées.
 * URL complète sera : 
 *      method: POST
 *              1. http://localhost:3000/api/auth/signup
 *              2. http://localhost:3000/api/auth/login
 *              3. http://localhost:3000/api/auth/logout
 * 
 * Routes protégées pour la gestion du profil utilisateur (authentification requise) :
 *      method: GET
 *              1. http://localhost:3000/api/auth/profile
 *      method: PUT
 *              2. http://localhost:3000/api/auth/edit-profile/:id
 *      method: DELETE
 *              3. http://localhost:3000/api/auth/delete-profile/:id
 */

// ROUTES PUBLIQUES :
router.post('/signup', upload,  signup) // Route pour l'inscription de l'utilisateur.
router.post('/login', login)  // Route pour la connexion de l'utilisateur.
router.post('/logout', logout) // Route pour la deconnexion de l'utilisateur.

// ROUTES PROTEGEES (authentification requise) :
router.get('/profile', auth, upload, getUserProfile)
router.put('/edit-profile/:id', auth, upload, updateUserProfile) // Route pour mettre à jour le profil de l'utilisateur.
router.delete('/delete-profile/:id', auth, deleteUserProfile) // Route pour supprimer le profil de l'utilisateur.


// On export nos routes pour povoir les utiliser sur le server.
module.exports = router