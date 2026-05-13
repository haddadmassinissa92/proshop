// middlewares/error.middleware.js


const errorHandler = (err, req, res, next) => {
    // Si le status est 200, on le force à 500 (erreur serveur)
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode);
    res.json({
        message: err.message,
        // On n'affiche la pile d'erreur (stack) qu'en développement
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
};
