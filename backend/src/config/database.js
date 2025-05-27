const mysql = require('mysql2/promise');
require('dotenv').config();

// Verificar que todas las variables de entorno necesarias estén definidas
const requiredEnvVars = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('Error: Faltan las siguientes variables de entorno:', missingEnvVars);
  console.error('Por favor, verifica que el archivo .env existe y contiene todas las variables necesarias.');
  process.exit(1);
}

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  // Agregando timeout más largo para conexiones lentas
  connectTimeout: 30000,
  // Configuración SSL (comentada por defecto)
  // ssl: {
  //   rejectUnauthorized: false
  // }
};

console.log('Configuración de la base de datos:', {
  host: dbConfig.host,
  user: dbConfig.user,
  database: dbConfig.database,
  // No mostramos la contraseña por seguridad
});

// Crear pool de conexiones
const pool = mysql.createPool(dbConfig);

// Función para probar la conexión
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('Conexión a la base de datos establecida correctamente');
    
    // Verificar que la tabla Usuario existe
    const [tables] = await connection.query('SHOW TABLES LIKE "Usuario"');
    if (tables.length === 0) {
      console.warn('¡Advertencia! La tabla Usuario no existe');
    } else {
      // Obtener la estructura de la tabla
      const [columns] = await connection.query('DESCRIBE Usuario');
      console.log('Estructura de la tabla Usuario:', columns.map(col => col.Field));
    }
    
    connection.release();
    return true;
  } catch (error) {
    console.error('Error al conectar con la base de datos:');
    console.error('Mensaje:', error.message);
    if (error.code) console.error('Código de error:', error.code);
    if (error.errno) console.error('Número de error:', error.errno);
    if (error.sqlState) console.error('Estado SQL:', error.sqlState);
    if (error.sqlMessage) console.error('Mensaje SQL:', error.sqlMessage);
    
    // Sugerencias basadas en el código de error
    switch (error.code) {
      case 'ECONNREFUSED':
        console.error('Sugerencia: El servidor de base de datos no está aceptando conexiones. Verifica que:');
        console.error('1. La dirección IP y el puerto son correctos');
        console.error('2. El servidor MySQL está en ejecución');
        console.error('3. El firewall permite conexiones al puerto 3306');
        break;
      case 'ER_ACCESS_DENIED_ERROR':
        console.error('Sugerencia: Credenciales incorrectas. Verifica:');
        console.error('1. El nombre de usuario es correcto');
        console.error('2. La contraseña es correcta');
        console.error('3. El usuario tiene permisos para conectarse desde tu IP');
        break;
      case 'ER_BAD_DB_ERROR':
        console.error('Sugerencia: La base de datos no existe. Verifica:');
        console.error('1. El nombre de la base de datos es correcto');
        console.error('2. La base de datos ha sido creada');
        break;
    }
    
    throw error;
  }
};

// Función para ejecutar queries con manejo de errores
const executeQuery = async (query, params = []) => {
  try {
    const [results] = await pool.execute(query, params);
    return results;
  } catch (error) {
    console.error('Error al ejecutar query:', error.message);
    throw error;
  }
};

// Manejar errores de conexión a nivel de pool
pool.on('error', (err) => {
  console.error('Error inesperado en el pool de conexiones:', err);
});

module.exports = {
  pool,
  testConnection,
  executeQuery
}; 