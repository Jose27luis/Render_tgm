const bcrypt = require("bcrypt");
const { getPool } = require("../config/database");

async function createAdmin() {
  try {
    const pool = await getPool();
    // Datos del administrador
    const adminData = {
      nombre: "TECO",
      correo: "18121040@gmail.com",
      contrasena: "75318092",
      rol: "admin",
    };

    // Encriptar la contraseña
    const hashedPassword = await bcrypt.hash(adminData.contrasena, 10);

    // Insertar el administrador
    const [result] = await pool.execute(
      "INSERT INTO Usuario (nombre, correo, contrasena, rol) VALUES (?, ?, ?, ?)",
      [adminData.nombre, adminData.correo, hashedPassword, adminData.rol]
    );

    console.log("Administrador creado exitosamente");
    console.log("Credenciales:");
    console.log("Email:", adminData.correo);
    console.log("Contraseña:", adminData.contrasena);

    process.exit(0);
  } catch (error) {
    console.error("Error al crear el administrador:", error);
    process.exit(1);
  }
}

createAdmin();
