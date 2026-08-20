// src/components/AddProductModal.jsx


// Import de React et des hooks nécessaires pour le composant
// Import d'axios pour les requêtes HTTP
// Import de useSelector pour accéder à l'état Redux
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';

// Import des icônes FontAwesome pour la fermeture et l'upload
import { FaTimes, FaCloudUploadAlt } from 'react-icons/fa';
import { API_URL } from '../api/api';

const AddProductModal = ({ onClose, refreshProducts }) => {
  // Récupération du token d'authentification depuis l'état Redux
  const { token } = useSelector((state) => state.auth);
  
  // État pour la liste des catégories disponibles
  // État pour le fichier image sélectionné
  // État pour la prévisualisation de l'image
  const [categories, setCategories] = useState([]);
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(null);

  // État pour les données du formulaire d'ajout de produit
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    category: '',
    price: '',
    countInStock: '',
    description: ''
  });


  // État pour afficher un message si le chargement des catégories échoue
  const [catError, setCatError] = useState(null);

  // Charger les catégories du backend au démarrage
  useEffect(() => {
    const fetchCats = async () => {
        try {
            // Récupérer les catégories depuis l'API
            const { data } = await axios.get(`${API_URL}/api/categories`);
            
            // Mise à jour de l'état des catégories
            setCategories(data);

            // Initialisation de la catégorie par défaut avec l'ID de la première
            // catégorie reçue (et non l'objet catégorie entier — Mongoose attend
            // un ObjectId dans le champ "category" du produit).
            if (data.length > 0) {
                setFormData(prev => ({ ...prev, category: prev.category || data[0]._id }));
            }
        } catch (erreur) {
            console.error("Impossible de charger les catégories", erreur);
            setCatError("Impossible de charger les catégories. Vérifie qu'au moins une catégorie existe (page Catégories).");
        }
    };
    fetchCats();
}, []);

  // Fonction pour gérer la sélection du fichier image
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    
    // Mise à jour du fichier sélectionné
    // Création de l'URL de prévisualisation
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
  };

  // Fonction pour gérer l'envoi du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Vérification qu'une image est sélectionnée
    if (!imageFile) return alert("Veuillez choisir une image !");

    // Vérification qu'une catégorie est bien sélectionnée
    if (!formData.category) return alert("Veuillez choisir une catégorie (ou en créer une depuis la page Catégories).");

    // Création d'un objet FormData pour envoyer fichier et données texte
    const data = new FormData();
    data.append('name', formData.name);
    data.append('brand', formData.brand);
    data.append('category', formData.category);
    data.append('price', formData.price);
    data.append('countInStock', formData.countInStock);
    data.append('description', formData.description);
    data.append('image', imageFile);

    try {
      // Configuration des headers pour l'authentification et le type de contenu
      const config = { 
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data' 
        } 
      };
      
      // Ajouter le produit
      // (Bug corrigé : c'était `\${API_URL}` avec un backslash, donc littéralement
      // envoyé comme URL relative "${API_URL}/api/products" au lieu d'être interpolé.)
      await axios.post(`${API_URL}/api/products`, data, config);
      // Message de succès
      // Rafraîchissement de la liste des produits
      // Fermeture du modal
      alert("Produit informatique ajouté !");
      refreshProducts();
      onClose();
    } catch (err) {
      // Gestion des erreurs (y compris quand le serveur est injoignable,
      // où err.response n'existe pas du tout).
      alert("Erreur : " + (err.response?.data?.message || err.message || "Échec de l'envoi"));
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        {/* En-tête du modal avec titre et bouton de fermeture */}
        <div className="modal-header">
          <h2>Ajouter un produit</h2>
          <button className="close-btn" onClick={onClose}><FaTimes /></button>
        </div>

        {/* Formulaire d'ajout de produit */}
        <form onSubmit={handleSubmit}>
          {/* Ligne pour le nom et la marque du produit */}
          <div className="form-row">
            <input type="text" placeholder="Nom du produit" required value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})} />
            
            <input type="text" placeholder="Marque" required value={formData.brand}
              onChange={(e) => setFormData({...formData, brand: e.target.value})} />
          </div>

          {/* Ligne pour la catégorie et le prix */}
          <div className="form-row">
            <select value={formData.category} required
              onChange={(e) => setFormData({...formData, category: e.target.value})}>
              <option value="" disabled>-- Choisir une catégorie --</option>
              {/* Options pour chaque catégorie */}
              {categories.map(cat => (
                <option key={cat._id} value={cat._id}>
                                    {cat.name}
                                </option>
              ))}
            </select>

            <input type="number" placeholder="Prix (DA)" required value={formData.price}
              onChange={(e) => setFormData({...formData, price: e.target.value})} />
          </div>
          {catError && <p style={{ color: '#ef4444', fontSize: '0.85rem', margin: '-8px 0 10px' }}>{catError}</p>}

          {/* Champ pour la quantité en stock */}
          <input type="number" placeholder="Quantité en stock" required value={formData.countInStock}
            onChange={(e) => setFormData({...formData, countInStock: e.target.value})} />

          {/* Section d'upload d'image — même présentation que le modal de
              modification (aperçu carré + champ fichier stylé côte à côte). */}
          <div className="image-upload-block">
            {preview ? (
              <img src={preview} alt="Aperçu" className="image-upload-preview" />
            ) : (
              <div className="image-upload-preview image-upload-preview-empty">
                <FaCloudUploadAlt />
              </div>
            )}
            <div className="image-upload-fields">
              <input type="file" accept="image/*" onChange={handleFileChange} />
              <p className="image-upload-hint">Image obligatoire pour créer le produit.</p>
            </div>
          </div>

          {/* Zone de texte pour la description */}
          <textarea placeholder="Description du produit..." required value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}></textarea>

          {/* Bouton de soumission du formulaire */}
          <button type="submit" className="btn-save">Enregistrer le produit</button>
        </form>
      </div>
    </div>
  );
};

// Export du composant AddProductModal par défaut
export default AddProductModal;
