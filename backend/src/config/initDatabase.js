const fs = require('fs').promises;
const path = require('path');
const { getPool } = require('./database');

async function initDatabase() {
    try {
        const pool = await getPool();
        
        // Leer el archivo SQL
        const sqlFile = await fs.readFile(path.join(__dirname, 'database.sql'), 'utf8');
        
        // Dividir el archivo en consultas individuales
        const queries = sqlFile
            .split(';')
            .filter(query => query.trim())
            .map(query => query.trim() + ';');
        
        // Ejecutar cada consulta
        for (const query of queries) {
            try {
                await pool.execute(query);
                console.log('Consulta ejecutada exitosamente');
            } catch (error) {
                if (error.code === 'ER_TABLE_EXISTS_ERROR') {
                    console.log('La tabla ya existe, continuando...');
                } else {
                    console.error('Error al ejecutar consulta:', error);
                    throw error;
                }
            }
        }
        
        console.log('Base de datos inicializada correctamente');
    } catch (error) {
        console.error('Error al inicializar la base de datos:', error);
        process.exit(1);
    }
}

// Si este archivo se ejecuta directamente (no se importa como módulo)
if (require.main === module) {
    initDatabase();
}

module.exports = initDatabase; 