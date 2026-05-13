// src/pages/Home.jsx

// Import de React et les bibliothèques necessaires
import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation  } from 'react-router-dom';
import axios from 'axios';

// useDispatch pour envoyer des actions
// Import de l'action d'ajouter un produit au panier
import { useDispatch } from 'react-redux';
import { addToCart } from '../store/cartSlice';

// Import des icônes FontAwesome
import { 
  FaShoppingCart, 
  FaStar 
} from 'react-icons/fa';

// Importation des styles CSS pour la page d'accueil
import '../styles/Home.css';

const Home = () => {

  // État pour stocker la liste des produits affichés
  const [products, setProducts] = useState([]);

  // useDispatch pour envoyer des actions au store Redux
  // useNavigate pour la redirection programmatique
  // useLocation pour accéder aux paramètres de l'URL
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()

  // Extraction du paramètre de recherche depuis l'URL (?search=...)
  const searchParams = new URLSearchParams(location.search)
  const search = searchParams.get('search') || ''

  useEffect(() => {
    const fetchProducts = async () => {
      const { data } = await axios.get(`http://localhost:3000/api/products?search=${search}`)
      setProducts(data);
    };
    fetchProducts();
  }, [search]);

  // Fonction utilitaire pour tronquer le texte à une longueur donnée
  const truncateText = (text, limit) => {
    return text.length > limit ? text.substring(0, limit) + "..." : text
  }

  // Rendu du composant
  return (
    <div className="home-container">
      <h2 className="main-title">Latest IT Hardware</h2>

      {/* Message affiché si aucune recherche ne correspond */}
      {search && products.length === 0 && (
        <div className="no-products">
          <p>Aucun produit ne correspond à votre recherche "<strong>{search}</strong>".</p>
          <button onClick={() => navigate('/')} className="btn-clear-search">
            Voir tous les produits
          </button>
        </div>
      )}
      
      {/* Grille d'affichage des produits */}
      <div className="product-grid">
        {products.map((product) => (
          
            <div 
            key={product._id} 
            className="product-card link-card"
            onClick={() => navigate(`/product/${product._id}`)}
            >
              
              {/* En-tête de la carte produit : marque, nom, catégorie */}
              <div className="card-header">
                <span className="brand-tag">{product.brand}</span>
                <h3 className="product-name">{product.name}</h3>
                <span className="category-text">{product.category}</span>
              </div>

              {/* Corps de la carte : image et description */}
              <div className="card-body">
                <img 
                  src={product.images && product.images.length > 0 
                    ? `http://localhost:3000${product.images[0].replace('/public', '')}` 
                    : 'https://placeholder.com'} 
                  alt={product.name} 
                  className="product-img" 
                />
                <p className="description">
                  {truncateText(product.description || "Aucune description disponible", 80)}
                </p>
              </div>

              {/* Pied de la carte : prix, stock, évaluation, bouton panier */}
              <div className="card-footer">
                <div className="footer-top">
                  <span className="price">{product.price.toLocaleString()} DA</span>
                  <span className={`stock-tag ${product.countInStock > 0 ? 'in-stock' : 'out-of-stock'}`}>
                    {product.countInStock > 0 ? `${product.countInStock} en stock` : 'Rupture de stock'}
                  </span>
                </div>
                
                <div className="footer-bottom">
                  <div className="rating">
                    <FaStar className="star-icon" /> {product.rating} 
                    <span className="num-reviews">({product.numReviews})</span>
                  </div>
                  <button 
                    className="add-to-cart-btn" 
                    onClick={(e) => {
                      e.stopPropagation(); 
                      dispatch(addToCart(product))
                    }}
                    disabled={product.countInStock === 0}
                  >
                    <FaShoppingCart /> Ajouter au Panier
                  </button>
                </div>
              </div>
            </div>

          
        ))}
      </div>
    </div>
  );
};

// Export par défaut du composant
export default Home;

