const { getPool } = require("../config/database");
const path = require("path");
const fs = require("fs").promises;

const requestAdmin = async (req, res) => {
  try {
    const { reason } = req.body;
    const userId = req.user.id; // From JWT token

    // Verificar si ya existe una solicitud pendiente
    const pool = await getPool();
    const [existingRequests] = await pool.execute(
      'SELECT * FROM SolicitudAdmin WHERE usuario_id = ? AND estado = "pendiente"',
      [userId]
    );

    if (existingRequests.length > 0) {
      return res
        .status(400)
        .json({ message: "Ya tienes una solicitud pendiente" });
    }

    // Crear nueva solicitud
    await pool.execute(
      'INSERT INTO SolicitudAdmin (id_usuario, razon, estado) VALUES (?, ?, "pendiente")',
      [userId, reason]
    );

    res.status(201).json({ message: "Solicitud enviada exitosamente" });
  } catch (error) {
    console.error("Error en solicitud de admin:", error);
    res.status(500).json({ message: "Error al procesar la solicitud" });
  }
};

const getProfile = async (req, res) => {
  try {
    const userId = req.user.id; // Obtenido del middleware de autenticación
    const pool = await getPool();

    const [users] = await pool.execute(
      "SELECT id_usuario, nombre, correo, rol, foto_perfil FROM Usuario WHERE id_usuario = ?",
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    res.json(users[0]);
  } catch (error) {
    console.error("Error al obtener perfil:", error);
    res.status(500).json({ message: "Error al obtener el perfil" });
  }
};

const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { nombre, correo } = req.body;
    const pool = await getPool();

    // Verificar si el correo ya está en uso por otro usuario
    const [existingUsers] = await pool.execute(
      "SELECT id_usuario FROM Usuario WHERE correo = ? AND id_usuario != ?",
      [correo, userId]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ message: "El correo ya está en uso" });
    }

    await pool.execute(
      "UPDATE Usuario SET nombre = ?, correo = ? WHERE id_usuario = ?",
      [nombre, correo, userId]
    );

    res.json({ message: "Perfil actualizado correctamente" });
  } catch (error) {
    console.error("Error al actualizar perfil:", error);
    res.status(500).json({ message: "Error al actualizar el perfil" });
  }
};

const updateProfilePhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ message: "No se ha proporcionado ninguna imagen" });
    }

    const userId = req.user.id;
    const photoPath = `/uploads/profile/${req.file.filename}`;
    const pool = await getPool();

    await pool.execute(
      "UPDATE Usuario SET foto_perfil = ? WHERE id_usuario = ?",
      [photoPath, userId]
    );

    res.json({
      message: "Foto de perfil actualizada correctamente",
      photoUrl: photoPath,
    });
  } catch (error) {
    console.error("Error al actualizar foto de perfil:", error);
    res.status(500).json({ message: "Error al actualizar la foto de perfil" });
  }
};

const getUserImages = async (req, res) => {
  try {
    const userId = req.user.id;
    const pool = await getPool();

    // Obtener imágenes originales
    const [originalImages] = await pool.execute(
      `SELECT id_imagen, usuario_id, nombre_archivo, url_original, fecha_subida, 'original' as tipo
       FROM Imagenes 
       WHERE usuario_id = ?
       ORDER BY fecha_subida DESC`,
      [userId]
    );

    // Obtener imágenes procesadas
    const [processedImages] = await pool.execute(
      `SELECT i.id_imagen, i.id_usuario, i.ruta_imagen, i.fecha_subida, i.estado, r.porcentaje_precision, r.ruta_resultado, 'procesada' as tipo
       FROM Imagen i 
       LEFT JOIN Resultado r ON i.id_resultado = r.id_resultado 
       WHERE i.id_usuario = ?
       ORDER BY i.fecha_subida DESC`,
      [userId]
    );

    // Combinar y organizar las imágenes
    const allImages = [...originalImages];
    
    // Agregar información de procesamiento a las imágenes originales si existe
    processedImages.forEach(processed => {
      const originalIndex = allImages.findIndex(orig => 
        // Para relacionar, usaremos la fecha o algún identificador común
        // Por ahora, agregaremos las procesadas como imágenes separadas
        false
      );
      
      // Agregar como imagen separada si no se encuentra relación
      allImages.push(processed);
    });

    res.json(allImages);
  } catch (error) {
    console.error("Error al obtener imágenes:", error);
    res.status(500).json({ message: "Error al obtener las imágenes" });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const pool = await getPool();
    const [users] = await pool.execute(
      "SELECT id_usuario, nombre, correo, rol, fecha_registro FROM Usuario ORDER BY fecha_registro DESC"
    );

    res.json(users);
  } catch (error) {
    console.error("Error al obtener lista de usuarios:", error);
    res.status(500).json({ message: "Error al obtener la lista de usuarios" });
  }
};

//notificaciones
const getUserNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const pool = await getPool();

    const [notifications] = await pool.execute(
      `SELECT * FROM Notificaciones WHERE usuario_id = ? ORDER BY fecha DESC`,
      [userId]
    );

    res.json(notifications);
  } catch (error) {
    console.error("Error al obtener notificaciones:", error);
    res.status(500).json({ message: "Error al obtener notificaciones" });
  }
};

module.exports = {
  requestAdmin,
  getProfile,
  updateProfile,
  updateProfilePhoto,
  getUserImages,
  getAllUsers,
  getUserNotifications,
};
