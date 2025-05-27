const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

const register = async (req, res) => {
  try {
    const { nombre, correo, contraseña } = req.body;
    const hashedPassword = await bcrypt.hash(contraseña, 10);
    
    const [result] = await pool.execute(
      'INSERT INTO Usuario (nombre, correo, contraseña) VALUES (?, ?, ?)',
      [nombre, correo, hashedPassword]
    );

    res.status(201).json({ 
      message: 'Usuario registrado exitosamente',
      userId: result.insertId 
    });
  } catch (error) {
    console.error(error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'El correo ya está registrado' });
    }
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

const login = async (req, res) => {
  try {
    const { correo, contraseña } = req.body;
    
    const [users] = await pool.execute(
      'SELECT id_usuario, nombre, correo, contraseña, rol FROM Usuario WHERE correo = ?',
      [correo]
    );

    if (users.length === 0) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const user = users[0];
    const validPassword = await bcrypt.compare(contraseña, user.contraseña);

    if (!validPassword) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    // Registrar la sesión del usuario
    const [sesion] = await pool.execute(
      'INSERT INTO SesionUsuario (id_usuario, ip) VALUES (?, ?)',
      [user.id_usuario, req.ip]
    );

    const token = jwt.sign(
      { 
        userId: user.id_usuario, 
        email: user.correo,
        role: user.rol 
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ 
      token,
      user: {
        id: user.id_usuario,
        nombre: user.nombre,
        correo: user.correo,
        rol: user.rol
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

module.exports = {
  register,
  login
}; 