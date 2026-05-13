// src/pages/AdminProducts.jsx

// Import de React et les bibliothèques necessaires
// Importation d'axios pour les requêtes HTTP
import React, { useEffect, useState } from 'react';
import axios from 'axios'; 

// Importation de useSelector pour accéder au state Redux
import { useSelector } from 'react-redux'; 

// Importation des composants modaux pour ajouter ou modifier un produit
import AddProductModal from '../components/AddProductModal';
import EditProductModal from '../components/EditProductModal';

// Importation des icônes FontAwesome pour l'interface
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa';

// Importation des styles CSS pour l'administration
import '../styles/Admin.css';

// Définition du composant AdminProducts 
// pour gérer les produits côté admin
const AdminProducts = () => {

  // État pour stocker la liste des produits
  // État pour stocker le produit en cours d'édition,
  // État pour contrôler l'affichage du modal d'ajout,
  const [products, setProducts] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showModal, setShowModal] = useState(false);
  
  // Récupération du token d'authentification depuis le store Redux
  const { token } = useSelector((state) => state.auth);
  
  // Fonction asynchrone pour récupérer les produits depuis l'API
  const fetchProducts = async () => {
    // Recuperer tous les produits
    const { data } = await axios.get('http://localhost:3000/api/products');
    
    // Mise à jour de l'état avec les produits récupérés
    setProducts(data);
  };


  // useEffect pour exécuter fetchProducts au montage du composant
  useEffect(() => {
    fetchProducts();
  }, []);

  // Fonction pour supprimer un produit par son ID
  const handleDelete = async (id) => {
    // Confirmation de l'utilisateur avant de supprimer
    if (window.confirm("Supprimer ce produit ?")) {
      // Supprimer le produit avec le token d'autorisation
      await axios.delete(`http://localhost:3000/api/products/delete-product/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Actualisation de la liste des produits après suppression
      fetchProducts();
    }
  };

  // Rendu du composant
  return (
    // Conteneur principal de l'administration
    <div className="admin-container">
      
      {/* En-tête de la page avec le titre et bouton d'ajout */}
      <div className="admin-header">
        <h1>Gestion du Stock</h1>

        {/* Bouton pour ouvrir le modal d'ajout d'un nouveau produit */}
        <button onClick={() => setShowModal(true)} className="btn-add-product">
            <FaPlus /> Nouveau Produit
        </button>
      </div>

      {/* Tableau pour afficher la liste des produits */}
      <table className="admin-table">
        
        {/* En-têtes du tableau */}
        <thead>
          <tr>
            <th>IMAGE</th>
            <th>NOM</th>
            <th>MARQUE</th>
            <th>PRIX</th>
            <th>STOCK</th>
            <th>ACTIONS</th>
          </tr>
        </thead>
        
        {/* Corps du tableau avec les données des produits */}
        <tbody>
          {products.map((product) => (
            <tr key={product._id}>
              
              {/* l'image du produit */}
              <td>
                <img 
                  src={product.images && product.images[0] 
                    ? `http://localhost:3000${product.images[0].replace('/public', '')}` 
                    : 'https://placeholder.com'} 
                  alt={product.name} 
                  style={{ width: '50px', height: '50px', objectFit: 'contain' }} 
                />
              </td>
              
              {/* Nom du produit */}
              <td>{product.name}</td>
              
              {/* Marque du produit */}
              <td>{product.brand}</td>
              
              {/* Prix du produit en DA */}
              <td>{product.price} DA</td>
              
              {/* Quantité en stock */}
              <td>{product.countInStock}</td>
              
              {/* Actions avec boutons modifier et supprimer */}
              <td>
                <button className="btn-edit" onClick={() => setEditingProduct(product)}>
                  <FaEdit />
                </button>

                <button className="btn-delete" onClick={() => handleDelete(product._id)}>
                  <FaTrash />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

        {/* Affichage conditionnel du modal d'ajout de produit */}
        {showModal && 
          <AddProductModal 
            onClose={() => setShowModal(false)} 
            refreshProducts={fetchProducts} 
          />
        }

        {/* Affichage conditionnel du modal de modification de produit */}
        {editingProduct && 
          <EditProductModal 
            product={editingProduct} 
            onClose={() => setEditingProduct(null)} 
            refreshProducts={fetchProducts} 
          />
        }

        {/* Bouton de lien rapide vers l'accueil */}
        <div className="quick-actions">
          <button className="btn-action-card" onClick={() => window.location.href='/'}>
              Retour vers L'accueil
          </button>
        </div>
    </div>
  );
};

// Export du composant AdminProducts
export default AdminProducts;
