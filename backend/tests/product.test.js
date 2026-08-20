const request = require('supertest');
const path = require('path');
const app = require('../app');
const Category = require('../models/category.model');
const Product = require('../models/product.model');
const { createUser, generateToken } = require('./helpers');

// On simule l'upload Cloudinary : les tests ne doivent jamais faire de
// vrai appel réseau (lent, non déterministe, et nécessiterait de vraies
// clés API rien que pour lancer la suite de tests). Ce mock renvoie une
// fausse URL, exactement comme le ferait la vraie fonction.
jest.mock('../utils/cloudinary', () => ({
    uploadImageBuffer: jest.fn().mockResolvedValue('https://res.cloudinary.com/fake/test-image.jpg'),
}));

const fixtureImage = path.join(__dirname, 'fixtures', 'test-image.png');

describe('Produits', () => {
    describe('GET /api/products', () => {
        it('renvoie un tableau vide quand aucun produit n\'existe', async () => {
            const res = await request(app).get('/api/products');
            expect(res.status).toBe(200);
            expect(res.body).toEqual([]);
        });

        it('trouve un produit par mot-clé sur le nom, la marque OU la description', async () => {
            const category = await Category.create({ name: 'Périphériques', universe: 'informatique' });
            await Product.create({
                name: 'Souris sans fil',
                brand: 'Logitech',
                description: 'Une souris gaming très précise.',
                price: 8500,
                images: ['https://res.cloudinary.com/fake/souris.jpg'],
                category: category._id,
                countInStock: 10,
            });

            // Recherche par marque — c'est précisément le bug corrigé plus tôt
            // dans le projet (la recherche ne portait avant que sur le nom et
            // la description, jamais sur la marque).
            const res = await request(app).get('/api/products?search=logitech');

            expect(res.status).toBe(200);
            expect(res.body).toHaveLength(1);
            expect(res.body[0].brand).toBe('Logitech');
        });
    });

    describe('POST /api/products', () => {
        it('refuse la création sans authentification', async () => {
            const res = await request(app).post('/api/products').send({ name: 'Test' });
            expect(res.status).toBe(401);
        });

        it("refuse la création pour un utilisateur qui n'est pas admin", async () => {
            const { user } = await createUser({ role: 'user' });
            const token = generateToken(user);

            const res = await request(app)
                .post('/api/products')
                .set('Authorization', `Bearer ${token}`)
                .field('name', 'Clavier mécanique')
                .attach('image', fixtureImage);

            expect(res.status).toBe(403);
        });

        it("refuse la création sans image (l'image est obligatoire)", async () => {
            const { user } = await createUser({ role: 'admin' });
            const token = generateToken(user);
            const category = await Category.create({ name: 'Claviers', universe: 'informatique' });

            const res = await request(app)
                .post('/api/products')
                .set('Authorization', `Bearer ${token}`)
                .field('name', 'Clavier mécanique')
                .field('brand', 'Logitech')
                .field('description', 'Un clavier mécanique rétroéclairé.')
                .field('price', '12000')
                .field('countInStock', '5')
                .field('category', category._id.toString());

            expect(res.status).toBe(400);
        });

        it('crée un produit pour un admin avec une image', async () => {
            const { user } = await createUser({ role: 'admin' });
            const token = generateToken(user);
            const category = await Category.create({ name: 'Claviers', universe: 'informatique' });

            const res = await request(app)
                .post('/api/products')
                .set('Authorization', `Bearer ${token}`)
                .field('name', 'Clavier mécanique')
                .field('brand', 'Logitech')
                .field('description', 'Un clavier mécanique rétroéclairé.')
                .field('price', '12000')
                .field('countInStock', '5')
                .field('category', category._id.toString())
                .attach('image', fixtureImage);

            expect(res.status).toBe(201);
            expect(res.body.product.images).toHaveLength(1);
            expect(res.body.product.user).toBe(user._id.toString());
        });
    });
});
