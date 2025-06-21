const jwt = require("jsonwebtoken");
const { getPool } = require("../config/database");

const JWT_SECRET = process.env.JWT_SECRET || "tu_clave_secreta_temporal";

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Token no proporcionado" });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const pool = await getPool();

    // Obtener información actualizada del usuario usando 'id' del token
    const [users] = await pool.execute(
      "SELECT id_usuario, nombre, correo, rol FROM Usuario WHERE id_usuario = ?",
      [decoded.id]
    );

    if (users.length === 0) {
      return res.status(401).json({ message: "Usuario no encontrado" });
    }

    const user = users[0];
    req.user = {
      id: user.id_usuario,
      nombre: user.nombre,
      correo: user.correo,
      rol: user.rol,
    };

    next();
  } catch (error) {
    console.error("Error de autenticación:", error);
    if (error.name === "JsonWebTokenError") {
      return res.status(403).json({ message: "Token inválido" });
    } else if (error.name === "TokenExpiredError") {
      return res.status(403).json({ message: "Token expirado" });
    }
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};

// Middleware para verificar si el usuario es admin o superadmin
const isAdmin = (req, res, next) => {
    console.log('Usuario autenticado:', req.user);
  if (!req.user) {
    return res.status(401).json({ message: "Usuario no autenticado" });
  }

  if (req.user.rol !== "admin" && req.user.rol !== "superusuario") {
    return res
      .status(403)
      .json({ message: "No tienes permisos para realizar esta acción" });
  }

  next();
};

// Middleware para verificar si el usuario es superadmin
const isSuperAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Usuario no autenticado" });
  }

  if (
    req.user.correo !== "jtecoluisgarciajoae@gmail.com" ||
    req.user.rol !== "superusuario"
  ) {
    return res
      .status(403)
      .json({
        message:
          "Esta acción solo puede ser realizada por el superadministrador",
      });
  }

  next();
};

// Verificar que las funciones existen antes de exportarlas
if (!authenticateToken || !isAdmin || !isSuperAdmin) {
  throw new Error("Middlewares de autenticación no definidos correctamente");
}

module.exports = {
  authenticateToken,
  isAdmin,
  isSuperAdmin,
  JWT_SECRET,
};
