const mysql = require('mysql2/promise');
const fs = require('fs');
require('dotenv').config();

async function createTables() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'render_tgm'
    });

    console.log('Conectado a la base de datos');

    const sql = fs.readFileSync('src/config/chat_tables.sql', 'utf8');
    const statements = sql.split(';').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        await connection.execute(statement);
        console.log('Tabla creada exitosamente');
      }
    }
    
    await connection.end();
    console.log('Todas las tablas del chat han sido creadas exitosamente');
  } catch (error) {
    console.error('Error al crear las tablas:', error);
  }
}

createTables(); 