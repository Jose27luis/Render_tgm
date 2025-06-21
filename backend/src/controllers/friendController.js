const { getPool } = require("../config/database");

const searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    const userId = req.user.id;
    const pool = await getPool();

    // Si no hay query, devolver lista vacía
    if (!query || query.trim().length === 0) {
      return res.json([]);
    }

    const [users] = await pool.execute(
      `SELECT u.id_usuario, u.nombre, u.foto_perfil,
             CASE
                WHEN a.estado = 'pendiente' AND a.usuario_id = ? THEN 'solicitud_enviada'
                WHEN a.estado = 'pendiente' AND a.amigo_id = ? THEN 'solicitud_recibida'
                WHEN a.estado = 'aceptado' THEN 'amigos'
                ELSE NULL
             END as estado
             FROM Usuario u
             LEFT JOIN Amigos a ON 
                (a.usuario_id = ? AND a.amigo_id = u.id_usuario)
                OR (a.amigo_id = ? AND a.usuario_id = u.id_usuario)
             WHERE u.id_usuario != ? 
             AND (
                 u.nombre LIKE ? 
                 OR u.correo LIKE ? 
                 OR SOUNDEX(u.nombre) = SOUNDEX(?)
             )
             ORDER BY 
                CASE 
                    WHEN u.nombre LIKE ? THEN 1
                    WHEN u.nombre LIKE ? THEN 2
                    WHEN SOUNDEX(u.nombre) = SOUNDEX(?) THEN 3
                    ELSE 4
                END,
                u.nombre
             LIMIT 10`,
      [
        userId,
        userId,
        userId,
        userId,
        userId,
        `${query}%`, // Comienza con
        `%${query}%`, // Contiene
        query, // Coincidencia fonética
        `${query}%`, // Para ordenamiento
        `%${query}%`, // Para ordenamiento
        query, // Para ordenamiento
      ]
    );

    res.json(users);
  } catch (error) {
    console.error("Error al buscar usuarios:", error);
    res.status(500).json({ message: "Error al buscar usuarios" });
  }
};

const getFriends = async (req, res) => {
  try {
    const userId = req.user.id;
    const pool = await getPool();

    const [friends] = await pool.execute(
      `SELECT u.id_usuario, u.nombre, u.correo, u.foto_perfil, a.fecha_solicitud
             FROM Amigos a
             JOIN Usuario u ON (a.amigo_id = u.id_usuario)
             WHERE a.usuario_id = ? AND a.estado = 'aceptado'
             UNION
             SELECT u.id_usuario, u.nombre, u.correo, u.foto_perfil, a.fecha_solicitud
             FROM Amigos a
             JOIN Usuario u ON (a.usuario_id = u.id_usuario)
             WHERE a.amigo_id = ? AND a.estado = 'aceptado'
             ORDER BY fecha_solicitud DESC`,
      [userId, userId]
    );

    res.json(friends);
  } catch (error) {
    console.error("Error al obtener amigos:", error);
    res.status(500).json({ message: "Error al obtener la lista de amigos" });
  }
};

const getFriendRequests = async (req, res) => {
  try {
    const userId = req.user.id;
    const pool = await getPool();

    const [requests] = await pool.execute(
      `SELECT u.id_usuario, u.nombre, u.correo, u.foto_perfil, a.fecha_solicitud, a.id_amistad AS id_solicitud
             FROM Amigos a
             JOIN Usuario u ON (a.usuario_id = u.id_usuario)
             WHERE a.amigo_id = ? AND a.estado = 'pendiente'
             ORDER BY a.fecha_solicitud DESC`,
      [userId]
    );

    res.json(requests);
  } catch (error) {
    console.error("Error al obtener solicitudes:", error);
    res
      .status(500)
      .json({ message: "Error al obtener las solicitudes de amistad" });
  }
};

const sendFriendRequest = async (req, res) => {
  try {
    const { amigo_id } = req.body;
    const userId = req.user.id;
    const pool = await getPool();

    // Primero buscamos el usuario por nombre
    const [users] = await pool.execute(
      "SELECT id_usuario FROM Usuario WHERE nombre = ?",
      [amigo_id]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    const friendId = users[0].id_usuario;

    // Verificar que no se esté enviando solicitud a sí mismo
    if (userId === friendId) {
      return res
        .status(400)
        .json({ message: "No puedes enviarte una solicitud a ti mismo" });
    }

    // Verificar si ya existe una amistad o solicitud
    const [existing] = await pool.execute(
      `SELECT * FROM Amigos 
             WHERE (usuario_id = ? AND amigo_id = ?) 
             OR (usuario_id = ? AND amigo_id = ?)`,
      [userId, friendId, friendId, userId]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        message: "Ya existe una solicitud o amistad con este usuario",
      });
    }

    // Crear la solicitud
    await pool.execute(
      'INSERT INTO Amigos (usuario_id, amigo_id, estado, fecha_solicitud) VALUES (?, ?, "pendiente", NOW())',
      [userId, friendId]
    );

    res.json({ message: "Solicitud de amistad enviada correctamente" });
  } catch (error) {
    console.error("Error al enviar solicitud:", error);
    res
      .status(500)
      .json({ message: "Error al enviar la solicitud de amistad" });
  }
};

const respondToFriendRequest = async (req, res) => {
  try {
    const userId = req.user.id;
    const requestId = req.params.id; // <-- ahora lo tomamos de la URL
    const pool = await getPool();

    // Verificar que la solicitud exista y sea para este usuario
    const [request] = await pool.execute(
      'SELECT * FROM Amigos WHERE id_amistad = ? AND amigo_id = ? AND estado = "pendiente"',
      [requestId, userId]
    );

    if (request.length === 0) {
      return res.status(404).json({ message: "Solicitud no encontrada" });
    }

    // Aceptar la solicitud
    await pool.execute(
      'UPDATE Amigos SET estado = "aceptado" WHERE id_amistad = ?',
      [requestId]
    );

    res.json({ message: "Solicitud de amistad aceptada" });
  } catch (error) {
    console.error("Error al aceptar solicitud:", error);
    res
      .status(500)
      .json({ message: "Error al aceptar la solicitud de amistad" });
  }
};
const rejectFriendRequest = async (req, res) => {
  try {
    const userId = req.user.id;
    const requestId = req.params.id;
    const pool = await getPool();

    const [request] = await pool.execute(
      'SELECT * FROM Amigos WHERE id_amistad = ? AND amigo_id = ? AND estado = "pendiente"',
      [requestId, userId]
    );

    if (request.length === 0) {
      return res.status(404).json({ message: "Solicitud no encontrada" });
    }

    await pool.execute("DELETE FROM Amigos WHERE id_amistad = ?", [requestId]);

    res.json({ message: "Solicitud de amistad rechazada" });
  } catch (error) {
    console.error("Error al rechazar solicitud:", error);
    res
      .status(500)
      .json({ message: "Error al rechazar la solicitud de amistad" });
  }
};

module.exports = {
  searchUsers,
  getFriends,
  getFriendRequests,
  sendFriendRequest,
  respondToFriendRequest,
  rejectFriendRequest,
};
