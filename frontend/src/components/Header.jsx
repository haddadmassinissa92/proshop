// src/components/Header.jsx

// Import de React et de useState pour gérer l'état local
// Import de Link pour la navigation et useNavigate pour la redirection programmatique
import React from 'react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

// Import de useSelector pour accéder à l'état global Redux et useDispatch pour envoyer des actions
// Import de l'action de déconnexion depuis le slice auth
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../store/authSlice';

// Import des icônes FontAwesome pour l'interface utilisateur
import {
    FaCartShopping,
    FaAngleDown,
    FaUser,
    FaBox,
    FaHeart,
    FaMagnifyingGlass,
    FaArrowRightFromBracket,
    FaLaptop,
    FaClipboardList,
    FaChartSimple,
    FaTags,
} from "react-icons/fa6";

// Import des styles CSS pour le header
import '../styles/Header.css';
import { getMediaUrl } from '../api/api';

// Composant Header qui reçoit des props pour gérer la fermeture/ouverture du panier
const Header = ({ onCartClick }) => {

  // État local pour gérer l'affichage du menu déroulant du profil
  // État pour écouter ce qui est tapé dans la barre de recherche
  const [showMenu, setShowMenu] = useState(false);
  const [keyword, setKeyword] = useState('');

  // useNavigate pour la navigation et useDispatch pour l'envoi 
  // d'actions Redux (ex : navigate('/') et dispatch(data))
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Récupération des informations depuis l'état Redux
  const { token, user } = useSelector((state) => state.auth);
  const { cartItems } = useSelector((state) => state.cart);

  // Calcul du nombre total d'articles dans le panier
  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

    // Fonction pour créer l'avatar à partir des initiales de l'utilisateur
    const getAvatarSrc = () => {
        // Si l'utilisateur a uploadé une photo, on utilise celle-ci.
        // getMediaUrl gère à la fois les URLs Cloudinary (déjà complètes,
        // renvoyées telles quelles) et d'anciens chemins locaux relatifs.
        if (user && user.avatar) return getMediaUrl(user.avatar)

        // Si le profil existe et que l'utilisateur n'a pas uploadé d'image,
        // on crée un avatar avec ses initiales
        if (user) {
            const fullName = `${user.firstName} ${user.lastName}`
            return `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=random&color=fff&size=128&rounded=true&bold=true`
        }
        // Avatar par défaut pour les invités
        // return 'https://ui-avatars.com/api/?name=Guest&background=random&color=fff&size=128&rounded=true&bold=true'
    }

    // Fonction de déconnexion
    const handleLogout = () => {
        // Envoi de l'action de déconnexion
        // Fermeture du menu déroulant
        // Redirection vers la page d'accueil
        dispatch(logout())
        setShowMenu(false)
        navigate('/')
    }

    // Fonction pour gérer la soumission de la recherche
    const submitHandler = (e) => {
        e.preventDefault();
        if (keyword.trim()) {
            // Navigation vers la page d'accueil avec le paramètre de recherche
            navigate(`/?search=${keyword}`)
        } else {
            // Navigation vers la page d'accueil sans recherche
            navigate('/')
        }
    }

    const handleLogoClick = () => {
        setKeyword(''); // Réinitialise l'état local du mot-clé
        // Si tu as un champ input avec un ID ou une référence, tu peux aussi le vider visuellement
        const searchInput = document.querySelector('.search-input');
        if (searchInput) searchInput.value = '';
    };

  return (
    <header className="main-header">
        {/* Barre de navigation */}
        <nav className="navbar">
            {/* Logo du site */}
            <div className="logo">
                <Link to="/" onClick={handleLogoClick}>
                    ProShop
                </Link>
            </div>

            {/* la barre de recherche (toujours visible) */}
            <div className="search-container">
                 
                {/* Formulaire de recherche */}
                <form onSubmit={submitHandler} className='search-box'>
                    {/* Champ de saisie pour la recherche */}
                    <input
                        autoComplete='off'
                        type="text"
                        name="search"
                        className="search-input"
                        placeholder="Rechercher un produit..."
                        onChange={(e) => setKeyword(e.target.value)}
                    />

                    {/* Bouton de soumission de la recherche */}
                    <button type="submit" className="search-btn">
                        <FaMagnifyingGlass />
                    </button>
                </form>
            </div>

            {/* Partie droite affiche les options selon l'état de l'utilisateur (connecté ou déconnecté) */}
            <div className="header-right">
                {token && user ? (
                // Si l'utilisateur est connecté
                    <>
                        {/* Icône du panier avec compteur */}
                        <div className="cart-wrapper" onClick={onCartClick}>
                            <FaCartShopping className="cart-icon" />
                            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
                        </div>

                        {/* Section profil utilisateur */}
                        <div className="user-profile">
                            {/* Bouton d'avatar avec flèche pour ouvrir le menu */}
                            <button className="avatar-button" onClick={() => setShowMenu(!showMenu)}>
                                <img src={getAvatarSrc()} alt="Avatar" className="avatar-img" />
                                <FaAngleDown className={`arrow ${showMenu ? 'open' : ''}`} />
                            </button>

                            {/* Menu déroulant du profil */}
                            {showMenu && (
                            <div className="dropdown-menu">
                                {/* En-tête du menu avec rôle, nom et email */}
                                <div className="menu-header">
                                    <span className="badge-role">{user.role}</span>
                                    <strong>{user.firstName} {user.lastName}</strong>
                                    <p>{user.email}</p>
                                </div>
                                <hr />
                                {/* Liens vers le profil et les commandes */}
                                <Link to="/profile" onClick={() => setShowMenu(false)}><FaUser /> Profil</Link>
                                <Link to="/user/orders" onClick={() => setShowMenu(false)}><FaBox /> Commandes</Link>
                                <hr />

                                {/* Dans ton dropdown-menu */}
                                {/* Section admin si l'utilisateur est administrateur */}
                                {user.role === 'admin' && (
                                    <>
                                        <hr />
                                        <div className="admin-label">GESTION</div>
                                        <Link to="/admin/dashboard" onClick={() => setShowMenu(false)}>
                                            <FaChartSimple /> Dashboard
                                        </Link>
                                        <Link to="/admin/products" onClick={() => setShowMenu(false)}>
                                            <FaLaptop /> Gérer les produits
                                        </Link>
                                        <Link to="/admin/categories" onClick={() => setShowMenu(false)}>
                                            <FaTags /> Gérer les catégories
                                        </Link>
                                        <Link to="/admin/orders" onClick={() => setShowMenu(false)}>
                                            <FaClipboardList /> Toutes les commandes
                                        </Link>
                                    </>
                                )}
                                <hr />
                                
                                {/* Bouton de déconnexion */}
                                <button className="logout-btn" onClick={handleLogout}>
                                    <FaArrowRightFromBracket /> Déconnexion
                                </button>
                            </div>
                            )}
                        </div>
                    </>
                ) : (
                    // Si l'utilisateur n'est pas connecté
                    <div className="auth-buttons">
                        <Link to="/login" className="login-btn">Se connecter</Link>
                        <Link to="/signup" className="register-btn">S'inscrire</Link>
                    </div>
                )}
            </div>
        </nav>
    </header>
  );
};

// Export du composant Header par défaut
export default Header;
