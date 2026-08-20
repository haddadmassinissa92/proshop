// src/pages/AboutUs.jsx
//
// Page "À propos" : présente la boutique, ce qui la différencie, et redirige
// vers le contact. Le texte en rouge ([...]) est un espace réservé à
// personnaliser avec le vrai contenu avant la mise en ligne — même
// convention que les mentions légales / CGV.

import React from 'react';
import { Link } from 'react-router-dom';
import { FaTruck, FaShieldAlt, FaHeadset, FaMoneyBillWave } from 'react-icons/fa';
import '../styles/About.css';

const Placeholder = ({ children }) => <span className="about-placeholder">{children}</span>;

const AboutUs = () => {
  return (
    <div className="about-container">

      {/* En-tête */}
      <div className="about-hero">
        <h1>À propos de ProShop</h1>
        <p>
          Du matériel informatique neuf, sélectionné avec soin, livré partout en Algérie —
          <Placeholder> [complète ici en une phrase ce qui te distingue vraiment : prix, choix, service...]</Placeholder>
        </p>
      </div>

      {/* Mission / histoire */}
      <div className="about-section">
        <h2>Notre histoire</h2>
        <p>
          <Placeholder>
            [Raconte ici pourquoi tu as lancé ProShop — un besoin que tu as constaté, une frustration
            avec l'offre existante, une passion pour le matériel informatique... Deux ou trois phrases
            sincères valent mieux qu'un texte générique.]
          </Placeholder>
        </p>
        <p>
          <Placeholder>
            [Tu peux ajouter ici depuis combien de temps tu es actif, combien de clients tu as servis,
            ou tout autre élément concret qui inspire confiance.]
          </Placeholder>
        </p>
      </div>

      {/* Signaux de confiance */}
      <div className="about-section">
        <h2>Pourquoi choisir ProShop</h2>
        <div className="trust-grid">
          <div className="trust-card">
            <div className="trust-icon"><FaMoneyBillWave /></div>
            <h3>Paiement à la livraison</h3>
            <p>Tu payes uniquement à la réception, sans aucun risque.</p>
          </div>
          <div className="trust-card">
            <div className="trust-icon"><FaShieldAlt /></div>
            <h3>Produits garantis</h3>
            <p><Placeholder>[précise ici la durée et les conditions de garantie que tu offres]</Placeholder></p>
          </div>
          <div className="trust-card">
            <div className="trust-icon"><FaTruck /></div>
            <h3>Livraison partout en Algérie</h3>
            <p><Placeholder>[précise ici les délais moyens ou les wilayas couvertes]</Placeholder></p>
          </div>
          <div className="trust-card">
            <div className="trust-icon"><FaHeadset /></div>
            <h3>Support réactif</h3>
            <p>Une question avant ou après ta commande ? On te répond rapidement.</p>
          </div>
        </div>
      </div>

      {/* Équipe — section optionnelle, à retirer si tu préfères rester discret */}
      <div className="about-section">
        <h2>L'équipe</h2>
        <div className="about-team">
          <img
            src="https://placeholder.com"
            alt="Fondateur de ProShop"
            className="about-team-photo"
          />
          <div className="about-team-info">
            <h3><Placeholder>[Ton nom]</Placeholder></h3>
            <p>
              <Placeholder>
                [Quelques lignes sur toi — ton parcours, ce qui te motive dans ce projet. Ça
                humanise beaucoup une boutique en ligne aux yeux des clients.]
              </Placeholder>
            </p>
          </div>
        </div>
      </div>

      {/* Appel à l'action vers le contact */}
      <div className="about-cta">
        <h2>Une question ?</h2>
        <p>On est là pour t'aider, avant ou après ta commande.</p>
        <Link to="/" className="about-cta-btn">Voir la boutique</Link>
      </div>
    </div>
  );
};

export default AboutUs;
