const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { 
  uploadImage, 
  deleteImage, 
  mejorarImagen, 
  getUserImages,
  mejorarResolucion,
  mejorarCombinada,
  getAvailableModels
} = require('../controllers/imageController');
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
    fileSize: 50 * 1024 * 1024 // Límite de 50MB
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

// Middleware para manejar errores de Multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        message: 'El archivo es demasiado grande. El tamaño máximo permitido es 50MB.' 
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ 
        message: 'Demasiados archivos. Solo se permite un archivo a la vez.' 
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ 
        message: 'Campo de archivo inesperado.' 
      });
    }
  }
  if (err.message === 'Solo se permiten imágenes (jpeg, jpg, png)') {
    return res.status(400).json({ message: err.message });
  }
  next(err);
};

// Rutas para imágenes
router.post('/upload', authenticateToken, upload.single('image'), handleMulterError, uploadImage);
router.get('/', authenticateToken, getUserImages);
router.delete('/:imageId', authenticateToken, deleteImage);
router.post('/:imageId/mejorar', authenticateToken, mejorarImagen);

// Nuevas rutas para Real-ESRGAN
router.post('/:imageId/enhance', authenticateToken, mejorarResolucion);
router.post('/:imageId/enhance-combined', authenticateToken, mejorarCombinada);
router.get('/models', authenticateToken, getAvailableModels);

module.exports = router; 