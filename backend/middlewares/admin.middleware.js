// middlewares/admin.middleware.js

// Middleware pour vérifier si l'utilisateur est un administrateur.
module.exports = (req, res, next) => {
    /**
     * Middleware pour vérifier si l'utilisateur est un administrateur.
     * 
     * Etapes:
     *    1. Vérifier que l'utilisateur est authentifié (req.user doit exister).
     *    2. Vérifier que le rôle de l'utilisateur est "admin".
     * 
     *    Si l'utilisateur est un administrateur:
     *          3. Continuer vers la route suivante en appelant next().
     * 
     *    Sinon, si l'utilisateur n'est pas un administrateur ou n'est pas authentifié: 
     *          4. Renvoyer une erreur 403 (Accès interdit).
     */

    // Vérifier si l'utilisateur a le rôle d'administrateur.
    if (req.user && req.user.role === 'admin') {
        // Si l'utilisateur est un administrateur, continuer vers la route suivante.
        next();
    } else {
        // Si l'utilisateur n'est pas un administrateur, renvoyer une erreur 403 (Accès interdit).
        return res.status(403).json({ message: "Access denied. Admin only." });
    }
};
