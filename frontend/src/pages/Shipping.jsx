// src/pages/Shipping.jsx

// Import de React et useState pour gérer l'état local
import React, { useState } from 'react';

// Import du useNavigate pour la navigation
import { useNavigate } from 'react-router-dom';

// Import des icônes FontAwesome pour l'interface
import { FaTruck, FaMapMarkerAlt, FaPhoneAlt, FaCity } from 'react-icons/fa';

// Import du fichier CSS pour les styles
import '../styles/Shipping.css';

// Définition du composant Shipping pour la page d'adresse de livraison
const Shipping = () => {

  // Récupération de l'adresse sauvegardée dans le localStorage, 
  // ou un objet vide si rien n'est sauvegardé
  const savedAddress = JSON.parse(localStorage.getItem('shippingAddress')) || {};

  // États locaux pour chaque champ du formulaire, 
  // initialisés avec les valeurs sauvegardées ou vides
  const [address, setAddress] = useState(savedAddress.address || '');
  const [city, setCity] = useState(savedAddress.city || '');
  const [postalCode, setPostalCode] = useState(savedAddress.postalCode || '');
  const [phone, setPhone] = useState(savedAddress.phone || '');

  // useNavigate pour naviguer vers d'autres pages
  const navigate = useNavigate();

  // Fonction appelée lors de la soumission du formulaire
  const submitHandler = (e) => {
    
    // Empêche le rechargement de la page par défaut
    e.preventDefault();
    
    // Sauvegarde l'adresse dans le localStorage sous forme de chaîne JSON
    localStorage.setItem('shippingAddress', JSON.stringify({ address, city, postalCode, phone }));
    
    // Navigation vers la page de confirmation de commande
    navigate('/place-order');
  };

  return (
    // Conteneur principal de la page d'expédition
    <div className="shipping-container">
      
      {/* Barre de progression indiquant les étapes du checkout */}
      <div className="checkout-steps">
        
        {/* Étape actuelle : Expédition, marquée comme active */}
        <span className="step active">Expédition</span>
        
        {/* Ligne de séparation entre les étapes */}
        <span className="step-line"></span>
        
        {/* Étape suivante : Confirmation */}
        <span className="step">Confirmation</span>
      </div>

      {/* Carte contenant le formulaire d'adresse */}
      <div className="shipping-card">
        
        {/* En-tête de la carte avec icône, titre et description */}
        <div className="shipping-header">
          <FaTruck className="title-icon" />
          <h1>Adresse de livraison</h1>
          <p>Indiquez où nous devons livrer votre matériel informatique</p>
        </div>

        {/* Formulaire pour saisir l'adresse, avec gestionnaire de soumission */}
        <form onSubmit={submitHandler} className="shipping-form">
          
          {/* Groupe d'entrée pour l'adresse */}
          <div className="input-group">
            <label><FaMapMarkerAlt /> Adresse</label>
            
            {/* Champ texte pour l'adresse, requis, contrôlé par l'état */}
            <input
              type="text"
              placeholder="Ex: 15 Rue des Jardins"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          {/* Ligne de formulaire pour ville et code postal côte à côte */}
          <div className="form-row">
            
            {/* Groupe pour la ville */}
            <div className="input-group">
              <label><FaCity /> Ville</label>
              <input
                type="text"
                placeholder="Ex: Tizi Ouzou"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>
            
            {/* Groupe pour le code postal */}
            <div className="input-group">
              <label>Code Postal</label>
              <input
                type="text"
                placeholder="15000"
                required
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
              />
            </div>
          </div>

          {/* Groupe pour le numéro de téléphone */}
          <div className="input-group">
            <label><FaPhoneAlt /> Téléphone</label>
            <input
              type="tel"
              placeholder="0515 25 35 45"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          {/* Bouton de soumission pour continuer vers le récapitulatif */}
          <button type="submit" className="btn-shipping" onClick={submitHandler}>
            Continuer vers le récapitulatif
          </button>
        </form>
      </div>
    </div>
  );
};

// Export par défaut du composant
export default Shipping;
