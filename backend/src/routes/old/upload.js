const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const db = require("../models/db");
const {soloAdmin} = require("../middlewares/verifyToken");
const { verificarToken } = require("../middlewares/verifyToken");

const router = express.Router();

//vamos a configurar el almacenamiento

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "uploads/";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const nombre = Date.now() + path.extname(file.originalname);
    cb(null, nombre);
  },
});

const upload = multer({ storage });

//rutta para subir la imagen
router.post("/upload", verificarToken, upload.single("imagen"), (req, res) => {
  if (!req.file) return res.status(400).send("nose subio la imagen");
  //aqui vamos a llamar al scrip de procesamiento mbllen en python
  //ejm enviar ruta req.file.path al script
  //ruta para guardar la imagen 
      db.query(
        'INSERT INTO imagenes (usuario_id, nombre_archivo) VALUES (?, ?)',
        [req.user.id, req.file.filename],
        (err) =>{
          if (err) return res.status(500).send('error al guardar la imagen en la base de datos');
          res.status(200).json({
            mensaje:"imagen subida y registrada correctamente",
            archivo:req.file.filename,
            ruta: req.file.path
          });
        }
      );

  res.status(200).json({
    mensaje: "imagen subida exitosamente",
    archivo: req.file.filename,
    ruta: req.file.path,
  });
});
//agregamos una ruta para guardar las imagenes
router.get('/mis-imagenes', verificarToken, (req, res)=>{
  const userId = req.user.id;

  db.query(
    'SELECT nombre_archivo, fecha_subida FROM imagenes WHERE usuario_id = ?',
    [userId],
    (err, results) =>{
      if (err) return res.status(500).send(err.message);
      res.json(results);
    }
  );
});
//hacemos una ruta para guardar las imagenes de admin
router.get('/admin/imagenes', verificarToken, soloAdmin, (req, res)=>{
  db.query(
    'SELECT imagenes.id, usuarios.nombre, imagenes.nombre_archivo, imagenes.fecha_subida FROM imagenes JOIN usuarios ON imagenes.usuarios.id = usuarios.id',
    (err, results) =>{
      if (err) return res.status(200).send(err.message);
      res.json(results);
    }
  );
});

module.exports = router;
