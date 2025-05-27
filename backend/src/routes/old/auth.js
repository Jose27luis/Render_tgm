const express = require("express");
const router = express.Router();
const { registrarUsuario, iniciarSesion } = require("../controllers/authController");
const { verificarToken } = require("../middlewares/verifyToken");


router.post("/register", registrarUsuario);
router.post("/login",iniciarSesion);
router.get("/perfil", verificarToken,(req, res) =>{
    res.json({
        mensaje:"bienvenido",
        usuario:req.user
    });
});
console.log("auth.js cargador correctamente");
module.exports = router;
