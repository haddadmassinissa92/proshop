// backend/server.js -
// Point d'entrée du serveur backend de l'application proShop.
// Ce fichier configure et démarre le serveur Express, connecte à MongoDB,
// définit les routes API pour l'authentification, les produits et les commandes,
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
const multer = require('./middlewares/multer.config')

// Import des routes API
const authRoutes = require('./routes/user.routes');
const productsRoutes = require('./routes/product.routes');
const orderRoutes = require('./routes/order.routes');

const app = express();

// --- SECURITÉ ---
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Limiter les requêtes pour éviter les abus
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500 // Limite chaque IP à 100 requêtes par fenêtre
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
app.use(express.json({ limit: '10kb' })); 

// Dossier pour les static files (Images)
app.use('/images', express.static(path.join(__dirname, 'public/images')));

// --- BASE DE DONNÉES ---
mongoose.connect(process.env.MONGO_URI, { dbName: 'proshop_db' })
    .then(() => console.log("✅ Connexion à MongoDB réussie !"))
    .catch((error) => console.error("❌ Erreur de connexion MongoDB :", error));



// Routes pour l'authentification, les produits et les commandes
app.use('/api/auth', authRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/orders', orderRoutes)

// --- GESTION DES ERREURS ---

// 404 - Route non trouvée
app.use((req, res) => {
    res.status(404).json({ 
        message: `La route ${req.originalUrl} n'existe pas.` 
    });
});

// 500 - Erreur global (Middleware d'erreur)
app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        status: "error",
        message: err.message || "Erreur interne du serveur",
        stack: process.env.NODE_ENV === 'development' ? err.stack : null 
    });
});

// Middleware pour gérer les erreurs spécifiques à Multer (upload de fichiers)
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    console.log("ERREUR MULTER :", err.code); 
  }
  console.error("LOG COMPLET :", err);
  res.status(500).json({ message: err.message });
});

// --- DÉMARRAGE DU SERVEUR ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🖧 Server running on http://localhost:${PORT}`);
});
