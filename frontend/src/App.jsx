// src/App.jsx

// Importations React et bibliothèques
import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Importation des composants
import Header from './components/Header';
import Footer from './components/Footer';
import CartSidebar from './components/CartSidebar';

// Importation des composants de page
import Home from './pages/Home';
import Signup from './pages/Signup';
import Login from './pages/Login';
import Profile from './pages/Profile';
import ProductDetails from './pages/ProductDetails';
import AdminProducts from './pages/AdminProducts';
import AdminCategories from './pages/AdminCategories';
import AdminDashboard from './pages/AdminDashboard';
import Shipping from './pages/Shipping';
import PlaceOrder from './pages/PlaceOrders';
import MyOrders from './pages/MyOrders';
import OrderSuccess from './pages/OrderSuccess';
import AdminOrders from './pages/AdminOrders';
import MentionsLegales from './pages/MentionsLegales';
import CGV from './pages/CGV';


// Importation useSelector pour accéder à l'état global, 
// useDispatch pour envoyer des actions
// Importation de l'action de déconnexion
import { useSelector, useDispatch } from 'react-redux'; 
import { logout } from './store/authSlice';

// Importation des styles css
import './App.css';


function App() {
  // useDispatch pour envoyer des actions au store
  const dispatch = useDispatch();

  // État local pour savoir si le panneau du panier est ouvert ou fermé
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Lecture des informations de l'utilisateur et du panier 
  // depuis l'état global Redux
  const { user, token } = useSelector((state) => state.auth);
  const { cartItems } = useSelector((state) => state.cart);

  // Calcul du nombre total d'articles dans le panier
  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  // Fonction appelée lorsque l'utilisateur clique sur Déconnexion
  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <div className="App">
      {/* Header de l'application avec l'état du panier et l'utilisateur */}
      <Header
        token={token}
        user={user}
        cartCount={cartCount}
        onLogout={handleLogout}
        onCartClick={() => setIsCartOpen(true)}
      />

      {/* Panneau latéral du panier, affiché ou caché selon isCartOpen */}
      <CartSidebar
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
      />

      {/* Contenu principal contenant les routes de l'application */}
      <main className="main-content">
        <Routes>
          
          {/* Routes publiques pour L'acceuil l'inscription et la connexion */}
          {/* Affichage d'une page produit selon son identifiant (<ProductDetails />) */}
          <Route path="/" element={<Home />} />
          <Route path="/product/:id" element={<ProductDetails />} />

          {/* Pages légales — accessibles à tous, connecté ou non */}
          <Route path="/mentions-legales" element={<MentionsLegales />} />
          <Route path="/cgv" element={<CGV />} />

          <Route path="/signup" element={!token ? <Signup /> : <Navigate to="/" />} />
          <Route path="/login" element={!token ? <Login /> : <Navigate to="/" />} />

          {/* Route privée pour le profil utilisateur */}
          <Route path="/profile" element={token ? <Profile /> : <Navigate to="/login" />} />

          {/* Étapes de commande pour un utilisateur connecté */}
          <Route path="/shipping" element={token ? <Shipping /> : <Navigate to="/" />} />
          <Route path="/place-order" element={token ? <PlaceOrder /> : <Navigate to="/" />} />

          {/* Page de confirmation affichée juste après la validation d'une commande */}
          <Route path="/order/:id" element={token ? <OrderSuccess /> : <Navigate to="/login" />} />

          {/* Historique des commandes de l'utilisateur */}
          <Route path="/user/orders" element={token ? <MyOrders /> : <Navigate to="/" />} />

          {/* Routes réservées à l'administrateur */}
          <Route
            path="/admin/products"
            element={token && user?.role === 'admin' ? <AdminProducts /> : <Navigate to="/" />}
          />
          <Route
            path="/admin/categories"
            element={token && user?.role === 'admin' ? <AdminCategories /> : <Navigate to="/" />}
          />
          <Route
            path="/admin/dashboard"
            element={token && user?.role === 'admin' ? <AdminDashboard /> : <Navigate to="/" />}
          />

          {/* Page d'administration des commandes réservée à l'administrateur */}
          <Route
            path="/admin/orders"
            element={user?.role === 'admin' ? <AdminOrders /> : <Navigate to="/" />}
          />

          {/* Route de secours : toute URL inconnue redirige vers l'accueil */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>

      {/* footer de site web page */}
      <Footer />
    </div>
  );
}

// Export du composant principal de l'application
export default App;
