// src/pages/MentionsLegales.jsx
//
// Page de mentions légales — obligatoire pour un site e-commerce en Algérie.
// IMPORTANT : les champs en rouge (ex: [NOM DE LA SOCIÉTÉ]) sont des
// espaces réservés à compléter avec tes vraies informations avant la mise
// en ligne. Ce texte est un point de départ raisonnable, pas un document
// validé par un juriste — pour un site marchand qui traite de vrais
// paiements, fais-le relire par quelqu'un du métier (avocat, expert-
// comptable habitué au e-commerce) avant publication, en particulier pour
// la partie CGV (droit de rétractation, garanties).

import React from 'react';
import '../styles/Legal.css';

const Placeholder = ({ children }) => <span className="legal-placeholder">{children}</span>;

const MentionsLegales = () => {
  return (
    <div className="legal-container">
      <h1>Mentions légales</h1>
      <p className="legal-updated">Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}</p>

      <div className="legal-notice">
        Les champs surlignés en rouge sont à remplacer par les informations réelles de l'entreprise avant la mise en ligne du site.
      </div>

      <h2>1. Éditeur du site</h2>
      <p>
        Le présent site est édité par <Placeholder>[NOM DE LA SOCIÉTÉ / NOM DU COMMERÇANT]</Placeholder>,
        <Placeholder> [forme juridique — ex: EURL, SARL, personne physique]</Placeholder>,
        immatriculé(e) au registre du commerce sous le numéro <Placeholder>[NUMÉRO RC]</Placeholder>,
        NIF <Placeholder>[NUMÉRO NIF]</Placeholder>, NIS <Placeholder>[NUMÉRO NIS]</Placeholder>.
      </p>
      <p>
        Siège social : <Placeholder>[ADRESSE COMPLÈTE]</Placeholder><br />
        Téléphone : <Placeholder>[NUMÉRO DE TÉLÉPHONE]</Placeholder><br />
        Email : <Placeholder>[ADRESSE EMAIL DE CONTACT]</Placeholder>
      </p>

      <h2>2. Directeur de la publication</h2>
      <p><Placeholder>[NOM ET PRÉNOM DU RESPONSABLE]</Placeholder></p>

      <h2>3. Hébergement</h2>
      <p>
        Le site est hébergé par :<br />
        Frontend : <Placeholder>[ex: Vercel Inc.]</Placeholder><br />
        Backend : <Placeholder>[ex: Render Services Inc.]</Placeholder><br />
        Base de données : <Placeholder>[ex: MongoDB Atlas]</Placeholder>
      </p>

      <h2>4. Propriété intellectuelle</h2>
      <p>
        L'ensemble des contenus présents sur ce site (textes, images, logos, structure) est la
        propriété de <Placeholder>[NOM DE LA SOCIÉTÉ]</Placeholder>, sauf mention contraire. Toute
        reproduction, représentation ou diffusion, en tout ou partie, sans autorisation préalable,
        est interdite.
      </p>

      <h2>5. Données personnelles</h2>
      <p>
        Les informations collectées lors de la création d'un compte ou d'une commande (nom, prénom,
        email, adresse, numéro de téléphone) sont utilisées uniquement dans le cadre du traitement
        des commandes et de la gestion de la relation client. Elles ne sont ni vendues ni transmises
        à des tiers en dehors des prestataires nécessaires au fonctionnement du site (hébergement,
        paiement, livraison).
      </p>
      <p>
        Conformément à la réglementation en vigueur, tu disposes d'un droit d'accès, de rectification
        et de suppression de tes données personnelles. Pour l'exercer, contacte-nous à
        <Placeholder> [hmassinissa39@gmail.com]</Placeholder>.
      </p>

      <h2>6. Cookies</h2>
      <p>
        Ce site utilise uniquement des cookies techniques nécessaires à son fonctionnement (maintien
        de la session de connexion, contenu du panier). Aucun cookie publicitaire ou de tracking tiers
        n'est utilisé.
      </p>

      <h2>7. Contact</h2>
      <p>
        Pour toute question, réclamation, ou signalement lié au site : <Placeholder>[hmassinissa39@gmail.com]</Placeholder>
      </p>
    </div>
  );
};

export default MentionsLegales;
