// src/pages/Profile.jsx

// Import de React et des bibliothèques React nécessaires
import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';

// Import des icônes utilisées dans l'interface
import { FaUser, FaEnvelope, FaIdBadge, FaQuoteLeft } from 'react-icons/fa';

// Import du modal de modification de profil
import EditProfileModal from './EditProfileModal';

// Import des styles spécifiques à la page profil
import '../styles/Profile.css';
import { getMediaUrl } from '../api/api';

const Profile = () => {
  // Récupération des informations utilisateur depuis le state auth de Redux
  // État local pour stocker éventuellement la biographie de l'utilisateur
  // État pour contrôler l'ouverture/fermeture du modal de modification
  const { user } = useSelector((state) => state.auth);
  const [bio, setBio] = useState(user?.bio || "");
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Fonction pour générer l'URL de l'avatar à afficher
  const getAvatarSrc = () => {
    // Si l'utilisateur a un avatar custom, on l'utilise.
    // getMediaUrl gère à la fois les URLs Cloudinary (déjà complètes) et
    // d'anciens chemins locaux relatifs.
    if (user && user.avatar) return getMediaUrl(user.avatar);
    
    if (user) {
      // Sinon on génère un avatar à partir des initiales du nom complet
      const fullName = `${user.firstName} ${user.lastName}`;
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=random&color=fff&size=128&rounded=true&bold=true`;
    }
    // Cas générique quand aucun utilisateur n'est trouvé
    // return 'https://ui-avatars.com/api/?name=Guest&background=random&color=fff&size=128&rounded=true&bold=true';
  }

  return (
    <div className="profile-container">
      <div className="profile-card">
        {/* Section header : avatar, rôle et nom */}
        <div className="profile-header">
          <div className="profile-avatar-wrapper">
            <img src={getAvatarSrc()} alt="Avatar" className="profile-img" />
            <span className={`role-badge ${user?.role}`}>{user?.role}</span>
          </div>
          <h1>{user?.firstName} {user?.lastName}</h1>
          <p className="username">@{user?.username}</p>
        </div>

        {/* Section des informations du compte */}
        <div className="profile-body">
          <div className="info-item">
            <FaEnvelope className="icon" />
            <div>
              <label>Email</label>
              <p>{user?.email}</p>
            </div>
          </div>

          <div className="info-item">
            <FaIdBadge className="icon" />
            <div>
                <label>Membre depuis</label>
                <p>
                    {user?.createdAt 
                    ? new Date(user.createdAt).toLocaleDateString('fr-FR', {
                        day: 'numeric', 
                        month: 'long', 
                        year: 'numeric'
                    }) 
                    : "Chargement de la date..."}
                </p>
            </div>
          </div>

          {/* Section de la biographie utilisateur */}
          <div className="bio-section">
            <label><FaQuoteLeft /> Ma Biographie</label>
            <p className="bio-text">
              {user?.bio ? user.bio : "Aucune description pour le moment... Ajoutez-en une pour vous présenter !"}
            </p>
          </div>
        </div>

        {/* Actions disponibles pour l'utilisateur */}
        <div className="profile-actions">
          <button className="edit-profile-btn" onClick={() => setIsModalOpen(true)}>Modifier mon profil</button>
        </div>

        {/* Affichage conditionnel du modal de modification du profil */}
        {isModalOpen && (
          <EditProfileModal 
            user={user} 
            onClose={() => setIsModalOpen(false)} 
          />
        )}
      </div>
    </div>
  );
};

// Export par défaut du composant
export default Profile;
