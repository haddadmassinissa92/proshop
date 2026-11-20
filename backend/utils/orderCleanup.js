// utils/orderCleanup.js
//
// Libère le stock des commandes par carte restées impayées.
//
// Pourquoi : à la création d'une commande, le stock est réservé tout de suite
// (pour ne pas vendre deux fois le dernier article). Pour "Paiement à la
// livraison" c'est définitif. Pour la carte, si le client ferme l'onglet ou
// abandonne le paiement, le stock resterait bloqué indéfiniment : on annule donc
// les commandes par carte impayées après un délai, et on remet le stock.

const Order = require('../models/order.model');
const { releaseStock } = require('./stock');

const CARD_METHOD = 'Carte CIB/Edahabia';

const cancelStaleCardOrders = async (olderThanMinutes = 60) => {
    const cutoff = new Date(Date.now() - olderThanMinutes * 60 * 1000);

    const stale = await Order.find({
        paymentMethod: CARD_METHOD,
        isPaid: false,
        status: 'En attente',
        createdAt: { $lt: cutoff },
    }).select('_id');

    let cancelled = 0;
    for (const { _id } of stale) {
        // "Réclamation" atomique : si deux exécutions se chevauchent, une seule
        // reçoit le document, donc le stock n'est jamais remis deux fois.
        const claimed = await Order.findOneAndUpdate(
            { _id, isPaid: false, status: 'En attente' },
            { $set: { status: 'Annulée', 'paymentResult.status': 'expired' } }
        );
        if (claimed) {
            await releaseStock(claimed.orderItems);
            cancelled += 1;
        }
    }
    return cancelled;
};

module.exports = { cancelStaleCardOrders };
