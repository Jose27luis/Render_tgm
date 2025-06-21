const { getPool } = require('../config/database');
const bcrypt = require('bcrypt');

async function checkUser() {
    try {
        const pool = await getPool();
        const [users] = await pool.execute(
            'SELECT id_usuario, nombre, correo, contrasena, rol FROM Usuario WHERE correo = ?',
            ['jtecoluisgarciajoae@gmail.com']
        );

        if (users.length === 0) {
            console.log('Usuario no encontrado en la base de datos');
            return;
        }

        const user = users[0];
        console.log('Usuario encontrado:');
        console.log('ID:', user.id_usuario);
        console.log('Nombre:', user.nombre);
        console.log('Correo:', user.correo);
        console.log('Rol:', user.rol);
        console.log('Contraseña hasheada:', user.contrasena);

        // Verificar si la contraseña coincide
        const validPassword = await bcrypt.compare('75318092', user.contrasena);
        console.log('¿La contraseña es válida?:', validPassword);

    } catch (error) {
        console.error('Error al verificar usuario:', error);
    } finally {
        process.exit();
    }
}

checkUser(); 