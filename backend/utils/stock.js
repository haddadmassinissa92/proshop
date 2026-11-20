// utils/stock.js
//
// Remet en stock des articles précédemment réservés (commande échouée,
// annulée ou jamais payée). Utilisé par order.controller.js et orderCleanup.js.
//
// "items" : tableau d'objets { product, quantity } (la forme d'orderItems).

const Product = require('../models/product.model');

const releaseStock = async (items = []) => {
    await Promise.all(
        items.map((item) =>
            Product.findByIdAndUpdate(item.product, { $inc: { countInStock: item.quantity } })
        )
    );
};

module.exports = { releaseStock };
