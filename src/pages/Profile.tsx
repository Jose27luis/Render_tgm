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
  Tooltip,
  CircularProgress,
  Divider,
  Snackbar,
} from '@mui/material';
import { motion } from 'framer-motion';
import PersonIcon from '@mui/icons-material/Person';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';

interface UserData {
  nombre: string;
  correo: string;
  rol: string;
  foto_perfil?: string;
  bio: string;
  location: string;
  phone: string;
}

const initialUserData: UserData = {
  nombre: '',
  correo: '',
  rol: '',
  bio: '',
  location: '',
  phone: '',
};

const Profile = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [userData, setUserData] = useState<UserData>(initialUserData);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [tempData, setTempData] = useState<UserData>(initialUserData);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('No hay sesión activa. Por favor, inicia sesión nuevamente.');
          navigate('/login');
          return;
        }

        console.log('Intentando obtener datos del perfil...');
        const response = await fetch('http://localhost:5000/api/user/profile', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          console.error('Error response:', {
            status: response.status,
            statusText: response.statusText,
            error: errorData
          });
          
          if (response.status === 401) {
            setError('Sesión expirada. Por favor, inicia sesión nuevamente.');
            localStorage.removeItem('token');
            navigate('/login');
            return;
          }
          
          throw new Error(errorData?.message || 'Error al cargar datos del usuario');
        }

        const data = await response.json();
        console.log('Datos del perfil recibidos:', data);
        
        // Asegurarse de que los campos opcionales estén presentes
        const completeData = {
          ...initialUserData,
          ...data,
        };
        setUserData(completeData);
        setTempData(completeData);
        if (data.foto_perfil) {
          setPreviewImage(data.foto_perfil);
        }
      } catch (err) {
        console.error('Error al cargar el perfil:', err);
        setError(err instanceof Error ? err.message : 'Error al cargar el perfil');
        setIsLoading(false);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTempData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

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
      setIsLoading(true);
      const formData = new FormData();
      formData.append('foto', file);

      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/user/profile/photo', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Error al subir la imagen');
      }

      const data = await response.json();
      setPreviewImage(data.foto_url);
      setSuccess('Foto de perfil actualizada correctamente');
    } catch (err) {
      setError('Error al subir la imagen');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    setTempData({ ...userData });
    setIsEditing(true);
  };

  const handleSave = async () => {
    setError('');
    setSuccess('');

    // Validar contraseñas si se están cambiando
    if (tempData.nuevaContraseña) {
      if (tempData.nuevaContraseña !== tempData.confirmarContraseña) {
        setError('Las contraseñas no coinciden');
        return;
      }
      if (tempData.nuevaContraseña.length < 6) {
        setError('La contraseña debe tener al menos 6 caracteres');
        return;
      }
      if (!tempData.contraseñaActual) {
        setError('Debes ingresar tu contraseña actual');
        return;
      }
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(tempData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al actualizar perfil');
      }

      setSuccess('Perfil actualizado correctamente');
      setIsEditing(false);
      setUserData(data);
      setTempData(data);
      localStorage.setItem('userName', data.nombre);

      // Limpiar campos de contraseña
      setTempData(prev => ({
        ...prev,
        contraseñaActual: '',
        nuevaContraseña: '',
        confirmarContraseña: '',
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar perfil');
    }
  };

  const handleCancel = () => {
    setTempData({ ...userData });
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '100vh',
          background: 'linear-gradient(to bottom, #0a1929 0%, #132f4c 100%)',
        }}
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error && !userData.nombre) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '100vh',
          background: 'linear-gradient(to bottom, #0a1929 0%, #132f4c 100%)',
          color: 'error.main',
          gap: 2,
        }}
      >
        <Typography variant="h5" color="error">
          {error}
        </Typography>
        <Button 
          variant="contained" 
          onClick={() => window.location.reload()}
          color="primary"
        >
          Reintentar
        </Button>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100%',
        background: 'linear-gradient(to bottom, #0a1929 0%, #132f4c 100%)',
        pt: 8,
        pb: 6,
      }}
    >
      <Container maxWidth="md">
        <Paper
          elevation={6}
          sx={{
            p: 4,
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(10px)',
            borderRadius: 2,
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: 'center',
                gap: 4,
                mb: 4,
              }}
            >
              <Box sx={{ position: 'relative' }}>
                <Avatar
                  sx={{
                    width: 150,
                    height: 150,
                    border: '4px solid',
                    borderColor: 'primary.main',
                  }}
                  src={previewImage || undefined}
                >
                  {!previewImage && <PersonIcon sx={{ fontSize: 60 }} />}
                </Avatar>
                <Tooltip title="Cambiar foto de perfil">
                  <IconButton
                    sx={{
                      position: 'absolute',
                      bottom: 0,
                      right: 0,
                      backgroundColor: 'primary.main',
                      '&:hover': {
                        backgroundColor: 'primary.dark',
                      },
                    }}
                    onClick={handlePhotoClick}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <CircularProgress size={24} color="inherit" />
                    ) : (
                      <PhotoCameraIcon />
                    )}
                  </IconButton>
                </Tooltip>
                <input
                  type="file"
                  ref={fileInputRef}
                  hidden
                  accept="image/*"
                  onChange={handlePhotoChange}
                />
              </Box>

              <Box sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Typography variant="h4" gutterBottom>
                    {isEditing ? (
                      <TextField
                        fullWidth
                        variant="standard"
                        value={tempData.nombre}
                        onChange={handleInputChange}
                        name="nombre"
                      />
                    ) : (
                      userData.nombre
                    )}
                  </Typography>
                  {!isEditing && (
                    <IconButton onClick={handleEdit} color="primary">
                      <EditIcon />
                    </IconButton>
                  )}
                </Box>
                <Typography variant="body1" color="text.secondary" gutterBottom>
                  {isEditing ? (
                    <TextField
                      fullWidth
                      variant="standard"
                      value={tempData.correo}
                      onChange={handleInputChange}
                      name="correo"
                    />
                  ) : (
                    userData.correo
                  )}
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ my: 4 }} />

            <Grid container spacing={4}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Biografía
                </Typography>
                {isEditing ? (
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    value={tempData.bio}
                    onChange={handleInputChange}
                    name="bio"
                  />
                ) : (
                  <Typography variant="body1">{userData.bio}</Typography>
                )}
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="h6" gutterBottom>
                  Ubicación
                </Typography>
                {isEditing ? (
                  <TextField
                    fullWidth
                    value={tempData.location}
                    onChange={handleInputChange}
                    name="location"
                  />
                ) : (
                  <Typography variant="body1">{userData.location}</Typography>
                )}
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="h6" gutterBottom>
                  Teléfono
                </Typography>
                {isEditing ? (
                  <TextField
                    fullWidth
                    value={tempData.phone}
                    onChange={handleInputChange}
                    name="phone"
                  />
                ) : (
                  <Typography variant="body1">{userData.phone}</Typography>
                )}
              </Grid>
            </Grid>

            {isEditing && (
              <Box sx={{ display: 'flex', gap: 2, mt: 4, justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<CancelIcon />}
                  onClick={handleCancel}
                >
                  Cancelar
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<SaveIcon />}
                  onClick={handleSave}
                >
                  Guardar
                </Button>
              </Box>
            )}
          </motion.div>
        </Paper>
      </Container>

      <Snackbar
        open={showSuccess}
        autoHideDuration={6000}
        onClose={() => setShowSuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setShowSuccess(false)} severity="success">
          Perfil actualizado exitosamente
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Profile; 