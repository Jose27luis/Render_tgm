const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const { testConnection } = require('./config/database');
const setupDatabase = require('./config/setupDatabase');

const app = express();

// Configuración de CORS simple para desarrollo
app.use(cors({
  origin: true, // Permite todos los orígenes
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

// Middleware adicional para asegurar los headers CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin);
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  next();
});

// Middleware para parsear JSON y urlencoded
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging con Morgan
app.use(morgan('dev'));

// Directorio para archivos estáticos
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Rutas
app.use('/api/health', require('./routes/healthRoutes'));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/images', require('./routes/imageRoutes'));
app.use('/api/friends', require('./routes/friendRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// Ruta de prueba para verificar que el servidor está funcionando
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Manejador de errores global mejorado
app.use((err, req, res, next) => {
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    code: err.code,
    sqlMessage: err.sqlMessage
  });

  // Determinar el código de estado HTTP apropiado
  let statusCode = 500;
  if (err.code === 'ER_NO_SUCH_TABLE') statusCode = 503; // Servicio no disponible
  else if (err.code === 'ER_ACCESS_DENIED_ERROR') statusCode = 401; // No autorizado
  else if (err.code === 'ER_BAD_DB_ERROR') statusCode = 503; // Servicio no disponible
  else if (err.code === 'ER_DUP_ENTRY') statusCode = 409; // Conflicto

  res.status(statusCode).json({
    status: 'error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Error interno del servidor',
    code: err.code,
    sqlMessage: process.env.NODE_ENV === 'development' ? err.sqlMessage : undefined,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Inicialización de la base de datos y servidor
const initializeApp = async () => {
  try {
    // Probar la conexión a la base de datos
    await testConnection();
    console.log('✓ Conexión a la base de datos verificada');

    // Configurar la base de datos
    await setupDatabase();
    console.log('✓ Base de datos configurada correctamente');

  } catch (error) {
    console.error('Error durante la inicialización:', error);
    process.exit(1);
  }
};

// Ejecutar la inicialización
initializeApp();

module.exports = app; 