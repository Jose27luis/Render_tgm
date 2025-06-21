const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const {
  getFriends,
  searchUsers,
  getFriendRequests,
  sendFriendRequest,
  respondToFriendRequest,
  rejectFriendRequest,
} = require("../controllers/friendController");
const {
  requestAdmin,
  getProfile,
  updateProfile,
  updateProfilePhoto,
  getUserImages,
  getAllUsers,
  getUserNotifications,
} = require("../controllers/userController");
const authMiddleware = require("../middleware/authMiddleware");
const { authenticateToken } = require("../middlewares/auth");

// Configuración de multer para subida de archivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../../uploads/profile"));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max
  },
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("Solo se permiten imágenes (jpeg, jpg, png)"));
  },
});

// Rutas protegidas - requieren autenticación
router.use(authMiddleware);

// Rutas de perfil y usuario
router.get("/profile", getProfile);
router.put("/profile", updateProfile);
router.get("/images", getUserImages);
router.get("/list", getAllUsers);
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

router.post("/profile/photo", upload.single("photo"), handleMulterError, updateProfilePhoto);
router.post("/requestadmin", requestAdmin);
// Ruta para obtener notificaciones del usuario
router.get("/notificaciones", authenticateToken, getUserNotifications);
//ruta de los amigos
router.get("/amigos", getFriends);
//ruta para enviar las solicitudes
router.post("/solicitudes", sendFriendRequest);
//ruta para ver las soliciturdes
router.get("/misSolicitudes", getFriendRequests);
//ruta para eliminar las solicitudes
router.delete("/eliminarSolicitudes/:id", rejectFriendRequest);
//rita para aceptar las solicitudes
router.put("/aceptarSolicitudes/:id", respondToFriendRequest);
//ruta para buscar personas
router.get("/buscarPersonas", searchUsers);

module.exports = router;
