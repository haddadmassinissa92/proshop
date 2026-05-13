// middlewares/auth.middleware.js

// Importation de la bibliothèque jsonwebtoken pour la vérification des tokens JWT.
const jwt = require('jsonwebtoken')

// Middleware d'authentification pour protéger les routes qui nécessitent une authentification.
module.exports = (req, res, next) => {
    /**
     * Middleware d'authentification pour protéger les routes qui nécessitent une authentification.
     * 
     * Etapes:
     *      1. Récupérer le token JWT depuis le header d'autorisation de la requete (Authorization).
     * 
     *      Si le token n'est pas présent:
     *          2. Renvoyer une erreur 401 (token missing).
     * 
     *      Si le token est présent:
     *          3. Vérifier la validité du token avec la clé secrète .
     * 
     *      Si le token est valide:
     *         4. Ajouter les informations de l'utilisateur décodé à la requete (req.user) pour les utiliser dans les routes protégées.
     *         5. Passer au middleware ou à la route suivante en appelant next().
     * 
     *      Si le token est invalide ou expiré:
     *         6. Afficher l'erreur dans la console pour le développement.
     *         7. Renvoyer une réponse avec un message d'erreur et un status 401 pour indiquer que le token est invalide ou expiré.
     */

    try {
        // On recupere le token du header d'autorisation.
        const authHeader = req.headers.authorization

        // Si le header d'autorisation n'existe pas, on renvoie une erreur 401.
        if (!authHeader) {
            return res.status(401).json({ message: "Authentication required" })
        }

        // On recupere le token en supprimant le préfix "Bearer " du header d'autorisation.
        const token = authHeader.split(' ')[1]

        // Si le token n'existe pas, on renvoie une erreur 401.
        if (!token) {
            return res.status(401).json({ message: "Token missing" })
        }

        // On verifie le token avec la clé secrète définie dans les variables d'environnement.
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET)

        // Si le token est valide, on ajoute les informations de l'utilisateur 
        // décodé à la requete pour les utiliser dans les routes protégées.
        req.user = {
            id : decodedToken.id,
            role: decodedToken.role
        }

        // On passe au middleware ou à la route suivante.
        next()
    } catch (error) {
        // Afficher l'erreur dans la console pour le développement.
        // Renvoyer une réponse avec un message d'erreur et un status 401 
        // pour indiquer que le token est invalide ou expiré.
        console.error(error)
        res.status(401).json({ message: "Invalid or expired token." })
    }
}

