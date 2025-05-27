const express = require("express");
const router = express.Router();
const db = require("../models/db");
const { verificarToken, soloAdmin } = require("../middlewares/verifyToken");

router.get("/usuarios", verificarToken, soloAdmin, (req, res) => {
  db.query("SELECT id, nombre, correo, rol FROM usuarios", (err, results) => {
    if (err) return res.status(500).send(err.message);
    res.json(results);
  });
});


module.exports = router;
