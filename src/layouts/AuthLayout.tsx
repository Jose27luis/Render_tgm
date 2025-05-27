import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ImageIcon from '@mui/icons-material/Image';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';

const AuthLayout = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
    navigate('/login');
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar 
        position="fixed" 
        sx={{ 
          background: 'rgba(10, 25, 41, 0.9)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Typography 
            variant="h6" 
            sx={{
              background: 'linear-gradient(45deg, #2196f3 30%, #21CBF3 90%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: 'bold',
              cursor: 'pointer',
            }}
            onClick={() => navigate('/')}
          >
            RENDER-TGM
          </Typography>

          {isMobile ? (
            <IconButton
              color="inherit"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              edge="end"
            >
              <MenuIcon />
            </IconButton>
          ) : (
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                color="inherit"
                startIcon={<HomeIcon />}
                onClick={() => navigate('/dashboard')}
              >
                Inicio
              </Button>
              <Button
                color="inherit"
                startIcon={<DashboardIcon />}
                onClick={() => navigate('/dashboard')}
              >
                Dashboard
              </Button>
              <Button
                color="inherit"
                startIcon={<ImageIcon />}
                onClick={() => navigate('/my-images')}
              >
                Mis Imágenes
              </Button>
              <Button
                color="inherit"
                startIcon={<AccountCircleIcon />}
                onClick={() => navigate('/profile')}
              >
                Perfil
              </Button>
              <Button
                color="inherit"
                startIcon={<LogoutIcon />}
                onClick={handleLogout}
              >
                Cerrar Sesión
              </Button>
            </Box>
          )}
        </Toolbar>

        {/* Mobile Menu */}
        {isMobile && mobileMenuOpen && (
          <Box
            sx={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              background: 'rgba(10, 25, 41, 0.95)',
              backdropFilter: 'blur(10px)',
              display: 'flex',
              flexDirection: 'column',
              padding: 2,
              zIndex: 1000,
            }}
          >
            <Button
              color="inherit"
              startIcon={<HomeIcon />}
              onClick={() => {
                navigate('/dashboard');
                setMobileMenuOpen(false);
              }}
              sx={{ justifyContent: 'flex-start', mb: 1 }}
            >
              Inicio
            </Button>
            <Button
              color="inherit"
              startIcon={<DashboardIcon />}
              onClick={() => {
                navigate('/dashboard');
                setMobileMenuOpen(false);
              }}
              sx={{ justifyContent: 'flex-start', mb: 1 }}
            >
              Dashboard
            </Button>
            <Button
              color="inherit"
              startIcon={<ImageIcon />}
              onClick={() => {
                navigate('/my-images');
                setMobileMenuOpen(false);
              }}
              sx={{ justifyContent: 'flex-start', mb: 1 }}
            >
              Mis Imágenes
            </Button>
            <Button
              color="inherit"
              startIcon={<AccountCircleIcon />}
              onClick={() => {
                navigate('/profile');
                setMobileMenuOpen(false);
              }}
              sx={{ justifyContent: 'flex-start', mb: 1 }}
            >
              Perfil
            </Button>
            <Button
              color="inherit"
              startIcon={<LogoutIcon />}
              onClick={() => {
                handleLogout();
                setMobileMenuOpen(false);
              }}
              sx={{ justifyContent: 'flex-start' }}
            >
              Cerrar Sesión
            </Button>
          </Box>
        )}
      </AppBar>

      {/* Toolbar offset */}
      <Toolbar />

      {/* Main content */}
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1,
          minHeight: '100vh',
          background: 'linear-gradient(to bottom, #0a1929 0%, #132f4c 100%)',
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default AuthLayout; 