const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { getPool } = require('../config/database');

const register = async (req, res) => {
  try {
    const { nombre, correo, contrasena } = req.body;
    
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET no está definido');
      return res.status(500).json({ message: 'Error en la configuración del servidor' });
    }

    const hashedPassword = await bcrypt.hash(contrasena, 10);
    
    console.log('Intentando registrar usuario:', { nombre, correo });
    
    const pool = await getPool();
    const [result] = await pool.execute(
      'INSERT INTO Usuario (nombre, correo, contrasena) VALUES (?, ?, ?)',
      [nombre, correo, hashedPassword]
    );

    console.log('Usuario insertado con ID:', result.insertId);

    // Get the created user data
    const [users] = await pool.execute(
      'SELECT id_usuario, nombre, correo, rol FROM Usuario WHERE id_usuario = ?',
      [result.insertId]
    );

    if (!users || users.length === 0) {
      console.error('No se pudo obtener los datos del usuario después de la inserción');
      return res.status(500).json({ message: 'Error al crear el usuario' });
    }

    const user = users[0];
    console.log('Datos del usuario recuperados:', user);

    // Create token for the new user
    const token = jwt.sign(
      { 
        id: user.id_usuario,
        email: user.correo,
        role: user.rol 
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    const responseData = { 
      token,
      user: {
        id: user.id_usuario,
        nombre: user.nombre,
        correo: user.correo,
        rol: user.rol
      }
    };

    console.log('Enviando respuesta:', responseData);
    res.status(201).json(responseData);
  } catch (error) {
    console.error('Error completo:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'El correo ya está registrado' });
    }
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

const login = async (req, res) => {
  try {
    const { correo, contrasena } = req.body;
    
    const pool = await getPool();
    const [users] = await pool.execute(
      'SELECT id_usuario, nombre, correo, contrasena, rol FROM Usuario WHERE correo = ?',
      [correo]
    );

    if (users.length === 0) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const user = users[0];
    const validPassword = await bcrypt.compare(contrasena, user.contrasena);

    if (!validPassword) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const token = jwt.sign(
      { 
        id: user.id_usuario,
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
    console.error('Error en login:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

module.exports = {
  register,
  login
}; 