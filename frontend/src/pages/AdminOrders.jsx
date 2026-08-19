// AdminOrders.jsx

// Importation de React et des bibliothèques nécessaires pour les actions et l'états global
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux'; // Gestion du store
import axios from 'axios'; // Importation d'axios pour les requêtes HTTP


// Importation des icônes FontAwesome pour l'interface
import { FaTruck, FaEye, FaCheckCircle, FaClock } from 'react-icons/fa';

// Importation des styles CSS pour l'administration
import '../styles/Admin.css';
import { API_URL, getMediaUrl } from '../api/api';

// Définition du composant AdminOrders pour gérer les commandes côté admin
const AdminOrders = () => {

  // État pour stocker la liste des commandes
  // État pour gérer l'état de chargement des données
  // État pour stocker la commande sélectionnée pour prévisualisation
  const [orders, setOrders] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null); 
  
  // Récupération du token d'authentification depuis le store Redux
  const { token } = useSelector((state) => state.auth);

  // Fonction asynchrone pour récupérer les commandes depuis l'API
  const fetchOrders = async () => {
    try {
      // Configuration des headers avec le token d'autorisation
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      // Requête GET pour obtenir les commandes admin
      const { data } = await axios.get(`${API_URL}/api/orders/admin`, config);
      // Mise à jour de l'état avec les 
      // commandes récupérées et Fin du chargement
      setOrders(data.orders);
      setLoading(false);
    } catch (error) {
      // Gestion des erreurs et affichage dans la console
      // Fin du chargement même en cas d'erreur
      console.error("Erreur lors de la récupération des commandes", error);
      setLoading(false);
    }
  };

  // useEffect pour exécuter fetchOrders au montage du composant
  useEffect(() => {
    fetchOrders();
  }, []);

  // Fonction pour marquer une commande comme livrée
  const deliverHandler = async (orderId) => {
    // Confirmation de l'utilisateur avant de procéder
    if (window.confirm("Marquer cette commande comme livrée ?")) {
      try {
        // Configuration des headers avec le token
        const config = { headers: { Authorization: `Bearer ${token}` } };
        
        // Requête PUT pour mettre à jour le statut de livraison
        await axios.put(`${API_URL}/api/orders/${orderId}/deliver`, {}, config);
        
        // Alerte de succès
        alert("Statut de la commande mis à jour !");
        
        // Actualisation de la liste des commandes
        fetchOrders(); 
      } catch (error) {
        // Alerte en cas d'erreur
        alert(error.response?.data?.message || "Erreur lors de la mise à jour du statut");
      }
    }
  };

  // Fonction pour marquer une commande comme payée (paiement à la livraison
  // encaissé, ou virement reçu — pas de passerelle de paiement automatique).
  const markAsPaidHandler = async (orderId) => {
    if (window.confirm("Confirmer que cette commande a été payée ?")) {
      try {
        const config = { headers: { Authorization: `Bearer ${token}` } };
        await axios.put(`${API_URL}/api/orders/${orderId}/pay`, {}, config);
        alert("Commande marquée comme payée !");
        fetchOrders();
      } catch (error) {
        alert(error.response?.data?.message || "Erreur lors de la mise à jour du paiement");
      }
    }
  };

  // Fonction pour prévisualiser les détails d'une commande
  const handlePreview = (order) => {
    setSelectedOrder(order);
  };

  // Fonction pour fermer le modal de prévisualisation
  const closePreview = () => {
    setSelectedOrder(null);
  };

  // Affichage du chargement si les données sont en cours de récupération
  if (loading) return <div className="admin-container">Chargement des commandes...</div>;

  // Rendu du composant
  return (
    // Conteneur principal de l'administration
    <div className="admin-container">
      
      {/* En-tête de la page avec titre et description */}
      <div className="admin-header">
        <h1><FaTruck /> Gestion : Commandes clients</h1>
        <p>Gérez vos expéditions et suivez vos ventes de matériel informatique.</p>
      </div>

      {/* Conteneur du tableau des commandes */}
      <div className="admin-table-container">

        {/* Tableau pour afficher les commandes */}
        <table className="admin-table">
          
          {/* En-têtes du tableau */}
          <thead>
            <tr>
              <th>ID</th>
              <th>CLIENT</th>
              <th>DATE</th>
              <th>MODE</th>
              <th>TOTAL</th>
              <th>PAYÉ</th>
              <th>LIVRÉ</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          
          {/* Corps du tableau avec les données */}
          <tbody>
            {orders.length > 0 ? (
              orders.map((order) => (
                <tr key={order._id}>
                  
                  {/* ID de la commande tronqué */}
                  <td className="order-id" data-label="ID">#{order._id.substring(18)}</td>
                  
                  {/* Informations du client */}
                  <td data-label="Client">
                    <strong>{order.user?.firstName} {order.user?.lastName}</strong>
                    <br /><small>{order.user?.email}</small>
                  </td>
                  
                  {/* Date de création */}
                  <td data-label="Date">{new Date(order.createdAt).toLocaleDateString()}</td>

                  {/* Mode de paiement choisi */}
                  <td data-label="Mode">{order.paymentMethod}</td>

                  {/* Prix total */}
                  <td data-label="Total">{order.totalPrice.toLocaleString()} DA</td>
                  
                  {/* Statut de paiement */}
                  <td data-label="Payé">
                    {order.isPaid ? 
                      <span className="badge success">Payé</span> : 
                      <span className="badge danger">En Attente</span>
                    }
                  </td>
                  
                  {/* Statut de livraison */}
                  <td data-label="Livré">
                    {order.isDelivered ? 
                      <span className="badge success">Expédié</span> : 
                      <span className="badge warning">À expédier</span>
                    }
                  </td>
                  
                  {/* Boutons de paiement, livraison et previsualisation des details */}
                  <td className="actions-cell" data-label="Actions">

                    {/* Bouton pour marquer le paiement reçu */}
                    {!order.isPaid && (
                      <button className="btn-deliver" onClick={() => markAsPaidHandler(order._id)}>
                        <FaClock /> Marquer payé
                      </button>
                    )}

                    {/* Bouton pour marquer la livréson */}
                    {!order.isDelivered && (
                      <button className="btn-deliver" onClick={() => deliverHandler(order._id)}>
                        <FaCheckCircle /> Livrer
                      </button>
                    )}
                    
                    {/* Bouton pour voir les détails de la commande */}
                    <button className="btn-view" onClick={() => handlePreview(order)}>
                      <FaEye />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              // Message si aucune commande trouvée
              <tr><td colSpan="8" style={{textAlign: 'center'}}>Aucune commande trouvée.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de prévisualisation des détails de la commande */}
      {selectedOrder && (
        <div className="modal-overlay" onClick={closePreview}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Détails de la Commande #{selectedOrder._id.substring(18)}</h2>
              <button className="modal-close" onClick={closePreview}>×</button>
            </div>
            <div className="modal-body">
              <div className="order-details">
                <div className="detail-section">
                  <h3>Informations Client</h3>
                  <p><strong>Nom :</strong> {selectedOrder.user?.firstName} {selectedOrder.user?.lastName}</p>
                  <p><strong>Email :</strong> {selectedOrder.user?.email}</p>
                </div>
                
                <div className="detail-section">
                  <h3>Détails de la Commande</h3>
                  <p><strong>Date :</strong> {new Date(selectedOrder.createdAt).toLocaleString()}</p>
                  <p><strong>Mode de paiement :</strong> {selectedOrder.paymentMethod}</p>
                  <p><strong>Total :</strong> {selectedOrder.totalPrice.toLocaleString()} DA</p>
                  <p><strong>Payé :</strong> {selectedOrder.isPaid ? 'Oui' : 'Non'}</p>
                  <p><strong>Livré :</strong> {selectedOrder.isDelivered ? 'Oui' : 'Non'}</p>
                </div>
                
                <div className="detail-section">
                  <h3>Articles Commandés</h3>
                  {selectedOrder.orderItems && selectedOrder.orderItems.length > 0 ? (
                    <ul className="order-items">
                      {selectedOrder.orderItems.map((item, index) => (
                        <li key={index}>
                          <img 
                            src={item.image ? getMediaUrl(item.image) : 'https://placeholder.com'} 
                            alt={item.name} 
                            style={{ width: '50px', height: '50px', objectFit: 'contain', marginRight: '10px' }} 
                          />
                          <div>
                            <strong>{item.name}</strong>
                            <br />
                            Quantité: {item.quantity} | Prix: {item.price} DA
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>Aucun article trouvé.</p>
                  )}
                </div>
                
                {selectedOrder.shippingAddress && (
                  <div className="detail-section">
                    <h3>Adresse de Livraison</h3>
                    <p>{selectedOrder.shippingAddress.address}</p>
                    <p>{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.postalCode}</p>
                    <p>{selectedOrder.shippingAddress.country}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Export du composant pour l'utiliser 
// dans d'autres parties de l'application
export default AdminOrders;
