const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();

// Configuration du stockage
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, 'uploads/'); 
  },
  filename(req, file, cb) {
    cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({ storage });

// Route pour uploader une seule image
router.post('/', upload.single('image'), (req, res) => {
  res.send(`/${req.file.path.replace(/\\/g, "/")}`); // Renvoie l'URL propre
});

module.exports = router;
