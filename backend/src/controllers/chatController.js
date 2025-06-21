const { getPool } = require('../config/database');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuración de multer para imágenes de chat
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, '../../uploads/chat');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'chat_' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB para imágenes de chat
  },
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Solo se permiten imágenes (jpeg, jpg, png, gif)'));
  }
});

// Obtener o crear conversación entre dos usuarios
const getOrCreateConversation = async (req, res) => {
  try {
    const userId = req.user.id;
    const { friendId } = req.params;
    const pool = await getPool();

    // Verificar que son amigos
    const [friendship] = await pool.execute(
      `SELECT * FROM amigos 
       WHERE ((usuario_id = ? AND amigo_id = ?) OR (usuario_id = ? AND amigo_id = ?)) 
       AND estado = 'aceptado'`,
      [userId, friendId, friendId, userId]
    );

    if (friendship.length === 0) {
      return res.status(403).json({ message: 'Solo puedes chatear con tus amigos' });
    }

    // Buscar conversación existente
    const [existing] = await pool.execute(
      `SELECT * FROM conversacion 
       WHERE (usuario1_id = ? AND usuario2_id = ?) OR (usuario1_id = ? AND usuario2_id = ?)`,
      [userId, friendId, friendId, userId]
    );

    let conversationId;

    if (existing.length > 0) {
      conversationId = existing[0].id_conversacion;
    } else {
      // Crear nueva conversación
      const [result] = await pool.execute(
        'INSERT INTO conversacion (usuario1_id, usuario2_id) VALUES (?, ?)',
        [Math.min(userId, friendId), Math.max(userId, friendId)]
      );
      conversationId = result.insertId;

      // Crear estados de conversación para ambos usuarios
      await pool.execute(
        'INSERT INTO estadoconversacion (id_conversacion, id_usuario) VALUES (?, ?), (?, ?)',
        [conversationId, userId, conversationId, friendId]
      );
    }

    res.json({ conversationId });
  } catch (error) {
    console.error('Error al obtener/crear conversación:', error);
    res.status(500).json({ message: 'Error al acceder a la conversación' });
  }
};

// Obtener mensajes de una conversación
const getMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    const { conversationId } = req.params;
    const pool = await getPool();

    console.log('getMessages - userId:', userId, 'conversationId:', conversationId);

    // Verificar que el usuario pertenece a la conversación
    const [conversation] = await pool.execute(
      'SELECT * FROM conversacion WHERE id_conversacion = ? AND (usuario1_id = ? OR usuario2_id = ?)',
      [conversationId, userId, userId]
    );

    if (conversation.length === 0) {
      return res.status(403).json({ message: 'No tienes acceso a esta conversación' });
    }

    // Obtener mensajes básicos sin paginación por ahora
    const [messages] = await pool.execute(
      `SELECT 
        m.id_mensaje,
        m.contenido,
        m.tipo_mensaje,
        m.url_archivo,
        m.fecha_envio,
        m.leido,
        u.nombre as remitente_nombre,
        u.foto_perfil as remitente_foto,
        m.id_remitente
       FROM mensaje m
       JOIN usuario u ON m.id_remitente = u.id_usuario
       WHERE m.id_conversacion = ?
       ORDER BY m.fecha_envio ASC`,
      [conversationId]
    );

    console.log('Mensajes encontrados:', messages.length);
    res.json(messages);
  } catch (error) {
    console.error('Error al obtener mensajes:', error);
    res.status(500).json({ message: 'Error al obtener mensajes' });
  }
};

// Enviar mensaje de texto
const sendMessage = async (req, res) => {
  try {
    const userId = req.user.id;
    const { conversationId } = req.params;
    const { contenido, tipo_mensaje = 'texto' } = req.body;
    const pool = await getPool();

    // Verificar acceso a la conversación
    const [conversation] = await pool.execute(
      'SELECT * FROM conversacion WHERE id_conversacion = ? AND (usuario1_id = ? OR usuario2_id = ?)',
      [conversationId, userId, userId]
    );

    if (conversation.length === 0) {
      return res.status(403).json({ message: 'No tienes acceso a esta conversación' });
    }
    
    // Insertar mensaje
    const [result] = await pool.execute(
      'INSERT INTO mensaje (id_conversacion, id_remitente, contenido, tipo_mensaje) VALUES (?, ?, ?, ?)',
      [conversationId, userId, contenido, tipo_mensaje]
    );

    // Actualizar fecha del último mensaje en la conversación
    await pool.execute(
      'UPDATE conversacion SET ultimo_mensaje_fecha = NOW() WHERE id_conversacion = ?',
      [conversationId]
    );

    // Obtener el mensaje completo con información del usuario
    const [newMessage] = await pool.execute(
      `SELECT 
        m.id_mensaje,
        m.contenido,
        m.tipo_mensaje,
        m.url_archivo,
        m.fecha_envio,
        m.leido,
        u.nombre as remitente_nombre,
        u.foto_perfil as remitente_foto,
        m.id_remitente
       FROM mensaje m
       JOIN usuario u ON m.id_remitente = u.id_usuario
       WHERE m.id_mensaje = ?`,
      [result.insertId]
    );

    res.status(201).json(newMessage[0]);
  } catch (error) {
    console.error('Error al enviar mensaje:', error);
    res.status(500).json({ message: 'Error al enviar mensaje' });
  }
};

// Enviar imagen
const sendImage = async (req, res) => {
  try {
    const userId = req.user.id;
    const { conversationId } = req.params;
    const pool = await getPool();

    if (!req.file) {
      return res.status(400).json({ message: 'No se ha proporcionado ninguna imagen' });
    }

    // Verificar acceso a la conversación
    const [conversation] = await pool.execute(
      'SELECT * FROM conversacion WHERE id_conversacion = ? AND (usuario1_id = ? OR usuario2_id = ?)',
      [conversationId, userId, userId]
    );

    if (conversation.length === 0) {
      return res.status(403).json({ message: 'No tienes acceso a esta conversación' });
    }

    const imageUrl = `/uploads/chat/${req.file.filename}`;

    // Insertar mensaje de imagen
    const [result] = await pool.execute(
      'INSERT INTO mensaje (id_conversacion, id_remitente, contenido, tipo_mensaje, url_archivo) VALUES (?, ?, ?, ?, ?)',
      [conversationId, userId, 'Imagen', 'imagen', imageUrl]
    );

    // Actualizar fecha del último mensaje
    await pool.execute(
      'UPDATE conversacion SET ultimo_mensaje_fecha = NOW() WHERE id_conversacion = ?',
      [conversationId]
    );

    // Obtener el mensaje completo
    const [newMessage] = await pool.execute(
      `SELECT 
        m.id_mensaje,
        m.contenido,
        m.tipo_mensaje,
        m.url_archivo,
        m.fecha_envio,
        m.leido,
        u.nombre as remitente_nombre,
        u.foto_perfil as remitente_foto,
        m.id_remitente
       FROM mensaje m
       JOIN usuario u ON m.id_remitente = u.id_usuario
       WHERE m.id_mensaje = ?`,
      [result.insertId]
    );

    res.status(201).json(newMessage[0]);
  } catch (error) {
    console.error('Error al enviar imagen:', error);
    res.status(500).json({ message: 'Error al enviar imagen' });
  }
};

// Agregar reacción a mensaje
const addReaction = async (req, res) => {
  try {
    const userId = req.user.id;
    const { messageId } = req.params;
    const { emoji } = req.body;
    const pool = await getPool();

    // Verificar que el mensaje existe y el usuario tiene acceso
    const [message] = await pool.execute(
      `SELECT m.*, c.usuario1_id, c.usuario2_id 
       FROM mensaje m
       JOIN conversacion c ON m.id_conversacion = c.id_conversacion
       WHERE m.id_mensaje = ? AND (c.usuario1_id = ? OR c.usuario2_id = ?)`,
      [messageId, userId, userId]
    );

    if (message.length === 0) {
      return res.status(403).json({ message: 'No tienes acceso a este mensaje' });
    }

    // Insertar o actualizar reacción
    await pool.execute(
      `INSERT INTO reaccionmensaje (id_mensaje, id_usuario, emoji) 
       VALUES (?, ?, ?) 
       ON DUPLICATE KEY UPDATE emoji = VALUES(emoji), fecha_reaccion = NOW()`,
      [messageId, userId, emoji]
    );

    res.json({ message: 'Reacción agregada correctamente' });
  } catch (error) {
    console.error('Error al agregar reacción:', error);
    res.status(500).json({ message: 'Error al agregar reacción' });
  }
};

// Eliminar reacción
const removeReaction = async (req, res) => {
  try {
    const userId = req.user.id;
    const { messageId } = req.params;
    const pool = await getPool();

    await pool.execute(
      'DELETE FROM reaccionmensaje WHERE id_mensaje = ? AND id_usuario = ?',
      [messageId, userId]
    );

    res.json({ message: 'Reacción eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar reacción:', error);
    res.status(500).json({ message: 'Error al eliminar reacción' });
  }
};

// Obtener lista de conversaciones del usuario
const getConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    const pool = await getPool();

    // Primero obtener las conversaciones básicas
    const [conversations] = await pool.execute(
      `SELECT 
        c.id_conversacion,
        c.ultimo_mensaje_fecha,
        CASE 
          WHEN c.usuario1_id = ? THEN c.usuario2_id
          ELSE c.usuario1_id
        END as amigo_id
       FROM conversacion c
       WHERE c.usuario1_id = ? OR c.usuario2_id = ?
       ORDER BY c.ultimo_mensaje_fecha DESC`,
      [userId, userId, userId]
    );

    // Para cada conversación, obtener información del amigo y último mensaje
    const conversationsWithDetails = await Promise.all(
      conversations.map(async (conv) => {
        // Obtener información del amigo
        const [friend] = await pool.execute(
          'SELECT nombre, foto_perfil FROM usuario WHERE id_usuario = ?',
          [conv.amigo_id]
        );

        // Obtener último mensaje
        const [lastMessage] = await pool.execute(
          `SELECT contenido, tipo_mensaje, id_remitente 
           FROM mensaje 
           WHERE id_conversacion = ? 
           ORDER BY fecha_envio DESC 
           LIMIT 1`,
          [conv.id_conversacion]
        );

        // Contar mensajes no leídos
        const [unreadCount] = await pool.execute(
          `SELECT COUNT(*) as count 
           FROM mensaje 
           WHERE id_conversacion = ? AND id_remitente != ? AND leido = FALSE`,
          [conv.id_conversacion, userId]
        );

        return {
          id_conversacion: conv.id_conversacion,
          amigo_id: conv.amigo_id,
          amigo_nombre: friend[0]?.nombre || 'Usuario',
          amigo_foto: friend[0]?.foto_perfil || null,
          ultimo_mensaje: lastMessage[0]?.contenido || null,
          ultimo_tipo: lastMessage[0]?.tipo_mensaje || null,
          ultimo_mensaje_propio: lastMessage[0]?.id_remitente === userId,
          ultimo_mensaje_fecha: conv.ultimo_mensaje_fecha,
          mensajes_no_leidos: unreadCount[0]?.count || 0
        };
      })
    );

    res.json(conversationsWithDetails);
  } catch (error) {
    console.error('Error al obtener conversaciones:', error);
    res.status(500).json({ message: 'Error al obtener conversaciones' });
  }
};

// Marcar mensajes como leídos
const markAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { conversationId } = req.params;
    const pool = await getPool();

    // Marcar todos los mensajes de la conversación como leídos
    await pool.execute(
      `UPDATE mensaje 
       SET leido = TRUE 
       WHERE id_conversacion = ? AND id_remitente != ? AND leido = FALSE`,
      [conversationId, userId]
    );

    // Actualizar estado de conversación
    await pool.execute(
      `UPDATE estadoconversacion 
       SET fecha_ultima_lectura = NOW() 
       WHERE id_conversacion = ? AND id_usuario = ?`,
      [conversationId, userId]
    );

    res.json({ message: 'Mensajes marcados como leídos' });
  } catch (error) {
    console.error('Error al marcar como leído:', error);
    res.status(500).json({ message: 'Error al marcar mensajes como leídos' });
  }
};

module.exports = {
  getOrCreateConversation,
  getMessages,
  sendMessage,
  sendImage: [upload.single('image'), sendImage],
  addReaction,
  removeReaction,
  getConversations,
  markAsRead
}; 