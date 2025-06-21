const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { authenticateToken } = require('../middlewares/auth');

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Rutas de conversaciones
router.get('/conversations', chatController.getConversations);
router.get('/conversation/:friendId', chatController.getOrCreateConversation);

// Rutas de mensajes
router.get('/messages/:conversationId', chatController.getMessages);
router.post('/messages/:conversationId', chatController.sendMessage);
router.post('/messages/:conversationId/image', ...chatController.sendImage);
router.put('/messages/:conversationId/read', chatController.markAsRead);

// Rutas de reacciones
router.post('/reactions/:messageId', chatController.addReaction);
router.delete('/reactions/:messageId', chatController.removeReaction);

module.exports = router; 