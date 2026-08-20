const request = require('supertest');
const app = require('../app');
const User = require('../models/user.model');
const { createUser } = require('./helpers');

describe('Authentification', () => {
    describe('POST /api/auth/signup', () => {
        it('crée un nouvel utilisateur avec des données valides', async () => {
            const res = await request(app).post('/api/auth/signup').send({
                firstName: 'Alice',
                lastName: 'Martin',
                username: 'alicemartin',
                email: 'alice@test.com',
                password: 'MotDePasse123!',
            });

            expect(res.status).toBe(201);

            const created = await User.findOne({ email: 'alice@test.com' }).select('+password');
            expect(created).not.toBeNull();
            // Le mot de passe stocké ne doit jamais être le mot de passe en clair.
            expect(created.password).not.toBe('MotDePasse123!');
        });

        it("refuse l'inscription si l'email est déjà utilisé", async () => {
            await createUser({ email: 'existe@test.com' });

            const res = await request(app).post('/api/auth/signup').send({
                firstName: 'Bob',
                lastName: 'Durand',
                username: 'bobdurand',
                email: 'existe@test.com',
                password: 'AutreMotDePasse1!',
            });

            expect(res.status).toBe(400);
        });

        it("refuse l'inscription si le username est déjà pris", async () => {
            await createUser({ username: 'pseudopris' });

            const res = await request(app).post('/api/auth/signup').send({
                firstName: 'Chris',
                lastName: 'Petit',
                username: 'pseudopris',
                email: 'nouveau@test.com',
                password: 'MotDePasse123!',
            });

            expect(res.status).toBe(400);
        });
    });

    describe('POST /api/auth/login', () => {
        it('connecte un utilisateur avec les bons identifiants et renvoie un token', async () => {
            const { plainPassword } = await createUser({ email: 'login@test.com' });

            const res = await request(app).post('/api/auth/login').send({
                email: 'login@test.com',
                password: plainPassword,
            });

            expect(res.status).toBe(200);
            expect(res.body.token).toBeDefined();
            expect(res.body.user.email).toBe('login@test.com');
            // Le mot de passe (même hashé) ne doit jamais repartir dans la réponse.
            expect(res.body.user.password).toBeUndefined();
        });

        it('refuse la connexion avec un mauvais mot de passe', async () => {
            await createUser({ email: 'mdpfaux@test.com' });

            const res = await request(app).post('/api/auth/login').send({
                email: 'mdpfaux@test.com',
                password: 'CeNestPasLeBonMotDePasse',
            });

            expect(res.status).toBe(401);
        });

        it("refuse la connexion pour un email qui n'existe pas", async () => {
            const res = await request(app).post('/api/auth/login').send({
                email: 'inexistant@test.com',
                password: 'PeuImporte123!',
            });

            expect(res.status).toBe(401);
        });
    });
});
