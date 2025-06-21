const { getPool } = require('../config/database');

const checkTables = async () => {
  try {
    console.log('Conectando a la base de datos...');
    const pool = await getPool();
    
    // Verificar qué tablas existen
    const [tables] = await pool.execute(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = DATABASE()
    `);
    
    console.log('Tablas en la base de datos:');
    tables.forEach(table => console.log('-', table.TABLE_NAME));
    
    // Verificar estructura de tabla mensaje
    console.log('\nEstructura de tabla mensaje:');
    const [messageColumns] = await pool.execute(`
      SELECT COLUMN_NAME, DATA_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'mensaje'
    `);
    
    messageColumns.forEach(col => console.log('-', col.COLUMN_NAME, ':', col.DATA_TYPE));
    
    // Verificar estructura de tabla usuario
    console.log('\nEstructura de tabla usuario:');
    const [userColumns] = await pool.execute(`
      SELECT COLUMN_NAME, DATA_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'usuario'
    `);
    
    userColumns.forEach(col => console.log('-', col.COLUMN_NAME, ':', col.DATA_TYPE));
    
    // Verificar si hay datos en las tablas
    const [messageCount] = await pool.execute('SELECT COUNT(*) as count FROM mensaje');
    const [userCount] = await pool.execute('SELECT COUNT(*) as count FROM usuario');
    const [conversationCount] = await pool.execute('SELECT COUNT(*) as count FROM conversacion');
    
    console.log('\nConteo de registros:');
    console.log('- Mensajes:', messageCount[0].count);
    console.log('- Usuarios:', userCount[0].count);
    console.log('- Conversaciones:', conversationCount[0].count);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al verificar tablas:', error);
    process.exit(1);
  }
};

checkTables(); 