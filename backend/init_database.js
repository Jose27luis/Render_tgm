const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function initializeDatabase() {
    try {
        // Configuración de la base de datos
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '75318092',
            port: 3306
        });

        console.log('🔄 Conectado a MySQL...');

        // Crear la base de datos si no existe
        await connection.query('CREATE DATABASE IF NOT EXISTS render_tgm');
        console.log('✅ Base de datos creada o ya existente');

        // Usar la base de datos
        await connection.query('USE render_tgm');

        // Leer el archivo SQL
        const sqlFile = path.join(__dirname, '..', 'database_complete.sql');
        const sql = fs.readFileSync(sqlFile, 'utf8');

        // Ejecutar las consultas SQL
        const queries = sql.split(';').filter(query => query.trim());
        for (const query of queries) {
            if (query.trim()) {
                await connection.query(query);
            }
        }

        console.log('✅ Tablas creadas exitosamente');
        await connection.end();
        console.log('🔚 Conexión cerrada');

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

initializeDatabase(); 