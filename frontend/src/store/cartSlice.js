// cartSlice.js - Slice Redux pour gérer l'état du panier d'achat

// Import de createSlice depuis Redux Toolkit pour créer le slice
import { createSlice } from '@reduxjs/toolkit';

// Initialisation de l'état du panier
// On récupère les articles du panier depuis localStorage s'ils existent
// Cela permet de persister le panier même après un rafraîchissement de la page
// Si on souhaite ajouter une fonctionnalité de sauvegarde côté serveur,
// on pourra faire une requête API ici pour récupérer le panier de l'utilisateur connecté
const initialState = {
  cartItems: localStorage.getItem('cartItems')
    ? JSON.parse(localStorage.getItem('cartItems'))
    : [], // Tableau vide si aucun article n'est sauvegardé
};

// Création du slice Redux pour le panier
// Le slice contient le nom, l'état initial et les reducers pour gérer les actions
const cartSlice = createSlice({
  // Nom du slice utilisé comme préfixe pour les actions
  name: 'cart',
  
  // État initial du slice
  initialState,

  // Définition des reducers pour les actions synchrones sur le panier
  reducers: {
    // Action pour ajouter un produit au panier
    addToCart: (state, action) => {
        // Recherche si le produit est déjà dans le panier
        const itemIndex = state.cartItems.findIndex(
            (item) => item._id === action.payload._id
        );

        // Si le produit existe déjà dans le panier
        if (itemIndex >= 0) {
            // Augmentation de la quantité du produit existant
            state.cartItems[itemIndex].quantity += 1;
        } else {
            // Sinon, ajout du nouveau produit avec une quantité initiale de 1
            const tempProduct = { ...action.payload, quantity: 1 };
            state.cartItems.push(tempProduct);
        }
        // Sauvegarde du panier mis à jour dans localStorage pour la persistance
        localStorage.setItem('cartItems', JSON.stringify(state.cartItems));
    },

    // Action pour supprimer complètement un produit du panier
    removeFromCart: (state, action) => {
      // Filtrage du tableau pour retirer l'article dont l'ID correspond
      state.cartItems = state.cartItems.filter(
        (item) => item._id !== action.payload
      );
      // Mise à jour du localStorage après suppression
      localStorage.setItem('cartItems', JSON.stringify(state.cartItems));
    },

    // Action pour changer la quantité d'un article déjà dans le panier
    // (boutons +/- dans CartSidebar.jsx — avant, il n'existait aucun moyen
    // d'ajuster la quantité une fois l'article ajouté, seulement de le
    // supprimer entièrement).
    updateQuantity: (state, action) => {
      const { id, quantity } = action.payload;
      const item = state.cartItems.find((item) => item._id === id);
      if (!item) return;

      // Jamais en dessous de 1 (pour descendre à 0, on utilise removeFromCart,
      // via le bouton supprimer dédié) et jamais au-dessus du stock réellement
      // disponible pour ce produit — sinon le client pourrait commander plus
      // que ce qu'on peut réellement lui livrer.
      const max = item.countInStock ?? Infinity;
      item.quantity = Math.max(1, Math.min(quantity, max));

      localStorage.setItem('cartItems', JSON.stringify(state.cartItems));
    },

    // Action pour vider complètement le panier
    clearCart: (state) => {
      // Réinitialisation du tableau des articles
      // Suppression complète du panier du localStorage
      state.cartItems = [];
      localStorage.removeItem('cartItems');
    },
  },
});

// Exportation des actions créées par le slice
// Ces actions peuvent être dispatchées dans les composants 
// pour modifier l'état du panier
export const {
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart
} = cartSlice.actions

// Exportation du reducer par défaut
// Ce reducer sera intégré dans le store Redux pour gérer l'état du panier
export default cartSlice.reducer;
