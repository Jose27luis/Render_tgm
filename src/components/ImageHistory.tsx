import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import VisibilityIcon from '@mui/icons-material/Visibility';
import {
    Box,
    Card,
    CardActions,
    CardContent,
    CardMedia,
    Dialog,
    DialogContent,
    Grid,
    IconButton,
    Tab,
    Tabs,
    Typography
} from '@mui/material';
import { AnimatePresence, motion } from 'framer-motion';
import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import api, { SERVER_URL, mejorarImagen } from '../config/api';

interface Image {
  id_imagen: number;
  url_original?: string;
  url_procesada?: string;
  ruta_imagen?: string;
  nombre_archivo?: string;
  fecha_subida: string;
  estado?: string;
  tipo: string;
}

const ImageHistory = forwardRef((props, ref) => {
  const [images, setImages] = useState<Image[]>([]);
  const [tabValue, setTabValue] = useState(0);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [mejorandoId, setMejorandoId] = useState<number | null>(null);

  const fetchImages = async () => {
    try {
      // Usar la nueva ruta unificada
      const response = await api.get('/images');
      setImages(response.data);
    } catch (err) {
      console.error('Error al obtener imágenes:', err);
    }
  };

  useImperativeHandle(ref, () => ({
    refetch: fetchImages
  }));

  useEffect(() => {
    fetchImages();
  }, []);

  const handleDelete = async (imageId: number) => {
    try {
      await api.delete(`/images/${imageId}`);
      fetchImages();
    } catch (err) {
      console.error('Error al eliminar imagen:', err);
    }
  };

  const handleDownload = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImageClick = (url: string) => {
    setSelectedImage(url);
    setOpenDialog(true);
  };

  const handleMejorar = async (imageId: number) => {
    setMejorandoId(imageId);
    try {
      // Llamar a la API para mejorar la imagen
      await api.post(`/images/${imageId}/mejorar`);
      // Refrescar la lista de imágenes para mostrar el resultado
      await fetchImages(); 
    } catch (err) {
      console.error('Error al mejorar la imagen:', err);
      // Aquí podrías añadir una notificación de error para el usuario
    } finally {
      setMejorandoId(null);
    }
  };

  return (
    <Box sx={{ width: '100%', mt: 2 }}>
      <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
        Historial de Imágenes
      </Typography>

      <Tabs
        value={tabValue}
        onChange={(_, newValue) => setTabValue(newValue)}
        sx={{
          mb: 2,
          '& .MuiTab-root': {
            color: 'rgba(255, 255, 255, 0.7)',
            '&.Mui-selected': {
              color: '#2196f3',
            },
          },
        }}
      >
        <Tab label="Originales" />
        <Tab label="Procesadas" />
      </Tabs>

      <Grid container spacing={2}>
        <AnimatePresence>
          {images
            .filter(img => tabValue === 0 ? img.tipo === 'original' : img.tipo === 'procesada')
            .map((image) => {
              const imageUrl = tabValue === 0 ? 
                (image.url_original || '') : 
                (image.ruta_imagen || image.url_procesada || '');
              const fullUrl = imageUrl && imageUrl.startsWith('/uploads') ? `${SERVER_URL}${imageUrl}` : imageUrl;
              return (
                <Grid item xs={12} sm={6} md={4} key={image.id_imagen} component={motion.div}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.4 }}
                >
                  <Card
                    sx={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                    }}
                  >
                    <CardMedia
                      component="img"
                      height="200"
                      image={fullUrl}
                      alt="Imagen"
                      sx={{
                        objectFit: 'cover',
                        cursor: 'pointer',
                      }}
                      onClick={() => handleImageClick(fullUrl)}
                    />
                    <CardContent>
                      <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                        Fecha: {new Date(image.fecha_subida).toLocaleDateString()}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                        Estado: {image.estado}
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <IconButton
                        onClick={() => handleImageClick(fullUrl)}
                        sx={{ color: '#2196f3' }}
                      >
                        <VisibilityIcon />
                      </IconButton>
                      <IconButton
                        onClick={() => handleDownload(fullUrl, `imagen-${tabValue === 0 ? 'original' : 'procesada'}-${image.id_imagen}.jpg`)}
                        sx={{ color: '#4caf50' }}
                      >
                        <DownloadIcon />
                      </IconButton>
                      <IconButton
                        onClick={() => handleDelete(image.id_imagen)}
                        sx={{ color: '#f44336' }}
                      >
                        <DeleteIcon />
                      </IconButton>
                      {tabValue === 0 && image.tipo === 'original' && (
                        <IconButton
                          onClick={() => handleMejorar(image.id_imagen)}
                          sx={{ color: '#ff9800' }}
                          disabled={mejorandoId === image.id_imagen}
                        >
                          {mejorandoId === image.id_imagen ? (
                            <span className="loader" style={{ width: 24, height: 24, display: 'inline-block' }} />
                          ) : (
                            <span style={{ fontWeight: 700, fontSize: 18 }}>✨</span>
                          )}
                        </IconButton>
                      )}
                    </CardActions>
                  </Card>
                </Grid>
              );
            })}
        </AnimatePresence>
      </Grid>

      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="lg"
        PaperProps={{
          sx: {
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }
        }}
      >
        <DialogContent>
          {selectedImage && (
            <img
              src={selectedImage}
              alt="Vista previa"
              style={{ width: '100%', height: 'auto', maxHeight: '80vh' }}
            />
          )}
        </DialogContent>
      </Dialog>

      <style>{`
        .loader {
          border: 3px solid #f3f3f3;
          border-top: 3px solid #ff9800;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </Box>
  );
});

export default ImageHistory; 