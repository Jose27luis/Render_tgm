require("dotenv").config();
const { pool } = require("../config/database");

const initializeDatabase = async () => {
  try {
    // Drop existing tables if they exist (in reverse order of dependencies)
    console.log("Dropping existing tables...");
    await pool.execute("DROP TABLE IF EXISTS Amigos");
    await pool.execute("DROP TABLE IF EXISTS SolicitudAmistad");
    await pool.execute("DROP TABLE IF EXISTS SolicitudAdmin");
    await pool.execute("DROP TABLE IF EXISTS Imagen");
    await pool.execute("DROP TABLE IF EXISTS Imagenes");
    await pool.execute("DROP TABLE IF EXISTS Resultado");
    await pool.execute("DROP TABLE IF EXISTS SesionUsuario");
    await pool.execute("DROP TABLE IF EXISTS Usuario");

    // Crear tabla usuario
    console.log("Creando la tabla de usuario...");
    await pool.execute(`
            CREATE TABLE Usuario (
                id_usuario INT PRIMARY KEY AUTO_INCREMENT,
                nombre VARCHAR(100) NOT NULL,
                correo VARCHAR(100) UNIQUE NOT NULL,
                contrasena VARCHAR(255) NOT NULL,
                rol ENUM('usuario', 'admin', 'superusuario') DEFAULT 'usuario',
                foto_perfil VARCHAR(255),
                fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

    // Create SolicitudAmistad table
    console.log("Creating SolicitudAmistad table...");
    await pool.execute(`
            CREATE TABLE SolicitudAmistad (
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

    // Create Amigos table
    console.log("Creating Amigos table...");
    await pool.execute(`
            CREATE TABLE Amigos (
                id_amistad INT PRIMARY KEY AUTO_INCREMENT,
                id_usuario1 INT NOT NULL,
                id_usuario2 INT NOT NULL,
                fecha_amistad TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (id_usuario1) REFERENCES Usuario(id_usuario) ON DELETE CASCADE,
                FOREIGN KEY (id_usuario2) REFERENCES Usuario(id_usuario) ON DELETE CASCADE,
                UNIQUE KEY unique_amistad (id_usuario1, id_usuario2)
            )
        `);

    // Create SolicitudAdmin table
    console.log("Creating SolicitudAdmin table...");
    await pool.execute(`
            CREATE TABLE SolicitudAdmin (
                id_solicitud INT PRIMARY KEY AUTO_INCREMENT,
                usuario_id INT NOT NULL,
                razon TEXT NOT NULL,
                estado ENUM('pendiente', 'aprobada', 'rechazada') DEFAULT 'pendiente',
                fecha_solicitud TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                fecha_respuesta TIMESTAMP NULL,
                admin_id INT NULL,
                FOREIGN KEY (usuario_id) REFERENCES Usuario(id_usuario) ON DELETE CASCADE,
                FOREIGN KEY (admin_id) REFERENCES Usuario(id_usuario)
            )
        `);

    // Create indexes
    console.log("Creating indexes...");
    await pool.execute(
      "CREATE INDEX idx_solicitud_receptor ON SolicitudAmistad(id_usuario_receptor, estado)"
    );
    await pool.execute(
      "CREATE INDEX idx_solicitud_solicitante ON SolicitudAmistad(id_usuario_solicitante, estado)"
    );
    await pool.execute(
      "CREATE INDEX idx_amigos_usuario1 ON Amigos(id_usuario1)"
    );
    await pool.execute(
      "CREATE INDEX idx_amigos_usuario2 ON Amigos(id_usuario2)"
    );

    // Verify tables
    const [tables] = await pool.query("SHOW TABLES");
    console.log(
      "\nCreated tables:",
      tables.map((t) => Object.values(t)[0])
    );

    console.log("\nDatabase initialization completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error initializing database:", error);
    process.exit(1);
  }
};

// Run the initialization
initializeDatabase();
