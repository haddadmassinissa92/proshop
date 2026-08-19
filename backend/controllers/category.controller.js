// controllers/category.controller.js

const Category = require('../models/category.model');
const Product = require('../models/product.model');

// @desc    Créer une nouvelle catégorie
// @route   POST /api/categories
// @access  Admin
const createCategory = async (req, res) => {
    try {
        const { name, description, universe, parentId, image, icon, color } = req.body;

        if (!name || !universe) {
            return res.status(400).json({ message: "Le nom et l'univers sont obligatoires." });
        }

        // Si un parentId est fourni, on vérifie qu'il correspond bien à une catégorie existante
        if (parentId) {
            const parent = await Category.findById(parentId);
            if (!parent) {
                return res.status(400).json({ message: "La catégorie parente indiquée n'existe pas." });
            }
        }

        const category = new Category({
            name,
            description,
            universe,
            parentId: parentId || null,
            image: image || null,
            icon: icon || undefined,   // undefined -> Mongoose applique la valeur par défaut du schéma
            color: color || undefined,
        });

        const savedCategory = await category.save();
        res.status(201).json({ message: "Catégorie créée avec succès !", category: savedCategory });

    } catch (error) {
        // Erreur de doublon (slug ou nom déjà utilisé)
        if (error.code === 11000) {
            return res.status(400).json({ message: "Une catégorie avec ce nom existe déjà." });
        }
        console.error("Error while creating category:", error);
        res.status(500).json({ message: "Error while creating category", error: error.message });
    }
};

// @desc    Récupérer toutes les catégories (avec filtre optionnel par univers)
//          Chaque catégorie renvoyée contient un champ "productCount" (nombre
//          de produits qui l'utilisent) et "name" de son parent le cas échéant —
//          pratique pour l'interface d'administration et pour savoir si une
//          catégorie peut être supprimée sans conséquence.
// @route   GET /api/categories
// @access  Public
const getAllCategories = async (req, res) => {
    try {
        const { universe } = req.query;
        const query = universe ? { universe } : {};

        const categories = await Category.find(query)
            .populate('parentId', 'name')
            .sort('name')
            .lean();

        // On compte les produits de chaque catégorie en une seule requête
        // d'agrégation plutôt qu'une requête countDocuments() par catégorie
        // (évite le problème "N+1 requêtes" si la liste s'allonge).
        const counts = await Product.aggregate([
            { $group: { _id: '$category', count: { $sum: 1 } } }
        ]);
        const countMap = counts.reduce((acc, c) => {
            acc[c._id?.toString()] = c.count;
            return acc;
        }, {});

        const categoriesWithCount = categories.map(cat => ({
            ...cat,
            productCount: countMap[cat._id.toString()] || 0
        }));

        res.status(200).json(categoriesWithCount);

    } catch (error) {
        console.error("Error while getting categories:", error);
        res.status(500).json({ message: "Error while getting categories", error: error.message });
    }
};

// @desc    Récupérer une catégorie par son ID, avec le nombre de produits
//          associés et la liste de ces produits (utile pour la page admin
//          "produits de cette catégorie").
// @route   GET /api/categories/:id
// @access  Public
const getCategoryById = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id).populate('parentId', 'name');

        if (!category) {
            return res.status(404).json({ message: "Category not found!" });
        }

        // Produits associés à cette catégorie (résumé léger : pas besoin de tous les champs).
        const products = await Product.find({ category: category._id })
            .select('name price images countInStock');

        res.status(200).json({
            ...category.toObject(),
            productCount: products.length,
            products,
        });

    } catch (error) {
        console.error("Error while getting category by ID:", error);
        res.status(500).json({ message: "Invalid ID or server failed!" });
    }
};

// @desc    Mettre à jour une catégorie
// @route   PUT /api/categories/:id
// @access  Admin
const updateCategory = async (req, res) => {
    try {
        const { name, description, universe, parentId, image, icon, color } = req.body;

        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).json({ message: "Category not found!" });
        }

        // Une catégorie ne peut pas être son propre parent
        if (parentId && parentId === req.params.id) {
            return res.status(400).json({ message: "Une catégorie ne peut pas être sa propre catégorie parente." });
        }

        category.name = name || category.name;
        category.description = description !== undefined ? description : category.description;
        category.universe = universe || category.universe;
        category.parentId = parentId !== undefined ? (parentId || null) : category.parentId;
        category.image = image !== undefined ? image : category.image;
        category.icon = icon || category.icon;
        category.color = color || category.color;

        const updatedCategory = await category.save();
        res.status(200).json({ message: "Category updated successfully", category: updatedCategory });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: "Une catégorie avec ce nom existe déjà." });
        }
        console.error("Error while updating category:", error);
        res.status(500).json({ message: "Error while updating category", error: error.message });
    }
};

// @desc    Supprimer une catégorie
// @route   DELETE /api/categories/:id
// @access  Admin
const deleteCategory = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).json({ message: "Category not found!" });
        }

        // On empêche la suppression si des produits utilisent encore cette catégorie
        const productsUsingCategory = await Product.countDocuments({ category: category._id });
        if (productsUsingCategory > 0) {
            return res.status(400).json({
                message: `Impossible de supprimer : ${productsUsingCategory} produit(s) utilisent encore cette catégorie.`
            });
        }

        // On empêche aussi la suppression si d'autres catégories l'ont comme parent
        const subCategories = await Category.countDocuments({ parentId: category._id });
        if (subCategories > 0) {
            return res.status(400).json({
                message: `Impossible de supprimer : ${subCategories} sous-catégorie(s) en dépendent encore.`
            });
        }

        await category.deleteOne();
        res.status(200).json({ message: "Category deleted successfully!" });

    } catch (error) {
        console.error("Error while deleting category:", error);
        res.status(500).json({ message: "Error while deleting category", error: error.message });
    }
};

module.exports = {
    createCategory,
    getAllCategories,
    getCategoryById,
    updateCategory,
    deleteCategory,
};
