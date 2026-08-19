// src/pages/CGV.jsx
//
// Conditions Générales de Vente — document contractuel qui encadre les
// achats sur le site (prix, paiement, livraison, retours...).
// IMPORTANT : comme pour les mentions légales, ce texte est un point de
// départ raisonnable et couvre les points attendus sur un site marchand,
// mais N'A PAS été relu par un juriste spécialisé en droit algérien du
// e-commerce. Avant un vrai lancement commercial, fais-le valider par un
// professionnel — en particulier la partie "droit de rétractation /
// retours", qui doit correspondre précisément à ce que la loi algérienne
// impose et à ce que tu es réellement en mesure d'offrir.

import React from 'react';
import '../styles/Legal.css';

const Placeholder = ({ children }) => <span className="legal-placeholder">{children}</span>;

const CGV = () => {
  return (
    <div className="legal-container">
      <h1>Conditions Générales de Vente</h1>
      <p className="legal-updated">Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}</p>

      <div className="legal-notice">
        Les champs surlignés en rouge sont à remplacer, et ce document est à faire relire par un
        professionnel avant la mise en ligne (voir la remarque en tête du fichier source).
      </div>

      <h2>1. Objet</h2>
      <p>
        Les présentes Conditions Générales de Vente régissent les ventes de matériel informatique
        réalisées sur le site ProShop, édité par <Placeholder>[NOM DE LA SOCIÉTÉ]</Placeholder>
        (voir mentions légales). Toute commande passée sur le site implique l'acceptation pleine et
        entière des présentes CGV.
      </p>

      <h2>2. Produits et prix</h2>
      <p>
        Les prix des produits sont indiqués en Dinars Algériens (DA), toutes taxes comprises. ProShop
        se réserve le droit de modifier ses prix à tout moment ; les produits sont facturés sur la
        base du prix en vigueur au moment de la validation de la commande.
      </p>

      <h2>3. Commande</h2>
      <p>
        La commande est validée après confirmation du panier, saisie de l'adresse de livraison et
        choix du mode de paiement. Un email de confirmation est envoyé à l'adresse renseignée lors de
        l'inscription. ProShop se réserve le droit d'annuler ou de refuser toute commande en cas de
        litige avec un client, de non-disponibilité du produit, ou de suspicion de fraude.
      </p>

      <h2>4. Modalités de paiement</h2>
      <p>Le paiement peut s'effectuer selon les modes suivants :</p>
      <ul>
        <li><strong>Paiement à la livraison</strong> : règlement en espèces au moment de la réception de la commande.</li>
        <li><strong>Carte CIB / Edahabia</strong> : paiement en ligne sécurisé via la passerelle SATIM.</li>
      </ul>

      <h2>5. Livraison</h2>
      <p>
        Les délais de livraison sont indiqués à titre estimatif et peuvent varier selon la wilaya de
        livraison. ProShop ne pourra être tenu responsable des retards liés au transporteur ou à des
        circonstances indépendantes de sa volonté. En cas de produit manquant ou endommagé à la
        réception, le client doit le signaler sous <Placeholder>[DÉLAI — ex: 48 heures]</Placeholder>
        à <Placeholder>[ADRESSE EMAIL DE CONTACT]</Placeholder>.
      </p>

      <h2>6. Droit de rétractation et retours</h2>
      <p>
        <Placeholder>
          [À compléter selon la politique réelle du commerçant et la réglementation algérienne en
          vigueur — délai de rétractation, conditions de retour (produit non ouvert/scellé), qui
          supporte les frais de retour, modalités de remboursement.]
        </Placeholder>
      </p>

      <h2>7. Garantie</h2>
      <p>
        Les produits vendus bénéficient de la garantie légale du fabricant / distributeur, dans les
        conditions précisées sur la fiche produit ou la facture. <Placeholder>[Préciser la durée et
        les conditions de garantie appliquées par ProShop, le cas échéant.]</Placeholder>
      </p>

      <h2>8. Responsabilité</h2>
      <p>
        ProShop ne saurait être tenu responsable de l'inexécution du contrat en cas de rupture de
        stock, de force majeure, ou de perturbation ou grève partielle ou totale notamment des
        services postaux et moyens de transport.
      </p>

      <h2>9. Droit applicable et litiges</h2>
      <p>
        Les présentes CGV sont soumises au droit algérien. En cas de litige, une solution amiable sera
        recherchée avant toute action judiciaire ; à défaut, les tribunaux compétents seront ceux du
        ressort du siège social de <Placeholder>[NOM DE LA SOCIÉTÉ]</Placeholder>.
      </p>

      <h2>10. Contact</h2>
      <p>
        Pour toute question relative à une commande ou aux présentes CGV : <Placeholder>[ADRESSE EMAIL DE CONTACT]</Placeholder>
      </p>
    </div>
  );
};

export default CGV;
