// backend/server.js -
// Point d'entrée du serveur backend de l'application proShop.
// Ce fichier configure et démarre le serveur Express, connecte à MongoDB,
// définit les routes API pour l'authentification, les produits, les catégories et les commandes,
// et gère les erreurs globales.

// Forcer l'utilisation de serveurs DNS publics pour éviter 
// les problèmes de résolution de noms
const dns = require("dns");
dns.setServers(['8.8.8.8', '8.8.4.4']);

// Importation des modules nécessaires
require('dotenv').config();
const express = require("express");
const mongoose = require('mongoose');
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

// Gestionnaire d'erreurs centralisé (voir middlewares/error.middleware.js)
const errorHandler = require('./middlewares/error.middleware');

const app = express();

// --- SECURITÉ ---
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Limiter les requêtes pour éviter les abus
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500 // Limite chaque IP à 500 requêtes par fenêtre de 15 minutes
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

// --- BASE DE DONNÉES ---
mongoose.connect(process.env.MONGO_URI, { dbName: 'proshop_db' })
    .then(() => console.log("✅ Connexion à MongoDB réussie !"))
    .catch((error) => console.error("❌ Erreur de connexion MongoDB :", error));



// Routes pour l'authentification, les produits, les catégories et les commandes
app.use('/api/auth', authRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/orders', orderRoutes)
app.use('/api/payments', paymentRoutes)

// --- GESTION DES ERREURS ---
// L'ordre compte : le 404 d'abord (pour les routes qui n'existent pas),
// puis UN SEUL middleware d'erreur en dernier (4 arguments = error handler Express).
// Avant, deux gestionnaires d'erreur se suivaient : le premier répondait toujours
// avant le second (celui pensé pour Multer), qui ne s'exécutait donc jamais.

// 404 - Route non trouvée
app.use((req, res) => {
    res.status(404).json({ 
        message: `La route ${req.originalUrl} n'existe pas.` 
    });
});

// Gestionnaire d'erreurs unique (générique + Multer), toujours en dernier.
app.use(errorHandler);

// --- DÉMARRAGE DU SERVEUR ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🖧 Server running on http://localhost:${PORT}`);
});
