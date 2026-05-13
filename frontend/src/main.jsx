// src/main.jsx

// Importation de React et des bibliothèques nécessaires pour le rendu,
// le routage et la gestion de l'état global
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter as Router } from 'react-router-dom'  // Router pour la navigation côté client

// Importation du Provider pour connecter le store Redux pour l'etat global, 
// à l'application, et la configuration de store lui meme
import { Provider } from 'react-redux'
import { store } from './store/store'

// Importation du composant principal de l'application
import App from './App.jsx'

// Création du root React et rendu de l'application enveloppée dans le
// Provider et le Router pour permettre la gestion de l'état
// global et du routage dans toute l'application.
createRoot(document.getElementById('root')).render(  // Création de la racine React sur l'élément DOM 'root'
  <StrictMode>

    {/* Store de Redux: Gestion de toute l'application */}
    <Provider store={store}>

      {/* Activation du routage avec BrowserRouter */} 
      <Router>

          {/* Rendu du composant principal App */}
          <App />
      </Router>
    </Provider>
  </StrictMode>
)

   