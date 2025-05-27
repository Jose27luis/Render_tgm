const { pool } = require('../config/database');

const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No se ha proporcionado ninguna imagen' });
    }

    const { filename, path: filePath } = req.file;
    
    // Crear registro de imagen
    const [result] = await pool.execute(
      'INSERT INTO Imagen (id_usuario, fecha_subida, estado) VALUES (?, NOW(), ?)',
      [req.user.userId, 'pendiente']
    );

    res.status(201).json({
      message: 'Imagen subida exitosamente',
      imageId: result.insertId,
      filename
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al subir la imagen' });
  }
};

const getImageResults = async (req, res) => {
  try {
    const { imageId } = req.params;

    const [results] = await pool.execute(
      `SELECT i.*, r.porcentaje_precision, r.ruta_resultado, r.fecha_proceso
       FROM Imagen i
       LEFT JOIN Resultado r ON i.id_resultado = r.id_resultado
       WHERE i.id_imagen = ? AND i.id_usuario = ?`,
      [imageId, req.user.userId]
    );

    if (results.length === 0) {
      return res.status(404).json({ message: 'Imagen no encontrada' });
    }

    res.json(results[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener resultados de la imagen' });
  }
};

const deleteImage = async (req, res) => {
  try {
    const { imageId } = req.params;

    // Verificar que la imagen pertenezca al usuario
    const [image] = await pool.execute(
      'SELECT * FROM Imagen WHERE id_imagen = ? AND id_usuario = ?',
      [imageId, req.user.userId]
    );

    if (image.length === 0) {
      return res.status(404).json({ message: 'Imagen no encontrada' });
    }

    // Eliminar resultados asociados
    if (image[0].id_resultado) {
      await pool.execute(
        'DELETE FROM Resultado WHERE id_resultado = ?',
        [image[0].id_resultado]
      );
    }

    // Eliminar la imagen
    await pool.execute(
      'DELETE FROM Imagen WHERE id_imagen = ?',
      [imageId]
    );

    res.json({ message: 'Imagen eliminada exitosamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al eliminar la imagen' });
  }
};

module.exports = {
  uploadImage,
  getImageResults,
  deleteImage
}; 