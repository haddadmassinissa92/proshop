// src/pages/Signup.jsx

// Import de React et des bibliothèques nécessaires pour le composant
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Importation de useSelector pour accéder à l'état global Redux, useDispatch pour envoyer des actions
// Importation de l'action d'inscription depuis le slice auth
import { useDispatch, useSelector } from 'react-redux';
import { signup } from '../store/authSlice';

// Import des icônes FontAwesome pour l'upload d'avatar
import { FaCloudUploadAlt } from 'react-icons/fa'

// Import des styles CSS pour l'authentification
import '../styles/Auth.css'

function Signup() {

    // État pour la sélection du fichier avatar et la prévisualisation
    const [selectedFile, setSelectedFile] = useState(null);
    const [preview, setPreview] = useState(null);

    // État pour les données du formulaire d'inscription
    const [formData, setFormData] = useState({ 
        firstName: '',
        lastName: '',
        username: '',
        email: '',
        bio: '',
        password: ''
    });

    // useNavigate pour la navigation et useDispatch pour l'envoi 
    // d'actions Redux (ex : navigate('/') et dispatch(data))
    const navigate = useNavigate();
    const dispatch = useDispatch();
    
    // Récupération de l'état d'authentification depuis Redux pour gérer le chargement et les erreurs
    const { loading, error } = useSelector((state) => state.auth);

    // Fonction pour gérer la sélection de l'avatar avant validation du formulaire
    const handleAvatarSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    // Fonction pour gérer l'envoi du formulaire complet
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Utilisation de FormData pour envoyer texte et fichier au backend
        const data = new FormData();
        data.append('firstName', formData.firstName);
        data.append('lastName', formData.lastName);
        data.append('username', formData.username);
        data.append('email', formData.email);
        data.append('password', formData.password);
        data.append('bio', formData.bio);

        // Si un fichier est sélectionné, l'ajouter au FormData
        if (selectedFile) {
            data.append('image', selectedFile);
        }

        // Envoi du FormData au reducer Redux
        const resultAction = await dispatch(signup(data));

        // Si l'action est réussie, afficher un message de succès et rediriger vers login
        if (signup.fulfilled.match(resultAction)) {
            alert('Compte créé avec succès !');
            navigate('/login');
        }
    };


    return (
        <div className="auth-container">
            {/* Formulaire d'inscription avec gestionnaire d'envoi */}
            <form onSubmit={handleSubmit} className="auth-form">
                <h2 className="form-title">Créer un compte</h2>
                
                {/* Affichage de l'erreur du serveur si elle existe (ex: Email déjà pris) */}
                {error && <p className="error-alert">{error}</p>}

                <div className="form-row">
                    {/* Groupe d'entrée pour le prénom */}
                    <div className="input-group">
                        <label>Prénom</label>
                        <input 
                            type="text" 
                            autoComplete='true'
                            required 
                            onChange={(e) => setFormData({...formData, firstName: e.target.value})} 
                        />
                    </div>
                    {/* Groupe d'entrée pour le nom */}
                    <div className="input-group">
                        <label>Nom</label>
                        <input 
                            type="text"
                            autoComplete='true'                             
                            required 
                            onChange={(e) => setFormData({...formData, lastName: e.target.value})} 
                        />
                    </div>
                </div>

                {/* Groupe d'entrée pour le nom d'utilisateur */}
                <div className="input-group">
                    <label>Nom d'utilisateur</label>
                    <input 
                        type="text" 
                        autoComplete='true'
                        required 
                        onChange={(e) => setFormData({...formData, username: e.target.value})} 
                    />
                </div>

                {/* Groupe d'entrée pour l'email */}
                <div className="input-group">
                    <label>Email</label>
                    <input 
                        type="email" 
                        autoComplete='true'
                        required 
                        onChange={(e) => setFormData({...formData, email: e.target.value})} 
                    />
                </div>

                {/* Groupe d'entrée pour le mot de passe */}
                <div className="input-group">
                    <label>Mot de passe</label>
                    <input 
                        type="password" 
                        autoComplete='true'
                        required 
                        onChange={(e) => setFormData({...formData, password: e.target.value})} 
                    />
                </div>

                {/* Section d'upload de l'avatar */}
                <div className="input-group avatar-upload-section">
                    <label htmlFor="avatar-input" className="avatar-label">
                        {preview ? (
                            // Prévisualisation de l'image sélectionnée
                            <img src={preview} alt="Preview" className="avatar-preview" />
                        ) : (
                            // Placeholder avec icône pour l'upload
                            <div className="avatar-placeholder"><FaCloudUploadAlt /></div>
                        )}
                    </label>
                    
                    {/* Input caché pour la sélection de fichier */}
                    <input type="file" id="avatar-input" hidden onChange={handleAvatarSelect} accept="image/*" />
                    <p>Photo de profil (optionnel)</p>
                </div>
                
                {/* Zone de texte pour la biographie */}
                <textarea 
                    placeholder="Parlez-nous de vous (ex: passionné d'informatique...)" 
                    onChange={(e) => setFormData({...formData, bio: e.target.value})}
                    className="input-group bio-input"
                ></textarea>

                {/* Bouton de soumission du formulaire */}
                <button type="submit" className="btn-submit" disabled={loading}>
                    {loading ? 'Inscription en cours...' : "S'inscrire"}
                </button>

                {/* Lien vers la page de connexion */}
                <div className="auth-link">
                    <p>Déjà un compte ? <span onClick={() => navigate('/login')}>Se connecter</span></p>
                </div>
            </form>
        </div>
    );
}

// Export du composant Signup par défaut
export default Signup;

