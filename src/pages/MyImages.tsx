import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Button,
  IconButton,
  CircularProgress,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';

interface ImageData {
  id: string;
  url: string;
  title: string;
  createdAt: string;
}

const MyImages = () => {
  const [images, setImages] = useState<ImageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/images', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Error al cargar las imágenes');
      }

      const data = await response.json();
      setImages(data);
    } catch (err) {
      setError('Error al cargar las imágenes');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/images/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Error al eliminar la imagen');
      }

      setImages(images.filter(img => img.id !== id));
    } catch (err) {
      setError('Error al eliminar la imagen');
    }
  };

  const handleDownload = (url: string, title: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = title;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Mis Imágenes
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddPhotoAlternateIcon />}
          onClick={() => {/* Implementar lógica de subida */}}
        >
          Subir Imagen
        </Button>
      </Box>

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      <Grid container spacing={3}>
        {images.map((image) => (
          <Grid item xs={12} sm={6} md={4} key={image.id}>
            <Card 
              sx={{ 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <CardMedia
                component="img"
                height="200"
                image={image.url}
                alt={image.title}
                sx={{ objectFit: 'cover' }}
              />
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h6" component="h2" gutterBottom>
                  {image.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {new Date(image.createdAt).toLocaleDateString()}
                </Typography>
              </CardContent>
              <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                <IconButton 
                  onClick={() => handleDownload(image.url, image.title)}
                  color="primary"
                >
                  <DownloadIcon />
                </IconButton>
                <IconButton 
                  onClick={() => handleDelete(image.id)}
                  color="error"
                >
                  <DeleteIcon />
                </IconButton>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {images.length === 0 && !loading && (
        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            justifyContent: 'center',
            height: '50vh',
          }}
        >
          <AddPhotoAlternateIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No tienes imágenes aún
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            Comienza subiendo tu primera imagen
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddPhotoAlternateIcon />}
            onClick={() => {/* Implementar lógica de subida */}}
          >
            Subir Imagen
          </Button>
        </Box>
      )}
    </Container>
  );
};

export default MyImages; 