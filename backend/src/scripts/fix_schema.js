const { getPool } = require('../config/database');

const fixSchema = async () => {
    let pool;
    try {
        console.log('🔄 Iniciando la corrección del esquema de la base de datos...');
        pool = await getPool();

        // 1. Comprobar si la columna ya existe
        const [columns] = await pool.query(
            "SHOW COLUMNS FROM `Imagen` LIKE 'id_imagen_original'"
        );

        if (columns.length > 0) {
            console.log('✅ La columna `id_imagen_original` ya existe. No se necesita ninguna acción.');
        } else {
            // 2. Si no existe, añadirla
            console.log('Columna `id_imagen_original` no encontrada. Añadiéndola...');
            await pool.query(
                'ALTER TABLE `Imagen` ADD COLUMN `id_imagen_original` INT NULL AFTER `id_usuario`, ADD KEY `idx_id_imagen_original` (`id_imagen_original`)'
            );
            console.log('✅ Columna `id_imagen_original` añadida correctamente.');

            // 3. Añadir la clave foránea (FOREIGN KEY) para mantener la integridad de los datos
            await pool.query(
                'ALTER TABLE `Imagen` ADD CONSTRAINT `fk_imagen_original` FOREIGN KEY (`id_imagen_original`) REFERENCES `Imagenes`(`id_imagen`) ON DELETE CASCADE'
            );
            console.log('✅ Clave foránea `fk_imagen_original` añadida correctamente.');
        }
        
        console.log('🎉 ¡El esquema de la base de datos ha sido corregido exitosamente!');

    } catch (error) {
        console.error('❌ Error al corregir el esquema:', error);
    } finally {
        if (pool) {
            await pool.end();
            console.log('🔚 Conexión cerrada.');
        }
    }
};

fixSchema(); 