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
    Chip,
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
    Menu,
    Paper,
    TextField,
    Typography,
    Zoom
} from '@mui/material';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { AnimatePresence, motion } from 'framer-motion';
import React, { useEffect, useRef, useState } from 'react';
import * as api from '../config/api';

// Emojis disponibles
const EMOJIS = ['😀', '😂', '😍', '😢', '😮', '😡', '👍', '👎', '❤️', '🔥', '💯', '🎉'];

interface Message {
  id_mensaje: number;
  contenido: string;
  tipo_mensaje: 'texto' | 'imagen' | 'emoji';
  url_archivo?: string;
  fecha_envio: string;
  leido: boolean;
  remitente_nombre: string;
  remitente_foto?: string;
  id_remitente: number;
  reacciones: Array<{
    emoji: string;
    userId: number;
    userName: string;
  }>;
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

interface Friend {
  id_usuario: number;
  nombre: string;
  foto_perfil?: string;
}

const ChatSystem: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [emojiMenuAnchor, setEmojiMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedMessageForReaction, setSelectedMessageForReaction] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentUserId = parseInt(localStorage.getItem('userId') || '0');

  useEffect(() => {
    if (chatOpen) {
      loadConversations();
      loadFriends();
    }
  }, [chatOpen]);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages();
      markAsRead();
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = async () => {
    try {
      const response = await api.getConversations();
      setConversations(response.data);
    } catch (error) {
      console.error('Error al cargar conversaciones:', error);
    }
  };

  const loadFriends = async () => {
    try {
      const response = await api.getFriends();
      setFriends(response.data);
    } catch (error) {
      console.error('Error al cargar amigos:', error);
    }
  };

  const loadMessages = async () => {
    if (!selectedConversation) return;
    
    try {
      setLoading(true);
      const response = await api.getMessages(selectedConversation.id_conversacion);
      setMessages(response.data);
    } catch (error) {
      console.error('Error al cargar mensajes:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async () => {
    if (!selectedConversation) return;
    
    try {
      await api.markAsRead(selectedConversation.id_conversacion);
      // Actualizar contador de no leídos
      setConversations(prev => 
        prev.map(conv => 
          conv.id_conversacion === selectedConversation.id_conversacion
            ? { ...conv, mensajes_no_leidos: 0 }
            : conv
        )
      );
    } catch (error) {
      console.error('Error al marcar como leído:', error);
    }
  };

  const startConversation = async (friend: Friend) => {
    try {
      const response = await api.getOrCreateConversation(friend.id_usuario);
      const conversationId = response.data.conversationId;
      
      // Buscar si ya existe en la lista
      let conversation = conversations.find(c => c.id_conversacion === conversationId);
      
      if (!conversation) {
        // Crear objeto de conversación temporal
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

  const sendTextMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      const response = await api.sendMessage(selectedConversation.id_conversacion, {
        contenido: newMessage,
        tipo_mensaje: 'texto'
      });
      
      setMessages(prev => [...prev, response.data]);
      setNewMessage('');
      loadConversations(); // Actualizar lista de conversaciones
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
    }
  };

  const sendImageMessage = async (file: File) => {
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
      sendImageMessage(file);
    }
  };

  const handleEmojiSelect = async (emoji: string) => {
    if (selectedMessageForReaction) {
      try {
        await api.addReaction(selectedMessageForReaction, emoji);
        loadMessages(); // Recargar mensajes para mostrar la reacción
      } catch (error) {
        console.error('Error al agregar reacción:', error);
      }
    }
    setEmojiMenuAnchor(null);
    setSelectedMessageForReaction(null);
  };

  const handleMessageReaction = (messageId: number, event: React.MouseEvent) => {
    setSelectedMessageForReaction(messageId);
    setEmojiMenuAnchor(event.currentTarget as HTMLElement);
  };

  const formatTime = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { 
      addSuffix: true, 
      locale: es 
    });
  };

  const MessageBubble: React.FC<{ message: Message }> = ({ message }) => {
    const isOwn = message.id_remitente === currentUserId;
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Box
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
                borderRadius: isOwn ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                cursor: 'pointer',
                '&:hover': {
                  transform: 'scale(1.02)',
                  transition: 'transform 0.2s'
                }
              }}
              onClick={(e) => handleMessageReaction(message.id_mensaje, e)}
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
            
            {/* Reacciones */}
            {message.reacciones.length > 0 && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                {message.reacciones.map((reaccion, index) => (
                  <Chip
                    key={index}
                    label={`${reaccion.emoji} ${reaccion.userName}`}
                    size="small"
                    sx={{ 
                      height: 20, 
                      fontSize: '0.7rem',
                      backgroundColor: 'rgba(33, 150, 243, 0.1)'
                    }}
                  />
                ))}
              </Box>
            )}
          </Box>
        </Box>
      </motion.div>
    );
  };

  return (
    <AnimatePresence>
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
            {selectedConversation ? selectedConversation.amigo_nombre : 'Chat'}
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
                  <Typography variant="h6" sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                    {selectedConversation.amigo_nombre}
                  </Typography>

                  <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
                    {loading ? (
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
                            }}
                          >
                            <Box
                              sx={{
                                maxWidth: '70%',
                              }}
                            >
                              <Paper
                                elevation={1}
                                sx={{
                                  p: 1.5,
                                  borderRadius: 4,
                                  bgcolor: isSender ? 'primary.main' : 'background.paper',
                                  color: isSender ? 'primary.contrastText' : 'text.primary',
                                }}
                              >
                                <Typography variant="body2">{msg.contenido}</Typography>
                              </Paper>
                              <Typography
                                variant="caption"
                                sx={{
                                  display: 'block',
                                  textAlign: isSender ? 'right' : 'left',
                                  mt: 0.5,
                                  color: 'text.secondary',
                                }}
                              >
                                {formatTime(msg.fecha_envio)}
                              </Typography>
                            </Box>
                          </Box>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </Box>
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
                        sendTextMessage();
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
                    onClick={sendTextMessage}
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
              </Box>
            )}
          </Box>
        </DialogContent>

        {selectedConversation && (
          <>
            <Divider />
            <Box sx={{ p: 2, display: 'flex', alignItems: 'center', bgcolor: 'background.default' }}>
              <IconButton onClick={() => fileInputRef.current?.click()}>
                <PhotoIcon />
              </IconButton>
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleFileSelect}
                accept="image/*"
              />
              <TextField
                fullWidth
                variant="outlined"
                size="small"
                placeholder="Escribe un mensaje..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendTextMessage()}
                sx={{ mr: 1, borderRadius: 20 }}
              />
              <IconButton color="primary" onClick={sendTextMessage}>
                <SendIcon />
              </IconButton>
            </Box>
          </>
        )}
      </Dialog>

      <Menu
        anchorEl={emojiMenuAnchor}
        open={Boolean(emojiMenuAnchor)}
        onClose={() => setEmojiMenuAnchor(null)}
      >
        <Box sx={{ p: 1, display: 'flex', flexWrap: 'wrap', maxWidth: 200 }}>
          {EMOJIS.map(emoji => (
            <IconButton key={emoji} onClick={() => handleEmojiSelect(emoji)} size="small">
              {emoji}
            </IconButton>
          ))}
        </Box>
      </Menu>
    </AnimatePresence>
  );
};

export default ChatSystem; 