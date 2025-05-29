const { pool } = require('../config/database');

const createAdminRequest = async (req, res) => {
    try {
        const { reason } = req.body;
        const userId = req.user.userId;

        // Verificar si ya existe una solicitud pendiente
        const [existingRequests] = await pool.execute(
            'SELECT * FROM SolicitudAdmin WHERE usuario_id = ? AND estado = "pendiente"',
            [userId]
        );

        if (existingRequests.length > 0) {
            return res.status(400).json({ message: 'Ya tienes una solicitud pendiente' });
        }

        // Crear nueva solicitud
        await pool.execute(
            'INSERT INTO SolicitudAdmin (usuario_id, razon) VALUES (?, ?)',
            [userId, reason]
        );

        res.status(201).json({ message: 'Solicitud enviada correctamente' });
    } catch (error) {
        console.error('Error al crear solicitud:', error);
        res.status(500).json({ message: 'Error al procesar la solicitud' });
    }
};

const getPendingRequests = async (req, res) => {
    try {
        // Obtener solicitudes pendientes con información del usuario
        const [requests] = await pool.execute(`
            SELECT s.*, u.nombre, u.correo 
            FROM SolicitudAdmin s
            JOIN Usuario u ON s.usuario_id = u.id_usuario
            WHERE s.estado = 'pendiente'
            ORDER BY s.fecha_solicitud DESC
        `);

        res.json(requests);
    } catch (error) {
        console.error('Error al obtener solicitudes:', error);
        res.status(500).json({ message: 'Error al obtener las solicitudes' });
    }
};

const handleAdminRequest = async (req, res) => {
    try {
        const { requestId, action } = req.body;

        // Actualizar el estado de la solicitud
        await pool.execute(
            'UPDATE SolicitudAdmin SET estado = ?, admin_id = ?, fecha_respuesta = CURRENT_TIMESTAMP WHERE id_solicitud = ?',
            [action, req.user.userId, requestId]
        );

        // Si la solicitud es aprobada, actualizar el rol del usuario
        if (action === 'aprobada') {
            const [request] = await pool.execute(
                'SELECT usuario_id FROM SolicitudAdmin WHERE id_solicitud = ?',
                [requestId]
            );

            if (request.length > 0) {
                await pool.execute(
                    'UPDATE Usuario SET rol = "admin" WHERE id_usuario = ?',
                    [request[0].usuario_id]
                );
            }
        }

        res.json({ message: `Solicitud ${action} correctamente` });
    } catch (error) {
        console.error('Error al procesar solicitud:', error);
        res.status(500).json({ message: 'Error al procesar la solicitud' });
    }
};

// Nuevas funciones para el superadministrador

const getAllAdmins = async (req, res) => {
    try {
        const [admins] = await pool.execute(`
            SELECT id_usuario, nombre, correo, fecha_registro
            FROM Usuario
            WHERE rol = 'admin'
            ORDER BY fecha_registro DESC
        `);

        res.json(admins);
    } catch (error) {
        console.error('Error al obtener lista de administradores:', error);
        res.status(500).json({ message: 'Error al obtener la lista de administradores' });
    }
};

const removeAdmin = async (req, res) => {
    try {
        const { adminId } = req.params;

        // Verificar que el usuario a remover no sea el superadmin
        const [adminToRemove] = await pool.execute(
            'SELECT correo FROM Usuario WHERE id_usuario = ?',
            [adminId]
        );

        if (adminToRemove.length > 0 && adminToRemove[0].correo === 'rmontufarm@unamad.edu.pe') {
            return res.status(403).json({ message: 'No se puede remover al superadministrador' });
        }

        // Cambiar el rol de admin a usuario
        await pool.execute(
            'UPDATE Usuario SET rol = "usuario" WHERE id_usuario = ? AND rol = "admin"',
            [adminId]
        );

        res.json({ message: 'Administrador removido correctamente' });
    } catch (error) {
        console.error('Error al remover administrador:', error);
        res.status(500).json({ message: 'Error al remover el administrador' });
    }
};

module.exports = {
    createAdminRequest,
    getPendingRequests,
    handleAdminRequest,
    getAllAdmins,
    removeAdmin
}; 