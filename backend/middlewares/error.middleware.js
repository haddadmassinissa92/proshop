// middlewares/error.middleware.js

const multer = require('multer');

// Gestionnaire d'erreurs centralisé — DOIT être le dernier middleware déclaré
// dans server.js (signature à 4 arguments = middleware d'erreur pour Express).
const errorHandler = (err, req, res, next) => {
    console.error(err);

    // Erreurs spécifiques à Multer (upload de fichiers) : on donne un message clair
    // au lieu de la réponse 500 générique.
    if (err instanceof multer.MulterError) {
        let message = "Erreur lors de l'upload du fichier.";
        if (err.code === 'LIMIT_FILE_SIZE') {
            message = "Le fichier est trop volumineux.";
        } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            message = "Champ de fichier inattendu.";
        }
        return res.status(400).json({ message });
    }

    // Erreur de type de fichier renvoyée par notre propre fileFilter (voir multer.config.js)
    if (err.message && err.message.includes('non supporté')) {
        return res.status(400).json({ message: err.message });
    }

    // Erreur générique : si le status est encore 200, on le force à 500.
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode).json({
        message: err.message || "Une erreur est survenue sur le serveur.",
        // On n'affiche la pile d'erreur (stack) qu'en développement.
        stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
    });
};

module.exports = errorHandler;
