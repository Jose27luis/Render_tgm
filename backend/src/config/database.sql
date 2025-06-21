-- Tabla de Usuarios
CREATE TABLE IF NOT EXISTS Usuario (
    id_usuario INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    correo VARCHAR(100) NOT NULL UNIQUE,
    contrasena VARCHAR(255) NOT NULL,
    rol ENUM('usuario', 'admin') DEFAULT 'usuario',
    foto_perfil VARCHAR(255),
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Amigos
CREATE TABLE IF NOT EXISTS Amigos (
    id_amistad INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT NOT NULL,
    amigo_id INT NOT NULL,
    estado ENUM('pendiente', 'aceptado') NOT NULL,
    fecha_solicitud TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES Usuario(id_usuario) ON DELETE CASCADE,
    FOREIGN KEY (amigo_id) REFERENCES Usuario(id_usuario) ON DELETE CASCADE,
    UNIQUE KEY unique_friendship (usuario_id, amigo_id),
    INDEX idx_amigos_usuario (usuario_id, estado),
    INDEX idx_amigos_amigo (amigo_id, estado)
);

-- Tabla de Imágenes
CREATE TABLE IF NOT EXISTS Imagen (
    id_imagen INT PRIMARY KEY AUTO_INCREMENT,
    id_usuario INT NOT NULL,
    ruta_imagen VARCHAR(255) NOT NULL,
    fecha_subida TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    id_resultado INT,
    FOREIGN KEY (id_usuario) REFERENCES Usuario(id_usuario) ON DELETE CASCADE
);

-- Tabla de Resultados
CREATE TABLE IF NOT EXISTS Resultado (
    id_resultado INT PRIMARY KEY AUTO_INCREMENT,
    id_imagen INT NOT NULL,
    porcentaje_precision DECIMAL(5,2),
    ruta_resultado VARCHAR(255),
    fecha_procesamiento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_imagen) REFERENCES Imagen(id_imagen) ON DELETE CASCADE
);

-- Tabla de Solicitudes de Admin
CREATE TABLE IF NOT EXISTS SolicitudAdmin (
    id_solicitud INT PRIMARY KEY AUTO_INCREMENT,
    id_usuario INT NOT NULL,
    razon TEXT NOT NULL,
    estado ENUM('pendiente', 'aprobada', 'rechazada') DEFAULT 'pendiente',
    fecha_solicitud TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_respuesta TIMESTAMP,
    FOREIGN KEY (id_usuario) REFERENCES Usuario(id_usuario) ON DELETE CASCADE
); 