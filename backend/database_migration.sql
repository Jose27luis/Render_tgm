-- Migración para actualizar el esquema de la tabla Imagen
-- Fecha: 19 Junio 2025

USE render_tgm;

-- Primero verificar la estructura actual
DESCRIBE Imagenes;
DESCRIBE Imagen;

-- Actualizar tabla Imagenes si le falta la columna url_original
ALTER TABLE Imagenes ADD COLUMN IF NOT EXISTS url_original VARCHAR(500) NULL AFTER nombre_archivo;

-- Eliminar la tabla actual si existe y recrearla con la estructura correcta
DROP TABLE IF EXISTS Imagen;

-- Crear la nueva tabla Imagen con la estructura que espera el código
CREATE TABLE IF NOT EXISTS Imagen (
    id_imagen INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    id_imagen_original INT NULL,  -- Referencia a la imagen original
    ruta_imagen VARCHAR(500) NOT NULL,  -- Ruta del archivo procesado
    estado ENUM('pendiente', 'procesado', 'error', 'procesada', 'enhanced', 'combined') NOT NULL DEFAULT 'pendiente',
    metadata JSON NULL,  -- Metadata del procesamiento (modelo usado, parámetros, etc.)
    fecha_subida DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_procesamiento DATETIME NULL,
    FOREIGN KEY (id_usuario) REFERENCES Usuario(id_usuario) ON DELETE CASCADE,
    FOREIGN KEY (id_imagen_original) REFERENCES Imagenes(id_imagen) ON DELETE CASCADE
);

-- Agregar índices para mejorar el rendimiento
CREATE INDEX idx_imagen_usuario ON Imagen(id_usuario);
CREATE INDEX idx_imagen_original ON Imagen(id_imagen_original);
CREATE INDEX idx_imagen_estado ON Imagen(estado);

-- También actualizar la tabla Imagenes para agregar url_original si no existe
ALTER TABLE Imagenes 
ADD COLUMN IF NOT EXISTS url_original VARCHAR(500) NULL AFTER nombre_archivo;

-- Verificar las estructuras actualizadas
DESCRIBE Imagenes;
DESCRIBE Imagen;

SELECT 'Migración completada exitosamente' as status; 