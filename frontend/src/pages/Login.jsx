// src/pages/Login.jsx

// Importations React et bibliothèques nécessaires
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Importation de useSelector pour accéder à l'état global, useDispatch pour envoyer des actions
// Importation de l'action de connexion depuis le slice auth
import { useDispatch, useSelector } from 'react-redux';
import { login } from '../store/authSlice'; 

// Importation des styles CSS pour l'authentification
import '../styles/Auth.css';

// Définition du composant fonctionnel Login
function Login() {
    // État pour stocker l'email saisi par l'utilisateur
    // Et L'État pour stocker le mot de passe saisi par l'utilisateur
    const [email, setEmail] = useState(''); 
    const [password, setPassword] = useState('');

    // useNavigate pour la redirection programmatique
    // useDispatch pour envoyer des actions au store Redux
    const navigate = useNavigate();
    const dispatch = useDispatch();
    
    // Sélection des états de chargement et d'erreur depuis le store Redux
    const { loading, error } = useSelector((state) => state.auth);

    // Fonction de gestion de la soumission du formulaire
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Dispatch de l'action login avec les identifiants utilisateur
        const resultAction = await dispatch(login({ email, password }));

        // Si la connexion réussit, on redirige vers la page d'accueil
        if (login.fulfilled.match(resultAction)) {
            navigate('/');
        }
    };

    // Rendu du composant
    return (
        <div className="auth-container">
            {/* Formulaire de connexion */}
            <form onSubmit={handleSubmit} className="auth-form">
                <h2 className="form-title">Connexion</h2>
                
                {/* Affichage de l'erreur si la connexion échoue */}
                {error && <p className="error-alert">{error}</p>}

                {/* Groupe d'entrée pour l'email */}
                <div className="input-group">
                    <label>Email</label>
                    <input 
                        type="email" 
                        autoComplete='true'
                        required 
                        onChange={(e) => setEmail(e.target.value)} 
                        placeholder="votre@email.com"
                    />
                </div>

                {/* Groupe d'entrée pour le mot de passe */}
                <div className="input-group">
                    <label>Mot de passe</label>
                    <input 
                        type="password" 
                        autoComplete='true'
                        required 
                        onChange={(e) => setPassword(e.target.value)} 
                        placeholder="Votre mot de passe..."
                    />
                </div>

                {/* Bouton de soumission du formulaire */}
                <button type="submit" className="btn-submit" disabled={loading}>
                    {loading ? 'Connexion...' : 'Se connecter'}
                </button>

                {/* Lien vers la page d'inscription */}
                <div className="auth-link">
                    <p>Nouveau client ? <span onClick={() => navigate('/signup')}>Créer un compte</span></p>
                </div>
            </form>
        </div>
    );
}

// Export par défaut du composant
export default Login;
