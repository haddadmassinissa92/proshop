// authSlice.js - Slice Redux pour gérer l'authentification et les données utilisateur

// Importations nécessaires :
// - createSlice : fonction pour créer un slice Redux avec reducers et actions
// - createAsyncThunk : fonction pour créer des actions asynchrones qui gèrent les états pending/fulfilled/rejected
// - axios : bibliothèque pour effectuer des requêtes HTTP
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { API_URL as BASE_API_URL } from '../api/api';

// URL de base pour toutes les requêtes d'authentification
const API_URL = `${BASE_API_URL}/api/auth`;

// --- ACTIONS ASYNCHRONES (Appels Backend) ---

// Action pour l'inscription d'un nouvel utilisateur
export const signup = createAsyncThunk('auth/signup', async (userData, thunkAPI) => {
    try {
        // Requête POST pour envoyer les données d'inscription au backend
        // Utilise multipart/form-data pour gérer les fichiers (avatar)
        const response = await axios.post(`${API_URL}/signup`, userData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });

        // Retour des données reçues du serveur
        return response.data;
    } catch (error) {
        // Gestion des erreurs : retour du message d'erreur du serveur
        return thunkAPI.rejectWithValue(error.response.data.message);
    }
});

// Action pour la connexion d'un utilisateur existant
export const login = createAsyncThunk('auth/login', async (userData, thunkAPI) => {
    try {
        // Requête POST pour authentifier l'utilisateur
        const response = await axios.post(`${API_URL}/login`, userData);
        
        // Retour des données : token JWT et informations utilisateur
        return response.data; // Retourne { token, user }
    } catch (error) {
        // Gestion des erreurs : retour du message d'erreur du serveur
        return thunkAPI.rejectWithValue(error.response.data.message);
    }
});

// Action pour mettre à jour le profil utilisateur
export const updateUser = createAsyncThunk('auth/update-user', async (userData, thunkAPI) => {
    try {
        // Récupération de l'état Redux actuel
        const state = thunkAPI.getState()
        
        // Extraction du token et de l'ID utilisateur depuis l'état
        const token = state.auth.token;
        const userId = state.auth.user.id

        // Configuration des headers avec authentification et type de contenu
        const config = { 
            headers: { 
                Authorization: `Bearer ${token}`,
                'Content-Type': 'multipart/form-data' 
            } 
        };
        
        // Requête PUT pour mettre à jour les informations de l'utilisateur
        const response = await axios.put(`${API_URL}/edit-profile/${userId}`, userData, config);

        // Retour des données utilisateur mises à jour
        return response.data.user;
    } catch (error) {
        // Gestion des erreurs
        return thunkAPI.rejectWithValue(error.response.data.message);
    }
});

// Action pour supprimer le compte utilisateur
export const deleteUser = createAsyncThunk('auth/delete-user', async (_, thunkAPI) => {
    try {
        // Récupération de l'état Redux actuel
        const state = thunkAPI.getState()
        
        // Extraction du token et de l'ID utilisateur depuis l'état
        const token = state.auth.token;
        const userId = state.auth.user.id

        // Configuration des headers avec authentification
        const config = { 
            headers: { 
                Authorization: `Bearer ${token}` 
            } 
        };
        
        // Requête DELETE pour supprimer le compte utilisateur
        await axios.delete(`${API_URL}/delete-profile/${userId}`, config);
        
        // Retour de null pour indiquer la suppression réussie
        return null;
    } catch (error) {
        // Gestion des erreurs
        return thunkAPI.rejectWithValue(error.response.data.message);
    }
});

// --- CRÉATION DU SLICE REDUX ---

// Création du slice d'authentification avec ses reducers et extraReducers
const authSlice = createSlice({
    // Nom du slice utilisé comme préfixe pour les actions
    name: 'auth',
    
    // État initial du slice
    initialState: {
        // Récupération des données utilisateur depuis localStorage (si disponible)
        // Récupération du token depuis localStorage (si disponible)
        // État de chargement pour les actions asynchrones
        // Message d'erreur en cas d'échec
        user: JSON.parse(localStorage.getItem('userData')) || null,
        token: localStorage.getItem('userToken') || null,
        loading: false,
        error: null
    },

    // Reducers synchrones pour les actions qui ne nécessitent pas d'appels asynchrones
    reducers: {
        // Reducer pour se déconnecter
        logout: (state) => {
            // Suppression des données utilisateur
            // Suppression du token
            // Suppression du token du localStorage
            // Suppression des données utilisateur du localStorage
            state.user = null;
            state.token = null;
            localStorage.removeItem('userToken');
            localStorage.removeItem('userData');
        }
    },

    // Gestion des actions asynchrones (login, signup, update, delete)
    extraReducers: (builder) => {
        builder
            // --- GESTION DE L'ACTION LOGIN ---
            // État pendant que la requête est en cours
            .addCase(login.pending, (state) => { 
                // Passage du state loading à true pour afficher un spinner
                state.loading = true; 
            })
            
            // État quand la connexion est réussie
            .addCase(login.fulfilled, (state, action) => {
                // Fin du chargement
                // Stockage des données utilisateur
                // Stockage du token JWT
                // Sauvegarde du token dans localStorage pour la persistance
                // Sauvegarde des données utilisateur dans localStorage
                state.loading = false;
                state.user = action.payload.user;
                state.token = action.payload.token;
                localStorage.setItem('userToken', action.payload.token);
                localStorage.setItem('userData', JSON.stringify(action.payload.user));
            })
            // État quand la connexion échoue
            .addCase(login.rejected, (state, action) => {
                // Fin du chargement
                // Stockage du message d'erreur
                state.loading = false;
                state.error = action.payload;
            })

            // --- GESTION DE L'ACTION UPDATE ---
            // État quand la mise à jour est réussie
            .addCase(updateUser.fulfilled, (state, action) => {
                // Mise à jour des données utilisateur
                // Mise à jour des données dans localStorage
                state.user = action.payload;
                localStorage.setItem('userData', JSON.stringify(action.payload));
            })

            // --- GESTION DE L'ACTION DELETE ---
            // État quand la suppression du compte est réussie
            .addCase(deleteUser.fulfilled, (state) => {
                // Suppression des données utilisateur
                // Suppression du token
                // Effacement complet du localStorage
                state.user = null;
                state.token = null;
                localStorage.clear();
            });
    }
});

// --- EXPORTATIONS ---

// Exportation de l'action de déconnexion (synchrone) 
// pour l'utiliser dans les composants
export const { logout } = authSlice.actions;

// Exportation du reducer par défaut pour l'intégrer dans le store Redux
// Ce reducer sera responsable de gérer tout l'état d'authentification de l'application
export default authSlice.reducer; 
