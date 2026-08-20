// jest.config.js
//
// - testEnvironment 'node' : ce backend n'a rien à faire d'un DOM simulé.
// - setupFiles : variables d'environnement de test, chargées AVANT que le
//   framework de tests lui-même soit installé (peuvent servir à toute la
//   config, comme JWT_SECRET utilisé par les contrôleurs).
// - setupFilesAfterEnv : connexion à la base MongoDB en mémoire, chargée
//   APRÈS l'installation du framework — nécessaire ici car ce fichier
//   utilise les fonctions globales de Jest (beforeAll, afterEach...).
// - testTimeout élevé : le tout premier démarrage de MongoMemoryServer
//   télécharge le binaire MongoDB la première fois, ce qui peut prendre
//   plus que les 5 secondes par défaut de Jest.
module.exports = {
    testEnvironment: 'node',
    setupFiles: ['<rootDir>/tests/env.js'],
    setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
    testTimeout: 20000,
    verbose: true,
};
