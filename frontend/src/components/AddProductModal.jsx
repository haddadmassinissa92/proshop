// src/components/AddProductModal.jsx


// Import de React et des hooks nécessaires pour le composant
// Import d'axios pour les requêtes HTTP
// Import de useSelector pour accéder à l'état Redux
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';

// Import des icônes FontAwesome pour la fermeture et l'upload
import { FaTimes, FaCloudUploadAlt } from 'react-icons/fa';

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
    category: 'ordinateurs',
    price: '',
    countInStock: '',
    description: ''
  });


  // Charger les catégories du backend au démarrage
  useEffect(() => {
    const fetchCats = async () => {
        try {
            // Récupérer les catégories depuis l'API
            const { data } = await axios.get('http://localhost:3000/api/products/categories');
            
            // Mise à jour de l'état des catégories
            setCategories(data);
            
            // Initialisation de la catégorie par défaut avec la première valeur reçue
            if (data.length > 0) {
                setFormData(prev => ({ ...prev, category: data[0] }));
            }
        } catch (erreur) {
            console.error("Impossible de charger les catégories", erreur);
            // Valeurs de secours si le backend échoue
            setCategories(['ordinateurs', 'composants', 'peripheriques']);
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
      
      // L'Ajouter le produit
      await axios.post('http://localhost:3000/api/products', data, config);
      // Message de succès
      // Rafraîchissement de la liste des produits
      // Fermeture du modal
      alert("Produit informatique ajouté !");
      refreshProducts();
      onClose();
    } catch (err) {
      // Gestion des erreurs
      alert("Erreur : " + (err.response?.data?.message || "Échec de l'envoi"));
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
            <input type="text" placeholder="Nom du produit" required
              onChange={(e) => setFormData({...formData, name: e.target.value})} />
            
            <input type="text" placeholder="Marque" required
              onChange={(e) => setFormData({...formData, brand: e.target.value})} />
          </div>

          {/* Ligne pour la catégorie et le prix */}
          <div className="form-row">
            <select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})}>
              {/* Options pour chaque catégorie */}
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat.toUpperCase()}</option>
              ))}
            </select>

            <input type="number" placeholder="Prix (DA)" required
              onChange={(e) => setFormData({...formData, price: e.target.value})} />
          </div>

          {/* Champ pour la quantité en stock */}
          <input type="number" placeholder="Quantité en stock" required
            onChange={(e) => setFormData({...formData, countInStock: e.target.value})} />

          {/* Section d'upload d'image */}
          <div className="upload-container">
            <label htmlFor="file-upload" className="custom-file-upload">
              <FaCloudUploadAlt /> {imageFile ? "Image sélectionnée" : "Uploader l'image"}
            </label>
            <input id="file-upload" type="file" accept="image/*" onChange={handleFileChange} hidden />
            
            {/* Prévisualisation de l'image si sélectionnée */}
            {preview && <img src={preview} alt="Aperçu" className="image-preview-small" />}
          </div>

          {/* Zone de texte pour la description */}
          <textarea placeholder="Description du produit..." required
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
