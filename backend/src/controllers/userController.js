const { pool } = require('../config/database');
const bcrypt = require('bcrypt');

class UserController {
  static async getProfile(req, res) {
    try {
      const [users] = await pool.execute(
        'SELECT id_usuario, nombre, correo, rol, foto_perfil, fecha_registro FROM Usuario WHERE id_usuario = ?',
        [req.user.userId]
      );

      if (users.length === 0) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }

      // Obtener las imágenes del usuario
      const [imagenes] = await pool.execute(
        `SELECT i.*, r.porcentaje_precision, r.fecha_proceso 
         FROM Imagen i 
         LEFT JOIN Resultado r ON i.id_resultado = r.id_resultado 
         WHERE i.id_usuario = ?`,
        [req.user.userId]
      );

      const user = users[0];
      user.imagenes = imagenes;

      res.json(user);
    } catch (error) {
      console.error('Error al obtener perfil:', error);
      res.status(500).json({ message: 'Error al obtener perfil' });
    }
  }

  static async updateProfile(req, res) {
    const { nombre, correo } = req.body;

    try {
      await pool.execute(
        'UPDATE Usuario SET nombre = ?, correo = ? WHERE id_usuario = ?',
        [nombre, correo, req.user.userId]
      );

      res.json({ message: 'Perfil actualizado exitosamente' });
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ message: 'El correo ya está en uso' });
      }
      res.status(500).json({ message: 'Error en el servidor' });
    }
  }

  static async updateProfilePhoto(req, res) {
    if (!req.file) {
      return res.status(400).json({ message: 'No se ha proporcionado ninguna imagen' });
    }

    try {
      const photoUrl = `/uploads/profile/${req.file.filename}`;
      
      await pool.execute(
        'UPDATE Usuario SET foto_perfil = ? WHERE id_usuario = ?',
        [photoUrl, req.user.userId]
      );

      res.json({ 
        message: 'Foto de perfil actualizada exitosamente',
        photoUrl 
      });
    } catch (error) {
      console.error('Error al actualizar la foto de perfil:', error);
      res.status(500).json({ message: 'Error al actualizar la foto de perfil' });
    }
  }

  static async getUserImages(req, res) {
    try {
      const [imagenes] = await pool.execute(
        `SELECT i.*, r.porcentaje_precision, r.fecha_proceso, r.ruta_resultado
         FROM Imagen i 
         LEFT JOIN Resultado r ON i.id_resultado = r.id_resultado 
         WHERE i.id_usuario = ?
         ORDER BY i.fecha_subida DESC`,
        [req.user.userId]
      );

      res.json(imagenes);
    } catch (error) {
      console.error('Error al obtener imágenes del usuario:', error);
      res.status(500).json({ message: 'Error al obtener imágenes del usuario' });
    }
  }
}

module.exports = UserController; 