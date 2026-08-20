// tests/setup.js
//
// Démarre une base MongoDB en mémoire (mongodb-memory-server) avant tous
// les tests, vide les collections entre chaque test (pour que les tests
// restent indépendants les uns des autres, quel que soit leur ordre
// d'exécution), et arrête tout proprement à la fin.
//
// Aucun test de cette suite ne touche jamais à une vraie base de données —
// toujours cette base jetable, recréée à chaque lancement.

const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongoServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri(), { dbName: 'proshop_test' });
});

afterEach(async () => {
    // Table rase entre chaque test : un test ne doit jamais dépendre des
    // données laissées par le précédent.
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        await collections[key].deleteMany({});
    }
});

afterAll(async () => {
    await mongoose.connection.close();
    await mongoServer.stop();
});
