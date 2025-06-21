const { getPool } = require('../config/database');
const bcrypt = require('bcrypt');

async function updatePassword() {
    try {
        const pool = await getPool();
        
        // Generar el hash de la contraseña
        const hashedPassword = await bcrypt.hash('75318092', 10);
        
        // Actualizar la contraseña en la base de datos
        await pool.execute(
            'UPDATE Usuario SET contrasena = ? WHERE correo = ?',
            [hashedPassword, 'jtecoluisgarciajoae@gmail.com']
        );
        
        console.log('Contraseña actualizada correctamente');
        
        // Verificar la actualización
        const [users] = await pool.execute(
            'SELECT id_usuario, nombre, correo, contrasena FROM Usuario WHERE correo = ?',
            ['jtecoluisgarciajoae@gmail.com']
        );
        
        if (users.length > 0) {
            const user = users[0];
            console.log('Usuario actualizado:');
            console.log('ID:', user.id_usuario);
            console.log('Nombre:', user.nombre);
            console.log('Correo:', user.correo);
            console.log('Nueva contraseña hasheada:', user.contrasena);
            
            // Verificar que la contraseña coincide
            const validPassword = await bcrypt.compare('75318092', user.contrasena);
            console.log('¿La contraseña es válida?:', validPassword);
        }
    } catch (error) {
        console.error('Error al actualizar la contraseña:', error);
    } finally {
        process.exit();
    }
}

updatePassword(); 