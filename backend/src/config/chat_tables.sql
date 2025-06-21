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

SHOW TABLES;

