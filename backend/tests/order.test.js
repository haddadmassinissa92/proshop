const request = require('supertest');
const app = require('../app');
const Category = require('../models/category.model');
const Product = require('../models/product.model');
const { createUser, generateToken } = require('./helpers');

// Crée un produit valide en base, prêt à être commandé dans les tests.
const createTestProduct = async (overrides = {}) => {
    const category = await Category.create({ name: 'Test', universe: 'informatique' });
    return Product.create({
        name: 'Clavier mécanique',
        brand: 'Logitech',
        description: 'Un clavier de test.',
        price: 12000,
        images: ['https://res.cloudinary.com/fake/clavier.jpg'],
        category: category._id,
        countInStock: 5,
        ...overrides,
    });
};

const validShippingAddress = {
    address: '12 rue des Tests',
    city: 'Alger',
    postalCode: '16000',
    phone: '0555000000',
};

describe('Commandes', () => {
    describe('POST /api/orders', () => {
        it('refuse la création sans authentification', async () => {
            const res = await request(app).post('/api/orders').send({ orderItems: [] });
            expect(res.status).toBe(401);
        });

        it('refuse une commande sans article', async () => {
            const { user } = await createUser();
            const token = generateToken(user);

            const res = await request(app)
                .post('/api/orders')
                .set('Authorization', `Bearer ${token}`)
                .send({ orderItems: [], shippingAddress: validShippingAddress, paymentMethod: 'Paiement à la livraison' });

            expect(res.status).toBe(400);
        });

        it("refuse un article sans champ 'product' — régression du bug corrigé précédemment", async () => {
            // Avant correction, le frontend envoyait seulement "_id" et jamais
            // "product" (le nom réellement attendu par le schéma), ce qui
            // faisait échouer la commande sans message clair.
            const { user } = await createUser();
            const token = generateToken(user);
            const product = await createTestProduct();

            const res = await request(app)
                .post('/api/orders')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    orderItems: [{ _id: product._id, name: product.name, quantity: 1, image: product.images[0], price: product.price }],
                    shippingAddress: validShippingAddress,
                    paymentMethod: 'Paiement à la livraison',
                    itemsPrice: product.price,
                    totalPrice: product.price,
                });

            expect(res.status).toBe(400);
        });

        it('refuse une commande qui dépasse le stock disponible', async () => {
            const { user } = await createUser();
            const token = generateToken(user);
            const product = await createTestProduct({ countInStock: 2 });

            const res = await request(app)
                .post('/api/orders')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    orderItems: [{ product: product._id, name: product.name, quantity: 5, image: product.images[0], price: product.price }],
                    shippingAddress: validShippingAddress,
                    paymentMethod: 'Paiement à la livraison',
                    itemsPrice: product.price * 5,
                    totalPrice: product.price * 5,
                });

            expect(res.status).toBe(400);
        });

        it('crée une commande valide et décrémente le stock du produit', async () => {
            const { user } = await createUser();
            const token = generateToken(user);
            const product = await createTestProduct({ countInStock: 5 });

            const res = await request(app)
                .post('/api/orders')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    orderItems: [{ product: product._id, name: product.name, quantity: 2, image: product.images[0], price: product.price }],
                    shippingAddress: validShippingAddress,
                    paymentMethod: 'Paiement à la livraison',
                    itemsPrice: product.price * 2,
                    totalPrice: product.price * 2,
                });

            expect(res.status).toBe(201);
            expect(res.body.orderItems).toHaveLength(1);

            const updatedProduct = await Product.findById(product._id);
            expect(updatedProduct.countInStock).toBe(3); // 5 - 2
        });
    });

    describe('PUT /api/orders/:id/pay', () => {
        it('refuse à un client de marquer sa propre commande comme payée (réservé aux admins)', async () => {
            const { user } = await createUser();
            const token = generateToken(user);
            const product = await createTestProduct();

            const createRes = await request(app)
                .post('/api/orders')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    orderItems: [{ product: product._id, name: product.name, quantity: 1, image: product.images[0], price: product.price }],
                    shippingAddress: validShippingAddress,
                    paymentMethod: 'Paiement à la livraison',
                    itemsPrice: product.price,
                    totalPrice: product.price,
                });

            const res = await request(app)
                .put(`/api/orders/${createRes.body._id}/pay`)
                .set('Authorization', `Bearer ${token}`)
                .send({});

            // Faille corrigée précédemment : cette route n'était protégée que
            // par "connecté", pas "admin" — n'importe quel client pouvait
            // marquer n'importe quelle commande comme payée.
            expect(res.status).toBe(403);
        });
    });
});
