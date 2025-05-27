import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  Paper,
  IconButton,
  InputAdornment,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { motion } from 'framer-motion';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import api from '../config/api';

const validationSchema = Yup.object({
  nombre: Yup.string()
    .required('El nombre es requerido')
    .min(3, 'El nombre debe tener al menos 3 caracteres'),
  correo: Yup.string()
    .email('Ingresa un correo electrónico válido')
    .required('El correo es requerido'),
  contraseña: Yup.string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres')
    .required('La contraseña es requerida'),
  confirmarContraseña: Yup.string()
    .oneOf([Yup.ref('contraseña')], 'Las contraseñas no coinciden')
    .required('Confirma tu contraseña'),
});

// Componente para las figuras de fondo
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
        position: 'absolute',
        top: '10%',
        left: '10%',
        width: '300px',
        height: '300px',
        borderRadius: '50%',
        background: 'linear-gradient(45deg, #2196f3 30%, transparent 90%)',
        opacity: 0.1,
        filter: 'blur(40px)',
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
        position: 'absolute',
        bottom: '10%',
        right: '10%',
        width: '250px',
        height: '250px',
        borderRadius: '50%',
        background: 'linear-gradient(45deg, #21CBF3 30%, transparent 90%)',
        opacity: 0.1,
        filter: 'blur(40px)',
      }}
    />
  </>
);

const Register = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const formik = useFormik({
    initialValues: {
      nombre: '',
      correo: '',
      contraseña: '',
      confirmarContraseña: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        setError('');
        const response = await api.post('/auth/register', {
          nombre: values.nombre,
          correo: values.correo,
          contraseña: values.contraseña,
        });
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        navigate('/dashboard');
      } catch (err: any) {
        setError(err.response?.data?.message || 'Error al registrar usuario');
      }
    },
  });

  const textFieldStyles = {
    '& .MuiOutlinedInput-root': {
      '& fieldset': {
        borderColor: 'rgba(255, 255, 255, 0.23)',
      },
      '&:hover fieldset': {
        borderColor: 'rgba(255, 255, 255, 0.5)',
      },
      '&.Mui-focused fieldset': {
        borderColor: '#2196f3',
      },
    },
    '& .MuiInputLabel-root': {
      color: 'rgba(255, 255, 255, 0.7)',
    },
    '& .MuiInputBase-input': {
      color: 'white',
    },
    '& .MuiFormHelperText-root': {
      color: '#ff5252',
    },
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(to bottom right, #0a1929 0%, #132f4c 100%)',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <BackgroundShapes />
      
      <Container component="main" maxWidth="xs" sx={{ position: 'relative', zIndex: 1 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Paper
            elevation={6}
            sx={{
              p: 4,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 2,
            }}
          >
            <motion.div
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.6 }}
            >
              <Box
                sx={{
                  width: 45,
                  height: 45,
                  borderRadius: '50%',
                  background: 'linear-gradient(45deg, #2196f3 30%, #21CBF3 90%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 2,
                  boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
                }}
              >
                <PersonAddIcon sx={{ color: 'white' }} />
              </Box>
            </motion.div>

            <Typography 
              component="h1" 
              variant="h4" 
              sx={{ 
                mb: 3,
                color: 'white',
                textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
                fontWeight: 500
              }}
            >
              Registro
            </Typography>

            {error && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Alert 
                  severity="error" 
                  sx={{ 
                    mt: 1, 
                    mb: 2, 
                    width: '100%',
                    backgroundColor: 'rgba(211, 47, 47, 0.1)',
                    color: '#ff5252',
                    '& .MuiAlert-icon': {
                      color: '#ff5252'
                    }
                  }}
                >
                  {error}
                </Alert>
              </motion.div>
            )}

            <Box 
              component="form" 
              onSubmit={formik.handleSubmit} 
              sx={{ width: '100%' }}
            >
              <TextField
                margin="normal"
                fullWidth
                id="nombre"
                name="nombre"
                label="Nombre"
                autoComplete="name"
                autoFocus
                value={formik.values.nombre}
                onChange={formik.handleChange}
                error={formik.touched.nombre && Boolean(formik.errors.nombre)}
                helperText={formik.touched.nombre && formik.errors.nombre}
                sx={textFieldStyles}
              />

              <TextField
                margin="normal"
                fullWidth
                id="correo"
                name="correo"
                label="Correo Electrónico"
                autoComplete="email"
                value={formik.values.correo}
                onChange={formik.handleChange}
                error={formik.touched.correo && Boolean(formik.errors.correo)}
                helperText={formik.touched.correo && formik.errors.correo}
                sx={textFieldStyles}
              />

              <TextField
                margin="normal"
                fullWidth
                id="contraseña"
                name="contraseña"
                label="Contraseña"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={formik.values.contraseña}
                onChange={formik.handleChange}
                error={formik.touched.contraseña && Boolean(formik.errors.contraseña)}
                helperText={formik.touched.contraseña && formik.errors.contraseña}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={textFieldStyles}
              />

              <TextField
                margin="normal"
                fullWidth
                id="confirmarContraseña"
                name="confirmarContraseña"
                label="Confirmar Contraseña"
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={formik.values.confirmarContraseña}
                onChange={formik.handleChange}
                error={formik.touched.confirmarContraseña && Boolean(formik.errors.confirmarContraseña)}
                helperText={formik.touched.confirmarContraseña && formik.errors.confirmarContraseña}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        edge="end"
                        sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                      >
                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={textFieldStyles}
              />

              <Button
                component={motion.button}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                fullWidth
                variant="contained"
                sx={{
                  mt: 3,
                  mb: 2,
                  py: 1.5,
                  background: 'linear-gradient(45deg, #2196f3 30%, #21CBF3 90%)',
                  color: 'white',
                  textTransform: 'none',
                  fontSize: '1.1rem',
                  boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
                }}
              >
                Registrarse
              </Button>

              <Box sx={{ textAlign: 'center' }}>
                <Link 
                  to="/login" 
                  style={{ 
                    textDecoration: 'none',
                    color: '#2196f3',
                  }}
                >
                  <Typography 
                    variant="body1"
                    sx={{
                      color: 'rgba(255, 255, 255, 0.7)',
                      '&:hover': {
                        color: '#2196f3',
                      },
                    }}
                  >
                    ¿Ya tienes una cuenta? Inicia sesión
                  </Typography>
                </Link>
              </Box>
            </Box>
          </Paper>
        </motion.div>
      </Container>
    </Box>
  );
};

export default Register; 