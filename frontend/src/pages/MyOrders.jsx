// src/pages/MyOrders.jsx

// Import de React et des bibliothèques nécessaires
import React, { useEffect, useState } from 'react';

// Import axios pour effectuer des requêtes HTTP
import axios from 'axios';

// Import useSelector pour accéder au state Redux
import { useSelector } from 'react-redux';

// Import des icônes FontAwesome pour afficher le statut de livraison
import { FaBox, FaClock, FaCheckCircle } from 'react-icons/fa';

// Import des styles CSS spécifiques à la page des commandes
import '../styles/MyOrders.css';

const MyOrders = () => {
  // État local pour stocker la liste des commandes de l'utilisateur
  // Et La Récupération du token d'authentification depuis le store Redux
  const [orders, setOrders] = useState([]);
  const { token } = useSelector((state) => state.auth);

  useEffect(() => {
    // Fonction asynchrone pour récupérer l'historique des commandes
    const fetchMyOrders = async () => {
      try {
        // Configuration des headers avec le token Bearer
        const config = { headers: { Authorization: `Bearer ${token}` } };
        
        // Requête API pour obtenir les commandes de l'utilisateur connecté
        const { data } = await axios.get('http://localhost:3000/api/orders/user', config);
        
        // Mise à jour de l'état avec les commandes renvoyées par le serveur
        setOrders(data.orders);
      } catch (error) {
        // Affichage de l'erreur dans la console en cas de problème
        console.error("Erreur historique client", error);
      }
    };

    fetchMyOrders();
  }, [token]);

  return (
    <div className="admin-container">
      <h1><FaBox /> Mon Historique d'Achats</h1>

      {/* Tableau listant les commandes */}
      <table className="admin-table">
        <thead>
          <tr>
            <th>COMMANDE</th>
            <th>DATE</th>
            <th>TOTAL</th>
            <th>LIVRAISON</th>
          </tr>
        </thead>
        <tbody>
          {orders.length > 0 ? orders.map((order) => (
            <tr key={order._id}>
              {/* Identifiant de la commande tronqué pour l'affichage */}
              <td>#{order._id.substring(18)}</td>
              
              {/* Date de création de la commande */}
              <td>{new Date(order.createdAt).toLocaleDateString()}</td>
              
              {/* Montant total de la commande */}
              <td>{order.totalPrice.toLocaleString()} DA</td>
              <td>
                {/* Affichage du statut de livraison */}
                {order.isDelivered ? 
                  <span className="status-pill delivered"><FaCheckCircle /> Livré</span> : 
                  <span className="status-pill pending"><FaClock /> En préparation</span>
                }
              </td>
            </tr>
          )) : (
            // Message affiché si aucune commande n'a été trouvée
            <tr><td colSpan="4" style={{textAlign: 'center' }}>Vous n'avez pas encore passé de commande.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

// Export par défaut du composant
export default MyOrders;
