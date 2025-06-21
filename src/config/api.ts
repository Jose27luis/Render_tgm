import axios from 'axios';

export const SERVER_URL = 'http://localhost:5000';

const api = axios.create({
  baseURL: `${SERVER_URL}/api`,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para agregar el token a todas las solicitudes
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de respuesta
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// --- ADMIN ---
export const getAllUsers = () => api.get('/admin/users');
export const getUserDetails = (userId) => api.get(`/admin/users/${userId}`);
export const getPendingAdminRequests = () => api.get('/admin/pending');
export const handleAdminRequest = (data) => api.put('/admin/handle', data);
export const getAdminList = () => api.get('/admin/list');
export const removeAdmin = (id) => api.delete(`/admin/remove/${id}`);
export const acceptFriendRequestAdmin = (id) => api.post(`/admin/requests/${id}/accept`);
export const rejectFriendRequestAdmin = (id) => api.post(`/admin/requests/${id}/reject`);
export const createAdminRequest = (data) => api.post('/user/requestAdmin', data);

// --- USER ---
export const registerUser = (data) => api.post('/auth/register', data);
export const loginUser = (data) => api.post('/auth/login', data);
export const getUserNotifications = () => api.get('/usuarios/notificaciones');

// --- FRIENDS ---
export const getFriends = () => api.get('/user/amigos');
export const sendFriendRequest = (data) => api.post('/user/solicitudes', data);
export const getMyFriendRequests = () => api.get('/user/misSolicitudes');
export const rejectFriendRequest = (id) => api.delete(`/user/eliminarSolicitudes/${id}`);
export const acceptFriendRequest = (id) => api.put(`/user/aceptarSolicitudes/${id}`);
export const searchPeople = (query) => api.get(`/user/buscarPersonas?query=${encodeURIComponent(query)}`);

// --- IMAGES ---
export const getImages = () => api.get('/images');
export const getOriginalImages = () => api.get('/images/originales');
export const getProcessedImages = () => api.get('/images/procesadas');
export const uploadImage = (data) => api.post('/images/upload', data, { headers: { 'Content-Type': undefined } });
export const deleteImage = (id) => api.delete(`/images/${id}`);
export const mejorarImagen = (imageId) => api.post(`/images/${imageId}/mejorar`);

// --- CHAT ---
export const getConversations = () => api.get('/chat/conversations');
export const getOrCreateConversation = (friendId) => api.get(`/chat/conversation/${friendId}`);
export const getMessages = (conversationId, page = 1, limit = 50) => 
  api.get(`/chat/messages/${conversationId}?page=${page}&limit=${limit}`);
export const sendMessage = (conversationId, data) => 
  api.post(`/chat/messages/${conversationId}`, data);
export const sendImage = (conversationId, formData) => 
  api.post(`/chat/messages/${conversationId}/image`, formData, { 
    headers: { 'Content-Type': 'multipart/form-data' } 
  });
export const markAsRead = (conversationId) => 
  api.put(`/chat/messages/${conversationId}/read`);
export const addReaction = (messageId, emoji) => 
  api.post(`/chat/reactions/${messageId}`, { emoji });
export const removeReaction = (messageId) => 
  api.delete(`/chat/reactions/${messageId}`);

// --- OTROS ---
export const getStatus = () => api.get('/status'); 