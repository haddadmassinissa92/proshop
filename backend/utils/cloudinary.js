// utils/cloudinary.js
//
// Petit helper pour envoyer les images uploadées (produits, catégories,
// avatars) vers Cloudinary plutôt que sur le disque du serveur. Nécessaire
// car le disque de la plupart des hébergeurs (Render, Railway...) est
// effacé à chaque redéploiement — les images stockées localement
// disparaîtraient à la prochaine mise à jour du code.
//
// Compte gratuit sur https://cloudinary.com — voir .env.example pour les
// 3 variables à récupérer sur le dashboard ("Product Environment
// Credentials" sur la page d'accueil du dashboard).

const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Envoie un buffer d'image (req.file.buffer fourni par Multer en mode
// memoryStorage — voir middlewares/multer.config.js) vers Cloudinary, et
// renvoie l'URL sécurisée (https) de l'image hébergée.
//
// @param {Buffer} buffer - le contenu du fichier image
// @param {string} folder - sous-dossier Cloudinary pour ranger l'image
//                           (ex: 'proshop/products', 'proshop/avatars')
// @returns {Promise<string>} l'URL https de l'image uploadée
const uploadImageBuffer = (buffer, folder = 'proshop') => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            { folder, resource_type: 'image' },
            (error, result) => {
                if (error) return reject(error);
                resolve(result.secure_url);
            }
        );
        uploadStream.end(buffer);
    });
};

module.exports = { cloudinary, uploadImageBuffer };
