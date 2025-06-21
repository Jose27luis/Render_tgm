const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '75318092',
    database: 'render_tgm'
  });

  try {
    console.log('🔄 Conectando a la base de datos...');
    
    console.log('📋 Ejecutando migración paso a paso...');
    console.log('⚠️  ADVERTENCIA: Esto eliminará y recreará la tabla Imagen');
    
    // Paso 1: Verificar estructura actual
    console.log('🔍 Paso 1: Verificando estructura actual...');
    try {
      const [imagenesStructure] = await connection.execute('DESCRIBE Imagenes');
      console.log('Estructura actual de Imagenes:', imagenesStructure.map(col => col.Field));
    } catch (e) {
      console.log('⚠️  Tabla Imagenes no encontrada o error:', e.message);
    }
    
    try {
      const [imagenStructure] = await connection.execute('DESCRIBE Imagen');
      console.log('Estructura actual de Imagen:', imagenStructure.map(col => col.Field));
    } catch (e) {
      console.log('⚠️  Tabla Imagen no encontrada o error:', e.message);
    }
    
    // Paso 2: Actualizar tabla Imagenes
    console.log('🔧 Paso 2: Actualizando tabla Imagenes...');
    try {
      await connection.execute(`
        ALTER TABLE Imagenes 
        ADD COLUMN url_original VARCHAR(500) NULL AFTER nombre_archivo
      `);
      console.log('✅ Columna url_original agregada a Imagenes');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log('✅ Columna url_original ya existe en Imagenes');
      } else {
        console.log('⚠️  Error al agregar columna:', e.message);
      }
    }
    
    // Paso 3: Recrear tabla Imagen
    console.log('🔧 Paso 3: Recreando tabla Imagen...');
    await connection.execute('DROP TABLE IF EXISTS Imagen');
    
    await connection.execute(`
      CREATE TABLE Imagen (
        id_imagen INT AUTO_INCREMENT PRIMARY KEY,
        id_usuario INT NOT NULL,
        id_imagen_original INT NULL,
        ruta_imagen VARCHAR(500) NOT NULL,
        estado ENUM('pendiente', 'procesado', 'error', 'procesada', 'enhanced', 'combined') NOT NULL DEFAULT 'pendiente',
        metadata JSON NULL,
        fecha_subida DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        fecha_procesamiento DATETIME NULL,
        FOREIGN KEY (id_usuario) REFERENCES Usuario(id_usuario) ON DELETE CASCADE,
        FOREIGN KEY (id_imagen_original) REFERENCES Imagenes(id_imagen) ON DELETE CASCADE
      )
    `);
    
    // Paso 4: Agregar índices
    console.log('🔧 Paso 4: Agregando índices...');
    await connection.execute('CREATE INDEX idx_imagen_usuario ON Imagen(id_usuario)');
    await connection.execute('CREATE INDEX idx_imagen_original ON Imagen(id_imagen_original)');
    await connection.execute('CREATE INDEX idx_imagen_estado ON Imagen(estado)');
    
    console.log('✅ Migración completada exitosamente');
    console.log('🔍 Verificando nueva estructura...');
    
    // Verificar estructura de Imagenes
    const [imagenesStructure] = await connection.execute('DESCRIBE Imagenes');
    console.log('\n📊 Estructura de tabla Imagenes:');
    console.table(imagenesStructure);
    
    // Verificar estructura de Imagen
    const [imagenStructure] = await connection.execute('DESCRIBE Imagen');
    console.log('\n📊 Estructura de tabla Imagen:');
    console.table(imagenStructure);
    
  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  runMigration()
    .then(() => {
      console.log('\n🎉 Migración completada. Puedes reiniciar el servidor backend.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Error fatal:', error);
      process.exit(1);
    });
}

module.exports = runMigration; 