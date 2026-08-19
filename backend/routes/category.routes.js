// routes/category.routes.js

const express = require('express');
const router = express.Router();

const {
    createCategory,
    getAllCategories,
    getCategoryById,
    updateCategory,
    deleteCategory,
} = require('../controllers/category.controller');

const auth = require('../middlewares/auth.middleware');
const admin = require('../middlewares/admin.middleware');

/**
 * Routes pour la gestion des catégories.
 *
 * Routes publiques :
 *      GET  /api/categories        (liste, filtrable par ?universe=...)
 *      GET  /api/categories/:id
 *
 * Routes réservées aux administrateurs :
 *      POST   /api/categories
 *      PUT    /api/categories/:id
 *      DELETE /api/categories/:id
 */

// ROUTES PUBLIQUES
router.get('/', getAllCategories);
router.get('/:id', getCategoryById);

// ROUTES ADMIN
router.post('/', auth, admin, createCategory);
router.put('/:id', auth, admin, updateCategory);
router.delete('/:id', auth, admin, deleteCategory);

module.exports = router;
