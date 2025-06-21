const { pool } = require('./database');

const setupDatabase = async () => {
    try {
        // Verificar y crear la tabla Usuario si no existe
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS Usuario (
                id_usuario INT PRIMARY KEY AUTO_INCREMENT,
                nombre VARCHAR(100) NOT NULL,
                correo VARCHAR(100) UNIQUE NOT NULL,
                contrasena VARCHAR(255) NOT NULL,
                rol ENUM('usuario', 'admin', 'superadmin') DEFAULT 'usuario',
                foto_perfil VARCHAR(255),
                fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✓ Tabla Usuario verificada/creada');

        // Verificar y crear la tabla SolicitudAmistad si no existe
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS SolicitudAmistad (
                id_solicitud INT PRIMARY KEY AUTO_INCREMENT,
                id_usuario_solicitante INT NOT NULL,
                id_usuario_receptor INT NOT NULL,
                estado ENUM('pendiente', 'aceptada', 'rechazada') DEFAULT 'pendiente',
                fecha_solicitud TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (id_usuario_solicitante) REFERENCES Usuario(id_usuario) ON DELETE CASCADE,
                FOREIGN KEY (id_usuario_receptor) REFERENCES Usuario(id_usuario) ON DELETE CASCADE,
                UNIQUE KEY unique_solicitud (id_usuario_solicitante, id_usuario_receptor)
            )
        `);
        console.log('✓ Tabla SolicitudAmistad verificada/creada');

        // Verificar y crear la tabla Amigos si no existe
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS Amigos (
                id_amistad INT PRIMARY KEY AUTO_INCREMENT,
                id_usuario1 INT NOT NULL,
                id_usuario2 INT NOT NULL,
                fecha_amistad TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (id_usuario1) REFERENCES Usuario(id_usuario) ON DELETE CASCADE,
                FOREIGN KEY (id_usuario2) REFERENCES Usuario(id_usuario) ON DELETE CASCADE,
                UNIQUE KEY unique_amistad (id_usuario1, id_usuario2)
            )
        `);
        console.log('✓ Tabla Amigos verificada/creada');

        // Crear índices para optimizar las búsquedas
        await pool.execute('CREATE INDEX IF NOT EXISTS idx_solicitud_receptor ON SolicitudAmistad(id_usuario_receptor, estado)');
        await pool.execute('CREATE INDEX IF NOT EXISTS idx_solicitud_solicitante ON SolicitudAmistad(id_usuario_solicitante, estado)');
        await pool.execute('CREATE INDEX IF NOT EXISTS idx_amigos_usuario1 ON Amigos(id_usuario1)');
        await pool.execute('CREATE INDEX IF NOT EXISTS idx_amigos_usuario2 ON Amigos(id_usuario2)');
        console.log('✓ Índices verificados/creados');

        // Verificar la estructura de las tablas
        const [tables] = await pool.query('SHOW TABLES');
        console.log('\nTablas existentes:', tables.map(t => Object.values(t)[0]));

        for (const table of ['Usuario', 'SolicitudAmistad', 'Amigos']) {
            const [columns] = await pool.query(`DESCRIBE ${table}`);
            console.log(`\nEstructura de la tabla ${table}:`);
            console.log(columns.map(col => ({
                Field: col.Field,
                Type: col.Type,
                Null: col.Null,
                Key: col.Key,
                Default: col.Default
            })));
        }

        console.log('\n✓ Configuración de la base de datos completada');
    } catch (error) {
        console.error('Error al configurar la base de datos:', error);
        throw error;
    }
};

// Ejecutar la configuración si este archivo se ejecuta directamente
if (require.main === module) {
    setupDatabase()
        .then(() => process.exit(0))
        .catch(error => {
            console.error('Error fatal:', error);
            process.exit(1);
        });
}

module.exports = setupDatabase; 