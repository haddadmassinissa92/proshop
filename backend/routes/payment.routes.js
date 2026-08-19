// routes/payment.routes.js
//
// Routes du paiement en ligne par carte CIB/Edahabia (via SATIM).

const express = require('express');
const router = express.Router();

const {
    createCibPayment,
    cibReturn,
    cibFail,
} = require('../controllers/payment.controller');

const auth = require('../middlewares/auth.middleware');

router.post('/cib/register/:orderId', auth, createCibPayment);
// Ces deux routes sont appelées par une redirection de navigateur depuis
// SATIM (pas par un appel API classique), donc pas de middleware "auth" —
// la vérification de sécurité se fait via le vrai statut SATIM, pas via le token.
router.get('/cib/return', cibReturn);
router.get('/cib/fail', cibFail);

module.exports = router;
