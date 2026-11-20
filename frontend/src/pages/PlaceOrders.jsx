// src/pages/PlaceOrders.jsx

// Import de React et useState pour gérer le mode de paiement choisi
import React, { useState } from 'react';

// Import de useSelector pour accéder à l'état global du store Redux,
// et useDispatch pour envoyer des actions au store
import { useSelector, useDispatch } from 'react-redux';

// Import de useNavigate pour naviguer vers d'autres pages 
// et de Link pour navigation React Router (liens connexion)
import { useNavigate, Link } from 'react-router-dom';

// Import d'axios pour l'appel direct à la route de paiement CIB/Edahabia
// (qui ne passe pas par le slice Redux "order")
import axios from 'axios';

// Import de l'action asynchrone pour la création de commande via Redux
import { createOrder } from '../store/orderSlice';
import { clearCart } from '../store/cartSlice';

// Import des icônes FontAwesome pour l'interface
import { FaMapMarkerAlt, FaCreditCard, FaBoxOpen, FaTruck } from 'react-icons/fa';

// Import du fichier CSS pour les styles de la page
import '../styles/PlaceOrder.css';
import { API_URL, getMediaUrl } from '../api/api';

// Les 2 modes de paiement disponibles. Les valeurs correspondent exactement
// à l'enum "paymentMethod" du modèle Order côté backend.
const PAYMENT_METHODS = [
  { value: 'Paiement à la livraison', label: 'Paiement à la livraison', icon: <FaTruck /> },
  { value: 'Carte CIB/Edahabia', label: 'Carte CIB / Edahabia', icon: <FaCreditCard /> },
];

// Définition du composant PlaceOrder pour la page 
// de confirmation de commande
const PlaceOrder = () => {

  // Configuration de useDispatch et useNavigate pour Redux et le routage
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Récupération de l'état du panier depuis Redux
  // Récupération de l'utilisateur et du token d'authentification depuis Redux
  const cart = useSelector((state) => state.cart);
  const cartItems = cart.cartItems || [];
  const { user, token } = useSelector((state) => state.auth);
  const orderState = useSelector((state) => state.order || {});

  // Mode de paiement sélectionné par le client
  const [paymentMethod, setPaymentMethod] = useState('Paiement à la livraison');
  const [paymentError, setPaymentError] = useState(null);
  const [redirecting, setRedirecting] = useState(false);

  // Récupération de l'adresse d'expédition stockée dans le localStorage depuis l'étape précédente
  // et le subtotal
  const shippingAddress = JSON.parse(localStorage.getItem('shippingAddress') || '{}');
  const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  // Si aucune adresse d'expédition n'est trouvée, 
  // redirection vers la page d'expédition
  if (!shippingAddress.address) {
    navigate('/shipping');
  }

  // Fonction asynchrone pour traiter la validation de la commande :
  // 1) crée la commande en base avec le mode de paiement choisi
  // 2) pour le paiement à la livraison, confirme directement ;
  //    pour la carte CIB/Edahabia, redirige vers la page de paiement SATIM.
  const placeOrderHandler = async () => {
    setPaymentError(null);
    try {
      const orderData = {
        orderItems: cartItems.map(item => ({
              product: item._id, // Champ attendu par le schéma Order (orderItemSchema.product)
              name: item.name,
              quantity: item.quantity,
              image: Array.isArray(item.images) ? item.images[0] : item.images,
              price: item.price
        })),
        shippingAddress: shippingAddress,
        paymentMethod,
        itemsPrice: subtotal,
        taxPrice: 0,
        shippingPrice: 0,
        totalPrice: subtotal,
      };

      // Exécution de l'action via le dispatch Redux
      const res = await dispatch(createOrder(orderData)).unwrap();
      if (!res || !res._id) return;

      // La commande est créée en base : le panier a rempli son rôle, on le
      // vide maintenant (et pas sur la page de confirmation, qui sert aussi
      // à revoir d'anciennes commandes depuis l'historique — le vider
      // là-bas effacerait le panier courant à chaque simple consultation).
      dispatch(clearCart());

      if (paymentMethod === 'Paiement à la livraison') {
        // Rien à payer en ligne : la commande est confirmée directement.
        navigate(`/order/${res._id}?new=1`);
        return;
      }

      // Carte CIB/Edahabia : on enregistre le paiement auprès de SATIM
      // puis on redirige le client vers leur page de paiement sécurisée.
      setRedirecting(true);
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const { data } = await axios.post(`${API_URL}/api/payments/chargily/checkout/${res._id}`, {}, config);
      // faux positif documenté et reconnu de cette règle sur ce pattern
      // précis (redirection via window.location.href dans un gestionnaire
      // async, voir github.com/facebook/react/issues/34776 et #35158) :
      // ce n'est pas une mutation d'état React, juste une navigation
      // navigateur standard.
      // eslint-disable-next-line react-hooks/immutability
      window.location.href = data.checkoutUrl;

    } catch (err) {
      // Gestion propre des erreurs à l'écran via l'erreur rejetée par le slice Redux
      // ou par l'appel axios direct (CIB/Edahabia).
      setRedirecting(false);
      setPaymentError(err?.response?.data?.message || err.message || err || "Erreur lors de la validation");
    }
  };

  return (
    // Conteneur principal de la page
    <div className="placeorder-container">

      {/* Titre principal de la page */}
      <h1 className="main-title">Récapitulatif de Commande</h1>

      {/* Grille pour organiser les informations et le résumé */}
      <div className="placeorder-grid">

        {/* COLONNE GAUCHE : DÉTAILS DE LA COMMANDE */}
        <div className="order-details">

          {/* Bloc d'informations sur l'expédition */}
          <div className="info-block">
            <h3><FaMapMarkerAlt /> Expédition</h3>

            {/* Affichage du nom du destinataire */}
            <p><strong>Destinataire :</strong> {user?.firstName} {user?.lastName}</p>
            
            {/* Affichage de l'adresse complète */}
            <p><strong>Adresse :</strong> {shippingAddress.address}, {shippingAddress.city} ({shippingAddress.postalCode})</p>
            
            {/* Affichage du numéro de téléphone */}
            <p><strong>Téléphone :</strong> {shippingAddress.phone}</p>
          </div>

          {/* Bloc de sélection du mode de paiement */}
          <div className="info-block">
            <h3><FaCreditCard /> Mode de Paiement</h3>
            <div className="payment-methods-list">
              {PAYMENT_METHODS.map((method) => (
                <label
                  key={method.value}
                  className={`payment-method-option ${paymentMethod === method.value ? 'selected' : ''}`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={method.value}
                    checked={paymentMethod === method.value}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <span className="payment-method-icon">{method.icon}</span>
                  <span>{method.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Bloc d'informations sur les articles commandés */}
          <div className="info-block">
            <h3><FaBoxOpen /> Articles commandés</h3>
            
            {/* Si le panier est vide, afficher un message */}
            {cartItems.length === 0 ? (
              <p>Votre panier est vide</p>
            ) : (
              // Liste des articles du panier
              <div className="order-items-list">
                {cartItems.map((item, index) => (
                  <div key={index} className="order-item">
                    
                    {/* Image du produit */}
                    <img 
                      src={item.images ? getMediaUrl((Array.isArray(item.images) ? item.images[0] : item.images)) : ''} 
                      alt={item.name} 
                    />
                    
                    {/* Lien vers la page détaillée du produit */}
                    <Link to={`/product/${item._id}`}>{item.name}</Link>
                    
                    {/* Quantité, prix unitaire et total pour cet article */}
                    <span>{item.quantity} x {item.price.toLocaleString()} DA = <strong>{(item.quantity * item.price).toLocaleString()} DA</strong></span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* COLONNE DROITE : RÉSUMÉ ET BOUTON DE CONFIRMATION */}
        <div className="order-summary-card">
          
          {/* Titre du résumé */}
          <h2>Résumé</h2>
          
          {/* Ligne pour le sous-total des articles */}
          <div className="summary-row">
            <span>Articles :</span>
            <span>{subtotal.toLocaleString()} DA</span>
          </div>
          
          {/* Ligne pour les frais de livraison (gratuits) */}
          <div className="summary-row">
            <span>Livraison :</span>
            <span>Gratuit</span>
          </div>
          
          {/* Ligne pour le total général */}
          <div className="summary-row total">
            <span>Total :</span>
            <span>{subtotal.toLocaleString()} DA</span>
          </div>

          {paymentError && (
            <p style={{ color: '#ef4444', fontSize: '0.9rem', marginBottom: '10px' }}>{paymentError}</p>
          )}

          {/* Bouton pour confirmer la commande, désactivé si le panier est vide ou en cours de chargement */}
          <button
            className="btn-place-order"
            disabled={cartItems.length === 0 || orderState.loading || redirecting}
            onClick={placeOrderHandler}
          >
            {orderState.loading || redirecting ? 'Validation en cours...' : 'Confirmer la commande'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Export par défaut du composant
export default PlaceOrder;
