// src/components/Footer.jsx

// Import de React
import React from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FaTruck, FaCreditCard, FaEnvelope, FaPhone } from 'react-icons/fa';
import '../styles/Footer.css';

const Footer = () => {
  // Pour adapter le lien "compte" (connexion vs mes commandes) et n'afficher
  // le lien admin qu'aux administrateurs connectés.
  const { user } = useSelector((state) => state.auth);

  return (
    <footer className="site-footer">
      <div className="footer-top">

        {/* Colonne marque : logo, accroche, moyens de paiement acceptés */}
        <div className="footer-col footer-brand">
          <h3>ProShop</h3>
          <p className="footer-tagline">
            Matériel informatique neuf, sélectionné pour la performance et la fiabilité — livré partout en Algérie.
          </p>
          <div className="footer-payment-badges">
            <span className="footer-payment-badge"><FaTruck /> Paiement à la livraison</span>
            <span className="footer-payment-badge"><FaCreditCard /> Carte CIB / Edahabia</span>
          </div>
        </div>

        {/* Navigation rapide */}
        <div className="footer-col">
          <h4>Navigation</h4>
          <ul>
            <li><Link to="/">Accueil</Link></li>
            {user ? (
              <li><Link to="/user/orders">Mes commandes</Link></li>
            ) : (
              <>
                <li><Link to="/login">Se connecter</Link></li>
                <li><Link to="/signup">Créer un compte</Link></li>
              </>
            )}
            {user?.role === 'admin' && (
              <li><Link to="/admin/dashboard">Espace administrateur</Link></li>
            )}
          </ul>
        </div>

        {/* Informations légales */}
        <div className="footer-col">
          <h4>Informations</h4>
          <ul>
            <li><Link to="/a-propos">À propos</Link></li>
            <li><Link to="/mentions-legales">Mentions légales</Link></li>
            <li><Link to="/cgv">Conditions Générales de Vente</Link></li>
          </ul>
        </div>

        {/* Contact — coordonnées à compléter avant mise en ligne (voir
            aussi mentions légales) */}
        <div className="footer-col">
          <h4>Contact</h4>
          <ul className="footer-contact">
            <li><FaEnvelope /> <span className="footer-placeholder">[email de contact]</span></li>
            <li><FaPhone /> <span className="footer-placeholder">[téléphone]</span></li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} ProShop — Tous droits réservés</p>
      </div>
    </footer>
  );
};

export default Footer;
