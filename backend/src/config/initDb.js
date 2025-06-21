const fs = require('fs');
const path = require('path');

async function initializeTables(pool) {
    try {
        // Read the SQL file
        const sqlFile = fs.readFileSync(path.join(__dirname, '../../database.sql'), 'utf8');
        
        // Split the SQL file into individual statements
        const statements = sqlFile.split(';').filter(statement => statement.trim());
        
        console.log('Initializing tables...');
        
        // Primero ejecutar los comandos de la base de datos
        for (let i = 0; i < 2; i++) {
            if (statements[i].trim()) {
                try {
                    await pool.execute(statements[i]);
                    console.log('Successfully executed:', statements[i].substring(0, 50) + '...');
                } catch (error) {
                    console.error('Error executing statement:', error.message);
                    console.error('Statement:', statements[i]);
                    throw error;
                }
            }
        }

        // Crear un nuevo pool con la base de datos seleccionada
        const dbConfig = {
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '75318092',
            database: process.env.DB_NAME || 'render_tgm',
            port: process.env.DB_PORT || 3306,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        };

        const newPool = await require('mysql2/promise').createPool(dbConfig);
        
        // Ejecutar el resto de las sentencias para crear las tablas
        for (let i = 2; i < statements.length; i++) {
            if (statements[i].trim()) {
                try {
                    await newPool.execute(statements[i]);
                    console.log('Successfully executed:', statements[i].substring(0, 50) + '...');
                } catch (error) {
                    if (error.code === 'ER_TABLE_EXISTS_ERROR') {
                        console.log('Table already exists, continuing...');
                    } else {
                        console.error('Error executing statement:', error.message);
                        console.error('Statement:', statements[i]);
                        throw error;
                    }
                }
            }
        }
        
        console.log('Tables initialization completed successfully!');
        return newPool;
    } catch (error) {
        console.error('Error initializing tables:', error);
        throw error;
    }
}

// Export the initialization function
module.exports = {
    initializeTables
}; 