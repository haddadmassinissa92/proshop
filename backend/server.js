// backend/server.js -
// Point d'entrée du serveur backend de l'application proShop. Ce fichier
// ne fait que 3 choses : charger les variables d'environnement, se
// connecter à MongoDB, et démarrer le serveur HTTP — toute la config de
// l'app Express (middlewares, routes) vit dans app.js (voir ce fichier
// pour le pourquoi de cette séparation : elle rend l'app testable).

// Forcer l'utilisation de serveurs DNS publics pour éviter 
// les problèmes de résolution de noms
const dns = require("dns");
dns.setServers(['8.8.8.8', '8.8.4.4']);

// Importation des modules nécessaires
require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./app');

// --- BASE DE DONNÉES ---
mongoose.connect(process.env.MONGO_URI, { dbName: 'proshop_db' })
    .then(() => console.log("✅ Connexion à MongoDB réussie !"))
    .catch((error) => console.error("❌ Erreur de connexion MongoDB :", error));

// --- DÉMARRAGE DU SERVEUR ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🖧 Server running on http://localhost:${PORT}`);
});
