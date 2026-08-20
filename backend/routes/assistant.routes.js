// routes/assistant.routes.js
//
// Route publique — l'assistant d'achat doit être utilisable par un visiteur
// qui n'est pas encore connecté (c'est un outil de découverte produit, pas
// une fonctionnalité de compte).

const express = require('express');
const router = express.Router();
const { chatWithAssistant } = require('../controllers/assistant.controller');

router.post('/chat', chatWithAssistant);

module.exports = router;
