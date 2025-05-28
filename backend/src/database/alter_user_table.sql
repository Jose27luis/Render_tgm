-- Agregar columna foto_perfil a la tabla Usuario
ALTER TABLE Usuario
ADD COLUMN foto_perfil VARCHAR(255) DEFAULT NULL; 