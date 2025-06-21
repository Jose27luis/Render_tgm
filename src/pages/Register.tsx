import { Visibility, VisibilityOff } from '@mui/icons-material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import {
    Alert,
    Box,
    Button,
    Container,
    IconButton,
    InputAdornment,
    Paper,
    TextField,
    Typography,
} from '@mui/material';
import { useFormik } from 'formik';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as Yup from 'yup';
import api from '../config/api';

const validationSchema = Yup.object({
  nombre: Yup.string()
    .required('El nombre es requerido')
    .min(3, 'El nombre debe tener al menos 3 caracteres'),
  correo: Yup.string()
    .email('Ingresa un correo electrónico válido')
    .required('El correo es requerido'),
  contrasena: Yup.string()
    .min(6, 'La contrasena debe tener al menos 6 caracteres')
    .required('La contrasena es requerida'),
  confirmarContrasena: Yup.string()
    .oneOf([Yup.ref('contrasena')], 'Las contrasenas no coinciden')
    .required('Confirma tu contrasena'),
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
      contrasena: '',
      confirmarContrasena: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        setError('');
        const response = await api.post('/auth/register', {
          nombre: values.nombre,
          correo: values.correo,
          contrasena: values.contrasena,
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
                id="contrasena"
                name="contrasena"
                label="Contrasena"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={formik.values.contrasena}
                onChange={formik.handleChange}
                error={formik.touched.contrasena && Boolean(formik.errors.contrasena)}
                helperText={formik.touched.contrasena && formik.errors.contrasena}
                sx={textFieldStyles}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                margin="normal"
                fullWidth
                id="confirmarContrasena"
                name="confirmarContrasena"
                label="Confirmar Contrasena"
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={formik.values.confirmarContrasena}
                onChange={formik.handleChange}
                error={formik.touched.confirmarContrasena && Boolean(formik.errors.confirmarContrasena)}
                helperText={formik.touched.confirmarContrasena && formik.errors.confirmarContrasena}
                sx={textFieldStyles}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        edge="end"
                      >
                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
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