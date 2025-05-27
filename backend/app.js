// para el backend
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const db = require("./models/db");
const adminRoutes = require("./routes/admin");
require("dotenv").config();

//ruta del procesamiento
const uploadRoutes = require("./routes/upload");

//ruta del registro
const authRoutes = require("./routes/auth");

const app = express();
const PORT = process.env.PORT || 3000;

//los middlewares
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

//RUTA REGISTRO
app.use("/api", authRoutes);
//RUTA ADMIN
app.use("/api", adminRoutes);
//RUTA PROCESAMIENTO
app.use("/api", uploadRoutes);
//exponer las imagenes publicamente
app.use('/uploads', express.static('uploads'));

//rutas
app.get("/", (req, res) => {
  res.send("servidor backend activo");
});
//arrancamos el servidor
app.listen(PORT, () => {
  console.log(`el servidor esta corriendo en http://localhost:${PORT}`);
});

app.get("/usuarios", (req, res) => {
  db.query("SELECT * FROM usuarios", (err, results) => {
    if (err) return res.status(500).send(err.message);
    res.json(results);
  });
});
