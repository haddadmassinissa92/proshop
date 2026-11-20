// backend/app.js
//
// Configuration de l'application Express : middlewares, routes, gestion
// des erreurs. Ce fichier NE se connecte PAS à MongoDB et NE démarre PAS
// de serveur HTTP — il se contente d'exporter l'app Express configurée.
//
// Pourquoi séparé de server.js ? Pour rendre l'app testable. Avant,
// server.js faisait tout d'un coup (connexion Mongo réelle + démarrage du
// serveur) dès qu'on l'importait — impossible d'écrire des tests avec
// Supertest sans polluer la vraie base de données ou sans avoir un vrai
// serveur qui tourne. Avec ce découpage, les tests importent app.js
// directement et le branchent sur une base MongoDB en mémoire dédiée aux
// tests (voir tests/setup.js), pendant que server.js reste responsable du
// vrai démarrage en développement/production.

const express = require("express");
const path = require('path');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require("cors");
const rateLimit = require("express-rate-limit");

// Import des routes API
const authRoutes = require('./routes/user.routes');
const productsRoutes = require('./routes/product.routes');
const categoriesRoutes = require('./routes/category.routes');
const orderRoutes = require('./routes/order.routes');
const paymentRoutes = require('./routes/payment.routes');
const chargilyRoutes = require('./routes/chargily.routes');
const { chargilyWebhook } = require('./controllers/chargily.controller');
const assistantRoutes = require('./routes/assistant.routes');

// Gestionnaire d'erreurs centralisé (voir middlewares/error.middleware.js)
const errorHandler = require('./middlewares/error.middleware');

const app = express();

// Derrière le proxy d'un hébergeur (Render, Railway...), sans cette ligne
// Express voit l'IP du proxy pour TOUS les clients : le limiteur de requêtes
// les traiterait comme un seul visiteur. "1" = on fait confiance à un seul
// proxy (celui de l'hébergeur).
app.set('trust proxy', 1);

// --- SECURITÉ ---
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Limiter les requêtes pour éviter les abus
// (skip désactive la limite pendant les tests automatisés — voir la même
// note dans routes/user.routes.js)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Limite chaque IP à 500 requêtes par fenêtre de 15 minutes
  skip: () => process.env.NODE_ENV === 'test',
});
app.use("/api/", limiter);

// CORS - Autoriser les requêtes depuis le frontend
app.use(cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
}));

// --- MIDDLEWARES STANDARDS ---
app.use(morgan('dev'));

// Webhook Chargily : il doit recevoir le corps BRUT de la requête (Buffer) pour
// que la signature puisse être vérifiée. Il est donc monté AVANT
// express.json(), qui transformerait le corps et ferait échouer la vérification.
app.post(
    '/api/payments/chargily/webhook',
    express.raw({ type: 'application/json' }),
    chargilyWebhook
);

// 1mb au lieu de 10kb : une commande avec plusieurs articles peut dépasser
// 10kb et se faisait rejeter avant.
app.use(express.json({ limit: '1mb' })); 

// Dossier pour les static files (Images) — conservé uniquement pour la
// compatibilité avec d'éventuelles anciennes images déjà en local avant le
// passage à Cloudinary. Tous les NOUVEAUX uploads (produits, catégories,
// avatars) passent maintenant par Cloudinary (voir utils/cloudinary.js) et
// ne transitent plus par ce dossier — un chemin qui n'a de sens que si le
// disque du serveur persiste, ce qui n'est pas garanti sur la plupart des
// hébergeurs (Render, Railway...).
app.use('/images', express.static(path.join(__dirname, 'public/images')));

// Routes pour l'authentification, les produits, les catégories et les commandes
app.use('/api/auth', authRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/orders', orderRoutes)
app.use('/api/payments/chargily', chargilyRoutes)
app.use('/api/payments', paymentRoutes)

// Limite dédiée, plus stricte, pour l'assistant IA : le compte gratuit Groq
// est plafonné à 30 requêtes/minute au total pour tout le site — sans
// limite spécifique ici, quelqu'un pourrait épuiser tout le quota à lui
// seul en spammant le chat, et bloquer l'assistant pour tous les autres
// visiteurs.
const assistantLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 15, // 15 messages par IP toutes les 5 minutes
    message: { message: "Trop de messages envoyés à l'assistant, réessaie dans quelques minutes." },
});
app.use('/api/assistant', assistantLimiter, assistantRoutes);

// --- GESTION DES ERREURS ---
// L'ordre compte : le 404 d'abord (pour les routes qui n'existent pas),
// puis UN SEUL middleware d'erreur en dernier (4 arguments = error handler Express).

// 404 - Route non trouvée
app.use((req, res) => {
    res.status(404).json({ 
        message: `La route ${req.originalUrl} n'existe pas.` 
    });
});

// Gestionnaire d'erreurs unique (générique + Multer), toujours en dernier.
app.use(errorHandler);

module.exports = app;
