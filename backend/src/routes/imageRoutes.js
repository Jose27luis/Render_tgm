const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { uploadImage, getImageResults, deleteImage } = require('../controllers/imageController');
const { authenticateToken } = require('../middlewares/auth');

// Configuración de multer para subida de archivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/images/'); // Asegúrate de que este directorio exista
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // Límite de 5MB
  },
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Solo se permiten imágenes (jpeg, jpg, png)'));
  }
});

// Rutas para imágenes
router.post('/upload', authenticateToken, upload.single('image'), uploadImage);
router.get('/:imageId/results', authenticateToken, getImageResults);
router.delete('/:imageId', authenticateToken, deleteImage);

module.exports = router; 