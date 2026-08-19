// Import de React et du hook useState pour gérer l'état local
// Import d'axios pour effectuer des requêtes HTTP
// Import de useSelector pour accéder à l'état Redux
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';

// Import de l'icône FontAwesome pour la fermeture du modal
import { FaTimes } from 'react-icons/fa';
import { API_URL } from '../api/api';

const EditProductModal = ({ product, onClose, refreshProducts }) => {
  // Récupération du token d'authentification depuis l'état Redux
  const { token } = useSelector((state) => state.auth);

  // Liste des catégories disponibles pour le sélecteur
  // (avant, ce modal ne permettait pas du tout de changer la catégorie d'un produit)
  const [categories, setCategories] = useState([]);

  // product.category peut être soit un ObjectId (string) soit un objet peuplé
  // { _id, name } selon l'endroit d'où vient "product" — on normalise ici.
  const initialCategoryId = typeof product.category === 'object' && product.category !== null
    ? product.category._id
    : product.category;

  // État pour les données du formulaire, initialisé avec les valeurs du produit à modifier
  const [formData, setFormData] = useState({
    name: product.name,
    brand: product.brand,
    category: initialCategoryId || '',
    price: product.price,
    countInStock: product.countInStock,
    description: product.description
  });

  // Charger la liste des catégories pour le sélecteur
  useEffect(() => {
    const fetchCats = async () => {
      try {
        const { data } = await axios.get(`${API_URL}/api/categories`);
        setCategories(data);
      } catch (erreur) {
        console.error("Impossible de charger les catégories", erreur);
      }
    };
    fetchCats();
  }, []);

  // Fonction pour gérer l'envoi du formulaire de modification
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Configuration des headers avec le token d'autorisation
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      // Requête PUT pour mettre à jour le produit
      await axios.put(`${API_URL}/api/products/edit-product/${product._id}`, formData, config);
      
      // Message de succès
      // Rafraîchissement de la liste des produits
      // Fermeture du modal
      alert("Produit mis à jour !");
      refreshProducts();
      onClose();
    } catch (err) {
      // Gestion des erreurs (y compris quand le serveur est injoignable,
      // où err.response n'existe pas du tout).
      alert("Erreur : " + (err.response?.data?.message || err.message || "Échec de la mise à jour"));
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

          {/* Ligne pour la catégorie et le prix */}
          <div className="form-row">
            <select value={formData.category} required
              onChange={(e) => setFormData({...formData, category: e.target.value})}>
              <option value="" disabled>-- Choisir une catégorie --</option>
              {categories.map(cat => (
                <option key={cat._id} value={cat._id}>{cat.name}</option>
              ))}
            </select>
            <input type="number" placeholder="Prix (DA)" value={formData.price} required
              onChange={(e) => setFormData({...formData, price: e.target.value})} />
          </div>

          {/* Ligne pour la quantité en stock */}
          <div className="form-row">
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
