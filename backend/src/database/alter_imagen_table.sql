-- Agregar campo metadata a la tabla Imagen para guardar información adicional sobre el procesamiento
ALTER TABLE Imagen 
ADD COLUMN IF NOT EXISTS metadata JSON NULL COMMENT 'Metadata del procesamiento (modelo usado, parámetros, etc.)';

-- Agregar índice para el campo estado para mejorar las consultas
ALTER TABLE Imagen 
ADD INDEX idx_estado (estado);

-- Actualizar los estados posibles
ALTER TABLE Imagen 
MODIFY COLUMN estado ENUM('procesada', 'pendiente', 'error', 'enhanced', 'combined') DEFAULT 'pendiente'; 