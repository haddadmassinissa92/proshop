// src/pages/ProductDetails.jsx

// Import de React et des bibliothèques nécessaires
import React, { useEffect, useState } from 'react';
// Import de bibliotheque pour la navigation et les paramètres d'URL
import { useParams, useNavigate } from 'react-router-dom';

// Import axios pour les requêtes HTTP
import axios from 'axios';
// Import useDispatch pour envoyer des actions Redux
// Import de l'action pour ajouter un produit au panier
import { useDispatch } from 'react-redux';
import { addToCart } from '../store/cartSlice';

// Import des icônes FontAwesome pour les spécifications techniques
// Import d'une icône GPU supplémentaire
import { FaShoppingCart, FaArrowLeft, FaMemory, FaHdd, FaMicrochip } from 'react-icons/fa';
import { BsGpuCard } from "react-icons/bs";

// Import des styles CSS pour la page de détails du produit
import '../styles/ProductDetails.css';

const ProductDetails = () => {
  // Récupération de l'ID du produit depuis les paramètres de l'URL
  // import bibliotheque pour naviguer vers d'autres pages
  // dispatcher pour envoyer des actions au store de Redux
  // État local pour stocker les données du produit
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [product, setProduct] = useState(null);

  useEffect(() => {
    // Fonction asynchrone pour récupérer les détails du produit depuis l'API
    const fetchProduct = async () => {
      
      // Requête GET pour obtenir le produit par son ID
      const { data } = await axios.get(`http://localhost:3000/api/products/${id}`);
      
      // Mise à jour de l'état avec les données du produit
      setProduct(data);
    };
    fetchProduct();
  }, [id]);

  // Affichage du message de chargement si le produit n'est pas encore chargé
  if (!product) return <div className="loading">Chargement des données...</div>;

  // Rendu du composant
  return (
    <div className="product-detail-container">
      {/* Bouton pour revenir à la page précédente */}
      <button className="back-btn" onClick={() => navigate(-1)}>
        <FaArrowLeft /> Retour à la boutique
      </button>

      {/* Grille de disposition : image à gauche, infos à droite */}
      <div className="detail-grid">
        
        {/* SECTION IMAGE DU PRODUIT */}
        <div className="detail-image-section">
          <img src={`http://localhost:3000${product.images[0].replace('/public', '')}`} alt={product.name} />
        </div>

        {/* SECTION INFORMATIONS GÉNÉRALES */}
        <div className="detail-info-section">
          
          {/* Marque du produit */}
          <span className="brand-label">{product.brand}</span>
          
          {/* Nom du produit */}
          <h1>{product.name}</h1>
          
          {/* Catégorie du produit */}
          <p className="category-tag">{product.category.toUpperCase()}</p>
          
          {/* Prix du produit */}
          <div className="price-tag">{product.price.toLocaleString()} DA</div>

          {/* SECTION SPÉCIFICATIONS TECHNIQUES */}
          <div className="tech-specs">
            <h3>Spécifications techniques</h3>
            <div className="specs-grid">
              
              {/* Processeur */}
              <div className="spec-item">
                <strong>Processeur:</strong> <span><FaMicrochip/> {product.specs?.processor || 'N/A'}</span>
              </div>
              {/* Mémoire RAM */}
              <div className="spec-item">
                <strong>Mémoire RAM:</strong> <span><FaMemory/> {product.specs?.ram || 'N/A'}</span>
              </div>
              {/* Stockage (disque dur/SSD) */}
              <div className="spec-item">
                <strong>Stockage:</strong> <span><FaHdd/> {product.specs?.storage || 'N/A'}</span>
              </div>
              {/* Carte graphique */}
              <div className="spec-item">
                <strong>Carte Graphique:</strong><BsGpuCard/> <span> {product.specs?.gpu || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* SECTION DESCRIPTION DU PRODUIT */}
          <div className="description-section">
            <h3>Description</h3>
            <p>{product.description}</p>
          </div>

          {/* SECTION ACTIONS (stock et bouton panier) */}
          <div className="action-footer">
             {/* Affichage du statut de stock */}
             <span className={product.countInStock > 0 ? 'stock in' : 'stock out'}>
                {product.countInStock > 0 ? `En stock (${product.countInStock} unités)` : 'Rupture de stock'}
             </span>
             {/* Bouton pour ajouter un produit au panier */}
             <button 
                className="add-btn-main"
                disabled={product.countInStock === 0}
                onClick={() => dispatch(addToCart(product))}
             >
                <FaShoppingCart /> Ajouter au panier
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Export par défaut du composant
export default ProductDetails;
