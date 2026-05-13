// controllers/user.controller.js

// Importation des dépendances nécessaires pour la gestion des utilisateurs.
const bcrypt = require('bcryptjs') // Pour le hachage des mots de passe.
const jwt = require('jsonwebtoken') // Pour la génération de tokens JWT pour l'authentification.

// Importation du modèle de données utilisateur pour interagir avec la base de données MongoDB.
const User = require('../models/user.model') 


const signup = async (req, res) => {
    /**
     * Fonction d'inscription pour créer un nouvel utilisateur.
     * 
     * Étapes :
     * Tout d'abord essayer:
     *      1. Récupérer les données envoyées par le frontend (firstName, lastName, username, email, password, bio).
     *      
     *      2. Recuperer l'avatar de req.file
     * 
     *      3. Vérifier si un utilisateur existe déjà avec le même email ou username.
     *      4. Si l'utilisateur existe, renvoyer une erreur 400.
     * 
     * Sinon, si l'utilisateur n'existe pas:
     *      5. Générer une clé aléatoire et hasher le mot de passe avec bcrypt.
     *      6. Créer un nouvel utilisateur avec les données fournies et le mot de passe hashé.
     *      7. Enregistrer le nouvel utilisateur dans la base de données.
     * 
     * Si tout vas bien:
     *      8. On renvoyer une réponse avec un message de succès et un status 201.
     * 
     * Sinon en cas d'erreur server:
     *      9. Afficher l'erreur dans la console pour le développement.
     *      10. Renvoyer une réponse avec un message d'erreur et un status 500 
     *          pour indiquer une erreur serveur.
     * 
     * @desc fonction pour pouvoir s'inscrire et creer un compte user 
     * 
     * @route POST /api/auth/signup
     */

    try {
        // On recupere les donnes envoyer par le frontend.
        const { firstName, lastName, username, email, password, bio } = req.body

        // On recupere l'avatar de req.file
        const avatarPath = req.file ? `/images/${req.file.filename}` : '';

        // Vérifier si l'utilisateur existe déjà avec le même email ou username
        const userExists = await User.findOne({ $or: [{ email }, { username }] })
        if (userExists) {
            return res.status(400).json({ message: userExists.email === email ? 'Email already used.' : 'Username already taken.' })
        }

        // Générer une clé aléatoire
        // et hasher le mot de passe
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)

        // Créer un nouvel utilisateur
        // On force le role à 'user' pour éviter que quelqu'un puisse s'inscrire en tant qu'admin.
        const newUser = new User({
            firstName,
            lastName,
            username,
            email,
            bio,
            password: hashedPassword,
            avatar: avatarPath,
            role: 'user', 
        })

        // Enregistrer le nouvel utilisateur
        await newUser.save()

        // Renvoyer le résultat
        res.status(201).json({ message: 'User was created successfully!' })
    } catch (error) {
        console.log("DÉTAIL DE L'ERREUR SIGNUP :", error);
        // Afficher l'erreur dans la console pour le développement.
        // Renvoyer une réponse avec un message d'erreur et un status 500 pour 
        // indiquer une erreur serveur.
        console.error(error)
        res.status(500).json({ message: 'Error while inscription!' })
    }
}


// Fonction de connexion.
const login = async (req, res) => {
    /**
     * Fonction de connexion pour authentifier un utilisateur et lui fournir un token JWT.
     * 
     * Étapes :
     * Tout d'abord essayer:
     *      1. Récupérer les données envoyées par le frontend (email, password).
     *      2. Essayer de trouver un utilisateur avec l'email fourni.
     * 
     * Si l'utilisateur n'existe pas:
     *      3. Renvoyer une erreur 401 avec un message indiquant qu'il n'ya pas de compte avec l'email fournis.
     * 
     * Sinon, si l'utilisateur existe:
     *      4. Vérifier que le mot de passe selectionner correspond au mot de passe hashé dans la base de données en utilisant bcrypt.compare.
     *      5. Si le mot de passe ne correspond pas, renvoyer une erreur 401 avec un message indiquant que l'email ou le mot de passe est incorrect.
     * 
     * Sinon, si le mot de passe correspond:
     *      6. Générer un token JWT en utilisant jwt.sign, 
     *          en incluant l'id et le rôle de l'utilisateur dans le payload, 
     *          et en utilisant une clé jwt.
     * 
     *      7. Renvoyer une réponse avec le token JWT et les informations de l'utilisateur (sans le mot de passe).
     * 
     * Sinon en cas d'erreur server:
     *      8. Afficher l'erreur dans la console pour le développement.
     *      9. Renvoyer une réponse avec un message d'erreur et un status 500 
     *          pour indiquer une erreur serveur.
     * 
     * 
     * @desc formation pour permetre a l'utilisateur de se 
     * connecter.
     * 
     * @route POST /api/auth/login
     */

    try {
        // recuperer l'email et le password de l'utilisateur.
        const { email, password } = req.body

        // essayer de trouver un utilisateur avec l'email.
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            // Si l'email ou le mot de passe sont incorrect on renvoie une erreur.
            return res.status(401).json({ message: "Email or password incorrect." })
        }

        // verifier les deux mot de passe sont identiques.
        const isMatch = await bcrypt.compare(password, user.password)
        if (!isMatch) {
            // Si le mot de passe ne correspond pas, on renvoie une erreur.
            return res.status(401).json({ message: "Email or password incorrect." })
        }

        // On creer le token JWT.
        const token = jwt.sign(
            { id: user._id, role: user.role},
            process.env.JWT_SECRET,
            { expiresIn: '30d'}
        )

        // Envoyer la réponse avec le token
        // et les informations de l'utilisateur completes (sans le mot de passe).
        res.status(200).json({
            token,
            user: { 
                id: user._id, 
                username: user.username,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role,
                avatar: user.avatar,
                bio: user.bio,
                createdAt: user.createdAt
            }
        })

    } catch (error) {
        // Afficher l'erreur dans la console pour le développement.
        // Renvoyer une réponse avec un message d'erreur et un status 500 pour indiquer une erreur serveur.
        console.error(error)
        res.status(500).json({ message: "Error while connecting." })
    }
}

// Fonction de deconexion.
const logout = async (req, res) => { 
    // Comme on utilise des tokens JWT pour l'authentification, 
    // la déconnexion côté serveur est généralement gérée en invalidant le 
    // token côté client (en le supprimant du stockage local ou des cookies).
    res.status(200).json({ message: "Disconnected successfully !" })
}


// Fonction pour obtenir le profil de l'utilisateur.
const getUserProfile = async (req, res) => {
    /**
     * Fonction pour obtenir le profil de l'utilisateur connecté.
     * 
     * Étapes :
     *      1. Récupérer l'ID de l'utilisateur connecté à partir du token d'authentification (req.user.id) en excluant le mot de passe.
     *      2. Rechercher l'utilisateur dans la base de données MongoDB en utilisant son ID si il exist.
     * 
     *      Si l'utilisateur n'est pas trouvé:
     *          3. Renvoyer une erreur 404 avec un message indiquant que l'utilisateur n'a pas été trouvé.
     *      
     *      Sinon, si l'utilisateur est trouvé:
     *          4. Renvoyer une réponse avec les informations du profil de l'utilisateur (sans le mot de passe) et un status 200.
     *      
     *      Sinon en cas d'erreur server:
     *          5. Afficher l'erreur dans la console pour le développement.
     *          6. Renvoyer une réponse avec un message d'erreur et un status 500 pour 
     *              indiquer une erreur serveur.
     * 
     * @desc Cette fonction permet d'obtenir le profile d'un utilisateur 
     * et afficher ses informations
     * 
     * @route GET /api/auth/profile
     */

    try {
        // On trouve l'utilisateur par son id, et on exclu le mot de passe de la reponse.
        const user = await User.findById(req.user.id).select('-password')

        // Verifier si l'utilisateur est definis, exist
        // en affiche ses informations
        if (user) {
            res.json({
                id: user._id,
                username: user.username,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                avatar: user.avatar,
                bio: user.bio,
                createdAt: user.createdAt
            });
        } else {
            // Si l'utilisateur n'existe pas, on renvoie une erreur 404.
            res.status(404).json({ message: "User not found" });
        }

    } catch (error) { 
        // Afficher l'erreur dans la console pour le développement.
        // Renvoyer une réponse avec un message d'erreur et un status 500 pour indiquer une erreur serveur.
        console.error(error)
        res.status(500).json({ message: "Error while fetching user profile." })
    }
}


const updateUserProfile = async (req, res) => {
    /**
     * Fonction pour mettre à jour le profil de l'utilisateur connecté.
     * 
     * Étapes :
     *     1. Essayer de récupérer l'ID de l'utilisateur connecté à partir du token d'authentification (req.user.id).
     * 
     *     Si l'utilisateur est trouvé:
     *          2. Mettre à jour les champs du profil de l'utilisateur avec les données fournies 
     *              dans la requête (firstName, lastName, username, email, avatar. bio) 
     *              metre a jour les champs fournis les autre on leurs donne l'ancienne valeur.
     *     
     *     Si un nouveau mot de passe est fourni: 
     *          3. Générer une clé aléatoire et hasher le nouveau mot de passe avec bcrypt, 
     *              puis mettre à jour le champ password de l'utilisateur.
     *     
     *     4. Enregistrer les modifications dans la base de données.
     * 
     *     Si tout vas bien:
     *          5. Renvoyer une réponse avec un message de succès et les informations 
     *              du profil mis à jour (sans le mot de passe) et un status 200.
     * 
     *     Sinon, si l'utilisateur n'est pas trouvé:
     *          6. Renvoyer une erreur 404 avec un message indiquant que 
     *              l'utilisateur n'a pas été trouvé.
     * 
     *     Sinon en cas d'erreur server:
     *          7. Afficher l'erreur dans la console pour le développement.
     *          8. Renvoyer une réponse avec un message d'erreur et un status 500 pour indiquer une erreur serveur.
     *
     * @desc Cette fonction permet à un utilisateur de mettre à jour son propre profil. 
     * 
     * @route PUT /api/auth/edit-profile/:id
     */

    try {
        // On trouve l'utilisateur par son id.
        const user = await User.findById(req.user.id)

        // Si l'utilisateur est definis, exist
        if (user) {

            // Mettre à jour les champs du profil de l'utilisateur avec 
            // les données fournies dans la requête.
            user.firstName = req.body.firstName || user.firstName
            user.lastName = req.body.lastName || user.lastName
            user.username = req.body.username || user.username
            user.email = req.body.email || user.email
            user.bio = req.body.bio || user.bio

            // Si une nouvelle image a etais uploader 
            // On la garde, sinon, on laisse l'ancienne.
            if (req.file) {
                user.avatar = `/images/${req.file.filename}`;
            }

            // Enregistrer les modifications dans la base de données.
            const updatedUser = await user.save()

            // Renvoyer une réponse avec un message de succès et les informations du profil mis à jour (sans le mot de passe).
            res.status(200).json({ 
                message: "User profile updated successfully.", 
                user: {
                    id: updatedUser._id,
                    username: updatedUser.username,
                    firstName: updatedUser.firstName,
                    lastName: updatedUser.lastName,
                    email: updatedUser.email,
                    avatar: updatedUser.avatar,
                    bio: updatedUser.bio,
                    createdAt: updatedUser.createdAt
                } 
            })

        } else {
            // Si l'utilisateur n'existe pas, on renvoie une erreur 404.
            res.status(404).json({ message: "User not found." })
        }

    } catch (error) {
        // Afficher l'erreur dans la console pour le développement.
        // Renvoyer une réponse avec un message d'erreur et un status 500 pour indiquer une erreur serveur.
        console.error(error)
        res.status(500).json({ message: "Error while updating user profile." })
    }
}

// Fonction pour supprimer le profil de l'utilisateur connecté.
const deleteUserProfile = async (req, res) => {
    /**
     * Fonction pour supprimer le profil de l'utilisateur connecté.
     * 
     * Étapes :
     *     1. Récupérer l'ID de l'utilisateur connecté à partir du token d'authentification (req.user.id).
     *     
     *     Si l'utilisateur est trouvé:
     *          2. Supprimer l'utilisateur de la base de données.
     *          3. Renvoyer une réponse avec un message de succès et un status 200.
     * 
     *     Sinon, si l'utilisateur n'est pas trouvé:
     *          4. Renvoyer une réponse avec un message d'erreur et un status 404.
     * 
     *     Sinon en cas d'erreur:
     *          5. Afficher l'erreur dans la console pour le développement.
     *          6. Renvoyer une réponse avec un message d'erreur et un status 500 pour indiquer une erreur serveur.
     *
     * @desc Cette fonction permet à un utilisateur de supprimer son propre profil. 
     * 
     * @route DELETE /api/auth/delete-profile/:id
     * @access Private (auth, et admin)
     * cette route pour est priver pour les administrateur authentifier
     */
    try {
        // On trouve l'utilisateur par son id.
        const user = await User.findById(req.user.id)

        if (user) {
            // Supprimer l'utilisateur de la base de données.
            await user.deleteOne()

            // Renvoyer une réponse avec un message de succès et un status 200.
            res.status(200).json({ message: "User profile deleted successfully." })
        } else {
            // Si l'utilisateur n'existe pas, on renvoie une erreur 404.
            res.status(404).json({ message: "User not found." })
        }

    } catch (error) {
        // Afficher l'erreur dans la console pour le développement.
        // Renvoyer une réponse avec un message d'erreur et un status 500 pour indiquer une erreur serveur.
        console.error(error)
        res.status(500).json({ message: "Error while deleting user profile." })
    }
}


// On exporte les fonctions pour les utiliser dans les routes.
module.exports = { 
    signup, 
    login,
    logout,
    getUserProfile,
    updateUserProfile,
    deleteUserProfile
}

