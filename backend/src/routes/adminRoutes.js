const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const {
  authenticateToken,
  isAdmin,
  isSuperAdmin,
} = require("../middlewares/auth");
const {
  getPendingAdminRequests,
  handleAdminRequest,
  getAdminList,
  removeAdmin,
  createAdminRequest,
  getAllFriendRequests,
  acceptFriendRequest,
  rejectFriendRequest,
  getUsersList,
  getUserDetails,
} = require("../controllers/adminController");

// Todas las rutas requieren autenticación
router.use(authenticateToken);
//ruta para las solicitudes de admin
router.post("/request", adminController.createAdminRequest);
router.get("/requests", isAdmin, getAllFriendRequests);
router.post("/requests/:id/accept", isAdmin, acceptFriendRequest);
router.post("/requests/:id/reject", isAdmin, rejectFriendRequest);
//ruta para las solicitudes pendientes
router.get("/pending", isAdmin, getPendingAdminRequests);

//ruta para aceptar o rechazar solicitudes
router.put("/handle", isAdmin, handleAdminRequest);
router.get("/list", isAdmin, getAdminList);
router.delete("/remove/:id", isAdmin, removeAdmin);

// Rutas de administración
router.get("/users", adminController.getUsersList);
router.get("/users/:userId", adminController.getUserDetails);

module.exports = router;
