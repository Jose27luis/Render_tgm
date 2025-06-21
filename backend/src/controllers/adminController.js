const { getPool } = require("../config/database");

const getUsersList = async (req, res) => {
  try {
    // Verificar si el usuario es superadmin
    if (req.user.rol !== "superusuario") {
      return res.status(403).json({ message: "Acceso denegado" });
    }

    const pool = await getPool();
    const [users] = await pool.execute(`
            SELECT 
                id_usuario,
                nombre,
                correo,
                rol,
                foto_perfil,
                fecha_registro,
                (SELECT COUNT(*) FROM Amigos WHERE (usuario_id = u.id_usuario OR amigo_id = u.id_usuario) AND estado = 'aceptado') as num_amigos,
                (SELECT COUNT(*) FROM Imagen WHERE id_usuario = u.id_usuario) as num_imagenes
            FROM Usuario u
            ORDER BY fecha_registro DESC
        `);

    res.json(users);
  } catch (error) {
    console.error("Error al obtener lista de usuarios:", error);
    res.status(500).json({ message: "Error al obtener la lista de usuarios" });
  }
};

const getUserDetails = async (req, res) => {
  try {
    // Verificar si el usuario es superadmin
    if (req.user.rol !== "superusuario") {
      return res.status(403).json({ message: "Acceso denegado" });
    }

    const { userId } = req.params;
    const pool = await getPool();

    // Obtener detalles del usuario
    const [users] = await pool.execute(
      `
            SELECT 
                u.*,
                (SELECT COUNT(*) FROM Amigos WHERE (usuario_id = u.id_usuario OR amigo_id = u.id_usuario) AND estado = 'aceptado') as num_amigos,
                (SELECT COUNT(*) FROM Imagen WHERE id_usuario = u.id_usuario) as num_imagenes
            FROM Usuario u
            WHERE u.id_usuario = ?
        `,
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    const user = users[0];

    // Obtener las últimas imágenes del usuario
    const [images] = await pool.execute(
      `
            SELECT i.*, r.porcentaje_precision
            FROM Imagen i
            LEFT JOIN Resultado r ON i.id_resultado = r.id_resultado
            WHERE i.id_usuario = ?
            ORDER BY i.fecha_subida DESC
            LIMIT 5
        `,
      [userId]
    );

    // Obtener los amigos del usuario
    const [friends] = await pool.execute(
      `
            SELECT u.id_usuario, u.nombre, u.foto_perfil, a.fecha_solicitud
            FROM Amigos a
            JOIN Usuario u ON (a.amigo_id = u.id_usuario)
            WHERE a.usuario_id = ? AND a.estado = 'aceptado'
            UNION
            SELECT u.id_usuario, u.nombre, u.foto_perfil, a.fecha_solicitud
            FROM Amigos a
            JOIN Usuario u ON (a.usuario_id = u.id_usuario)
            WHERE a.amigo_id = ? AND a.estado = 'aceptado'
            ORDER BY fecha_solicitud DESC
            LIMIT 5
        `,
      [userId, userId]
    );

    res.json({
      ...user,
      images,
      friends,
    });
  } catch (error) {
    console.error("Error al obtener detalles del usuario:", error);
    res
      .status(500)
      .json({ message: "Error al obtener los detalles del usuario" });
  }
};

//para validar admin
const createAdminRequest = async (req, res) => {
  try {
    const { reason } = req.body;
    const userId = req.user.id;

    if (!reason || reason.trim() === "") {
      return res.status(400).json({ message: "La razón es obligatoria" });
    }
    // Insertar solicitud
    const pool = await getPool();
    await pool.execute(
      `
      INSERT INTO SolicitudAdmin (usuario_id, razon)
      VALUES (?, ?)
    `,
      [userId, reason]
    );

    res.json({ message: "Solicitud enviada correctamente" });
  } catch (error) {
    console.error("Error al crear la solicitud:", error);
    res.status(500).json({ message: "Error al enviar solicitud" });
  }
};
//agregar
const getAllFriendRequests = async (req, res) => {
  try {
    const pool = await getPool();

    const [requests] = await pool.execute(`
      SELECT 
        a.id_amistad AS id_solicitud,
        u.nombre AS nombre_solicitante,
        u.correo AS correo_solicitante,
        u.id_usuario AS id_usuario_solicitante,
        u.foto_perfil,
        a.fecha_solicitud
      FROM Amigos a
      JOIN Usuario u ON a.usuario_id = u.id_usuario
      WHERE a.estado = 'pendiente'
      ORDER BY a.fecha_solicitud DESC
    `);

    res.json(requests);
  } catch (error) {
    console.error("❌ Error al obtener solicitudes globales:", error);
    res.status(500).json({ message: "Error al obtener solicitudes" });
  }
};
//aceptar solicitud
const acceptFriendRequest = async (req, res) => {
  try {
    if (req.user.rol !== "superusuario") {
      return res.status(403).json({ message: "Acceso denegado" });
    }

    const requestId = req.params.id;
    const pool = await getPool();

    const [result] = await pool.execute(
      'UPDATE Amigos SET estado = "aceptado" WHERE id_amistad = ? AND estado = "pendiente"',
      [requestId]
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ message: "Solicitud no encontrada o ya aceptada" });
    }

    res.json({ message: "Solicitud aceptada exitosamente" });
  } catch (error) {
    console.error("Error al aceptar solicitud:", error);
    res.status(500).json({ message: "Error al aceptar solicitud" });
  }
};

const rejectFriendRequest = async (req, res) => {
  try {
    if (req.user.rol !== "superusuario") {
      return res.status(403).json({ message: "Acceso denegado" });
    }

    const requestId = req.params.id;
    const pool = await getPool();

    const [result] = await pool.execute(
      'DELETE FROM Amigos WHERE id_amistad = ? AND estado = "pendiente"',
      [requestId]
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ message: "Solicitud no encontrada o ya procesada" });
    }

    res.json({ message: "Solicitud rechazada exitosamente" });
  } catch (error) {
    console.error("Error al rechazar solicitud:", error);
    res.status(500).json({ message: "Error al rechazar solicitud" });
  }
};

const getPendingAdminRequests = async (req, res) => {
  try {
    if (req.user.rol !== "admin" && req.user.rol !== "superusuario") {
      return res.status(403).json({ message: "Acceso denegado" });
    }

    const pool = await getPool();
    const [requests] = await pool.execute(`
      SELECT sa.id_solicitud, sa.usuario_id, u.nombre, u.correo, sa.razon, sa.fecha_solicitud
      FROM SolicitudAdmin sa
      JOIN Usuario u ON sa.usuario_id = u.id_usuario
      WHERE sa.estado = 'pendiente'
      ORDER BY sa.fecha_solicitud DESC
    `);

    res.json(requests);
  } catch (error) {
    console.error("Error al obtener solicitudes pendientes:", error);
    res
      .status(500)
      .json({ message: "Error al obtener solicitudes pendientes" });
  }
};
//aprobar
const handleAdminRequest = async (req, res) => {
  try {
    const { solicitudId, aprobado } = req.body;

    if (!solicitudId || typeof aprobado !== "boolean") {
      return res.status(400).json({ message: "Datos inválidos" });
    }

    const nuevoEstado = aprobado ? "aprobada" : "rechazada";
    const pool = await getPool();

    // Actualizar el estado de la solicitud
    await pool.execute(
      `UPDATE SolicitudAdmin 
       SET estado = ?, fecha_respuesta = CURRENT_TIMESTAMP, admin_id = ?
       WHERE id_solicitud = ?`,
      [nuevoEstado, req.user.id, solicitudId]
    );

    // Si se aprueba, actualizar el rol del usuario
    if (aprobado) {
      await pool.execute(
        `UPDATE Usuario SET rol = 'admin'
         WHERE id_usuario = (
           SELECT usuario_id FROM SolicitudAdmin WHERE id_solicitud = ?
         )`,
        [solicitudId]
      );
    }

    res.json({ message: `Solicitud ${nuevoEstado} correctamente` });
  } catch (error) {
    console.error("Error al manejar la solicitud de admin:", error);
    res.status(500).json({ message: "Error al procesar la solicitud" });
  }
};

const getAdminList = async (req, res) => {
  try {
    const pool = await getPool();
    const [admins] = await pool.execute(`
      SELECT id_usuario, nombre, correo, rol
      FROM Usuario
      WHERE rol = 'admin' OR rol = 'superusuario'
    `);

    res.json(admins);
  } catch (error) {
    console.error("Error al obtener la lista de administradores:", error);
    res.status(500).json({ message: "Error al obtener administradores" });
  }
};
//remover admin
const removeAdmin = async (req, res) => {
  try {
    const { userId } = req.params;
    const removerId = req.user.id;

    const pool = await getPool();

    // Solo baja de rol, no elimina el usuario completamente
    const [result] = await pool.execute(
      `UPDATE Usuario SET rol = 'usuario' WHERE id_usuario = ? AND (rol = 'admin' OR rol = 'superusuario')`,
      [userId]
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ message: "Administrador no encontrado o ya es usuario común" });
    }
    //vamos a enviar la notificacion de que ha sido degradado a cliente
    await pool.execute(
      `INSERT INTO notificaciones (usuario_id, mensaje) VALUES (?, ?),`[
        (userId,
        "Tu rol a sido degregado, ahora puedes ayudarnos con la super tarea de cliente")
      ]
    );

    res.json({
      message: "Administrador eliminado correctamente (rol cambiado a usuario)",
    });
  } catch (error) {
    console.error("Error al eliminar administrador:", error);
    res.status(500).json({ message: "Error al eliminar administrador" });
  }
};

module.exports = {
  getUsersList,
  getUserDetails,
  getAllFriendRequests,
  acceptFriendRequest,
  rejectFriendRequest,
  createAdminRequest,
  getPendingAdminRequests,
  handleAdminRequest,
  getAdminList,
  removeAdmin,
};
