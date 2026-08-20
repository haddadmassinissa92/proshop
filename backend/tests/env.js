// tests/env.js — variables d'environnement dédiées aux tests, chargées
// avant tout le reste. Volontairement distinctes du vrai .env : les tests
// ne doivent JAMAIS dépendre de vraies clés API ni d'une vraie base de
// données (voir tests/setup.js pour la base MongoDB en mémoire).
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-do-not-use-in-production';
process.env.CLIENT_URL = 'http://localhost:5173';
process.env.SERVER_URL = 'http://localhost:3000';
