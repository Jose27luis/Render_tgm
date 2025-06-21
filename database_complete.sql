-- Base de datos completa para RENDER-TGM
USE render_tgm;

-- Tabla: Usuario
CREATE TABLE IF NOT EXISTS Usuario (
    id_usuario INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    correo VARCHAR(100) NOT NULL UNIQUE,
    contrasena VARCHAR(255) NOT NULL,
    rol ENUM('usuario', 'admin', 'superadmin') DEFAULT 'usuario',
    foto_perfil VARCHAR(255),
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: SesionUsuario
CREATE TABLE IF NOT EXISTS SesionUsuario (
    id_sesion INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT,
    fecha_inicio DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ip VARCHAR(45),
    FOREIGN KEY (id_usuario) REFERENCES Usuario(id_usuario) ON DELETE CASCADE
);

-- Tabla: Resultado
CREATE TABLE IF NOT EXISTS Resultado (
    id_resultado INT AUTO_INCREMENT PRIMARY KEY,
    ruta_resultado VARCHAR(255) NOT NULL,
    fecha_proceso DATETIME NOT NULL,
    porcentaje_precision DECIMAL(5,2)
);

-- Tabla: Imagenes (para archivos originales subidos)
CREATE TABLE IF NOT EXISTS Imagenes (
    id_imagen INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT,
    nombre_archivo VARCHAR(255) NOT NULL,
    url_original VARCHAR(500),
    fecha_subida TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES Usuario(id_usuario) ON DELETE CASCADE
);

-- Tabla: Imagen (para imágenes procesadas)
CREATE TABLE IF NOT EXISTS Imagen (
    id_imagen INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT,
    id_resultado INT,
    ruta_imagen VARCHAR(255) NOT NULL,
    fecha_subida DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    estado ENUM('pendiente', 'procesado', 'error') NOT NULL,
    FOREIGN KEY (id_usuario) REFERENCES Usuario(id_usuario) ON DELETE CASCADE,
    FOREIGN KEY (id_resultado) REFERENCES Resultado(id_resultado) ON DELETE SET NULL
);

-- Tabla: Amigos
CREATE TABLE IF NOT EXISTS Amigos (
    id_amistad INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT,
    amigo_id INT,
    estado ENUM('pendiente', 'aceptado', 'rechazado') DEFAULT 'pendiente',
    fecha_solicitud TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES Usuario(id_usuario) ON DELETE CASCADE,
    FOREIGN KEY (amigo_id) REFERENCES Usuario(id_usuario) ON DELETE CASCADE,
    UNIQUE KEY unique_friendship (usuario_id, amigo_id),
    INDEX idx_amigos_usuario (usuario_id, estado),
    INDEX idx_amigos_amigo (amigo_id, estado)
);

-- Tabla: SolicitudAdmin
CREATE TABLE IF NOT EXISTS SolicitudAdmin (
    id_solicitud INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT NOT NULL,
    razon TEXT NOT NULL,
    estado ENUM('pendiente', 'aprobada', 'rechazada') DEFAULT 'pendiente',
    fecha_solicitud TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_respuesta TIMESTAMP NULL,
    admin_id INT NULL,
    FOREIGN KEY (usuario_id) REFERENCES Usuario(id_usuario) ON DELETE CASCADE,
    FOREIGN KEY (admin_id) REFERENCES Usuario(id_usuario)
);

-- Tabla para conversaciones entre usuarios
CREATE TABLE IF NOT EXISTS Conversacion (
    id_conversacion INT AUTO_INCREMENT PRIMARY KEY,
    usuario1_id INT NOT NULL,
    usuario2_id INT NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ultimo_mensaje_fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario1_id) REFERENCES Usuario(id_usuario) ON DELETE CASCADE,
    FOREIGN KEY (usuario2_id) REFERENCES Usuario(id_usuario) ON DELETE CASCADE,
    INDEX idx_usuarios (usuario1_id, usuario2_id)
);

-- Tabla para mensajes
CREATE TABLE IF NOT EXISTS Mensaje (
    id_mensaje INT AUTO_INCREMENT PRIMARY KEY,
    id_conversacion INT NOT NULL,
    id_remitente INT NOT NULL,
    contenido TEXT,
    tipo_mensaje ENUM('texto', 'imagen', 'emoji') DEFAULT 'texto',
    url_archivo VARCHAR(500) NULL,
    fecha_envio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    leido BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (id_conversacion) REFERENCES Conversacion(id_conversacion) ON DELETE CASCADE,
    FOREIGN KEY (id_remitente) REFERENCES Usuario(id_usuario) ON DELETE CASCADE,
    INDEX idx_conversacion_fecha (id_conversacion, fecha_envio),
    INDEX idx_remitente (id_remitente)
);

-- Tabla para reacciones a mensajes (emoticones)
CREATE TABLE IF NOT EXISTS ReaccionMensaje (
    id_reaccion INT AUTO_INCREMENT PRIMARY KEY,
    id_mensaje INT NOT NULL,
    id_usuario INT NOT NULL,
    emoji VARCHAR(10) NOT NULL,
    fecha_reaccion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_mensaje) REFERENCES Mensaje(id_mensaje) ON DELETE CASCADE,
    FOREIGN KEY (id_usuario) REFERENCES Usuario(id_usuario) ON DELETE CASCADE,
    UNIQUE KEY unique_user_reaction (id_mensaje, id_usuario)
);

-- Tabla para estado de lectura de conversaciones
CREATE TABLE IF NOT EXISTS EstadoConversacion (
    id_estado INT AUTO_INCREMENT PRIMARY KEY,
    id_conversacion INT NOT NULL,
    id_usuario INT NOT NULL,
    ultimo_mensaje_leido INT NULL,
    fecha_ultima_lectura TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_conversacion) REFERENCES Conversacion(id_conversacion) ON DELETE CASCADE,
    FOREIGN KEY (id_usuario) REFERENCES Usuario(id_usuario) ON DELETE CASCADE,
    FOREIGN KEY (ultimo_mensaje_leido) REFERENCES Mensaje(id_mensaje) ON DELETE SET NULL,
    UNIQUE KEY unique_user_conversation (id_conversacion, id_usuario)
);

-- Crear índices adicionales para optimización
CREATE INDEX idx_solicitud_admin_usuario ON SolicitudAdmin(usuario_id, estado);
CREATE INDEX idx_sesion_usuario ON SesionUsuario(id_usuario, fecha_inicio);
CREATE INDEX idx_imagenes_usuario ON Imagenes(usuario_id, fecha_subida);
CREATE INDEX idx_imagen_usuario ON Imagen(id_usuario, estado); 