import {
    Chat as ChatIcon,
    Close as CloseIcon,
    PhotoCamera as PhotoIcon,
    Send as SendIcon
} from '@mui/icons-material';
import {
    Avatar,
    Badge,
    Box,
    Dialog,
    DialogContent,
    DialogTitle,
    Divider,
    Fab,
    IconButton,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Paper,
    TextField,
    Typography,
    Zoom
} from '@mui/material';
import React, { useEffect, useRef, useState } from 'react';
import * as api from '../config/api';

// --- NUEVA FUNCIÓN HELPER ---
function getCurrentUserId(): number {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      // Asumiendo que el ID está en user.id o user.id_usuario
      return parseInt(user.id || user.id_usuario || '0', 10);
    } catch (e) {
      console.error("Error al parsear datos de usuario:", e);
      return 0;
    }
  }
  return 0;
}

interface Friend {
  id_usuario: number;
  nombre: string;
  foto_perfil?: string;
}

interface Conversation {
  id_conversacion: number;
  amigo_id: number;
  amigo_nombre: string;
  amigo_foto?: string;
  ultimo_mensaje?: string;
  ultimo_tipo?: string;
  ultimo_mensaje_propio: boolean;
  ultimo_mensaje_fecha: string;
  mensajes_no_leidos: number;
}

interface Message {
  id_mensaje: number;
  contenido: string;
  tipo_mensaje: 'texto' | 'imagen';
  url_archivo?: string;
  fecha_envio: string;
  remitente_nombre: string;
  remitente_foto?: string;
  id_remitente: number;
}

const ChatSystemSimple: React.FC = () => {
  const [chatOpen, setChatOpen] = useState(false);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentUserId] = useState<number>(getCurrentUserId());

  useEffect(() => {
    if (chatOpen) {
      loadFriends();
      loadConversations();
    }
  }, [chatOpen]);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(true, true); // Mostrar loading en la carga inicial
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Polling para actualizar mensajes cada 3 segundos
  useEffect(() => {
    let interval: number;
    
    if (chatOpen && selectedConversation) {
      interval = setInterval(() => {
        loadMessages(false); // No marcar como leído en actualizaciones automáticas
        loadConversations(); // También actualizar la lista de conversaciones
      }, 3000);
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [chatOpen, selectedConversation]);

  // Polling para actualizar conversaciones cuando el chat está abierto
  useEffect(() => {
    let interval: number;
    
    if (chatOpen) {
      interval = setInterval(() => {
        loadConversations();
      }, 5000); // Cada 5 segundos
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [chatOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadFriends = async () => {
    try {
      const response = await api.getFriends();
      setFriends(response.data);
    } catch (error) {
      console.error('Error al cargar amigos:', error);
    }
  };

  const loadConversations = async () => {
    try {
      const response = await api.getConversations();
      setConversations(response.data);
    } catch (error) {
      console.error('Error al cargar conversaciones:', error);
    }
  };

  const loadMessages = async (markRead = true, showLoading = false) => {
    if (!selectedConversation) return;
    
    try {
      if (showLoading) setIsLoadingMessages(true);
      
      const response = await api.getMessages(selectedConversation.id_conversacion);
      setMessages(response.data);
      
      // Solo marcar como leído si es la primera carga o si se especifica
      if (markRead) {
        await api.markAsRead(selectedConversation.id_conversacion);
      }
    } catch (error) {
      console.error('Error al cargar mensajes:', error);
    } finally {
      if (showLoading) setIsLoadingMessages(false);
    }
  };

  const startConversation = async (friend: Friend) => {
    try {
      const response = await api.getOrCreateConversation(friend.id_usuario);
      const conversationId = response.data.conversationId;
      
      let conversation = conversations.find(c => c.id_conversacion === conversationId);
      
      if (!conversation) {
        conversation = {
          id_conversacion: conversationId,
          amigo_id: friend.id_usuario,
          amigo_nombre: friend.nombre,
          amigo_foto: friend.foto_perfil,
          ultimo_mensaje_fecha: new Date().toISOString(),
          ultimo_mensaje_propio: false,
          mensajes_no_leidos: 0
        };
        setConversations(prev => [conversation!, ...prev]);
      }
      
      setSelectedConversation(conversation);
    } catch (error) {
      console.error('Error al iniciar conversación:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      const response = await api.sendMessage(selectedConversation.id_conversacion, {
        contenido: newMessage,
        tipo_mensaje: 'texto'
      });
      
      setMessages(prev => [...prev, response.data]);
      setNewMessage('');
      
      // Actualizar conversaciones inmediatamente después de enviar
      setTimeout(() => {
        loadConversations();
      }, 100);
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
    }
  };

  const sendImage = async (file: File) => {
    if (!selectedConversation) return;

    try {
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await api.sendImage(selectedConversation.id_conversacion, formData);
      setMessages(prev => [...prev, response.data]);
      
      // Actualizar conversaciones inmediatamente después de enviar
      setTimeout(() => {
        loadConversations();
      }, 100);
    } catch (error) {
      console.error('Error al enviar imagen:', error);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      sendImage(file);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const totalUnreadMessages = conversations.reduce((total, conv) => total + conv.mensajes_no_leidos, 0);

  return (
    <>
      <Zoom in={!chatOpen}>
        <Fab
          color="primary"
          onClick={() => setChatOpen(true)}
          sx={{
            position: 'fixed',
            bottom: 20,
            right: 20,
            background: 'linear-gradient(45deg, #2196f3 30%, #21CBF3 90%)',
            boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
            zIndex: 1000
          }}
        >
          <Badge badgeContent={totalUnreadMessages} color="error">
            <ChatIcon />
          </Badge>
        </Fab>
      </Zoom>

      <Dialog
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            height: '80vh',
            background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
            color: 'white'
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          background: 'linear-gradient(45deg, #2196f3 30%, #21CBF3 90%)',
          color: 'white'
        }}>
          <Typography variant="h6">Chat</Typography>
          <IconButton onClick={() => setChatOpen(false)} sx={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 0, display: 'flex', height: '100%' }}>
          <Box sx={{ 
            width: 300, 
            borderRight: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <Typography variant="h6" sx={{ p: 2, borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
              Conversaciones
            </Typography>
            
            <Box sx={{ flex: 1, overflow: 'auto' }}>
              {conversations.map((conversation) => (
                <ListItem
                  key={conversation.id_conversacion}
                  button
                  onClick={() => {
                    setSelectedConversation(conversation);
                    // Marcar como leído inmediatamente al seleccionar
                    if (conversation.mensajes_no_leidos > 0) {
                      api.markAsRead(conversation.id_conversacion);
                    }
                  }}
                  selected={selectedConversation?.id_conversacion === conversation.id_conversacion}
                  sx={{
                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                    '&.Mui-selected': {
                      backgroundColor: 'rgba(33, 150, 243, 0.2)'
                    }
                  }}
                >
                  <ListItemAvatar>
                    <Badge badgeContent={conversation.mensajes_no_leidos} color="error">
                      <Avatar
                        src={conversation.amigo_foto ? `${api.SERVER_URL}${conversation.amigo_foto}` : undefined}
                      >
                        {conversation.amigo_nombre.charAt(0)}
                      </Avatar>
                    </Badge>
                  </ListItemAvatar>
                  <ListItemText
                    primary={conversation.amigo_nombre}
                    secondary={
                      <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                        {conversation.ultimo_mensaje || 'Sin mensajes'}
                      </Typography>
                    }
                  />
                </ListItem>
              ))}
            </Box>

            <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} />
            
            <Typography variant="subtitle2" sx={{ p: 2 }}>
              Amigos
            </Typography>
            
            <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
              {friends.map((friend) => (
                <ListItem
                  key={friend.id_usuario}
                  button
                  onClick={() => startConversation(friend)}
                  sx={{
                    py: 1,
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.05)'
                    }
                  }}
                >
                  <ListItemAvatar>
                    <Avatar
                      src={friend.foto_perfil ? `${api.SERVER_URL}${friend.foto_perfil}` : undefined}
                      sx={{ width: 32, height: 32 }}
                    >
                      {friend.nombre.charAt(0)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography variant="body2">
                        {friend.nombre}
                      </Typography>
                    }
                  />
                </ListItem>
              ))}
            </Box>
          </Box>

          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {selectedConversation ? (
              <>
                <Typography variant="h6" sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                  {selectedConversation.amigo_nombre}
                </Typography>

                <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
                  {isLoadingMessages ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                      <Typography>Cargando mensajes...</Typography>
                    </Box>
                  ) : (
                    messages.map((msg) => {
                      const isSender = msg.id_remitente === currentUserId;
                      return (
                        <Box
                          key={msg.id_mensaje}
                          sx={{
                            display: 'flex',
                            justifyContent: isSender ? 'flex-end' : 'flex-start',
                            mb: 2,
                            flexDirection: 'row',
                            alignItems: 'flex-end'
                          }}
                        >
                          {!isSender && (
                              <Avatar 
                                sx={{ width: 32, height: 32, mr: 1, mb: 1 }} 
                                src={msg.remitente_foto}
                              >
                                {msg.remitente_nombre.charAt(0).toUpperCase()}
                              </Avatar>
                          )}
                          <Paper
                            elevation={2}
                            sx={{
                              p: 1.5,
                              borderRadius: isSender ? '20px 20px 5px 20px' : '20px 20px 20px 5px',
                              bgcolor: isSender ? '#1976d2' : '#e0e0e0',
                              color: isSender ? 'white' : 'black',
                              maxWidth: '75%',
                            }}
                          >
                            {msg.tipo_mensaje === 'imagen' && msg.url_archivo ? (
                              <Box
                                component="a"
                                href={`${api.SERVER_URL}${msg.url_archivo}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                sx={{ textDecoration: 'none', color: 'inherit' }}
                              >
                                <img
                                  src={`${api.SERVER_URL}${msg.url_archivo}`}
                                  alt="Imagen adjunta"
                                  style={{
                                    maxWidth: '100%',
                                    height: 'auto',
                                    borderRadius: '12px',
                                    display: 'block',
                                  }}
                                />
                                {msg.contenido && (
                                  <Typography variant="body2" sx={{ mt: 1 }}>
                                    {msg.contenido}
                                  </Typography>
                                )}
                              </Box>
                            ) : (
                              <Typography variant="body2">{msg.contenido}</Typography>
                            )}
                            <Typography
                              variant="caption"
                              sx={{
                                display: 'block',
                                textAlign: 'right',
                                color: isSender ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
                                mt: 0.5,
                              }}
                            >
                              {formatTime(msg.fecha_envio)}
                            </Typography>
                          </Paper>
                        </Box>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </Box>

                <Divider />

                <Box sx={{ 
                  p: 2, 
                  borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                  display: 'flex',
                  gap: 1,
                  alignItems: 'flex-end'
                }}>
                  <TextField
                    fullWidth
                    multiline
                    maxRows={3}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Escribe un mensaje..."
                    variant="outlined"
                    size="small"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        color: 'white',
                        '& fieldset': {
                          borderColor: 'rgba(255, 255, 255, 0.3)'
                        },
                        '&:hover fieldset': {
                          borderColor: 'rgba(255, 255, 255, 0.5)'
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#2196f3'
                        }
                      },
                      '& .MuiInputBase-input::placeholder': {
                        color: 'rgba(255, 255, 255, 0.5)'
                      }
                    }}
                  />
                  
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    onChange={handleFileSelect}
                  />
                  
                  <IconButton
                    onClick={() => fileInputRef.current?.click()}
                    sx={{ color: 'white' }}
                  >
                    <PhotoIcon />
                  </IconButton>
                  
                  <IconButton
                    onClick={sendMessage}
                    disabled={!newMessage.trim()}
                    sx={{ 
                      color: 'white',
                      backgroundColor: newMessage.trim() ? '#2196f3' : 'transparent',
                      '&:hover': {
                        backgroundColor: newMessage.trim() ? '#1976d2' : 'rgba(255, 255, 255, 0.1)'
                      }
                    }}
                  >
                    <SendIcon />
                  </IconButton>
                </Box>
              </>
            ) : (
              <Box sx={{ 
                flex: 1, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                flexDirection: 'column',
                gap: 2
              }}>
                <ChatIcon sx={{ fontSize: 64, opacity: 0.3 }} />
                <Typography variant="h6" sx={{ opacity: 0.7 }}>
                  Selecciona una conversación para comenzar
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.5, textAlign: 'center' }}>
                  Elige un amigo de la lista o inicia una nueva conversación
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ChatSystemSimple; 