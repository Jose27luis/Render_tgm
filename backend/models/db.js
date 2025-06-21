const mysql = require('mysql2');
require('dotenv').config();

// Configuración inicial sin base de datos
const initialConnection = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '75318092',
    port: process.env.DB_PORT || 3306
});

// Crear la base de datos y configurar las tablas
initialConnection.connect((err) => {
    if (err) {
        console.error('Error al conectar al servidor MySQL:', err);
        return;
    }
    console.log('Conexión inicial al servidor MySQL establecida');

    // Crear la base de datos si no existe
    initialConnection.query('CREATE DATABASE IF NOT EXISTS render_tgm', (err) => {
        if (err) {
            console.error('Error al crear la base de datos:', err);
            return;
        }
        console.log('Base de datos creada o ya existente');
        
        // Cerrar la conexión inicial
        initialConnection.end();

        // Crear la conexión final con la base de datos seleccionada
        const connection = mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '75318092',
            database: process.env.DB_NAME || 'render_tgm',
            port: process.env.DB_PORT || 3306
        });

        // Conectar con la base de datos
        connection.connect((err) => {
            if (err) {
                console.error('Error al conectar a la base de datos:', err);
                return;
            }
            console.log('Conexión a la base de datos establecida');

            // Crear las tablas necesarias
            const createTables = `
                CREATE TABLE IF NOT EXISTS Usuario (
                    id_usuario INT PRIMARY KEY AUTO_INCREMENT,
                    nombre VARCHAR(100) NOT NULL,
                    correo VARCHAR(100) NOT NULL UNIQUE,
                    contrasena VARCHAR(255) NOT NULL,
                    rol ENUM('usuario', 'admin', 'superadmin') DEFAULT 'usuario',
                    foto_perfil VARCHAR(255),
                    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );

                CREATE TABLE IF NOT EXISTS Imagenes (
                    id_imagen INT PRIMARY KEY AUTO_INCREMENT,
                    usuario_id INT,
                    nombre_archivo VARCHAR(255) NOT NULL,
                    fecha_subida TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (usuario_id) REFERENCES Usuario(id_usuario)
                );

                CREATE TABLE IF NOT EXISTS SesionUsuario (
                    id_sesion INT AUTO_INCREMENT PRIMARY KEY,
                    id_usuario INT,
                    fecha_inicio DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    ip VARCHAR(45),
                    FOREIGN KEY (id_usuario) REFERENCES Usuario(id_usuario)
                );

                CREATE TABLE IF NOT EXISTS Resultado (
                    id_resultado INT AUTO_INCREMENT PRIMARY KEY,
                    ruta_resultado VARCHAR(255) NOT NULL,
                    fecha_proceso DATETIME NOT NULL,
                    porcentaje_precision DECIMAL(5,2)
                );

                CREATE TABLE IF NOT EXISTS Imagen (
                    id_imagen INT AUTO_INCREMENT PRIMARY KEY,
                    id_usuario INT,
                    id_resultado INT,
                    fecha_subida DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    estado ENUM('pendiente', 'procesado', 'error') NOT NULL,
                    FOREIGN KEY (id_usuario) REFERENCES Usuario(id_usuario),
                    FOREIGN KEY (id_resultado) REFERENCES Resultado(id_resultado)
                );

                CREATE TABLE IF NOT EXISTS Amigos (
                    id_amistad INT AUTO_INCREMENT PRIMARY KEY,
                    usuario_id INT,
                    amigo_id INT,
                    estado ENUM('pendiente', 'aceptado', 'rechazado') DEFAULT 'pendiente',
                    fecha_solicitud TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    FOREIGN KEY (usuario_id) REFERENCES Usuario(id_usuario),
                    FOREIGN KEY (amigo_id) REFERENCES Usuario(id_usuario),
                    UNIQUE KEY unique_friendship (usuario_id, amigo_id)
                );

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
            `;
            
            connection.query(createTables, (err) => {
                if (err) {
                    console.error('Error al crear las tablas:', err);
                    return;
                }
                console.log('Tablas creadas correctamente');
            });
        });

        // Manejar errores de conexión
        connection.on('error', (err) => {
            console.error('Error de conexión a la base de datos:', err);
            if (err.code === 'PROTOCOL_CONNECTION_LOST') {
                console.log('Conexión a la base de datos perdida. Reconectando...');
                connection.connect();
            } else {
                throw err;
            }
        });

        // Exportar la conexión
        module.exports = connection;
    });
}); 