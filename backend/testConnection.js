const { initializeDatabase } = require('./src/config/database');
const { initializeTables } = require('./src/config/initDb');

async function test() {
    try {
        // Inicializar la base de datos y obtener el pool inicial
        console.log('Inicializando base de datos...');
        const initialPool = await initializeDatabase();
        
        // Inicializar las tablas y obtener el pool final
        console.log('Inicializando tablas...');
        const pool = await initializeTables(initialPool);
        
        // Probar una consulta simple
        const [rows] = await pool.query('SHOW TABLES');
        console.log('Tablas en la base de datos:', rows.map(row => Object.values(row)[0]));
        
        console.log('¡Todo configurado correctamente!');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

test(); 