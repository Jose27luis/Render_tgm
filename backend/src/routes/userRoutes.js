const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const UserController = require('../controllers/userController');
const { authenticateToken } = require('../middlewares/auth');

// Configuración de multer para subida de fotos de perfil
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/profile/'); // Directorio para fotos de perfil
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 2 * 1024 * 1024 // Límite de 2MB para fotos de perfil
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

// Rutas protegidas - requieren autenticación
router.get('/profile', authenticateToken, (req, res) => UserController.getProfile(req, res));
router.put('/profile', authenticateToken, (req, res) => UserController.updateProfile(req, res));
router.get('/images', authenticateToken, (req, res) => UserController.getUserImages(req, res));
router.post('/profile/photo', authenticateToken, upload.single('photo'), (req, res) => UserController.updateProfilePhoto(req, res));

module.exports = router; 