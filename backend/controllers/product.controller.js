// controllers/product.controller.js

// Importation du modèle de données produit pour interagir avec la base de données MongoDB.
const Product = require('../models/product.model')


const createProduct = async (req, res) => {
    /**
     * Fonction pour créer un nouveau produit dans la boutique (réservée aux administrateurs).
     * 
     * Étapes :
     * Tout d'abord essayer:
     *      1. Récupérer le chemin de l'image du produit à partir de req.file généré par Multer.
     *      2. Récupérer les données du produit à partir de req.body et ajouter le champ 'createdBy' avec l'ID de l'administrateur connecté.
     *      3. Vérifier que l'image n'est pas manquante dans les données du produit.
     * 
     * Si l'image est manquante:
     *      4. Renvoyer une erreur 400 avec un message indiquant que l'image est requise.
     * 
     * Sinon, si l'image est présente:
     *      5. Créer une nouvelle instance de Product avec les données fournies et l'image construite.
     *      6. Enregistrer le produit dans la base de données MongoDB.
     *      7. Renvoyer une réponse avec un message de succès, le statut 201 et les détails du produit créé.
     * 
     * Sinon en cas d'erreur serveur:
     *      8. Afficher l'erreur dans la console pour le développement.
     *      9. Renvoyer une réponse avec un message d'erreur et un statut 400 pour indiquer une erreur de requête.
     * 
     * @desc Créer un nouveau produit dans la boutique (réservé aux administrateurs).
     * @route POST /api/products/
     * @access Administrateur authentifié
     */

    try {
        // On récupère le chemin du fichier généré par Multer
        const imageUrl = req.file ? `/images/${req.file.filename}` : null;

        // On force l'ID de l'administrateur qui crée le produit à partir du token d'authentification.
        const productData = { 
            ...req.body, 
            createdBy: req.user.id,
            images: imageUrl ? [imageUrl] : []
        }

        // On vérifie si l'image est manquante (si required dans ton modèle)
        if (productData.images.length === 0) {
            return res.status(400).json({ message: "The image is required." });
        }

        // On creer un nouveau produit des donnees recu dans req.body.
        const product = new Product(productData) 

        // On l'enregistre dans la base de donnees MongoDB.
        const savedProduct = await product.save()

        // On renvoi le resultat de la requette et on affiche un message de succession.
        res.status(201).json({
            message: "The product was added successfully !",
            product: savedProduct
        });
    } catch (error) {
        // Afficher l'erreur dans la console pour le développement.
        // Renvoyer une réponse avec un message d'erreur et un status 400 pour indiquer une erreur de requette.
        console.error(error)
        res.status(400).json({ message: "Error while creating product", error: error.message });
    }
}


const getAllProducts = async (req, res) => {
    /**
     * Fonction pour récupérer tous les produits avec options de filtrage, recherche et tri.
     * 
     * Étapes :
     * Tout d'abord essayer:
     *      1. Récupérer les paramètres de la requête (search, category, sort) pour construire dynamiquement les filtres.
     *      2. Initialiser une requête vide pour construire les filtres de manière flexible.
     * 
     * Si un paramètre de recherche est présent:
     *      3. Construire une requête de recherche insensible à la casse dans les champs (name, description) du produit.
     * 
     * Si un paramètre de catégorie est présent:
     *      4. Ajouter un filtre pour la catégorie au produit.
     * 
     * Exécution de la requête avec tri dynamique:
     *      5. Exécuter la requête avec les filtres appliqués.
     *      6. Trier les résultats selon le paramètre 'sort' : prix ascendant, prix descendant, ou par défaut par date de création décroissante.
     *      7. Récupérer les produits correspondants depuis la base de données.
     *      8. Renvoyer les produits avec un statut 200.
     * 
     * Sinon en cas d'erreur serveur:
     *      9. Afficher l'erreur dans la console pour le développement.
     *      10. Renvoyer une réponse avec un message d'erreur et un statut 500.
     * 
     * @desc Récupérer tous les produits avec options de filtrage, recherche et tri.
     * @route GET /api/products/
     * @access Public (accessible à tous, authentifiés ou non)
     */

    try {
        // On recupere les parametres de la requette.
        // On initialise une query vide pour construire dynamiquement les filtres.
        const { search, category, sort } = req.query
        let query = {} 

        // Recherche par mot-clé dans le nom ou la description du produit (insensible à la casse).
        if (search && search.trim() !== '') {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
            ];
        }

        // Filtrage par catégorie si le paramètre est présent.
        if (category) {
            query.category = category
        }

        // Tri des produits par date de création (du plus récent au plus ancien).
        let result = Product.find(query)

        // Tri dynamique selon le paramètre 'sort' (prix ascendant, descendant ou par défaut date).
        if (sort === 'price-asc') {
            result = result.sort('price');
        } else if (sort === 'price-desc') {
            result = result.sort('-price');
        } else {
            result = result.sort('-createdAt');
        }

        // On recupere tous les produits qui correspondent a la query.
        let products = await result

        // // Si la base de donnees est vide
        // // On fais des produits de test.
        // if (products.length === 0) {
        //     products = [
        //         {
        //             _id: "demo1",
        //             name: "MacBook Pro M2",
        //             price: 250000,
        //             category: "ordinateurs",
        //             brand: "Apple",
        //             description: "Le MacBook Pro 13 pouces avec puce M2 (2022) est un ordinateur portable compact et puissant, conçu pour l'efficacité. Il se distingue par un excellent équilibre entre performance et autonomie.",
        //             images: ["https://unsplash.com"],
        //             countInStock: 5,
        //             rating: 4.8
        //         },
        //         {
        //             _id: "demo2",
        //             name: "Clavier Mechanical RGB",
        //             price: 12000,
        //             category: "peripheriques",
        //             brand: "Razer",
        //             description: "Le clavier mécanique RGB petit format (60-65%) est l'outil idéal pour les joueurs compétitifs et les setups minimalistes. Très compact, il supprime le pavé numérique et souvent les touches de fonction (F1-F12) pour maximiser l'espace de la souris, offrant une meilleure ergonomie.",
        //             images: ["https://unsplash.com"],
        //             countInStock: 10,
        //             rating: 4.5
        //         }
        //     ];
        // }

        // On renvoie le resultat de la requette.
        res.status(200).json(products) 

    } catch (error) {
        // Afficher l'erreur dans la console pour le développement.
        // Renvoyer une réponse avec un message d'erreur et un status 500 pour indiquer une erreur serveur.
        console.error("Error while getting products:", error);
        res.status(500).json({ message: "Error while getting product", error: error.message });
    }
}

const getProductById = async (req, res) => {
    /**
     * Fonction pour récupérer un produit spécifique par son ID.
     * 
     * Étapes :
     * Tout d'abord essayer:
     *      1. Rechercher un produit par son ID dans la base de données.
     * 
     * Si le produit n'existe pas:
     *      2. Renvoyer une erreur 404 avec un message indiquant que le produit n'a pas été trouvé.
     * 
     * Sinon, si le produit est trouvé:
     *      3. Renvoyer le produit avec un statut 200 pour indiquer que la requête a réussi.
     * 
     * Sinon en cas d'erreur serveur:
     *      4. Afficher l'erreur dans la console pour le développement.
     *      5. Renvoyer une réponse avec un message d'erreur et un statut 500 pour indiquer une erreur serveur ou un ID invalide.
     * 
     * @desc Récupérer les détails complets d'un produit spécifique par son ID.
     * @route GET /api/products/:id
     * @access Public (accessible à tous, authentifiés ou non)
     */

    try {
        // On trouve un produit par son id.
        const product = await Product.findById(req.params.id);
        if (!product) { 
            // Si le produit n'est pas trouver, on affiche une erreur.
            res.status(404).json({ message: "Product not found!" });
        } 
        
        // On renvoie le resultat de la requette.
        res.status(200).json(product) 

    } catch (error) {
        // Afficher l'erreur dans la console pour le développement.
        // Renvoyer une réponse avec un message d'erreur et un status 500 pour indiquer une erreur serveur.
        console.error("Error while getting product by ID:", error);
        res.status(500).json({ message: "Invalid ID or server failed!" });
    }
};

const updateProduct = async (req, res) => {
    /**
     * Fonction pour mettre à jour un produit existant par son ID (réservée aux administrateurs).
     * 
     * Étapes :
     * Tout d'abord essayer:
     *      1. Récupérer les données du produit à partir de req.body (name, description, price, category, brand, countInStock, images).
     *      2. Rechercher le produit par son ID dans la base de données.
     * 
     * Si le produit n'existe pas:
     *      3. Renvoyer une erreur 404 avec un message indiquant que le produit n'a pas été trouvé.
     * 
     * Sinon, si le produit est trouvé:
     *      4. Mettre à jour les champs du produit avec les nouvelles données fournies (utiliser les valeurs anciennes si non fournies).
     *      5. Enregistrer le produit mis à jour dans la base de données MongoDB.
     *      6. Renvoyer une réponse avec un message de succès, le statut 200 et les détails du produit mis à jour.
     * 
     * Sinon en cas d'erreur serveur:
     *      7. Afficher l'erreur dans la console pour le développement.
     *      8. Renvoyer une réponse avec un message d'erreur et un statut 500 pour indiquer une erreur serveur.
     * 
     * @desc Mettre à jour les informations d'un produit existant (réservé aux administrateurs).
     * @route PUT /api/products/edit-product/:id
     * @access Administrateur authentifié
     */

    try {
        // On recupere les donnees du produit a partir de req.body.
        const { name, description, price, category, brand, countInStock, images } = req.body;

        // Trouver le produit par son ID et mettre à jour les champs avec les nouvelles données.
        const product = await Product.findById(req.params.id);
        if (product) {
            // Mettre à jour les champs du produit.
            product.name = name || product.name;
            product.description = description || product.description;
            product.price = price || product.price;
            product.category = category || product.category;
            product.brand = brand || product.brand;
            product.countInStock = countInStock || product.countInStock;
            product.images = images;

            // Enregistrer le produit mis à jour dans la base de données MongoDB.
            const updatedProduct = await product.save()

            // Renvoyer une réponse avec un message de succès et les détails du produit mis à jour.
            res.status(200).json({ message: "Product updated successfully", product: updatedProduct });
        } else {
            // Si le produit n'est pas trouvé, renvoyer une réponse avec un message d'erreur et un status 404.
            res.status(404).json({ message: "Product not found!" });
        }    
        
    } catch (error) {
        // Afficher l'erreur dans la console pour le développement.
        // Renvoyer une réponse avec un message d'erreur et un status 500 pour indiquer une erreur serveur.
        console.error("Error while updating product:", error);
        res.status(500).json({ message: "Error while updating product", error: error.message });
    }
}

const deleteProduct = async (req, res) => {
    /**
     * Fonction pour supprimer un produit par son ID (réservée aux administrateurs).
     * 
     * Étapes :
     * Tout d'abord essayer:
     *      1. Rechercher le produit par son ID dans la base de données.
     * 
     * Si le produit est trouvé:
     *      2. Supprimer le produit de la base de données MongoDB.
     *      3. Renvoyer une réponse avec un message de succès et un statut 200 pour indiquer que le produit a été supprimé avec succès.
     * 
     * Sinon, si le produit n'est pas trouvé:
     *      4. Renvoyer une erreur 404 avec un message indiquant que le produit n'a pas été trouvé.
     * 
     * Sinon en cas d'erreur serveur:
     *      5. Afficher l'erreur dans la console pour le développement.
     *      6. Renvoyer une réponse avec un message d'erreur et un statut 500 pour indiquer une erreur serveur.
     * 
     * @desc Supprimer un produit de la boutique de manière permanente (réservé aux administrateurs).
     * @route DELETE /api/products/:id
     * @access Administrateur authentifié
     */

    try {
        // Trouver un produit par son ID
        const product = await Product.findById(req.params.id);
        if (product) {
            // Supprimer le produit de la base de données MongoDB
            await product.deleteOne();

            // Renvoyer une réponse avec un message de succès et un status 200.
            res.status(200).json({ message: "Product deleted successfully!" });
        } else {
            // Si le produit n'est pas trouvé, renvoyer une réponse avec un message d'erreur et un status 404.
            res.status(404).json({ message: "Product not found!" });
        }

    } catch (error) {
        // Afficher l'erreur dans la console pour le développement.
        // Renvoyer une réponse avec un message d'erreur et un status 500 pour indiquer une erreur serveur.
        console.error("Error while deleting product:", error);
        res.status(500).json({ message: "Error while deleting product", error: error.message });
    }
}

const createProductReview = async (req, res) => {
    /**
     * Fonction pour ajouter un avis ou une évaluation à un produit existant.
     * 
     * Étapes :
     * Tout d'abord essayer:
     *      1. Récupérer les données de l'avis à partir de req.body (rating et comment).
     *      2. Rechercher un produit par son ID dans la base de données.
     * 
     * Si le produit n'existe pas:
     *      3. Renvoyer une erreur 404 avec un message indiquant que le produit n'a pas été trouvé.
     * 
     * Sinon, si le produit est trouvé:
     *      4. Vérifier si l'utilisateur a déjà laissé un avis pour ce produit en recherchant dans le tableau des avis du produit.
     * 
     * Si l'utilisateur a déjà laissé un avis:
     *      5. Renvoyer une erreur 400 avec un message indiquant que l'utilisateur a déjà laissé un avis.
     * 
     * Sinon, si l'utilisateur n'a pas encore laissé d'avis:
     *      6. Créer un nouvel objet d'avis avec les données reçues dans req.body (rating, comment) et les informations de l'utilisateur connecté (name, user ID).
     *      7. Ajouter l'avis au tableau des avis du produit.
     *      8. Mettre à jour le nombre total d'avis (numReviews).
     *      9. Calculer la note moyenne du produit en fonction de tous les avis.
     *      10. Enregistrer le produit mis à jour dans la base de données MongoDB.
     *      11. Renvoyer une réponse avec un message de succès et un statut 201 pour indiquer que l'avis a été ajouté avec succès.
     * 
     * Sinon en cas d'erreur serveur:
     *      12. Afficher l'erreur dans la console pour le développement.
     *      13. Renvoyer une réponse avec un message d'erreur et un statut 500 pour indiquer une erreur serveur.
     * 
     * @desc Ajouter une nouvelle critique ou évaluation à un produit (utilisateur authentifié).
     * @route POST /api/products/:id/reviews
     * @access Utilisateur authentifié
     */
    
    try {
        // On recupere les donnees de l'avis a partir de req.body.
        const { rating, comment } = req.body

        // trouver un produit par son id.
        const product = await Product.findById(req.params.id)

        if (!product) { 
            // Si le produit n'est pas trouver, on affiche une erreur.
            res.status(404).json({ message: 'Product not found !'})
        } 

        // On verifie si l'utilisateur a deja laissé un avis pour ce produit.
        const alreadyReviewed = product.reviews.find(r => r.user.toString() === req.user.id.toString())
        if (alreadyReviewed) {
            // Si l'utilisateur a déjà laissé un avis, on affiche une erreur.
            res.status(400).json({ message: 'You have already reviewed this product !'})
        }

        // On cree un nouvel avis avec les donnees recu dans req.body et les informations de l'utilisateur connecté.
        const review = {
            name: req.user.firstName + ' ' + req.user.lastName || 'Client',
            rating: Number(rating),
            comment,
            user: req.user.id
        }

        // On ajoute l'avis au tableau des avis du produit
        // On met à jour le nombre total d'avis 
        // On calcul la note moyenne du produit
        product.reviews.push(review)
        product.numReviews = product.reviews.length
        product.rating = product.reviews.reduce((acc, item) => item.rating + acc, 0) / product.reviews.length

        // On enregistre le produit mis à jour dans la base de données MongoDB.
        await product.save()

        // On renvoie le resultat de la requette et on affiche un message de succession.
        res.status(201).json({ message: 'Review added successfully !' })

    } catch (error) {
        // Afficher l'erreur dans la console pour le développement.
        // Renvoyer une réponse avec un message d'erreur et un status 500 pour indiquer une erreur serveur.
        console.error("Error while creating product review", error);
        res.status(500).json({ message: 'Error while creating product review', error: error.message })
    }
}


const getCategories = async (req, res) => {
    /**
     * Fonction pour récupérer la liste de toutes les catégories de produits disponibles.
     * 
     * Étapes :
     * Tout d'abord essayer:
     *      1. Récupérer directement les valeurs des catégories depuis le schéma du modèle Product (champ 'category').
     * 
     * Si les catégories existent:
     *      2. Renvoyer le tableau des catégories avec un statut 200.
     * 
     * Sinon, si les catégories n'existent pas:
     *      3. Renvoyer une erreur 404 avec un message indiquant que les catégories n'ont pas été trouvées.
     * 
     * Sinon en cas d'erreur serveur:
     *      4. Afficher l'erreur dans la console pour le développement.
     *      5. Renvoyer une réponse avec un message d'erreur et un statut 500 pour indiquer une erreur serveur.
     * 
     * @desc Récupérer la liste de toutes les catégories de produits définies dans le système.
     * @route GET /api/categories
     * @access Public (accessible à tous)
     */
    try {
        // On récupère directement les valeurs depuis le schéma du modèle Product
        const categories = await Product.schema.path('category').enumValues;
        
        if (!categories) {
            return res.status(404).json({ message: "Catégories non trouvées" });
        }
        
        res.status(200).json(categories);
    } catch (error) {
        console.error("Erreur catégories:", error);
        res.status(500).json({ message: "Erreur serveur lors de la récupération des catégories" });
    }
};




// On exporte les fonctions pour les utiliser dans les routes.
module.exports = {
    createProduct,
    getAllProducts,
    getProductById,
    updateProduct,
    deleteProduct,
    createProductReview,
    getCategories
}
