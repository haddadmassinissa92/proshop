// src/pages/adminDashboard.jsx

// Import de React et les bibliothèques necessaires
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// Import des icônes FontAwesome et Recharts
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { FaLaptop, FaUsers, FaBoxOpen, FaDollarSign, FaShoppingCart } from 'react-icons/fa';

// Import des styles css
import '../styles/Admin.css';

const AdminDashboard = () => {

  // states pour les commandes, le graphique, et les stats 
  const [stats, setStats] = useState({ totalProducts: 0, totalStock: 0, totalValue: 0 })
  const [chartData, setChartData] = useState([])
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  // la redirection
  const navigate = useNavigate();


  useEffect(() => {
    // Récupération du token depuis le localStorage
    const token = localStorage.getItem('token');

    // Vérification si le token est valide
    // (pas null, pas undefined, pas "null", pas "undefined")
    const isValidToken = token && token !== "null" && token !== "undefined"

    // const config = {
    //   headers: {
    //     Authorization: `Bearer ${token}`,
    //   },
    // };

    
    const fetchDashboardData = async () => {

      try {
        // Récupération du token depuis le localStorage
        const token = localStorage.getItem('userToken'); 

        // Récupération des données des produits depuis l'API publique
        const { data: products } = await axios.get('http://localhost:3000/api/products');

        // Calcul du stock total en additionnant countInStock de chaque produit
         // Calcul de la valeur totale du stock (prix * quantité en stock pour chaque produit)
        const totalStock = products.reduce((acc, item) => acc + item.countInStock, 0);
        const totalValue = products.reduce((acc, item) => acc + (item.price * item.countInStock), 0);

        // Comptage du nombre de produits par catégorie pour le graphique
        const categories = products.reduce((acc, item) => {
          acc[item.category] = (acc[item.category] || 0) + 1;
          return acc;
        }, {});

        // Formatage des données du graphique en forme cercle (camembert)
        const formattedData = Object.keys(categories).map(key => ({
          name: key.toUpperCase(),
          value: categories[key]
        }));

        // Mise à jour des statistiques dans l'état
        setStats({ 
          totalProducts: products.length, 
          totalStock: totalStock, 
          totalValue: totalValue 
        })

        // Mise à jour des données du graphique
        setChartData(formattedData)

        // Vérification si le token est valide
        const isValidToken = token && token !== "null" && token !== "undefined";

        // Si le token est valide, récupération des commandes admin
        if (isValidToken) {
          try {
            // Configuration des headers avec le token d'autorisation
            const config = { headers: { Authorization: `Bearer ${token}` } }

            // Récupération des commandes depuis l'API admin
            const { data: orderData } = await axios.get('http://localhost:3000/api/orders/admin', config)

            console.log("RÉPONSE SERVEUR :", orderData);

            // Mise à jour des commandes (limitées aux 5 dernières)
            setOrders(orderData.orders ? orderData.orders.slice(0, 5) : []);
          } catch (err) {
            console.error("Erreur Commandes (401):", err.message);
          }
        }
      } catch (error){
        console.error("Erreur Dashboard:", error.response?.data?.message || error.message);
      } finally {
        // Fin du chargement, quel que soit le résultat
        setLoading(false);
      }
      
    };

    fetchDashboardData();
  }, []);

  // les couleurs qui represente chaque categorie
  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

  return (
    <div className="admin-container">
      <h1 className="admin-title">Tableau de Bord</h1>
      
      <div className="stats-grid">
        {/* Carte pour le nombre total de produits */}
        <div className="stat-card">
            <div className="stat-icon products">
                <FaLaptop />
            </div>
          <div className="stat-info">
            <h3>Produits</h3>
            <p>{stats.totalProducts}</p>
          </div>
        </div>

        {/* Carte pour le nombre total d'unités en stock */}
        <div className="stat-card">
          <div className="stat-icon stock">
            <FaBoxOpen />
          </div>
          <div className="stat-info">
            <h3>Unités en Stock</h3>
            <p>{stats.totalStock}</p>
          </div>
        </div>

        {/* Carte pour la valeur totale du stock */}
        <div className="stat-card">
          <div className="stat-icon value"><FaDollarSign /></div>
          <div className="stat-info">
            <h3>Valeur du Stock</h3>
            <p>{stats.totalValue.toLocaleString()} DA</p>
          </div>
        </div>
      </div>

      {/* Graphique */}
      <div className="dashboard-content">
        <div className="chart-box">
          <h3>Répartition des catégories</h3>
          <div style={{ width: '100%', minWidth: 0,  height: 300, minHeight: 300 }}>
            <ResponsiveContainer width="99%" height={300} debounce={1}>
              <PieChart>
                {/* Composant Pie pour afficher le graphique en camembert */}
                <Pie 
                  data={chartData} 
                  innerRadius={60} 
                  outerRadius={80} 
                  paddingAngle={5} 
                  dataKey="value"
                >
                  {/* Cellules colorées pour chaque tranche du camembert */}
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                
                {/* Tooltip pour afficher les détails au survol */}
                <Tooltip />
                
                {/* Légende pour identifier les catégories */}
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>


      {/* TABLEAU DES COMMANDES */}
      <div className="dashboard-orders">
        <h3><FaShoppingCart /> Dernières Commandes</h3>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Client</th>
              <th>Date</th>
              <th>Total</th>
              <th>Statut</th>
            </tr>
          </thead>
          <tbody>
            {orders.length > 0 ? orders.map(order => (
              <tr key={order._id}>
                
                {/* Nom complet du client */}
                <td>{order.user?.firstName} {order.user?.lastName}</td>

                {/* Date de création de la commande */}
                <td>{new Date(order.createdAt).toLocaleDateString()}</td>

                {/* Prix total de la commande */}
                <td>{order.totalPrice.toLocaleString()} DA</td>

                {/* Statut de livraison */}
                <td><span className={`status-pill ${order.isDelivered ? 'delivered' : 'pending'}`}>
                  {order.isDelivered ? 'Livré' : 'En attente'}
                </span></td>
              </tr>
            )) : (
              // Message si aucune commande
              <tr><td colSpan="4" style={{textAlign: 'center', padding: '20px'}}>Aucune commande trouvée encore.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Boutton Lien rapide vers la gestion du stock */}
      <div className="quick-actions">
        <button className="btn-action-card" onClick={() => window.location.href='/admin/products'}>
            Aller À La Gestion Du Stock
        </button>
      </div>
    </div>
  );
};

// Export du composant AdminDashboard
export default AdminDashboard;
