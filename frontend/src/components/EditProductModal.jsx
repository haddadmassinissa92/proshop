// Import de React et du hook useState pour gérer l'état local
// Import d'axios pour effectuer des requêtes HTTP
// Import de useSelector pour accéder à l'état Redux
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';

// Import de l'icône FontAwesome pour la fermeture du modal
import { FaTimes } from 'react-icons/fa';
import { API_URL, getMediaUrl } from '../api/api';

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

  // Nouvelle image choisie (optionnelle — si non fournie, l'image actuelle
  // du produit est conservée telle quelle côté backend). Avant, ce modal
  // n'avait tout simplement aucun moyen de changer l'image d'un produit
  // après sa création : pas de champ fichier, et les données étaient
  // envoyées en JSON (pas en multipart), donc même en forçant un fichier
  // il n'aurait jamais atteint le serveur.
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(null);

  const currentImageUrl = product.images && product.images[0] ? getMediaUrl(product.images[0]) : null;

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

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
      // On envoie en multipart/form-data (comme AddProductModal) plutôt
      // qu'en JSON : c'est ce que le middleware Multer attend côté backend
      // pour reconnaître un fichier envoyé dans le champ "image". Envoyé en
      // JSON, req.file restait toujours vide côté serveur, donc l'image
      // n'était jamais mise à jour même si le reste du formulaire marchait.
      const data = new FormData();
      data.append('name', formData.name);
      data.append('brand', formData.brand);
      data.append('category', formData.category);
      data.append('price', formData.price);
      data.append('countInStock', formData.countInStock);
      data.append('description', formData.description);
      if (imageFile) {
        data.append('image', imageFile); // seulement si une nouvelle image a été choisie
      }

      // Configuration des headers avec le token d'autorisation
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        }
      };
      
      // Requête PUT pour mettre à jour le produit
      await axios.put(`${API_URL}/api/products/edit-product/${product._id}`, data, config);
      
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

          {/* Image actuelle du produit + champ pour la remplacer (optionnel) */}
          <div className="image-upload-block">
            <img
              src={preview || currentImageUrl || 'https://placeholder.com'}
              alt={product.name}
              className="image-upload-preview"
            />
            <div className="image-upload-fields">
              <input type="file" accept="image/*" onChange={handleImageChange} />
              <p className="image-upload-hint">Laisse vide pour garder l'image actuelle.</p>
            </div>
          </div>

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

          {/* Quantité en stock — hors de .form-row (qui est en flex) pour
              qu'elle prenne vraiment toute la largeur du formulaire, comme
              la description en dessous. */}
          <input type="number" placeholder="Quantité en stock" value={formData.countInStock} required
            onChange={(e) => setFormData({...formData, countInStock: e.target.value})} />

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
