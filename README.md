# 🛒 ProShop

**Site e-commerce full-stack** de matériel informatique, avec paiement local (Algérie), assistant d'achat par IA, et une suite de tests automatisés — développé en solo du backend au déploiement.

🔗 **Démo en ligne** : [proshop-peach.vercel.app](https://proshop-peach.vercel.app)
🔗 **API** : [proshop-backend-ub57.onrender.com](https://proshop-backend-ub57.onrender.com)

![Backend CI](https://github.com/haddadmassinissa92/proshop/actions/workflows/backend-ci.yml/badge.svg)
![Frontend CI](https://github.com/haddadmassinissa92/proshop/actions/workflows/frontend-ci.yml/badge.svg)

---

## Sommaire

- [Fonctionnalités](#-fonctionnalités)
- [Stack technique](#-stack-technique)
- [Architecture](#-architecture)
- [Défis techniques & décisions](#-défis-techniques--décisions)
- [Tests](#-tests)
- [Installation](#-installation)
- [Structure du projet](#-structure-du-projet)
- [Pistes d'amélioration](#-pistes-damélioration)

---

## ✨ Fonctionnalités

**Côté client**
- Catalogue de produits avec recherche (nom, marque, description) et filtre par catégorie
- Panier persistant, ajustement de quantité borné au stock réel
- Authentification (inscription, connexion par JWT), gestion de profil avec avatar
- Tunnel de commande complet : livraison → paiement → confirmation → historique
- **Paiement à la livraison**, fonctionnel dès aujourd'hui
- **Carte CIB / Edahabia** (paiement en ligne via la passerelle SATIM), code prêt en attente des identifiants marchand
- Système d'avis clients (notes + commentaires) par produit
- **Assistant d'achat conversationnel** : décrivez votre besoin en langage naturel, l'IA interroge le vrai catalogue et recommande de vrais produits
- Emails de confirmation de commande automatiques

**Côté administration**
- Gestion des produits (CRUD, upload d'image vers Cloudinary)
- Gestion des catégories (icônes Font Awesome, couleurs personnalisées, sous-catégories, comptage de produits)
- Gestion des commandes (suivi statut paiement/livraison)
- Tableau de bord avec statistiques (valeur du stock, répartition par catégorie)

**Technique**
- Responsive de bout en bout
- Pages légales (mentions légales, CGV, à propos)
- CI/CD avec GitHub Actions (tests backend + lint/build frontend à chaque push)

---

## 🛠 Stack technique

| | |
|---|---|
| **Frontend** | React 19, Redux Toolkit, React Router, Vite, CSS natif |
| **Backend** | Node.js, Express 5, MongoDB / Mongoose |
| **Auth** | JWT, bcrypt |
| **Paiement** | SATIM (CIB/Edahabia) — intégration Stripe/PayPal envisagée puis écartée (voir plus bas) |
| **IA** | Groq (Llama 3.3 70B) avec *function calling* |
| **Stockage média** | Cloudinary |
| **Emails** | Resend |
| **Tests** | Jest, Supertest, MongoDB Memory Server |
| **CI/CD** | GitHub Actions |
| **Déploiement** | Render (backend), Vercel (frontend), MongoDB Atlas |

---

## 🏗 Architecture

Monorepo à deux packages indépendants, déployés séparément :

```
proshop/
├── backend/     API REST Express + MongoDB
├── frontend/    SPA React (Vite)
└── .github/     Workflows CI/CD
```

Le backend sépare la **configuration de l'application** (`app.js` : middlewares, routes, gestion d'erreurs) du **point d'entrée** (`server.js` : connexion MongoDB + démarrage du serveur HTTP). Cette séparation rend l'app testable avec Supertest sans jamais toucher à une vraie base de données ni démarrer un vrai serveur — les tests importent directement `app.js`.

---

## 🧠 Défis techniques & décisions

Quelques problèmes concrets rencontrés pendant le développement, et comment ils ont été résolus.

### Le bug `pre('save')` vs `pre('validate')` de Mongoose
La génération automatique du slug des catégories était placée dans un hook `pre('save')`. Résultat : `save()` valide le document *avant* d'exécuter ce hook, donc le champ `slug` (obligatoire) était toujours vide au moment de la validation, et **toute création de catégorie échouait** avec `"Path 'slug' is required"` — un message qui ne pointait vers rien d'évident dans le code. La correction a été de déplacer le hook sur `pre('validate')`, qui s'exécute *avant* la validation. Un bon rappel que l'ordre d'exécution des hooks Mongoose n'est pas toujours celui qu'on imagine.

### Paiement en ligne : pourquoi pas Stripe/PayPal ?
Le choix initial se portait sur Stripe et PayPal. Après vérification, ni l'un ni l'autre n'acceptent les comptes marchands basés en Algérie (Stripe n'opère pas dans le pays ; PayPal n'y autorise que l'envoi d'argent, pas la réception côté professionnel). La solution retenue est **SATIM**, l'opérateur monétique interbancaire algérien — la vraie solution locale, mais qui nécessite un contrat "Vente à Distance" avec une banque partenaire (démarche administrative de plusieurs semaines, indépendante du code). En attendant la validation de ce contrat, le site fonctionne avec le **paiement à la livraison**, et le code CIB/SATIM est déjà écrit et prêt à être activé dès réception des identifiants marchand.

### Assistant d'achat IA sans hallucination de produits
Un assistant conversationnel qui recommande des produits est simple à faire *mal* : un LLM qui invente un produit ou un prix inexistant casse immédiatement la confiance. La solution est le **function calling** : le modèle ne répond jamais directement — il doit d'abord appeler un outil `search_products`, réellement exécuté contre MongoDB, et ne formule sa réponse finale qu'à partir des résultats retournés. Impossible pour lui de recommander un produit qui n'existe pas dans le catalogue.

### Stockage d'images persistant
Les images étaient d'abord stockées sur le disque du serveur backend. Problème : la plupart des hébergeurs gratuits (Render inclus) effacent ce disque à chaque redéploiement — toutes les photos produits auraient disparu au premier `git push`. Migration vers **Cloudinary** : upload en mémoire (Multer) puis envoi direct vers Cloudinary, sans jamais toucher au disque du serveur.

### Un faux positif ESLint instable
Une règle expérimentale de `eslint-plugin-react-hooks` (`set-state-in-effect`, liée au React Compiler) se déclenchait de façon incohérente sur un pattern pourtant standard et correct (fetch de données au montage). Vérifié contre les issues GitHub officielles de `facebook/react` avant de conclure à un bug reconnu de l'outil plutôt qu'un vrai problème de code — et désactivé la règle globalement plutôt que de réécrire du code qui fonctionnait déjà.

---

## 🧪 Tests

24 tests automatisés côté backend (Jest + Supertest), sur une base MongoDB en mémoire isolée — jamais de connexion à une vraie base pendant les tests.

```bash
cd backend
npm test
```

Couvre l'authentification, les catégories, les produits (recherche par nom/marque/description), et les commandes — y compris des tests de non-régression écrits directement pour les bugs réels rencontrés pendant le développement (validation de commande, sécurité sur la confirmation de paiement...).

---

## 🚀 Installation

```bash
git clone https://github.com/haddadmassinissa92/proshop.git
cd proshop

# Backend
cd backend
npm install
cp .env.example .env   # à compléter avec tes propres clés
npm run dev

# Frontend (dans un autre terminal)
cd frontend
npm install
cp .env.example .env
npm run dev
```

Chaque `.env.example` liste les variables nécessaires avec des commentaires expliquant où les récupérer (MongoDB Atlas, Cloudinary, Resend, Groq, SATIM).

---

## 📁 Structure du projet

```
backend/
├── app.js              Configuration Express (testable)
├── server.js            Point d'entrée (connexion DB + démarrage serveur)
├── controllers/          Logique métier par ressource
├── models/                Schémas Mongoose
├── routes/                 Définition des routes API
├── middlewares/            Auth, admin, upload, erreurs
├── utils/                   Cloudinary, envoi d'emails
└── tests/                    Suite de tests Jest

frontend/
├── src/
│   ├── pages/            Pages de l'application
│   ├── components/         Composants réutilisables
│   ├── store/                Redux Toolkit (auth, panier, commandes)
│   └── styles/                CSS par domaine
```

---

## 🔮 Pistes d'amélioration

- Migration progressive vers TypeScript
- Élargir la couverture de tests au frontend (React Testing Library)
- Activation du paiement CIB/Edahabia dès réception du contrat SATIM
- Tests end-to-end (Playwright/Cypress)

---

## 👤 Auteur

**Haddad Massinissa**
[GitHub](https://github.com/haddadmassinissa92)
