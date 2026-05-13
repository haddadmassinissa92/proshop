// src/components/Footer.jsx

// Import de React
import React from 'react';



const Footer = () => {
  return (
    <footer style={{ 
      textAlign: 'center', 
      padding: '20px', 
      background: '#1a1a1a', 
      color: 'white',
      marginTop: 'auto' 
    }}>
      <p>&copy; {new Date().getFullYear()} ProShop - Tous droits réservés</p>
    </footer>
  );
};

export default Footer;
