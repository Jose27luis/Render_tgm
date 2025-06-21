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
    List,
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

const ChatSystemWorking: React.FC = () => {
  const [chatOpen, setChatOpen] = useState(false);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentUserId = parseInt(localStorage.getItem('userId') || '0');

  useEffect(() => {
    if (chatOpen) {
      loadFriends();
      loadConversations();
    }
  }, [chatOpen]);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages();
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

  const loadMessages = async () => {
    if (!selectedConversation) return;
    
    try {
      const response = await api.getMessages(selectedConversation.id_conversacion);
      setMessages(response.data);
      await api.markAsRead(selectedConversation.id_conversacion);
    } catch (error) {
      console.error('Error al cargar mensajes:', error);
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
      loadConversations();
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
      loadConversations();
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

  return (
    <>
      <Zoom in={!chatOpen}>
        <Fab
          color="primary"
          sx={{
            position: 'fixed',
            bottom: 20,
            right: 20,
            background: 'linear-gradient(45deg, #2196f3 30%, #21CBF3 90%)',
            '&:hover': {
              transform: 'scale(1.1)',
              transition: 'transform 0.2s'
            }
          }}
          onClick={() => setChatOpen(true)}
        >
          <ChatIcon />
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
            background: 'linear-gradient(to bottom right, #0a1929 0%, #132f4c 100%)',
            color: 'white'
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <Typography variant="h6">
            {selectedConversation ? `Chat con ${selectedConversation.amigo_nombre}` : 'Chat'}
          </Typography>
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
            <Typography variant="subtitle1" sx={{ p: 2, borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
              Conversaciones
            </Typography>
            
            <List sx={{ flex: 1, overflow: 'auto' }}>
              {conversations.map((conversation) => (
                <ListItem
                  key={conversation.id_conversacion}
                  button
                  selected={selectedConversation?.id_conversacion === conversation.id_conversacion}
                  onClick={() => setSelectedConversation(conversation)}
                  sx={{
                    '&.Mui-selected': {
                      backgroundColor: 'rgba(33, 150, 243, 0.2)'
                    },
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.05)'
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
                      <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                        {conversation.ultimo_mensaje && (
                          <>
                            {conversation.ultimo_mensaje_propio && 'Tú: '}
                            {conversation.ultimo_tipo === 'imagen' ? '📷 Imagen' : conversation.ultimo_mensaje}
                          </>
                        )}
                      </Typography>
                    }
                  />
                </ListItem>
              ))}
            </List>
            
            <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} />
            
            <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
              <Typography variant="subtitle2" sx={{ p: 1, opacity: 0.7 }}>
                Iniciar conversación
              </Typography>
              {friends.filter(friend => 
                !conversations.some(conv => conv.amigo_id === friend.id_usuario)
              ).map((friend) => (
                <ListItem
                  key={friend.id_usuario}
                  button
                  onClick={() => startConversation(friend)}
                  sx={{
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
                <Box sx={{ 
                  flex: 1, 
                  overflow: 'auto', 
                  p: 2,
                  background: 'rgba(255, 255, 255, 0.02)'
                }}>
                  {messages.map((message) => {
                    const isOwn = message.id_remitente === currentUserId;
                    return (
                      <Box
                        key={message.id_mensaje}
                        sx={{
                          display: 'flex',
                          justifyContent: isOwn ? 'flex-end' : 'flex-start',
                          mb: 1,
                          alignItems: 'flex-end'
                        }}
                      >
                        {!isOwn && (
                          <Avatar
                            src={message.remitente_foto ? `${api.SERVER_URL}${message.remitente_foto}` : undefined}
                            sx={{ width: 32, height: 32, mr: 1 }}
                          >
                            {message.remitente_nombre.charAt(0)}
                          </Avatar>
                        )}
                        
                        <Box sx={{ maxWidth: '70%' }}>
                          <Paper
                            sx={{
                              p: 1.5,
                              backgroundColor: isOwn ? '#2196f3' : '#f5f5f5',
                              color: isOwn ? 'white' : 'black',
                              borderRadius: isOwn ? '18px 18px 4px 18px' : '18px 18px 18px 4px'
                            }}
                          >
                            {message.tipo_mensaje === 'imagen' ? (
                              <Box>
                                <img
                                  src={`${api.SERVER_URL}${message.url_archivo}`}
                                  alt="Imagen"
                                  style={{
                                    maxWidth: '100%',
                                    maxHeight: '200px',
                                    borderRadius: '8px'
                                  }}
                                />
                                <Typography variant="caption" sx={{ display: 'block', mt: 0.5, opacity: 0.8 }}>
                                  {message.contenido}
                                </Typography>
                              </Box>
                            ) : (
                              <Typography variant="body2">
                                {message.contenido}
                              </Typography>
                            )}
                            
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                display: 'block', 
                                mt: 0.5, 
                                opacity: 0.7,
                                fontSize: '0.7rem'
                              }}
                            >
                              {formatTime(message.fecha_envio)}
                            </Typography>
                          </Paper>
                        </Box>
                      </Box>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </Box>

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

export default ChatSystemWorking; 