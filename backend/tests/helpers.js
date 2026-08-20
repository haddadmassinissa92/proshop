// tests/helpers.js — utilitaires réutilisés dans plusieurs fichiers de
// test : créer un utilisateur (client ou admin) directement en base, et
// générer un token JWT valide pour lui sans repasser par la route /login
// à chaque fois (plus rapide, et isole ce qu'on teste réellement).

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

// Crée un utilisateur en base avec un mot de passe correctement hashé (comme
// le ferait vraiment le contrôleur signup), et renvoie aussi le mot de passe
// EN CLAIR à côté — nécessaire pour tester un vrai login par la suite.
const createUser = async (overrides = {}) => {
    const plainPassword = overrides.password || 'MotDePasse123!';
    const hashedPassword = await bcrypt.hash(plainPassword, 10);
    const unique = `${Date.now()}${Math.floor(Math.random() * 100000)}`;

    const user = await User.create({
        firstName: 'Jean',
        lastName: 'Dupont',
        username: `user${unique}`,
        email: `user${unique}@test.com`,
        bio: '',
        role: 'user',
        ...overrides,
        password: hashedPassword,
    });

    return { user, plainPassword };
};

// Génère un token JWT valide pour un utilisateur donné, avec la même forme
// de payload que le vrai contrôleur login (id + role).
const generateToken = (user) => {
    return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
};

module.exports = { createUser, generateToken };
