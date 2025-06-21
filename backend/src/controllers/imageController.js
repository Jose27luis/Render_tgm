const { getPool } = require("../config/database");
const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const FormData = require("form-data");
const { Blob } = require("buffer");

const UPLOADS_DIR = path.join(__dirname, "..", "..", "uploads");
const PYTHON_SERVICE_URL = "http://localhost:8002/enhance";
const REALESRGAN_SERVICE_URL = "http://localhost:8002";

/**
 * Sube una imagen original
 */
const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No se subió ningún archivo." });
    }

    const pool = await getPool();
    const { filename, path: filePath } = req.file;
    const relativePath = path.relative(path.join(UPLOADS_DIR, ".."), filePath);

    const [result] = await pool.query(
      "INSERT INTO Imagenes (usuario_id, nombre_archivo, url_original) VALUES (?, ?, ?)",
      [req.user.id, filename, "/" + relativePath.replace(/\\/g, "/")]
    );

    res.status(201).json({
      message: "Imagen subida exitosamente",
      imageId: result.insertId,
      url: "/" + relativePath.replace(/\\/g, "/"),
    });
  } catch (error) {
    console.error("Error al subir imagen:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
};

/**
 * Obtiene todas las imágenes de un usuario (originales y procesadas)
 */
const getUserImages = async (req, res) => {
  try {
    const pool = await getPool();
    // Esta consulta es compleja pero eficiente. Une las imágenes originales
    // con sus posibles versiones procesadas para devolver todo en una sola llamada.
    const [images] = await pool.query(
      `
            SELECT 
                i.id_imagen,
                i.url_original,
                p.ruta_imagen as url_procesada,
                i.fecha_subida,
                'original' as tipo,
                CASE WHEN p.id_imagen IS NOT NULL THEN 'procesada' ELSE 'pendiente' END as estado
            FROM 
                Imagenes i
            LEFT JOIN 
                Imagen p ON i.id_imagen = p.id_imagen_original
            WHERE 
                i.usuario_id = ?
            ORDER BY 
                i.fecha_subida DESC
            `,
      [req.user.id]
    );
    res.json(images);
  } catch (error) {
    console.error("Error al obtener imágenes del usuario:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

/**
 * Elimina una imagen (original y su versión procesada si existe)
 */
const deleteImage = async (req, res) => {
  try {
    const { imageId } = req.params;
    const pool = await getPool();

    const [original] = await pool.query(
      "SELECT * FROM Imagenes WHERE id_imagen = ? AND usuario_id = ?",
      [imageId, req.user.id]
    );

    if (original.length === 0) {
      return res.status(404).json({
        message: "Imagen no encontrada o no tienes permiso para eliminarla.",
      });
    }

    const [procesada] = await pool.query(
      "SELECT * FROM Imagen WHERE id_imagen_original = ?",
      [imageId]
    );

    // Eliminar archivos físicos del disco
    if (original[0].url_original) {
      await fs.remove(path.join(UPLOADS_DIR, "..", original[0].url_original));
    }
    if (procesada.length > 0 && procesada[0].ruta_imagen) {
      await fs.remove(path.join(UPLOADS_DIR, "..", procesada[0].ruta_imagen));
    }

    // Eliminar de la base de datos (ON DELETE CASCADE se encargará de la tabla Imagen)
    await pool.query("DELETE FROM Imagenes WHERE id_imagen = ?", [imageId]);

    res.status(200).json({ message: "Imagen eliminada correctamente." });
  } catch (error) {
    console.error("Error al eliminar imagen:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
};

/**
 * Llama al servicio de Python para mejorar una imagen
 */
const mejorarImagen = async (req, res) => {
  try {
    const { imageId } = req.params;
    const pool = await getPool();

    const [originalRows] = await pool.query(
      "SELECT * FROM Imagenes WHERE id_imagen = ? AND usuario_id = ?",
      [imageId, req.user.id]
    );
    if (originalRows.length === 0) {
      return res
        .status(404)
        .json({ message: "Imagen original no encontrada." });
    }
    const originalImage = originalRows[0];
    const originalFilePath = path.join(
      UPLOADS_DIR,
      "..",
      originalImage.url_original
    );

    if (!(await fs.pathExists(originalFilePath))) {
      return res
        .status(404)
        .json({ message: "El archivo físico de la imagen no se encuentra." });
    }

    const fileBuffer = await fs.readFile(originalFilePath);
    const form = new FormData();
    form.append("file", fileBuffer, originalImage.nombre_archivo);

    const response = await axios.post(PYTHON_SERVICE_URL, form, {
      headers: form.getHeaders(),
      responseType: "arraybuffer",
    });

    const processedDir = path.join(UPLOADS_DIR, "processed");
    await fs.ensureDir(processedDir);
    const processedFileName = `processed_${originalImage.nombre_archivo}`;
    const processedFilePath = path.join(processedDir, processedFileName);
    await fs.writeFile(processedFilePath, response.data);

    const relativeProcessedPath = `/uploads/processed/${processedFileName}`;

    // Eliminar registro procesado anterior si existiera
    await pool.query("DELETE FROM Imagen WHERE id_imagen_original = ?", [
      imageId,
    ]);

    await pool.query(
      "INSERT INTO Imagen (id_usuario, id_imagen_original, ruta_imagen, estado) VALUES (?, ?, ?, ?)",
      [req.user.id, imageId, relativeProcessedPath, "procesada"]
    );

    res.status(200).json({
      message: "Imagen mejorada exitosamente",
      url: relativeProcessedPath,
    });
  } catch (error) {
    console.error("❌ Error al mejorar la imagen:", {
      message: error.message,
      stack: error.stack,
      responseData: error.response?.data,
      status: error.response?.status,
      headers: error.response?.headers,
    });

    res.status(500).json({
      message:
        "Error al comunicarse con el servicio de mejora o al guardar el resultado.",
      error: error.message,
      detalle: error.response?.data || "Sin detalle del servicio externo",
    });
  }
};

/**
 * Mejora la resolución de una imagen usando Real-ESRGAN
 */
const mejorarResolucion = async (req, res) => {
  try {
    const { imageId } = req.params;
    const { model = "real4x", tta_mode = false, tilesize = 0 } = req.body;
    const pool = await getPool();

    const [originalRows] = await pool.query(
      "SELECT * FROM Imagenes WHERE id_imagen = ? AND usuario_id = ?",
      [imageId, req.user.id]
    );
    if (originalRows.length === 0) {
      return res
        .status(404)
        .json({ message: "Imagen original no encontrada." });
    }
    const originalImage = originalRows[0];
    const originalFilePath = path.join(
      UPLOADS_DIR,
      "..",
      originalImage.url_original
    );

    if (!(await fs.pathExists(originalFilePath))) {
      return res
        .status(404)
        .json({ message: "El archivo físico de la imagen no se encuentra." });
    }

    const fileBuffer = await fs.readFile(originalFilePath);
    const form = new FormData();
    form.append("file", fileBuffer, originalImage.nombre_archivo);
    form.append("model_name", model);
    form.append("gpu_id", "0");
    form.append("tta_mode", tta_mode.toString());
    form.append("tilesize", tilesize.toString());

    const response = await axios.post(
      `${REALESRGAN_SERVICE_URL}/enhance`,
      form,
      {
        headers: form.getHeaders(),
        responseType: "arraybuffer",
      }
    );

    const enhancedDir = path.join(UPLOADS_DIR, "enhanced");
    await fs.ensureDir(enhancedDir);
    const enhancedFileName = `enhanced_${model}_${originalImage.nombre_archivo}`;
    const enhancedFilePath = path.join(enhancedDir, enhancedFileName);
    await fs.writeFile(enhancedFilePath, response.data);

    const relativeEnhancedPath = `/uploads/enhanced/${enhancedFileName}`;

    // Guardar metadata de la mejora
    await pool.query(
      "INSERT INTO Imagen (id_usuario, id_imagen_original, ruta_imagen, estado, metadata) VALUES (?, ?, ?, ?, ?)",
      [
        req.user.id,
        imageId,
        relativeEnhancedPath,
        "enhanced",
        JSON.stringify({ model, tta_mode, tilesize }),
      ]
    );

    res.status(200).json({
      message: "Resolución mejorada exitosamente",
      url: relativeEnhancedPath,
      model_used: model,
      headers: response.headers,
    });
  } catch (error) {
    console.error("Error al mejorar la resolución:", error);
    res
      .status(500)
      .json({ message: "Error al comunicarse con el servicio Real-ESRGAN." });
  }
};

/**
 * Mejora combinada: iluminación + resolución
 */
const mejorarCombinada = async (req, res) => {
  try {
    const { imageId } = req.params;
    const { model = "real4x", enhance_low_light = true } = req.body;
    const pool = await getPool();

    const [originalRows] = await pool.query(
      "SELECT * FROM Imagenes WHERE id_imagen = ? AND usuario_id = ?",
      [imageId, req.user.id]
    );
    if (originalRows.length === 0) {
      return res
        .status(404)
        .json({ message: "Imagen original no encontrada." });
    }
    const originalImage = originalRows[0];
    const originalFilePath = path.join(
      UPLOADS_DIR,
      "..",
      originalImage.url_original
    );

    if (!(await fs.pathExists(originalFilePath))) {
      return res
        .status(404)
        .json({ message: "El archivo físico de la imagen no se encuentra." });
    }

    const fileBuffer = await fs.readFile(originalFilePath);
    const form = new FormData();
    form.append("file", fileBuffer, originalImage.nombre_archivo);
    form.append("model_name", model);
    form.append("enhance_low_light", enhance_low_light.toString());

    const response = await axios.post(
      `${REALESRGAN_SERVICE_URL}/enhance_combined`,
      form,
      {
        headers: form.getHeaders(),
        responseType: "arraybuffer",
      }
    );

    const combinedDir = path.join(UPLOADS_DIR, "combined");
    await fs.ensureDir(combinedDir);
    const combinedFileName = `combined_${originalImage.nombre_archivo}`;
    const combinedFilePath = path.join(combinedDir, combinedFileName);
    await fs.writeFile(combinedFilePath, response.data);

    const relativeCombinedPath = `/uploads/combined/${combinedFileName}`;

    await pool.query(
      "INSERT INTO Imagen (id_usuario, id_imagen_original, ruta_imagen, estado, metadata) VALUES (?, ?, ?, ?, ?)",
      [
        req.user.id,
        imageId,
        relativeCombinedPath,
        "combined",
        JSON.stringify({ model, enhance_low_light }),
      ]
    );

    res.status(200).json({
      message: "Mejora combinada exitosa",
      url: relativeCombinedPath,
      enhancements:
        response.headers["x-enhancements-applied"] ||
        "low-light,super-resolution",
    });
  } catch (error) {
    console.error("Error en mejora combinada:", error);
    res.status(500).json({ message: "Error al procesar la mejora combinada." });
  }
};

/**
 * Obtiene los modelos disponibles de Real-ESRGAN
 */
const getAvailableModels = async (req, res) => {
  try {
    const response = await axios.get(`${REALESRGAN_SERVICE_URL}/models`);
    res.json(response.data);
  } catch (error) {
    console.error("Error al obtener modelos:", error);
    res.status(500).json({ message: "Error al obtener modelos disponibles." });
  }
};

module.exports = {
  uploadImage,
  getUserImages,
  deleteImage,
  mejorarImagen,
  mejorarResolucion,
  mejorarCombinada,
  getAvailableModels,
};
