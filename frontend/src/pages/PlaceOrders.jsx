// src/pages/PlaceOrders.jsx

// Import de React pour créer le composant
import React from 'react';

// Import de useSelector pour accéder à l'état global du store Redux,
// et useDispatch pour envoyer des actions au store
import { useSelector, useDispatch } from 'react-redux';

// Import de useNavigate pour naviguer vers d'autres pages 
// et de Link pour navigation React Router (liens connexion)
import { useNavigate, Link } from 'react-router-dom';

// Import d'axios pour faire des requêtes HTTP
import axios from 'axios';

// Import des icônes FontAwesome pour l'interface
import { FaMapMarkerAlt, FaCreditCard, FaBoxOpen } from 'react-icons/fa';

// Import du fichier CSS pour les styles de la page
import '../styles/PlaceOrder.css';

// Définition du composant PlaceOrder pour la page 
// de confirmation de commande
const PlaceOrder = () => {

  // useDispatch pour envoyer des actions Redux
  // useNavigate pour la navigation programmatique (redirection)
  // const dispatch = useDispatch()
  const navigate = useNavigate();

  // Récupération de l'état du panier depuis Redux
  // Récupération de l'utilisateur et du token d'authentification depuis Redux
  const cart = useSelector((state) => state.cart);
  const cartItems = cart.cartItems || [];
  console.log(cart.cartItems);
  const { user, token } = useSelector((state) => state.auth);

  // Récupération de l'adresse d'expédition stockée dans le localStorage depuis l'étape précédente
  // et le subtotal
  const shippingAddress = JSON.parse(localStorage.getItem('shippingAddress') || '{}');
  const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  // Si aucune adresse d'expédition n'est trouvée, 
  // redirection vers la page d'expédition
  if (!shippingAddress.address) {
    navigate('/shipping');
  }

  // Fonction asynchrone pour traiter la validation de la commande
  const placeOrderHandler = async () => {
    try {
      // Configuration des en-têtes pour la requête API, incluant le token d'autorisation
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      };

      // Données de la commande à envoyer au serveur
      const orderData = {
        orderItems: cartItems.map(item => ({
              name: item.name,
              quantity: item.quantity,
              image: Array.isArray(item.images) ? item.images[0] : item.images,
              price: item.price,
              product: item._id
        })),
        shippingAddress: shippingAddress,
        paymentMethod: 'Paiement à la livraison',
        itemsPrice: subtotal,
        taxPrice: 0,
        shippingPrice: 0,
        totalPrice: subtotal,
      };

      // Envoi de la requête POST pour créer la commande
      await axios.post('http://localhost:3000/api/orders', orderData, config);

      // Affichage d'un message de succès
      alert("Commande validée avec succès !");

      // Suppression des articles du panier du localStorage
      // localStorage.removeItem('cartItems');

      // Redirection vers le tableau de bord admin (ou profil utilisateur)
      navigate(`/admin/dashboard`);
    } catch (err) {
      // Gestion des erreurs : affichage du message d'erreur du serveur ou un message générique
      alert(err.response?.data?.message || "Erreur lors de la validation");
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
            <p><strong>Destinataire :</strong> {user.firstName} {user.lastName}</p>
            
            {/* Affichage de l'adresse complète */}
            <p><strong>Adresse :</strong> {shippingAddress.address}, {shippingAddress.city} ({shippingAddress.postalCode})</p>
            
            {/* Affichage du numéro de téléphone */}
            <p><strong>Téléphone :</strong> {shippingAddress.phone}</p>
          </div>

          {/* Bloc d'informations sur le paiement */}
          <div className="info-block">
            <h3><FaCreditCard /> Mode de Paiement</h3>
            
            {/* Mode de paiement fixe : paiement à la livraison */}
            <p>Paiement à la livraison</p>
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
                      src={item.images ? `http://localhost:3000${(Array.isArray(item.images) ? item.images[0] : item.images).replace('/public', '')}` : ''} 
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
          
          {/* Bouton pour confirmer la commande, désactivé si le panier est vide */}
          <button
            className="btn-place-order"
            disabled={cartItems.length === 0}
            onClick={placeOrderHandler}
          >
            Confirmer la commande
          </button>
        </div>
      </div>
    </div>
  );
};

// Export par défaut du composant
export default PlaceOrder;
