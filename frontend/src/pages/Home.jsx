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
import { API_URL, getMediaUrl } from '../api/api';

const Home = () => {

  // État pour stocker la liste des produits affichés
  // État pour stocker la liste des catégories (pour le filtre)
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  // useDispatch pour envoyer des actions au store Redux
  // useNavigate pour la redirection programmatique
  // useLocation pour accéder aux paramètres de l'URL
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()

  // Extraction des paramètres depuis l'URL (?search=...&category=...)
  const searchParams = new URLSearchParams(location.search)
  const search = searchParams.get('search') || ''
  const categoryFilter = searchParams.get('category') || ''

  // Chargement des catégories une seule fois, pour le sélecteur de filtre
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await axios.get(`${API_URL}/api/categories`);
        setCategories(data);
      } catch (error) {
        console.error("Impossible de charger les catégories", error);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (categoryFilter) params.set('category', categoryFilter);
      const { data } = await axios.get(`${API_URL}/api/products?${params.toString()}`)
      setProducts(data);
    };
    fetchProducts();
  }, [search, categoryFilter]);

  // Fonction pour changer la catégorie sélectionnée dans le filtre,
  // tout en conservant une éventuelle recherche déjà en cours.
  const handleCategoryChange = (e) => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (e.target.value) params.set('category', e.target.value);
    navigate(`/?${params.toString()}`);
  };

  // Fonction utilitaire pour tronquer le texte à une longueur donnée
  const truncateText = (text, limit) => {
    return text.length > limit ? text.substring(0, limit) + "..." : text
  }

  // Rendu du composant
  return (
    <div className="home-container">
      <h2 className="main-title">Latest IT Hardware</h2>

      {/* Filtre par catégorie */}
      <div className="category-filter" style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '0 0 20px' }}>
        <label htmlFor="category-select" style={{ fontWeight: 'bold', color: '#334155' }}>Catégorie :</label>
        <select id="category-select" value={categoryFilter} onChange={handleCategoryChange}
          style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd' }}>
          <option value="">Toutes les catégories</option>
          {categories.map(cat => (
            <option key={cat._id} value={cat._id}>{cat.name}</option>
          ))}
        </select>
      </div>

      {/* Message affiché si aucun produit ne correspond aux filtres */}
      {(search || categoryFilter) && products.length === 0 && (
        <div className="no-products">
          <p>
            {search
              ? <>Aucun produit ne correspond à votre recherche "<strong>{search}</strong>".</>
              : "Aucun produit dans cette catégorie pour le moment."}
          </p>
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
                {/* product.category est maintenant peuplé par le backend
                    (populate('category', 'name slug')) : on affiche son nom
                    au lieu de l'ObjectId brut affiché auparavant. */}
                <span className="category-text">{product.category?.name || ''}</span>
              </div>

              {/* Corps de la carte : image et description */}
              <div className="card-body">
                <img 
                  src={product.images && product.images.length > 0 
                    ? getMediaUrl(product.images[0]) 
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

