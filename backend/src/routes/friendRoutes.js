const express = require('express');
const router = express.Router();
const friendController = require('../controllers/friendController');
const authMiddleware = require('../middleware/authMiddleware');

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Rutas de amigos
router.get('/search', friendController.searchUsers);
router.get('/', friendController.getFriends);
router.get('/requests', friendController.getFriendRequests);
router.post('/request', friendController.sendFriendRequest);
router.post('/respond', friendController.respondToFriendRequest);
router.post('/accept/:id', friendController.respondToFriendRequest);
router.post('/reject/:id', friendController.rejectFriendRequest);

module.exports = router; 