// utils/chargily.js
//
// Petit client pour l'API Chargily Pay V2 (paiement par carte EDAHABIA et CIB).
// Aucune dépendance externe : on utilise le "fetch" intégré à Node 18+ et le
// module "crypto" (même approche que utils/email.js : une fonction = un rôle).
//
// Le mode (test ou live) vient de CHARGILY_MODE. Passer en production se fait
// UNIQUEMENT en changeant les variables d'environnement (clé + mode), jamais
// en modifiant le code.

const crypto = require('crypto');

// À CONFIRMER avec la doc officielle (dev.chargily.com) si Chargily change ses URLs.
const BASE_URLS = {
    test: 'https://pay.chargily.net/test/api/v2',
    live: 'https://pay.chargily.net/api/v2',
};

const getMode = () => (process.env.CHARGILY_MODE === 'live' ? 'live' : 'test');

const isConfigured = () => Boolean(process.env.CHARGILY_SECRET_KEY);

// Appel générique à l'API Chargily. Lance une erreur (avec .status) si la
// réponse n'est pas un succès : c'est le controller qui décide quoi répondre
// au client, pour ne jamais lui renvoyer de détail technique.
const request = async (method, path, body) => {
    const response = await fetch(`${BASE_URLS[getMode()]}${path}`, {
        method,
        headers: {
            Authorization: `Bearer ${process.env.CHARGILY_SECRET_KEY}`,
            'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        const error = new Error(data.message || `Chargily a répondu avec le statut ${response.status}`);
        error.status = response.status;
        error.details = data;
        throw error;
    }
    return data;
};

// Crée une session de paiement ; la réponse contient "checkout_url" (page de
// paiement vers laquelle rediriger le client) et "id".
const createCheckout = (payload) => request('POST', '/checkouts', payload);

// Relit une session auprès de Chargily : sert à vérifier le VRAI statut avant
// de marquer une commande payée (on ne se fie jamais au seul contenu du webhook).
const getCheckout = (id) => request('GET', `/checkouts/${encodeURIComponent(id)}`);

// Vérifie la signature d'un webhook : HMAC-SHA256 (hex) du corps BRUT de la
// requête, calculé avec la clé secrète, à comparer à l'en-tête "signature".
// "rawBody" doit être le Buffer d'origine (voir express.raw dans app.js) :
// un corps déjà parsé puis re-sérialisé ne donnerait pas la même signature.
const verifyWebhookSignature = (rawBody, signature) => {
    if (!isConfigured() || !signature || !Buffer.isBuffer(rawBody)) return false;

    const expected = crypto
        .createHmac('sha256', process.env.CHARGILY_SECRET_KEY)
        .update(rawBody)
        .digest('hex');

    const a = Buffer.from(expected);
    const b = Buffer.from(String(signature));
    // timingSafeEqual exige deux buffers de même longueur.
    return a.length === b.length && crypto.timingSafeEqual(a, b);
};

module.exports = {
    getMode,
    isConfigured,
    createCheckout,
    getCheckout,
    verifyWebhookSignature,
};