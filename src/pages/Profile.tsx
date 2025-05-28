import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  Avatar,
  Grid,
  TextField,
  Button,
  Alert,
  IconButton,
  CircularProgress,
  Snackbar,
  Tooltip,
  Collapse,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import PersonIcon from '@mui/icons-material/Person';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EmailIcon from '@mui/icons-material/Email';
import BadgeIcon from '@mui/icons-material/Badge';
import LockIcon from '@mui/icons-material/Lock';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import SendIcon from '@mui/icons-material/Send';
import api from '../config/api';
import FriendsManager from '../components/FriendsManager';

interface UserData {
  id: number;
  nombre: string;
  correo: string;
  rol: string;
  foto_perfil?: string;
  fecha_registro?: string;
}

// Componente para las figuras de fondo mejorado
const BackgroundShapes = () => (
  <>
    <Box
      component={motion.div}
      animate={{
        scale: [1, 1.2, 1],
        rotate: [0, 180, 360],
      }}
      transition={{
        duration: 15,
        repeat: Infinity,
        ease: "linear"
      }}
      sx={{
        position: 'fixed',
        top: '10%',
        left: '10%',
        width: '300px',
        height: '300px',
        borderRadius: '50%',
        background: 'linear-gradient(45deg, #2196f3 30%, #21CBF3 90%)',
        opacity: 0.1,
        filter: 'blur(40px)',
        zIndex: 0,
      }}
    />
    <Box
      component={motion.div}
      animate={{
        scale: [1, 1.3, 1],
        rotate: [360, 180, 0],
      }}
      transition={{
        duration: 20,
        repeat: Infinity,
        ease: "linear"
      }}
      sx={{
        position: 'fixed',
        bottom: '10%',
        right: '10%',
        width: '250px',
        height: '250px',
        borderRadius: '50%',
        background: 'linear-gradient(45deg, #21CBF3 30%, #90CAF9 90%)',
        opacity: 0.1,
        filter: 'blur(40px)',
        zIndex: 0,
      }}
    />
    <Box
      component={motion.div}
      animate={{
        scale: [1, 1.1, 1],
        rotate: [180, 360, 180],
      }}
      transition={{
        duration: 18,
        repeat: Infinity,
        ease: "linear"
      }}
      sx={{
        position: 'fixed',
        top: '40%',
        right: '20%',
        width: '200px',
        height: '200px',
        borderRadius: '30%',
        background: 'linear-gradient(45deg, #90CAF9 30%, #2196f3 90%)',
        opacity: 0.08,
        filter: 'blur(40px)',
        zIndex: 0,
      }}
    />
  </>
);

const Profile = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [editData, setEditData] = useState<Partial<UserData>>({});
  const [isUploading, setIsUploading] = useState(false);
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [openAdminRequest, setOpenAdminRequest] = useState(false);
  const [adminRequestReason, setAdminRequestReason] = useState('');

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await api.get('/user/profile');
        setUserData(response.data);
        setEditData(response.data);
      } catch (error) {
        console.error('Error al cargar el perfil:', error);
        setError('Error al cargar los datos del perfil');
        if (error.response?.status === 401) {
          navigate('/login');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar el tipo de archivo
    if (!file.type.startsWith('image/')) {
      setError('Por favor, selecciona un archivo de imagen válido');
      return;
    }

    // Validar el tamaño del archivo (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen no debe superar los 5MB');
      return;
    }

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('photo', file);

      const response = await api.post('/user/profile/photo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setUserData(prev => prev ? { ...prev, foto_perfil: response.data.foto_url } : null);
      setSuccess('Foto de perfil actualizada correctamente');
    } catch (err) {
      setError('Error al actualizar la foto de perfil');
    } finally {
      setIsUploading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      await api.put('/user/profile', editData);
      setUserData(prev => prev ? { ...prev, ...editData } : null);
      setIsEditing(false);
      setSuccess('Perfil actualizado correctamente');
    } catch (error) {
      setError('Error al actualizar el perfil');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handlePasswordChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  const handleSavePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
        setError('Las contraseñas no coinciden');
        return;
    }

    try {
      await api.put('/user/password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      setSuccess('Contraseña actualizada correctamente');
      setShowPasswordFields(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      setError('Error al actualizar la contraseña');
    }
  };

  const handleAdminRequest = async () => {
    try {
      await api.post('/user/admin-request', { reason: adminRequestReason });
      setSuccess('Solicitud enviada correctamente');
      setOpenAdminRequest(false);
      setAdminRequestReason('');
    } catch (error) {
      setError('Error al enviar la solicitud');
    }
  };

  if (isLoading) {
    return (
      <Box 
        sx={{ 
          minHeight: '100vh',
          width: '100%',
          background: 'linear-gradient(to bottom right, #0a1929 0%, #132f4c 100%)',
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100%',
        background: 'linear-gradient(135deg, #0a1929 0%, #132f4c 50%, #0a1929 100%)',
        position: 'relative',
        overflow: 'hidden',
        py: 4,
      }}
    >
      <BackgroundShapes />

      <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1 }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
          {/* Botón de retroceso */}
          <Box sx={{ mb: 3 }}>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                onClick={() => navigate(-1)}
                startIcon={<ArrowBackIcon />}
                sx={{
                  color: 'white',
                  '&:hover': {
                    background: 'rgba(255, 255, 255, 0.1)',
                  }
                }}
              >
                Volver
              </Button>
            </motion.div>
          </Box>

          <Paper
            elevation={3}
              sx={{
              p: 4,
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 4,
              boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
            }}
          >
            <Grid container spacing={4}>
              <Grid item xs={12} display="flex" justifyContent="center">
                <motion.div 
                  whileHover={{ scale: 1.05 }} 
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <Box position="relative">
                <Avatar
                      src={userData?.foto_perfil}
                  sx={{
                    width: 150,
                    height: 150,
                        border: '4px solid rgba(255, 255, 255, 0.2)',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                        background: theme => theme.palette.primary.main,
                  }}
                >
                      {!userData?.foto_perfil && <PersonIcon sx={{ fontSize: 80 }} />}
                </Avatar>
                <Tooltip title="Cambiar foto de perfil">
                  <IconButton
                        onClick={handlePhotoClick}
                        disabled={isUploading}
                    sx={{
                      position: 'absolute',
                      bottom: 0,
                      right: 0,
                      backgroundColor: 'primary.main',
                      '&:hover': {
                        backgroundColor: 'primary.dark',
                            transform: 'scale(1.1)',
                      },
                          transition: 'transform 0.2s',
                          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                    }}
                  >
                        {isUploading ? (
                      <CircularProgress size={24} color="inherit" />
                    ) : (
                      <PhotoCameraIcon />
                    )}
                  </IconButton>
                </Tooltip>
                <input
                  type="file"
                      hidden
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handlePhotoChange}
                />
              </Box>
                </motion.div>
              </Grid>

              <Grid item xs={12}>
                <Typography
                  variant="h4"
                  component={motion.h4}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  sx={{
                    textAlign: 'center',
                    mb: 4,
                    color: 'white',
                    textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
                    fontWeight: 600,
                    letterSpacing: 1,
                  }}
                >
                  {userData?.nombre}
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <motion.div whileHover={{ scale: 1.02 }}>
                  <TextField
                    fullWidth
                    label="Nombre"
                    name="nombre"
                    value={isEditing ? editData.nombre : userData?.nombre}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    placeholder="Tu nombre"
                    InputProps={{
                      startAdornment: <BadgeIcon sx={{ mr: 1, color: 'rgba(255, 255, 255, 0.7)' }} />,
                    }}
                    sx={{
                      mb: 3,
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': {
                          borderColor: 'rgba(255, 255, 255, 0.3)',
                          borderWidth: 2,
                        },
                        '&:hover fieldset': {
                          borderColor: 'rgba(255, 255, 255, 0.5)',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#90CAF9',
                        },
                      },
                      '& .MuiInputLabel-root': {
                        color: 'white',
                        fontSize: '1.1rem',
                      },
                      '& .MuiInputBase-input': {
                        color: 'white',
                        fontSize: '1.1rem',
                        '&::placeholder': {
                          color: 'rgba(255, 255, 255, 0.7)',
                          opacity: 1,
                        },
                      },
                    }}
                  />
                </motion.div>
              </Grid>

              <Grid item xs={12} md={6}>
                <motion.div whileHover={{ scale: 1.02 }}>
                  <TextField
                    fullWidth
                    label="Correo Electrónico"
                    name="correo"
                    value={isEditing ? editData.correo : userData?.correo}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    placeholder="tu.correo@ejemplo.com"
                    InputProps={{
                      startAdornment: <EmailIcon sx={{ mr: 1, color: 'rgba(255, 255, 255, 0.7)' }} />,
                    }}
                    sx={{
                      mb: 3,
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': {
                          borderColor: 'rgba(255, 255, 255, 0.3)',
                          borderWidth: 2,
                        },
                        '&:hover fieldset': {
                          borderColor: 'rgba(255, 255, 255, 0.5)',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#90CAF9',
                        },
                      },
                      '& .MuiInputLabel-root': {
                        color: 'white',
                        fontSize: '1.1rem',
                      },
                      '& .MuiInputBase-input': {
                        color: 'white',
                        fontSize: '1.1rem',
                        '&::placeholder': {
                          color: 'rgba(255, 255, 255, 0.7)',
                          opacity: 1,
                        },
                      },
                    }}
                  />
                </motion.div>
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ mb: 3 }}>
                  <Button
                    variant="text"
                    onClick={() => setShowPasswordFields(!showPasswordFields)}
                    startIcon={<LockIcon />}
                    sx={{
                      color: 'white',
                      mb: 2,
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      },
                    }}
                  >
                    {showPasswordFields ? 'Ocultar cambio de contraseña' : 'Cambiar contraseña'}
                  </Button>

                  <Collapse in={showPasswordFields}>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          type="password"
                          label="Contraseña actual"
                          value={passwordData.currentPassword}
                          onChange={handlePasswordChange('currentPassword')}
                          InputProps={{
                            startAdornment: <LockIcon sx={{ mr: 1, color: 'rgba(255, 255, 255, 0.7)' }} />,
                          }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              '& fieldset': {
                                borderColor: 'rgba(255, 255, 255, 0.3)',
                                borderWidth: 2,
                              },
                              '&:hover fieldset': {
                                borderColor: 'rgba(255, 255, 255, 0.5)',
                              },
                              '&.Mui-focused fieldset': {
                                borderColor: '#90CAF9',
                              },
                            },
                            '& .MuiInputLabel-root': {
                              color: 'white',
                              fontSize: '1.1rem',
                            },
                            '& .MuiInputBase-input': {
                              color: 'white',
                              fontSize: '1.1rem',
                            },
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          type="password"
                          label="Nueva contraseña"
                          value={passwordData.newPassword}
                          onChange={handlePasswordChange('newPassword')}
                          InputProps={{
                            startAdornment: <LockIcon sx={{ mr: 1, color: 'rgba(255, 255, 255, 0.7)' }} />,
                          }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              '& fieldset': {
                                borderColor: 'rgba(255, 255, 255, 0.3)',
                                borderWidth: 2,
                              },
                              '&:hover fieldset': {
                                borderColor: 'rgba(255, 255, 255, 0.5)',
                              },
                              '&.Mui-focused fieldset': {
                                borderColor: '#90CAF9',
                              },
                            },
                            '& .MuiInputLabel-root': {
                              color: 'white',
                              fontSize: '1.1rem',
                            },
                            '& .MuiInputBase-input': {
                              color: 'white',
                              fontSize: '1.1rem',
                            },
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                          type="password"
                          label="Confirmar nueva contraseña"
                          value={passwordData.confirmPassword}
                          onChange={handlePasswordChange('confirmPassword')}
                          error={passwordData.newPassword !== passwordData.confirmPassword && passwordData.confirmPassword !== ''}
                          helperText={
                            passwordData.newPassword !== passwordData.confirmPassword && passwordData.confirmPassword !== ''
                              ? 'Las contraseñas no coinciden'
                              : ''
                          }
                          InputProps={{
                            startAdornment: <LockIcon sx={{ mr: 1, color: 'rgba(255, 255, 255, 0.7)' }} />,
                          }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              '& fieldset': {
                                borderColor: 'rgba(255, 255, 255, 0.3)',
                                borderWidth: 2,
                              },
                              '&:hover fieldset': {
                                borderColor: 'rgba(255, 255, 255, 0.5)',
                              },
                              '&.Mui-focused fieldset': {
                                borderColor: '#90CAF9',
                              },
                            },
                            '& .MuiInputLabel-root': {
                              color: 'white',
                              fontSize: '1.1rem',
                            },
                            '& .MuiInputBase-input': {
                              color: 'white',
                              fontSize: '1.1rem',
                            },
                            '& .MuiFormHelperText-root': {
                              color: '#ff1744',
                            },
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} display="flex" justifyContent="flex-end">
                        <Button
                          variant="contained"
                          onClick={handleSavePassword}
                          disabled={
                            !passwordData.currentPassword ||
                            !passwordData.newPassword ||
                            !passwordData.confirmPassword ||
                            passwordData.newPassword !== passwordData.confirmPassword
                          }
                          sx={{
                            background: 'linear-gradient(45deg, #2196f3 30%, #21CBF3 90%)',
                            boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
                          }}
                        >
                          Guardar contraseña
                        </Button>
                      </Grid>
                    </Grid>
                  </Collapse>
                </Box>
            </Grid>

              <Grid item xs={12} md={6}>
                <motion.div whileHover={{ scale: 1.02 }}>
                  <Box sx={{ position: 'relative' }}>
                    <TextField
                      fullWidth
                      label="Rol de Usuario"
                      value={userData?.rol}
                      disabled
                      InputProps={{
                        startAdornment: <AdminPanelSettingsIcon sx={{ mr: 1, color: 'rgba(255, 255, 255, 0.7)' }} />,
                      }}
                      sx={{
                        mb: 3,
                        '& .MuiOutlinedInput-root': {
                          '& fieldset': {
                            borderColor: 'rgba(255, 255, 255, 0.3)',
                            borderWidth: 2,
                          },
                          '&:hover fieldset': {
                            borderColor: 'rgba(255, 255, 255, 0.5)',
                          },
                        },
                        '& .MuiInputLabel-root': {
                          color: 'white',
                          fontSize: '1.1rem',
                        },
                        '& .MuiInputBase-input': {
                          color: 'white',
                          fontSize: '1.1rem',
                          textTransform: 'capitalize',
                        },
                      }}
                    />
                    {userData?.rol === 'usuario' && (
                <Button
                  variant="outlined"
                        size="small"
                        onClick={() => setOpenAdminRequest(true)}
                        startIcon={<SendIcon />}
                        sx={{
                          position: 'absolute',
                          right: 0,
                          top: '100%',
                          color: 'white',
                          borderColor: 'rgba(255, 255, 255, 0.3)',
                          '&:hover': {
                            borderColor: 'white',
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          },
                        }}
                      >
                        Solicitar rol admin
                      </Button>
                    )}
                  </Box>
                </motion.div>
              </Grid>

              {userData?.fecha_registro && (
                <Grid item xs={12}>
                  <motion.div whileHover={{ scale: 1.02 }}>
                    <TextField
                      fullWidth
                      label="Fecha de Registro"
                      value={formatDate(userData.fecha_registro)}
                      disabled
                      InputProps={{
                        startAdornment: <CalendarTodayIcon sx={{ mr: 1, color: 'rgba(255, 255, 255, 0.7)' }} />,
                      }}
                      sx={{
                        mb: 3,
                        '& .MuiOutlinedInput-root': {
                          '& fieldset': {
                            borderColor: 'rgba(255, 255, 255, 0.3)',
                            borderWidth: 2,
                          },
                          '&:hover fieldset': {
                            borderColor: 'rgba(255, 255, 255, 0.5)',
                          },
                        },
                        '& .MuiInputLabel-root': {
                          color: 'rgba(255, 255, 255, 0.9)',
                          fontSize: '1.1rem',
                        },
                        '& .MuiInputBase-input': {
                          color: 'white',
                          fontSize: '1.1rem',
                        },
                      }}
                    />
                  </motion.div>
                </Grid>
              )}

              {/* Sección de Amigos */}
              <Grid item xs={12}>
                <Typography
                  variant="h5"
                  sx={{
                    color: 'white',
                    mb: 3,
                    textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
                    fontWeight: 600,
                  }}
                >
                  Amigos
                </Typography>
                <FriendsManager />
              </Grid>

              <Grid item xs={12} display="flex" justifyContent="center" gap={2}>
                <AnimatePresence mode="wait">
                  {!isEditing ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                    >
                      <Button
                        variant="contained"
                        startIcon={<EditIcon />}
                        onClick={() => setIsEditing(true)}
                        sx={{
                          background: 'linear-gradient(45deg, #2196f3 30%, #21CBF3 90%)',
                          boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
                          transition: 'transform 0.2s',
                          '&:hover': {
                            transform: 'scale(1.05)',
                          },
                        }}
                      >
                        Editar Perfil
                </Button>
                    </motion.div>
                  ) : (
                    <>
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                      >
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<SaveIcon />}
                  onClick={handleSave}
                          sx={{
                            background: 'linear-gradient(45deg, #2196f3 30%, #21CBF3 90%)',
                            boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
                            transition: 'transform 0.2s',
                            '&:hover': {
                              transform: 'scale(1.05)',
                            },
                          }}
                >
                  Guardar
                </Button>
                      </motion.div>
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                      >
                        <Button
                          variant="outlined"
                          startIcon={<CancelIcon />}
                          onClick={() => {
                            setIsEditing(false);
                            setEditData(userData || {});
                          }}
                          sx={{
                            borderColor: '#ff5252',
                            color: '#ff5252',
                            '&:hover': {
                              borderColor: '#ff1744',
                              backgroundColor: 'rgba(255, 23, 68, 0.04)',
                              transform: 'scale(1.05)',
                            },
                            transition: 'transform 0.2s',
                          }}
                        >
                          Cancelar
                        </Button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </Grid>
            </Grid>
          </Paper>
          </motion.div>
      </Container>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{
              position: 'fixed',
              bottom: 20,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 2000,
            }}
          >
            <Alert 
              severity="error"
              sx={{
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
                borderRadius: 2,
              }}
            >
              {error}
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          severity="success"
          sx={{
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
            borderRadius: 2,
          }}
        >
          {success}
        </Alert>
      </Snackbar>

      {/* Admin Request Dialog */}
      <Dialog
        open={openAdminRequest}
        onClose={() => setOpenAdminRequest(false)}
        PaperProps={{
          sx: {
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            borderRadius: 2,
          },
        }}
      >
        <DialogTitle>Solicitar Rol de Administrador</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Razón de la solicitud"
            value={adminRequestReason}
            onChange={(e) => setAdminRequestReason(e.target.value)}
            placeholder="Explica por qué necesitas permisos de administrador..."
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAdminRequest(false)} color="inherit">
            Cancelar
          </Button>
          <Button
            onClick={handleAdminRequest}
            variant="contained"
            disabled={!adminRequestReason.trim()}
            sx={{
              background: 'linear-gradient(45deg, #2196f3 30%, #21CBF3 90%)',
            }}
          >
            Enviar solicitud
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Profile; 