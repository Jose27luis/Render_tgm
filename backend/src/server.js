const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const imageRoutes = require('./routes/imageRoutes');
const healthRoutes = require('./routes/healthRoutes');
const adminRequestRoutes = require('./routes/adminRequestRoutes');
const { testConnection } = require('./config/database');

const app = express();

// Configuración unificada de CORS
app.use(cors({
  origin: "http://localhost:5173",
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/admin', adminRequestRoutes);

// Ruta de prueba
app.get('/api/test', (req, res) => {
  res.json({ message: 'API funcionando correctamente' });
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Ha ocurrido un error en el servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// Ruta para manejar rutas no encontradas
app.use((req, res) => {
  res.status(404).json({ message: 'Ruta no encontrada' });
});

// Iniciar el servidor y probar la conexión a la base de datos
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Crear directorios necesarios si no existen
    const dirs = [
      path.join(__dirname, '../uploads/images'),
      path.join(__dirname, '../uploads/profile'),
      path.join(__dirname, '../uploads/results')
    ];
    
    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });

    // Probar la conexión a la base de datos antes de iniciar el servidor
    await testConnection();
    
    app.listen(PORT, "0.0.0.0" , () => {
      console.log(`Servidor corriendo en el puerto ${PORT}`);
    });
  } catch (error) {
    console.error('Error al iniciar el servidor:', error.message);
    process.exit(1);
  }
};

startServer(); 