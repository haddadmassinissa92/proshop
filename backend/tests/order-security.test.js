// tests/order-security.test.js
//
// Tests de non-régression pour la création de commande côté sécurité/stock :
// le prix ne doit JAMAIS venir du frontend, et le stock réservé doit être
// remis en place si la commande échoue. Même structure que tests/order.test.js.

const request = require('supertest');
const app = require('../app');
const Category = require('../models/category.model');
const Product = require('../models/product.model');
const Order = require('../models/order.model');
const { createUser, generateToken } = require('./helpers');

const createCategory = () => Category.create({ name: 'Test', universe: 'informatique' });

const createTestProduct = (category, overrides = {}) =>
    Product.create({
        name: 'Clavier mécanique',
        brand: 'Logitech',
        description: 'Un clavier de test.',
        price: 12000,
        images: ['https://res.cloudinary.com/fake/clavier.jpg'],
        category: category._id,
        countInStock: 5,
        ...overrides,
    });

const validShippingAddress = {
    address: '12 rue des Tests',
    city: 'Alger',
    postalCode: '16000',
    phone: '0555000000',
};

describe('Commandes — prix et stock', () => {
    it('ignore les prix envoyés par le frontend et recalcule le total depuis la base', async () => {
        const { user } = await createUser();
        const token = generateToken(user);
        const category = await createCategory();
        const product = await createTestProduct(category, { price: 12000, countInStock: 5 });

        const res = await request(app)
            .post('/api/orders')
            .set('Authorization', `Bearer ${token}`)
            .send({
                // Prix falsifiés : 1 DA partout.
                orderItems: [{ product: product._id, name: 'Faux nom', quantity: 2, image: 'x', price: 1 }],
                shippingAddress: validShippingAddress,
                paymentMethod: 'Carte CIB/Edahabia',
                itemsPrice: 1,
                taxPrice: 0,
                shippingPrice: 0,
                totalPrice: 1,
            });

        expect(res.status).toBe(201);
        expect(res.body.totalPrice).toBe(24000); // 2 x 12000, pas 1
        expect(res.body.orderItems[0].price).toBe(12000);
        expect(res.body.orderItems[0].name).toBe('Clavier mécanique');
    });

    it("remet en place le stock déjà réservé quand un autre article manque", async () => {
        const { user } = await createUser();
        const token = generateToken(user);
        const category = await createCategory();
        const plenty = await createTestProduct(category, { name: 'Article A', countInStock: 5 });
        const scarce = await createTestProduct(category, { name: 'Article B', countInStock: 1 });

        const res = await request(app)
            .post('/api/orders')
            .set('Authorization', `Bearer ${token}`)
            .send({
                orderItems: [
                    { product: plenty._id, quantity: 2 },
                    { product: scarce._id, quantity: 3 }, // dépasse le stock
                ],
                shippingAddress: validShippingAddress,
                paymentMethod: 'Paiement à la livraison',
            });

        expect(res.status).toBe(400);
        expect((await Product.findById(plenty._id)).countInStock).toBe(5); // remis en place
        expect((await Product.findById(scarce._id)).countInStock).toBe(1);
        expect(await Order.countDocuments()).toBe(0);
    });

    it("refuse un identifiant de produit invalide avec une erreur 400 claire", async () => {
        const { user } = await createUser();
        const token = generateToken(user);

        const res = await request(app)
            .post('/api/orders')
            .set('Authorization', `Bearer ${token}`)
            .send({
                orderItems: [{ product: 'pas-un-id', quantity: 1 }],
                shippingAddress: validShippingAddress,
                paymentMethod: 'Paiement à la livraison',
            });

        expect(res.status).toBe(400);
    });

    it('refuse une quantité décimale ou négative', async () => {
        const { user } = await createUser();
        const token = generateToken(user);
        const category = await createCategory();
        const product = await createTestProduct(category, { countInStock: 5 });

        for (const quantity of [1.5, -3, 0]) {
            const res = await request(app)
                .post('/api/orders')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    orderItems: [{ product: product._id, quantity }],
                    shippingAddress: validShippingAddress,
                    paymentMethod: 'Paiement à la livraison',
                });
            expect(res.status).toBe(400);
        }
        expect((await Product.findById(product._id)).countInStock).toBe(5);
    });
});
