// models/user.model.js

// Importation des dépendances nécessaires 
// pour la création du modèle de données utilisateur.
const mongoose = require('mongoose');
const validator = require('validator'); 

const userSchema = new mongoose.Schema({
    /**
     * Schéma de données pour les utilisateurs du e-commerce, avec des champs essentiels comme :
     * - firstName : prénom de l'utilisateur
     * - lastName : nom de famille de l'utilisateur
     * - username : nom d'utilisateur unique pour l'identification
     * - email : adresse email de l'utilisateur, avec validation pour s'assurer qu'elle est au format correct
     * - password : mot de passe de l'utilisateur, avec des règles de validation pour la sécurité
     * - role : rôle de l'utilisateur (ex: user, admin, moderator) avec des valeurs possibles et une valeur par défaut
     * - avatar : URL de la photo de profil de l'utilisateur (optionnel)
     * - bio : Une petite description sur l'utilisateur
     */
    
    // Prénom de l'utilisateur
    firstName: {
        type: String,
        required: [true, 'First name is required'],
        trim: true,
        minlength: [3, 'First name must be at least 3 characters'],
        maxlength: [100, 'First name cannot exceed 100 characters']
    },

    // Nom de l'utilisateur
    lastName: {
        type: String,
        required: [true, 'Last name is required'],
        trim: true,
        minlength: [3, 'Last name must be at least 3 characters'],
        maxlength: [100, 'Last name cannot exceed 100 characters']
    },

    // Nom d'utilisateur unique pour l'identification
    username: {
        type: String,
        required: [true, 'The username is required'],
        unique: true,
        trim: true,
        minlength: [3, 'Username must be at least 3 characters']
    },

    // Email de l'utilistateur
    email: {
        type: String,
        required: [true, 'Email is required.'],
        unique: true,
        lowercase: true,
        trim: true,
        validate: [validator.isEmail, 'Invalid email address.']
    },

    // Mot de passe de l'utilisateur, avec des règles de validation pour la sécurité.
    password: {
        type: String,
        required: [true, 'The password is required'],
        minlength: [8, 'The Password must be at least 8 characters'],
        select: false 
    },

    // Rôle de l'utilisateur, avec des valeurs possibles et une valeur par défaut.
    role: {
        type: String,
        enum: {
            values: ['user', 'admin', 'moderator'],
            message: '{VALUE} is not a valid role'
        },
        default: 'user'
    },

    // Optionnel : Photo de profil pour le drop-menu
    avatar: {
        type: String,
        default: ''
    },

    bio: {
        type: String,
        maxlength: [200, 'La description ne peut pas dépasser 200 caractères'],
        default: ''
    }
}, { timestamps: true });

// champ virtuel "fullName" pour le frontend
userSchema.virtual('fullName').get(function() {
    return `${this.firstName} ${this.lastName}`;
});

userSchema.virtual('initials').get(function() {
    return `${this.firstName.charAt(0)}${this.lastName.charAt(0)}`.toUpperCase();
});

module.exports = mongoose.model('User', userSchema);
