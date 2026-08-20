// src/components/CartSidebar.jsx

// Import de React pour créer des composants
import React from 'react';

// Import de useSelector pour accéder à l'état global du store Redux,
// et useDispatch pour envoyer des actions au store
// Import des actions de suppression d'un produit ou de 
// vider le panier depuis le slice cart
import { useSelector, useDispatch } from 'react-redux';
import { removeFromCart, updateQuantity, clearCart } from '../store/cartSlice';

// Import de useNavigate pour naviguer vers d'autres pages
import { useNavigate } from 'react-router-dom';

// Import des icones FontAwesome pour les boutons (poubelle, croix, +/-)
import { 
    FaTrash, 
    FaTimes,
    FaPlus,
    FaMinus,
} from 'react-icons/fa';

// Import du fichier CSS pour les styles du composant
import '../styles/Cart.css';
import { API_URL, getMediaUrl } from '../api/api';

// Définition du composant CartSidebar qui prend deux props :
// isOpen (booléen pour savoir si le panier est ouvert) 
// et onClose (fonction pour fermer le panier)
const CartSidebar = ({ isOpen, onClose }) => {

  // useDispatch pour envoyer des actions Redux
  // Et useNavigate pour la navigation programmatique (redirection)
  const dispatch = useDispatch();
  const navigate = useNavigate()
  
  // Récupération des articles du panier depuis l'état Redux
  // Et Récupération de l'utilisateur connecté depuis l'état Redux
  const { cartItems } = useSelector((state) => state.cart);
  const { user } = useSelector((state) => state.auth);

  // Calcul du prix total en additionnant le prix de chaque article multiplié par sa quantité
  const totalPrice = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

  // Fonction appelée lors du clic sur "Commander"
  // Si l'utilisateur n'est pas connecté, redirection vers la page de connexion avec un paramètre redirect
  // Sinon, redirection vers la page d'expédition
  const checkoutHandler = () => {
    if (!user) {
      navigate('/login?redirect=shipping');
    } else {
      navigate('/shipping');
    }
  };


  return (
    <>
      {/* Overlay sombre qui apparaît derrière le panier quand il est ouvert, clic dessus ferme le panier */}
      <div className={`cart-overlay ${isOpen ? 'show' : ''}`} onClick={onClose}></div>

      {/* Panneau latéral du panier, avec classe 'open' si isOpen est true */}
      <div className={`cart-sidebar ${isOpen ? 'open' : ''}`}>
        
        {/* En-tête du panier avec le titre et le bouton de fermeture */}
        <div className="cart-header">
            <h2>Mon Panier ({cartItems.length})</h2>
            <button className="close-btn" onClick={onClose}>
                <FaTimes />
            </button>
        </div>

        {/* Contenu du panier */}
        <div className="cart-content">
          
          {/* Si le panier est vide, afficher un message */}
          {cartItems.length === 0 ? (
            <div className="empty-cart">
              <p>Votre panier est vide.</p>
            </div>
          ) : (
            
            // Sinon, mapper sur chaque article pour l'afficher
            cartItems.map((item) => (
              <div key={item._id} className="cart-item">
                
                {/* Image du produit, avec une URL construite dynamiquement ou un placeholder */}
                <img 
                  src={item.images && item.images.length > 0 
                    ? getMediaUrl((Array.isArray(item.images) ? item.images[0] : item.images)) 
                    : 'https://placeholder.com'} 
                  alt={item.name} 
                />
                
                {/* Détails de l'article : nom et sélecteur de quantité */}
                <div className="item-details">
                  <h4>{item.name}</h4>
                  <p className="item-unit-price">{item.price.toLocaleString()} DA / unité</p>

                  {/* Boutons +/- pour ajuster la quantité sans avoir à
                      retirer puis rajouter l'article. Le reducer
                      updateQuantity bloque déjà les valeurs hors limites
                      (min 1, max le stock disponible), donc pas besoin de
                      re-vérifier ici. */}
                  <div className="quantity-selector">
                    <button
                      onClick={() => dispatch(updateQuantity({ id: item._id, quantity: item.quantity - 1 }))}
                      disabled={item.quantity <= 1}
                      aria-label="Diminuer la quantité"
                    >
                      <FaMinus />
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      onClick={() => dispatch(updateQuantity({ id: item._id, quantity: item.quantity + 1 }))}
                      disabled={item.countInStock != null && item.quantity >= item.countInStock}
                      aria-label="Augmenter la quantité"
                    >
                      <FaPlus />
                    </button>
                  </div>
                </div>
                
                {/* Bouton pour supprimer cet article du panier */}
                <button 
                  className="remove-btn" 
                  onClick={() => dispatch(removeFromCart(item._id))}
                >
                  <FaTrash className=''/>
                </button>
              </div>
            ))
          )}
        </div>

        {/* Pied du panier, affiché seulement si le panier n'est pas vide */}
        {cartItems.length > 0 && (
          <div className="cart-footer">
            
            {/* Boîte affichant le total */}
            <div className="total-box">
              <span>Total :</span>
              <span className="total-price">{totalPrice.toLocaleString()} DA</span>
            </div>
            
            {/* Bouton pour procéder au paiement */}
            <button className="checkout-btn" onClick={checkoutHandler}>Commander</button>
            
            {/* Bouton pour vider complètement le panier */}
            <button className="clear-btn" onClick={() => dispatch(clearCart())}>
              <FaTrash className='trash'/> Vider le panier
            </button>
          </div>
        )}
      </div>
    </>
  );
};

// Export par défaut du composant
export default CartSidebar;
