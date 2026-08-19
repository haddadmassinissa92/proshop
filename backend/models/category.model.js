// models/category.model.js

const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    // Nom affiché de la catégorie (ex: "Ordinateurs portables")
    name: { 
        type: String, 
        required: true, 
        trim: true 
    },

    // Identifiant URL-friendly, généré automatiquement à partir du nom (ex: "ordinateurs-portables")
    slug: { 
        type: String, 
        required: true, 
        unique: true, 
        lowercase: true 
    },

    // Description courte, optionnelle (utile pour le SEO ou l'affichage)
    description: { type: String, trim: true },

    // Univers parent de haut niveau, pour regrouper les catégories dans le menu.
    universe: {
        type: String,
        required: true,
        enum: ['informatique', 'vetements', 'electromenager']
    },

    // Pour gérer les sous-catégories (optionnel). Si parentId est nul,
    // c'est une catégorie principale de l'univers.
    parentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        default: null
    },

    // Icône représentant la catégorie, affichée dans un badge coloré sur les
    // cartes de la page d'administration. C'est une classe CSS Font Awesome
    // complète tapée à la main dans le formulaire admin (ex: "fas fa-microchip",
    // "fab fa-github"), rendue directement via <i className={icon}> — pas une
    // image uploadée.
    icon: { type: String, default: 'fas fa-tag' },

    // Couleur d'accent de la catégorie (code hexadécimal), utilisée pour le
    // badge d'icône et la bordure supérieure de la carte.
    color: { type: String, default: '#6366f1' },

    // Image/photo de la catégorie (optionnel, pour un usage futur — ex: une
    // bannière sur une page catégorie dédiée). Le badge visuel de la page
    // d'administration utilise "icon" + "color" ci-dessus, pas ce champ.
    image: { type: String, default: null },

}, { timestamps: true });

// Génère automatiquement le slug à partir du nom.
// IMPORTANT : ce hook doit tourner sur "validate", pas sur "save". Mongoose
// exécute la validation (dont le "required: true" sur slug) AVANT les hooks
// "pre save" — donc un hook "pre save" arrive trop tard : slug est encore
// vide au moment où Mongoose vérifie qu'il est rempli, et la validation
// échoue systématiquement ("Path `slug` is required."), même quand le code
// du hook est correct. "pre validate" s'exécute avant la validation, donc
// slug est déjà prêt quand Mongoose le vérifie.
//
// Pas de paramètre "next" ici volontairement : sur les versions récentes de
// Mongoose (^9.x), ce hook n'est plus appelé avec un callback "next" —
// déclarer ce paramètre et essayer de l'appeler fait planter avec
// "next is not a function". Une fonction sans "next" et sans valeur de
// retour est traitée comme synchrone : Mongoose enchaîne automatiquement
// une fois qu'elle a fini de s'exécuter.
categorySchema.pre('validate', function () {
    if (this.isModified('name')) {
        this.slug = this.name
            .toLowerCase()
            .trim()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // enlève les accents
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
    }
});

module.exports = mongoose.model('Category', categorySchema);
