const { pool } = require('../config/database');
const path = require('path');
const fs = require('fs').promises;

const getProfile = async (req, res) => {
  try {
    const [users] = await pool.execute(
      'SELECT id_usuario, nombre, correo, rol FROM Usuario WHERE id_usuario = ?',
      [req.user.userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const user = users[0];
    res.json({
      id: user.id_usuario,
      nombre: user.nombre,
      correo: user.correo,
      rol: user.rol,
      foto_perfil: null // Temporalmente null hasta que se agregue la columna
    });
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({ message: 'Error al obtener datos del perfil' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { nombre, correo } = req.body;
    
    // Verificar si el correo ya está en uso por otro usuario
    const [existingUsers] = await pool.execute(
      'SELECT id_usuario FROM Usuario WHERE correo = ? AND id_usuario != ?',
      [correo, req.user.userId]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'El correo ya está en uso' });
    }

    await pool.execute(
      'UPDATE Usuario SET nombre = ?, correo = ? WHERE id_usuario = ?',
      [nombre, correo, req.user.userId]
    );

    res.json({ message: 'Perfil actualizado correctamente' });
  } catch (error) {
    console.error('Error al actualizar perfil:', error);
    res.status(500).json({ message: 'Error al actualizar el perfil' });
  }
};

const updateProfilePhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No se ha subido ninguna imagen' });
    }

    const photoUrl = `/uploads/profile/${req.file.filename}`;
    
    // Obtener la foto anterior para borrarla
    const [users] = await pool.execute(
      'SELECT foto_perfil FROM Usuario WHERE id_usuario = ?',
      [req.user.userId]
    );

    // Actualizar la foto en la base de datos
    await pool.execute(
      'UPDATE Usuario SET foto_perfil = ? WHERE id_usuario = ?',
      [photoUrl, req.user.userId]
    );

    // Si había una foto anterior, intentar borrarla
    if (users[0]?.foto_perfil) {
      const oldPhotoPath = path.join(__dirname, '../../', users[0].foto_perfil);
      try {
        await fs.unlink(oldPhotoPath);
      } catch (err) {
        console.error('Error al borrar foto anterior:', err);
      }
    }

    res.json({ 
      message: 'Foto de perfil actualizada',
      foto_url: photoUrl
    });
  } catch (error) {
    console.error('Error al actualizar foto:', error);
    res.status(500).json({ message: 'Error al actualizar la foto de perfil' });
  }
};

const getUserImages = async (req, res) => {
  try {
    const [images] = await pool.execute(
      'SELECT * FROM Imagenes WHERE usuario_id = ? ORDER BY fecha_subida DESC',
      [req.user.userId]
    );

    res.json(images);
  } catch (error) {
    console.error('Error al obtener imágenes:', error);
    res.status(500).json({ message: 'Error al obtener las imágenes' });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  updateProfilePhoto,
  getUserImages
}; 