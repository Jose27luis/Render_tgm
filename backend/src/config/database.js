const mysql = require('mysql2/promise');
require('dotenv').config();

// Configuración inicial sin base de datos
const initialConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '75318092',
    port: process.env.DB_PORT || 3306
};

// Configuración completa con base de datos
const dbConfig = {
    ...initialConfig,
    database: process.env.DB_NAME || 'render_tgm',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

let pool = null;

// Test the database connection and initialize if needed
async function testConnection() {
    try {
        // Primero crear una conexión sin base de datos
        const initialConnection = await mysql.createConnection(initialConfig);
        
        // Crear la base de datos si no existe
        await initialConnection.query(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database}`);
        
        // Cerrar la conexión inicial
        await initialConnection.end();
        
        // Crear el pool con la base de datos seleccionada
        pool = mysql.createPool(dbConfig);
        
        // Probar la conexión
        const connection = await pool.getConnection();
        console.log('Database connection successful');
        connection.release();
        
        return pool;
    } catch (error) {
        console.error('Error connecting to the database:', error);
        throw error;
    }
}

// Asegurarse de que el pool esté inicializado antes de usarlo
async function getPool() {
    if (!pool) {
        await testConnection();
    }
    return pool;
}

module.exports = {
    testConnection,
    getPool
}; 