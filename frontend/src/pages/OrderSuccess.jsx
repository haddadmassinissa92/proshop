// frontend/src/pages/OrderSuccess.jsx
//
// Page de détail d'une commande : affichée juste après la validation d'une
// nouvelle commande, mais aussi accessible depuis l'historique ("Mes
// commandes") pour revoir une ancienne commande — même page dans les deux
// cas, elle se contente d'afficher le récapitulatif tel quel.
import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { FaCheckCircle, FaBoxOpen } from 'react-icons/fa';
import { API_URL, getMediaUrl } from '../api/api';

const OrderSuccess = () => {
    const { id } = useParams(); // Récupère l'ID de la commande depuis l'URL
    const [searchParams] = useSearchParams();
    // PlaceOrders.jsx ajoute ?new=1 juste après la création d'une commande —
    // permet d'afficher un message de remerciement uniquement dans ce cas,
    // et un titre neutre quand la page est rouverte depuis l'historique.
    const isFreshOrder = searchParams.get('new') === '1';
    const { token } = useSelector((state) => state.auth);

    const [order, setOrder] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const config = { headers: { Authorization: `Bearer ${token}` } };
                const { data } = await axios.get(`${API_URL}/api/orders/${id}`, config);
                setOrder(data);
            } catch (err) {
                console.error("Erreur lors du chargement de la commande :", err);
                setError(err.response?.data?.message || "Impossible de charger le récapitulatif de la commande.");
            } finally {
                setLoading(false);
            }
        };

        if (id && token) {
            fetchOrder();
        }
    }, [id, token]);

    return (
        <div style={{ maxWidth: '700px', margin: '0 auto', padding: '50px 20px', fontFamily: 'sans-serif' }}>
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                <FaCheckCircle style={{ fontSize: '60px', color: '#28a745', marginBottom: '20px' }} />
                <h1 style={{ color: '#333' }}>{isFreshOrder ? 'Merci pour votre commande !' : 'Détail de la commande'}</h1>
                <p style={{ color: '#666', fontSize: '18px' }}>
                    {order
                        ? (order.isPaid
                            ? "Votre paiement a bien été confirmé. Votre commande va être préparée puis expédiée."
                            : "Le paiement sera confirmé " +
                              (order.paymentMethod === 'Paiement à la livraison'
                                ? "à la réception (paiement à la livraison)."
                                : "dès sa réception."))
                        : ""}
                </p>
            </div>

            {loading && <p style={{ textAlign: 'center' }}>Chargement du récapitulatif...</p>}
            {error && <p style={{ textAlign: 'center', color: '#ef4444' }}>{error}</p>}

            {order && (
                <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '25px', marginBottom: '30px' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' }}>
                        <FaBoxOpen /> Commande #{order._id.substring(18)}
                    </h3>
                    <p><strong>Statut :</strong> {order.status}</p>
                    <p><strong>Mode de paiement :</strong> {order.paymentMethod}</p>
                    <p><strong>Paiement :</strong> {order.isPaid ? 'Confirmé ✅' : 'En attente'}</p>
                    <p><strong>Adresse :</strong> {order.shippingAddress?.address}, {order.shippingAddress?.city} ({order.shippingAddress?.postalCode})</p>

                    <div style={{ marginTop: '15px' }}>
                        {order.orderItems?.map((item, index) => (
                            <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 0', borderTop: '1px solid #e2e8f0' }}>
                                <img
                                    src={item.image ? getMediaUrl(item.image) : ''}
                                    alt={item.name}
                                    style={{ width: '45px', height: '45px', objectFit: 'contain' }}
                                />
                                <span style={{ flex: 1 }}>{item.name}</span>
                                <span>{item.quantity} x {item.price.toLocaleString()} DA</span>
                            </div>
                        ))}
                    </div>

                    <p style={{ marginTop: '15px', fontSize: '18px', textAlign: 'right' }}>
                        <strong>Total : {order.totalPrice?.toLocaleString()} DA</strong>
                    </p>
                </div>
            )}

            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
                <Link to="/user/orders" style={{ padding: '12px 24px', backgroundColor: '#333', color: '#fff', textDecoration: 'none', borderRadius: '5px', fontWeight: 'bold' }}>
                    Voir mes commandes
                </Link>
                <Link to="/" style={{ padding: '12px 24px', backgroundColor: '#f4f4f4', color: '#333', textDecoration: 'none', borderRadius: '5px', fontWeight: 'bold', border: '1px solid #ccc' }}>
                    Retourner à la boutique
                </Link>
            </div>
        </div>
    );
};

export default OrderSuccess;
