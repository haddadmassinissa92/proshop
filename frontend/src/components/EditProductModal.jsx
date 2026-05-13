// Import de React et du hook useState pour gérer l'état local
// Import d'axios pour effectuer des requêtes HTTP
// Import de useSelector pour accéder à l'état Redux
import React, { useState } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';

// Import de l'icône FontAwesome pour la fermeture du modal
import { FaTimes } from 'react-icons/fa';

const EditProductModal = ({ product, onClose, refreshProducts }) => {
  // Récupération du token d'authentification depuis l'état Redux
  const { token } = useSelector((state) => state.auth);
  
  // État pour les données du formulaire, initialisé avec les valeurs du produit à modifier
  const [formData, setFormData] = useState({
    name: product.name,
    brand: product.brand,
    category: product.category,
    price: product.price,
    countInStock: product.countInStock,
    description: product.description
  });

  // Fonction pour gérer l'envoi du formulaire de modification
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Configuration des headers avec le token d'autorisation
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      // Requête PUT pour mettre à jour le produit
      await axios.put(`http://localhost:3000/api/products/${product._id}`, formData, config);
      
      // Message de succès
      // Rafraîchissement de la liste des produits
      // Fermeture du modal
      alert("Produit mis à jour !");
      refreshProducts();
      onClose();
    } catch (err) {
      // Gestion des erreurs
      alert("Erreur : " + err.response.data.message);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        {/* En-tête du modal avec titre dynamique et bouton de fermeture */}
        <div className="modal-header">
            <h2>Modifier : {product.name}</h2>
            <button onClick={onClose}>
                <FaTimes />
            </button>
        </div>

        {/* Formulaire de modification du produit */}
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <input type="text" placeholder="Nom du produit" value={formData.name} required
              onChange={(e) => setFormData({...formData, name: e.target.value})} />
            
            <input type="text" placeholder="Marque" value={formData.brand} required
              onChange={(e) => setFormData({...formData, brand: e.target.value})} />
          </div>

          {/* Ligne pour le prix et la quantité en stock */}
          <div className="form-row">
            <input type="number" placeholder="Prix (DA)" value={formData.price} required
              onChange={(e) => setFormData({...formData, price: e.target.value})} />
            <input type="number" placeholder="Quantité en stock" value={formData.countInStock} required
              onChange={(e) => setFormData({...formData, countInStock: e.target.value})} />
          </div>

          {/* Zone de texte pour la description */}
          <textarea placeholder="Description du produit" value={formData.description} required
            onChange={(e) => setFormData({...formData, description: e.target.value})}></textarea>
            
            {/* Bouton de soumission pour mettre à jour le produit */}
            <button type="submit" className="btn-save">
                Mettre à jour
            </button>
        </form>
      </div>
    </div>
  );
};

// Export du composant EditProductModal par défaut
export default EditProductModal;
