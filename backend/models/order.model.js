// models/order.model.js

const mongoose = require('mongoose');

/**
 * Schéma pour les éléments individuels d'une commande
 * Chaque élément représente un produit acheté avec sa quantité et son prix
 */
const orderItemSchema = new mongoose.Schema({
    // Nom du produit acheté
    name: { 
        type: String, 
        required: true 
    },

    // Quantité du produit commandé (minimum 1)
    quantity: { 
        type: Number, 
        required: true, 
        min: 1 
    },

    // URL de l'image du produit
    image: { 
        type: String, 
        required: true 
    },

    // Prix unitaire du produit au moment de la commande
    price: { 
        type: Number, 
        required: true, 
        min: 0 
    },

    // Référence ObjectId vers le modèle Product pour la gestion des stocks
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    }
});

/**
 * Schéma principal des commandes (Orders)
 * Définit la structure complète d'une commande client
 */
const orderSchema = new mongoose.Schema({
    // Référence vers l'utilisateur qui a passé la commande
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    // Tableau des produits commandés (utilise le schéma orderItemSchema)
    orderItems: [orderItemSchema],

    // Objet contenant les informations de livraison
    shippingAddress: {
        // Adresse de livraison
        address: { 
            type: String, 
            required: true 
        },
        
        // Ville de livraison
        city: { 
            type: String, 
            required: true 
        },
        
        // Code postal
        postalCode: { 
            type: String, 
            required: true 
        },
        
        // Pays (par défaut Algérie)
        country: { 
            type: String, 
            required: true, 
            default: 'Algérie' 
        },
        
        // Numéro de téléphone pour la livraison
        phone: { 
            type: String, 
            required: true 
        } 
    },

    // Méthode de paiement choisie
    paymentMethod: { 
        type: String, 
        required: true, 
        enum: ['Paiement à la livraison', 'Carte CIB', 'Virement'],
        default: 'Paiement à la livraison' 
    },
    
    // Montant de la TVA
    taxPrice: { 
        type: Number, 
        required: true, 
        default: 0.0 
    },
    
    // Frais de livraison
    shippingPrice: { 
        type: Number, 
        required: true, 
        default: 0.0 
    },
    
    // Prix total de la commande (produits + TVA + livraison)
    totalPrice: { 
        type: Number, 
        required: true, 
        default: 0.0 
    },

    // Statut du paiement
    isPaid: { 
        type: Boolean, 
        required: true, 
        default: false 
    },
    
    // Date du paiement (si payé)
    paidAt: { type: Date },

    // Statut de la livraison (important pour l'administration)
    isDelivered: { 
        type: Boolean, 
        required: true, 
        default: false 
    },
    
    // Date de livraison (si livré)
    deliveredAt: { type: Date },
    
    // Statut général de la commande pour le suivi
    status: {
        type: String,
        required: true,
        enum: ['En attente', 'Confirmée', 'En cours de livraison', 'Livrée', 'Annulée'],
        default: 'En attente'
    }

}, { 
    timestamps: true // Ajoute automatiquement les champs createdAt et updatedAt à chaque document
});

// Indexation pour optimiser les recherches : 
// par utilisateur et tri par date décroissante
orderSchema.index({ user: 1, createdAt: -1 });

// Export du modèle Order basé sur le schéma défini
module.exports = mongoose.model('Order', orderSchema);
