const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'tu_clave_secreta_temporal';

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Token no proporcionado' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Obtener información actualizada del usuario
    const [users] = await pool.execute(
      'SELECT id_usuario, nombre, correo, rol FROM Usuario WHERE id_usuario = ?',
      [decoded.userId]
    );

    if (users.length === 0) {
      return res.status(401).json({ message: 'Usuario no encontrado' });
    }

    const user = users[0];
    req.user = {
      userId: user.id_usuario,
      nombre: user.nombre,
      correo: user.correo,
      rol: user.rol
    };

    next();
  } catch (error) {
    console.error('Error de autenticación:', error);
    return res.status(403).json({ message: 'Token inválido o expirado' });
  }
};

// Middleware para verificar si el usuario es admin o superadmin
const isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Usuario no autenticado' });
  }
  
  if (req.user.rol !== 'admin' && req.user.rol !== 'superadmin') {
    return res.status(403).json({ message: 'No tienes permisos para realizar esta acción' });
  }
  
  next();
};

// Middleware para verificar si el usuario es superadmin
const isSuperAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Usuario no autenticado' });
  }

  if (req.user.correo !== 'rmontufarm@unamad.edu.pe' || req.user.rol !== 'superadmin') {
    return res.status(403).json({ message: 'Esta acción solo puede ser realizada por el superadministrador' });
  }

  next();
};

// Verificar que las funciones existen antes de exportarlas
if (!authenticateToken || !isAdmin || !isSuperAdmin) {
  throw new Error('Middlewares de autenticación no definidos correctamente');
}

module.exports = {
  authenticateToken,
  isAdmin,
  isSuperAdmin,
  JWT_SECRET
}; 