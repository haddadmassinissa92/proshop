// models/product.model.js

// Importation des dépendances nécessaires pour la création du modèle de données produit.
const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    /**
     * Schéma de données pour les avis (reviews) des produits, avec des champs essentiels comme :
     * - user : référence à l'utilisateur qui a laissé l'avis
     * - name : nom de l'utilisateur qui a laissé l'avis (pour affichage rapide)
     * - rating : note de l'avis (entre 1 et 5)
     * - comment : commentaire de l'avis
     */
    
    // Reférence à l'utilisateur qui a laissé l'avis, avec une relation vers le modèle User.
    user: { 
        type: mongoose.Schema.Types.ObjectId, ref: 'User', 
        required: true 
    },

    // Nom de l'utilisateur qui a laisse l'avis.
    name: { 
        type: String, 
        required: true 
    }, 

    // Note de l'avis, avec une validation pour s'assurer qu'elle est entre 1 et 5.
    rating: { 
        type: Number, 
        required: true, 
        min: 1, 
        max: 5 
    }, 

    // Commentaire de l'avis, avec une validation pour s'assurer qu'il n'est pas vide.
    comment: { 
        type: String, 
        required: true 
    }

}, { timestamps: true });

const productSchema = new mongoose.Schema({
    /**
     * Schéma de données pour les produits du e-commerce, avec des champs essentiels comme :
     * - name : nom du produit
     * - brand : marque du produit
     * - description : description détaillée du produit
     * - specs : spécificités techniques pour les produits informatiques
     * - price : prix du produit
     * - images : tableau d'URLs des images du produit
     * - category : catégorie du produit (ex: ordinateurs, composants, périphériques, etc.)
     * - countInStock : quantité disponible en stock
     * - reviews : tableau d'avis (reviews) pour chaque produit
     * - rating : note moyenne calculée à partir des avis
     * - numReviews : nombre total d'avis pour le produit
     */

    // Nom du produit, avec une validation pour s'assurer qu'il n'est pas vide.
    name: { 
        type: String, 
        required: true, 
        trim: true 
    },

    // Marque du produit, avec une validation pour s'assurer qu'elle n'est pas vide.
    brand: { 
        type: String, 
        required: true 
    }, 

    // Description détaillée du produit, avec une validation pour s'assurer qu'elle n'est pas vide.
    description: { 
        type: String, 
        required: true 
    },
    
    // Spécificités Informatiques.
    // Information technique détaillée pour les produits informatiques.
    specs: {
        processor: { type: String },
        ram: { type: String },
        storage: { type: String },
        gpu: { type: String }
    },

    // Prix du produit, avec une validation pour s'assurer qu'il est positif.
    price: { 
        type: Number, 
        required: true, 
        min: 0 
    },

    // Un produit peut avoir plusieurs images, on stocke les URLs dans un tableau.
    images: [{ 
        type: String, 
        required: true 
    }],
    
    // Catégorie du produit, avec une validation pour n'accepter que les catégories définies.
    category: { 
        type: String, 
        required: true,
        enum: ['ordinateurs', 'composants', 'peripheriques', 'reseaux', 'stockage'],
        lowercase: true 
    },
    
    // Stock disponible pour le produit, avec une valeur par défaut de 0.
    countInStock: { 
        type: Number, 
        required: true, 
        default: 0 
    },
    
    // Tableau d'avis (reviews) pour chaque produit,
    // Nombre total d'avis (numReviews) pour le produit.
    // Note moyenne (rating) calculée à partir des avis,
    reviews: [reviewSchema],
    numReviews: { type: Number, default: 0 },
    rating: { type: Number, default: 0 }
    
}, { timestamps: true });

// Exportation du modèle de données pour les produits.
module.exports = mongoose.model('Product', productSchema);
