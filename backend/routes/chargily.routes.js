// routes/chargily.routes.js
//
// Route de création de paiement Chargily (carte EDAHABIA / CIB).
// Le webhook n'est PAS ici : il doit recevoir le corps brut de la requête,
// donc il est monté directement dans app.js avant express.json().

const express = require('express');
const router = express.Router();

const { createChargilyCheckout } = require('../controllers/chargily.controller');
const auth = require('../middlewares/auth.middleware');

router.post('/checkout/:orderId', auth, createChargilyCheckout);

module.exports = router;