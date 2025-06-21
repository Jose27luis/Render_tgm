const { getPool } = require('../config/database');

async function updateRole() {
    try {
        const pool = await getPool();
        
        // Primero respaldamos los datos actuales
        const [users] = await pool.execute('SELECT * FROM Usuario');
        
        // Modificamos la tabla
        await pool.execute('ALTER TABLE Usuario DROP COLUMN rol');
        await pool.execute(`
            ALTER TABLE Usuario 
            ADD COLUMN rol ENUM('usuario', 'admin', 'superusuario') DEFAULT 'usuario'
        `);
        
        console.log('Tabla Usuario modificada correctamente');
        
        // Restauramos los roles anteriores y actualizamos el usuario específico
        for (const user of users) {
            let rol = user.rol;
            if (user.correo === 'jtecoluisgarciajoae@gmail.com') {
                rol = 'superusuario';
            }
            await pool.execute(
                'UPDATE Usuario SET rol = ? WHERE id_usuario = ?',
                [rol, user.id_usuario]
            );
        }
        
        console.log('Roles restaurados y actualizados correctamente');
        
        // Verificamos la actualización
        const [updatedUser] = await pool.execute(
            'SELECT id_usuario, nombre, correo, rol FROM Usuario WHERE correo = ?',
            ['jtecoluisgarciajoae@gmail.com']
        );
        
        if (updatedUser.length > 0) {
            const user = updatedUser[0];
            console.log('Usuario actualizado:');
            console.log('ID:', user.id_usuario);
            console.log('Nombre:', user.nombre);
            console.log('Correo:', user.correo);
            console.log('Rol:', user.rol);
        }
    } catch (error) {
        console.error('Error al actualizar el rol:', error);
    } finally {
        process.exit();
    }
}

updateRole(); 