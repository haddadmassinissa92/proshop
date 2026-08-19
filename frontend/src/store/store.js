// store.js - Configuration du store Redux pour l'application ProShop

// Importation de configureStore pour créer le store Redux,
import { configureStore } from '@reduxjs/toolkit';

// Importation des reducers pour chaque slice de l'état global
// authReducer : gère l'état d'authentification (utilisateur, token, chargement, erreurs)
// cartReducer : gère l'état du panier d'achat (articles, quantités)
import authReducer from './authSlice';
import cartReducer from './cartSlice';
import orderReducer from './orderSlice'; // Importation du reducer pour les commandes

// Création et configuration du store Redux
// Le store centralise tout l'état global de l'application
export const store = configureStore({
    // Configuration des reducers : chaque clé correspond à une partie de l'état
    reducer: {
        // Slice auth : gère les données de l'utilisateur connecté (token JWT, profil utilisateur, état de chargement, messages d'erreur)
        // Slice cart : gère les produits informatiques dans le panier (liste des articles, quantités, persistance dans localStorage)
        auth: authReducer,
        cart: cartReducer,
        order: orderReducer, // Ajout du slice order pour gérer les commandes
    },
    
});
