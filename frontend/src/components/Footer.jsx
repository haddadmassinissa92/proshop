// src/components/Footer.jsx

// Import de React
import React from 'react';
import { Link } from 'react-router-dom';



const Footer = () => {
  return (
    <footer style={{ 
      textAlign: 'center', 
      padding: '20px', 
      background: '#1a1a1a', 
      color: 'white',
      marginTop: 'auto' 
    }}>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '10px', flexWrap: 'wrap' }}>
        <Link to="/mentions-legales" style={{ color: '#cbd5e1', textDecoration: 'none', fontSize: '0.85rem' }}>
          Mentions légales
        </Link>
        <Link to="/cgv" style={{ color: '#cbd5e1', textDecoration: 'none', fontSize: '0.85rem' }}>
          Conditions Générales de Vente
        </Link>
      </div>
      <p>&copy; {new Date().getFullYear()} ProShop - Tous droits réservés</p>
    </footer>
  );
};

export default Footer;
