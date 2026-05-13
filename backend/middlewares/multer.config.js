// multer.config.js - Configuration Multer pour le backend de l'application proShop.
// Ce fichier définit comment Multer doit stocker les fichiers uploadés, quels types
// de fichiers sont autorisés, et quelle taille maximale est acceptée.
// Ce middleware est destiné aux routes qui gèrent l'upload d'images depuis le frontend.

// Import du package Multer pour traiter les fichiers 
// uploadés dans les requêtes HTTP.
const multer = require('multer');

// Correspondance entre les MIME types autorisés et les extensions de fichier.
// Cela permet de générer une extension de fichier correcte à partir du type MIME.
const MIME_TYPES = {
    'image/webp': 'webp',
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/svg': 'svg',
    'image/svg+xml': 'svg+xml',
    'image/avif': 'avif'
};

// Définition du stockage physique des fichiers uploadés.
const storage = multer.diskStorage({
    // Destination est appelé pour déterminer où enregistrer le fichier.
    // On stocke les images dans le dossier public/images du backend.
    destination: (req, file, callback) => {
        callback(null, './public/images');
    },

    // filename est appelé pour déterminer le nom du fichier enregistré.
    filename: (req, file, callback) => {
        
        // file.originalname contient le nom original du fichier fourni par l'utilisateur.
        // On enlève les espaces et on retire l'extension originale pour éviter les collisions.
        // On détermine l'extension du fichier en fonction de son type MIME.
        const name = file.originalname.split(' ').join('_').split('.')[0];
        const extension = MIME_TYPES[file.mimetype];

        // On ajoute un timestamp pour garantir que chaque fichier a un nom unique.
        // Exemple: photo_de_produit_1712345678901.jpg
        callback(null, name + '_' + Date.now() + '.' + extension);
    }
});

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
