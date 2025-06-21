const { getPool } = require('../config/database');
const fs = require('fs');
const path = require('path');

const createChatTables = async () => {
  try {
    console.log('Conectando a la base de datos...');
    const pool = await getPool();
    
    console.log('Leyendo archivo SQL...');
    const sqlFile = path.join(__dirname, '../config/chat_tables.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');
    
    // Dividir el SQL en declaraciones individuales
    const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);
    
    console.log('Ejecutando declaraciones SQL...');
    for (const statement of statements) {
      if (statement.trim()) {
        await pool.execute(statement.trim());
        console.log('✓ Declaración ejecutada correctamente');
      }
    }
    
    console.log('✅ Todas las tablas de chat han sido creadas exitosamente');
    
    // Verificar que las tablas existen
    const [tables] = await pool.execute(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME IN ('Conversacion', 'Mensaje', 'ReaccionMensaje', 'EstadoConversacion')
    `);
    
    console.log('Tablas de chat encontradas:', tables.map(t => t.TABLE_NAME));
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al crear las tablas de chat:', error);
    process.exit(1);
  }
};

createChatTables(); 