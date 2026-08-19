// src/pages/ProductDetails.jsx

// Import de React et des bibliothèques nécessaires
import React, { useEffect, useState } from 'react';
// Import de bibliotheque pour la navigation et les paramètres d'URL
import { useParams, useNavigate } from 'react-router-dom';

// Import axios pour les requêtes HTTP
import axios from 'axios';
// Import useDispatch/useSelector pour interagir avec le store Redux
// Import de l'action pour ajouter un produit au panier
import { useDispatch, useSelector } from 'react-redux';
import { addToCart } from '../store/cartSlice';

// Import des icônes FontAwesome pour les spécifications techniques
// Import d'une icône GPU supplémentaire
import { FaShoppingCart, FaArrowLeft, FaMemory, FaHdd, FaMicrochip, FaStar, FaRegStar, FaUserCircle } from 'react-icons/fa';
import { BsGpuCard } from "react-icons/bs";

// Import des styles CSS pour la page de détails du produit
import '../styles/ProductDetails.css';
import { API_URL, getMediaUrl } from '../api/api';

const ProductDetails = () => {
  // Récupération de l'ID du produit depuis les paramètres de l'URL
  // import bibliotheque pour naviguer vers d'autres pages
  // dispatcher pour envoyer des actions au store de Redux
  // État local pour stocker les données du produit
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [product, setProduct] = useState(null);

  // Utilisateur connecté (pour savoir s'il peut laisser un avis, et pour
  // le token d'authentification à envoyer à la route protégée des avis).
  const { user, token } = useSelector((state) => state.auth);

  // État du formulaire d'avis
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewError, setReviewError] = useState(null);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  // Fonction pour (re)charger le produit depuis l'API — utilisée au montage
  // et après l'envoi d'un nouvel avis, pour afficher la liste à jour.
  const fetchProduct = async () => {
    const { data } = await axios.get(`${API_URL}/api/products/${id}`);
    setProduct(data);
  };

  useEffect(() => {
    fetchProduct();
  }, [id]);

  // Est-ce que l'utilisateur connecté a déjà laissé un avis sur ce produit ?
  // (le backend refuse un deuxième avis, mais autant ne pas montrer le
  // formulaire dans ce cas plutôt que de laisser la personne essayer pour rien)
  const alreadyReviewed = product?.reviews?.some((r) => r.user === user?.id || r.user?._id === user?.id);

  const submitReview = async (e) => {
    e.preventDefault();
    setReviewError(null);
    setReviewSubmitting(true);
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.post(
        `${API_URL}/api/products/${id}/reviews`,
        { rating: reviewRating, comment: reviewComment },
        config
      );
      setReviewComment('');
      setReviewRating(5);
      await fetchProduct(); // recharge le produit pour afficher le nouvel avis et la note à jour
    } catch (err) {
      setReviewError(err.response?.data?.message || err.message || "Erreur lors de l'envoi de l'avis.");
    } finally {
      setReviewSubmitting(false);
    }
  };

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
          <img src={getMediaUrl(product.images[0])} alt={product.name} />
        </div>

        {/* SECTION INFORMATIONS GÉNÉRALES */}
        <div className="detail-info-section">
          
          {/* Marque du produit */}
          <span className="brand-label">{product.brand}</span>
          
          {/* Nom du produit */}
          <h1>{product.name}</h1>
          
          {/* Catégorie du produit */}
          <p className="category-tag">{product.category?.name?.toUpperCase()}</p>

          {/* Note moyenne et nombre d'avis */}
          <div className="rating-summary">
            {[1, 2, 3, 4, 5].map((n) => (
              n <= Math.round(product.rating) ? <FaStar key={n} className="star-filled" /> : <FaRegStar key={n} className="star-empty" />
            ))}
            <span className="rating-count">
              {product.rating?.toFixed(1)} ({product.numReviews} avis)
            </span>
          </div>
          
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

      {/* SECTION AVIS CLIENTS */}
      <div className="reviews-section">
        <h3>Avis clients</h3>

        {product.reviews && product.reviews.length > 0 ? (
          <div className="reviews-list">
            {product.reviews.map((review) => (
              <div key={review._id} className="review-item">
                <div className="review-header">
                  <FaUserCircle className="review-avatar-icon" />
                  <div>
                    <strong>{review.name}</strong>
                    <div className="review-stars">
                      {[1, 2, 3, 4, 5].map((n) => (
                        n <= review.rating ? <FaStar key={n} className="star-filled" /> : <FaRegStar key={n} className="star-empty" />
                      ))}
                    </div>
                  </div>
                  <span className="review-date">{new Date(review.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="review-comment">{review.comment}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-reviews-msg">Aucun avis pour ce produit pour le moment.</p>
        )}

        {/* Formulaire pour laisser un avis — uniquement si connecté et pas déjà avisé */}
        {!token ? (
          <p className="review-login-prompt">
            <a href="/login">Connecte-toi</a> pour laisser un avis sur ce produit.
          </p>
        ) : alreadyReviewed ? (
          <p className="review-login-prompt">Tu as déjà laissé un avis sur ce produit — merci !</p>
        ) : (
          <form className="review-form" onSubmit={submitReview}>
            <h4>Laisser un avis</h4>

            <div className="review-stars-input">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  type="button"
                  key={n}
                  className="star-input-btn"
                  onClick={() => setReviewRating(n)}
                  aria-label={`${n} étoiles`}
                >
                  {n <= reviewRating ? <FaStar className="star-filled" /> : <FaRegStar className="star-empty" />}
                </button>
              ))}
            </div>

            <textarea
              placeholder="Ton avis sur ce produit..."
              required
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
            />

            {reviewError && <p className="review-error">{reviewError}</p>}

            <button type="submit" className="btn-submit-review" disabled={reviewSubmitting}>
              {reviewSubmitting ? 'Envoi...' : 'Envoyer mon avis'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

// Export par défaut du composant
export default ProductDetails;
