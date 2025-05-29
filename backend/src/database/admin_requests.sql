CREATE TABLE IF NOT EXISTS SolicitudAdmin (
    id_solicitud INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT NOT NULL,
    razon TEXT NOT NULL,
    estado ENUM('pendiente', 'aprobada', 'rechazada') DEFAULT 'pendiente',
    fecha_solicitud TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_respuesta TIMESTAMP NULL,
    admin_id INT NULL,
    FOREIGN KEY (usuario_id) REFERENCES Usuario(id_usuario),
    FOREIGN KEY (admin_id) REFERENCES Usuario(id_usuario)
); 