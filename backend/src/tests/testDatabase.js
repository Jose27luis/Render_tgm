const { testConnection } = require('../config/database');

console.log('Iniciando prueba de conexión a la base de datos...');
console.log('Verificando variables de entorno:');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_NAME:', process.env.DB_NAME);

// Intentar establecer la conexión
testConnection()
  .then(() => {
    console.log('✅ Prueba completada exitosamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Prueba fallida');
    process.exit(1);
  }); 