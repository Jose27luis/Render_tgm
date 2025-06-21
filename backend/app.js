// para el backend
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const { pool, testConnection } = require("./src/config/database");
const { initializeDatabase } = require("./src/config/initDb");
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

// Inicializar la base de datos y arrancar el servidor
async function startServer() {
  try {
    // Probar la conexión a la base de datos
    await testConnection();
    
    // Inicializar la base de datos
    await initializeDatabase();
    
    // Arrancar el servidor
    app.listen(PORT, () => {
      console.log(`El servidor está corriendo en http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Error al iniciar el servidor:', error);
    process.exit(1);
  }
}

// Ejemplo de ruta usando el pool de conexiones
app.get("/usuarios", async (req, res) => {
  try {
    const [results] = await pool.query("SELECT * FROM Usuario");
    res.json(results);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Iniciar el servidor
startServer();
