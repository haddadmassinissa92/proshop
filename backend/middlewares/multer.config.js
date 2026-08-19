// multer.config.js - Configuration Multer pour le backend de l'application proShop.
// Ce fichier définit comment Multer doit récupérer les fichiers uploadés, quels types
// de fichiers sont autorisés, et quelle taille maximale est acceptée.
// Ce middleware est destiné aux routes qui gèrent l'upload d'images depuis le frontend.
//
// IMPORTANT : les fichiers ne sont PLUS écrits sur le disque du serveur ici
// (multer.memoryStorage() les garde juste en mémoire, dans req.file.buffer).
// C'est le contrôleur qui les envoie ensuite à Cloudinary (voir
// utils/cloudinary.js) pour un stockage permanent. Sur la plupart des
// hébergeurs (Render, Railway...), le disque local est effacé à chaque
// redéploiement — stocker les images là-dessus les aurait fait disparaître
// à la prochaine mise à jour du code.

// Import du package Multer pour traiter les fichiers 
// uploadés dans les requêtes HTTP.
const multer = require('multer');

// Correspondance entre les MIME types autorisés et les extensions de fichier.
const MIME_TYPES = {
    'image/webp': 'webp',
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/svg': 'svg',
    'image/svg+xml': 'svg+xml',
    'image/avif': 'avif'
};

// Stockage en mémoire (buffer) plutôt que sur disque — voir note ci-dessus.
const storage = multer.memoryStorage();

// Filtre qui valide que le fichier uploadé est bien une image autorisée.
const fileFilter = (req, file, callback) => {
    // Si le type MIME du fichier est présent dans la liste autorisée, on accepte le fichier.
    if (MIME_TYPES[file.mimetype]) {
        callback(null, true);
    } else {
        // Sinon, on rejette le fichier et on renvoie une erreur pour le middleware.
        callback(new Error('Format de fichier non supporté'), false);
    }
};

// Export du middleware Multer configuré.
// .single('image') signifie que l'on attend un seul fichier uploadé dans le champ nommé 'image'.
module.exports = multer({
    storage: storage, // Configuration du stockage définie plus haut.
    limits: { fileSize: 4 * 1024 * 1024 }, // Taille maximale autorisée : 4 Mo
    fileFilter: fileFilter // Filtre pour n'accepter que les types d'images précisés.
}).single('image');
