const request = require('supertest');
const app = require('../app');
const { createUser, generateToken } = require('./helpers');

describe('Catégories', () => {
    describe('POST /api/categories', () => {
        it('refuse la création sans authentification', async () => {
            const res = await request(app)
                .post('/api/categories')
                .send({ name: 'Cartes graphiques', universe: 'informatique' });

            expect(res.status).toBe(401);
        });

        it("refuse la création pour un utilisateur qui n'est pas admin", async () => {
            const { user } = await createUser({ role: 'user' });
            const token = generateToken(user);

            const res = await request(app)
                .post('/api/categories')
                .set('Authorization', `Bearer ${token}`)
                .send({ name: 'Cartes graphiques', universe: 'informatique' });

            expect(res.status).toBe(403);
        });

        it('crée une catégorie pour un admin, avec un slug généré automatiquement', async () => {
            const { user } = await createUser({ role: 'admin' });
            const token = generateToken(user);

            const res = await request(app)
                .post('/api/categories')
                .set('Authorization', `Bearer ${token}`)
                .send({ name: 'Cartes Graphiques', universe: 'informatique' });

            expect(res.status).toBe(201);
            // Régression du bug corrigé précédemment : le slug doit être généré
            // par le hook pre('validate') du modèle, pas laissé vide.
            expect(res.body.category.slug).toBe('cartes-graphiques');
        });

        it('refuse deux catégories avec exactement le même nom', async () => {
            const { user } = await createUser({ role: 'admin' });
            const token = generateToken(user);

            await request(app)
                .post('/api/categories')
                .set('Authorization', `Bearer ${token}`)
                .send({ name: 'RAM', universe: 'informatique' });

            const res = await request(app)
                .post('/api/categories')
                .set('Authorization', `Bearer ${token}`)
                .send({ name: 'RAM', universe: 'informatique' });

            expect(res.status).toBe(400);
        });

        it('refuse la création sans nom ni univers', async () => {
            const { user } = await createUser({ role: 'admin' });
            const token = generateToken(user);

            const res = await request(app)
                .post('/api/categories')
                .set('Authorization', `Bearer ${token}`)
                .send({});

            expect(res.status).toBe(400);
        });
    });

    describe('GET /api/categories', () => {
        it('liste les catégories avec leur nombre de produits (0 si vide)', async () => {
            const { user } = await createUser({ role: 'admin' });
            const token = generateToken(user);

            await request(app)
                .post('/api/categories')
                .set('Authorization', `Bearer ${token}`)
                .send({ name: 'SSD', universe: 'informatique' });

            const res = await request(app).get('/api/categories');

            expect(res.status).toBe(200);
            expect(res.body).toHaveLength(1);
            expect(res.body[0].productCount).toBe(0);
        });
    });
});
