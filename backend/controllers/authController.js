const db = require("../models/db");
//para el registro
const bcrypt = require("bcrypt");
//para el login
const jwt = require("jsonwebtoken");

//registrar usuarios
const registrarUsuario = async (req, res) => {
  const { nombre, correo, contrasena, rol } = req.body;

  try {
    db.query(
      "SELECT * FROM usuarios WHERE correo = ?",
      [correo],
      async (err, results) => {
        if (err) return res.status(500).send(err.message);
        if (results.length > 0)
          return res.status(400).send("el correo ya esta registrado");

        //ciframos la constraseña
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(contrasena, salt);

        //insertar usuairo
        db.query(
          "INSERT INTO usuarios (nombre, correo, contrasena, rol) VALUES (?,?,?,?)",
          [nombre, correo, hash, rol || "usuario"],
          (err, result) => {
            if (err) return res.status(500).send(err.message);
            res.status(201).send("usuario registrado con exito");
          }
        );
      }
    );
  } catch (error) {
    res.status(500).send("Error al registrar usuario");
  }
};
//iniciar sesion
const iniciarSesion = (req, res) => {
  const { correo, contrasena } = req.body;

  db.query(
    "SELECT * FROM usuarios WHERE correo = ?",
    [correo],
    async (err, results) => {
      if (err) return res.status(500).send(err.message);
      if (results.length === 0)
        return res.status(401).send("correo no encontrado");

      const usuario = results[0];
      const match = await bcrypt.compare(contrasena, usuario.contrasena);

      if (!match) return res.status(401).send("contrasena incorrecta");

      const token = jwt.sign(
        {
          id: usuario.id,
          rol: usuario.rol,
        },
        process.env.JWT_SECRET,
        {
          expiresIn: process.env.JWT_EXPIRES,
        }
      );

      res.json({
        mensaje: "inicio de sesion exitoso",
        token,
        usuario: {
          id: usuario.id,
          nombre: usuario.nombre,
          correo: usuario.correo,
          rol: usuario.rol,
        },
      });
    }
  );
};
module.exports = { registrarUsuario, iniciarSesion };
