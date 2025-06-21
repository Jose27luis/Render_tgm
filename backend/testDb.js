const connection = require('./models/db');

// La conexión ya se establece automáticamente al importar el módulo
// El script terminará después de que se complete la inicialización de la base de datos
// o si ocurre un error

// Agregar un manejador para cerrar la conexión después de 5 segundos
// (tiempo suficiente para que se complete la inicialización)
setTimeout(() => {
    console.log('Cerrando conexión...');
    connection.end((err) => {
        if (err) {
            console.error('Error al cerrar la conexión:', err);
            process.exit(1);
        }
        console.log('Conexión cerrada correctamente');
        process.exit(0);
    });
}, 5000); 