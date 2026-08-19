// frontend/src/store/orderSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { API_URL as BASE_API_URL } from '../api/api';

const API_URL = `${BASE_API_URL}/api/orders`;

// Action asynchrone pour créer la commande côté backend. La création de la
// commande est toujours la première étape, quel que soit le mode de
// paiement choisi (Paiement à la livraison / Carte CIB-Edahabia) — c'est
// PlaceOrders.jsx qui enchaîne ensuite avec le bon flux de paiement une fois
// la commande créée (voir /api/payments/cib/...).
export const createOrder = createAsyncThunk('order/create', async (orderData, thunkAPI) => {
    try {
        // On récupère le token JWT de l'utilisateur depuis le slice auth
        const state = thunkAPI.getState();
        const token = state.auth.token;

        const config = {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        };

        // Le backend renvoie directement la commande créée (pas d'enrobage).
        const response = await axios.post(API_URL, orderData, config);
        return response.data;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
});

const orderSlice = createSlice({
    name: 'order',
    initialState: {
        currentOrder: null,
        loading: false,
        error: null,
        success: false
    },
    reducers: {
        resetOrderState: (state) => {
            state.success = false;
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(createOrder.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.success = false;
            })
            .addCase(createOrder.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;
                // Bug corrigé : le backend renvoie la commande directement
                // (pas de champ imbriqué .order), donc action.payload.order
                // valait toujours undefined.
                state.currentOrder = action.payload;
            })
            .addCase(createOrder.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
                state.success = false;
            });
    }
});

export const { resetOrderState } = orderSlice.actions;
export default orderSlice.reducer;
