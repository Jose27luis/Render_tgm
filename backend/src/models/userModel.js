const { pool } = require('../config/database');
const bcrypt = require('bcrypt');

class UserModel {
  static async findByEmail(email) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM Usuario WHERE correo = ?',
        [email]
      );
      return rows[0];
    } catch (error) {
      console.error('Error al buscar usuario por email:', error);
      throw error;
    }
  }

  static async create(userData) {
    const { nombre, correo, contrasena } = userData;
    try {
      // Encriptar contrasena
      const hashedPassword = await bcrypt.hash(contrasena, 10);
      
      const [result] = await pool.execute(
        'INSERT INTO Usuario (nombre, correo, contrasena) VALUES (?, ?, ?)',
        [nombre, correo, hashedPassword]
      );
      
      return result.insertId;
    } catch (error) {
      console.error('Error al crear usuario:', error);
      throw error;
    }
  }

  static async validatePassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
  }
}

module.exports = UserModel; 