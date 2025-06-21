const mysql = require('mysql2/promise');

// Configuración de la base de datos
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '75318092',
    database: 'render_tgm',
    port: 3306
};

async function testConnection() {
    try {
        console.log('🔄 Intentando conectar a MySQL...');
        
        // Crear conexión
        const connection = await mysql.createConnection(dbConfig);
        
        console.log('✅ Conexión a MySQL exitosa!');
        
        // Verificar que estamos en la base de datos correcta
        const [dbResult] = await connection.execute('SELECT DATABASE() as current_db');
        console.log(`📂 Base de datos actual: ${dbResult[0].current_db}`);
        
        // Mostrar todas las tablas
        const [tables] = await connection.execute('SHOW TABLES');
        console.log(`📊 Tablas encontradas (${tables.length}):`);
        tables.forEach((table, index) => {
            console.log(`   ${index + 1}. ${Object.values(table)[0]}`);
        });
        
        // Verificar tabla Usuario
        const [userCount] = await connection.execute('SELECT COUNT(*) as count FROM Usuario');
        console.log(`👤 Registros en tabla Usuario: ${userCount[0].count}`);
        
        // Verificar tabla Imagenes
        const [imageCount] = await connection.execute('SELECT COUNT(*) as count FROM Imagenes');
        console.log(`🖼️  Registros en tabla Imagenes: ${imageCount[0].count}`);
        
        await connection.end();
        console.log('🔚 Conexión cerrada correctamente');
        
    } catch (error) {
        console.error('❌ Error de conexión:', error.message);
        if (error.code) {
            console.error(`   Código de error: ${error.code}`);
        }
        process.exit(1);
    }
}

testConnection(); 