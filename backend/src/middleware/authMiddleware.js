const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ message: 'No se proporcionó token de autenticación' });
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Formato de token inválido' });
        }

        if (!process.env.JWT_SECRET) {
            console.error('JWT_SECRET no está definido');
            return res.status(500).json({ message: 'Error en la configuración del servidor' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expirado' });
        }
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Token inválido' });
        }
        console.error('Error en autenticación:', error);
        res.status(500).json({ message: 'Error en la autenticación' });
    }
};

module.exports = authMiddleware; 