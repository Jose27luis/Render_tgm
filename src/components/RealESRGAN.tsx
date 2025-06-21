import {
    AutoFixHigh,
    CloudUpload,
    CompareArrows,
    Download,
    HighQuality,
    Speed
} from '@mui/icons-material';
import {
    Alert,
    Box,
    Button,
    Card,
    CardActions,
    CardContent,
    CardMedia,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    FormControlLabel,
    Grid,
    InputLabel,
    LinearProgress,
    MenuItem,
    Paper,
    Select,
    Switch,
    Typography,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import axios from 'axios';
import React, { useEffect, useState } from 'react';

interface Model {
  scale: number;
  description: string;
  downloaded: boolean;
}

interface ModelsResponse {
  models: Record<string, Model>;
  default: string;
  device: string;
  available: boolean;
}

interface ProcessingResult {
  url: string;
  processingTime?: string;
  modelUsed?: string;
  scaleFactor?: string;
  originalSize?: string;
  enhancedSize?: string;
}

const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

const API_BASE_URL = 'http://localhost:5000/api';

const RealESRGAN: React.FC = () => {
  // Estados
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  
  // Configuración
  const [selectedModel, setSelectedModel] = useState<string>('realesrgan-x4plus');
  const [enhanceLowLight, setEnhanceLowLight] = useState<boolean>(false);
  const [models, setModels] = useState<Record<string, Model>>({});
  const [serviceAvailable, setServiceAvailable] = useState<boolean>(false);
  
  // UI Estados
  const [compareDialogOpen, setCompareDialogOpen] = useState(false);
  const [userImages, setUserImages] = useState<any[]>([]);

  // Cargar modelos disponibles al iniciar
  useEffect(() => {
    loadAvailableModels();
    loadUserImages();
  }, []);

  const loadAvailableModels = async () => {
    try {
      const response = await axios.get<ModelsResponse>(`${API_BASE_URL}/images/models`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setModels(response.data.models);
      setServiceAvailable(response.data.available);
      setSelectedModel(response.data.default);
    } catch (error) {
      console.error('Error loading models:', error);
      setError('No se pudieron cargar los modelos disponibles');
      setServiceAvailable(false);
    }
  };

  const loadUserImages = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/images`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setUserImages(response.data);
    } catch (error) {
      console.error('Error loading user images:', error);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validar tipo de archivo
      if (!file.type.match(/^image\/(jpeg|jpg|png)$/)) {
        setError('Solo se permiten archivos JPG, JPEG y PNG');
        return;
      }
      
      // Validar tamaño (50MB máximo)
      if (file.size > 50 * 1024 * 1024) {
        setError('El archivo es demasiado grande. Máximo 50MB');
        return;
      }

      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setError('');
      setResult(null);
    }
  };

  const uploadAndEnhance = async () => {
    if (!selectedFile) {
      setError('Por favor selecciona una imagen');
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setError('');
    setSuccess('');

    try {
      // Simular progreso
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 500);

      // 1. Subir imagen
      const formData = new FormData();
      formData.append('image', selectedFile);

      const uploadResponse = await axios.post(`${API_BASE_URL}/images/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      const imageId = uploadResponse.data.imageId;
      
      // 2. Procesar con Real-ESRGAN
      const enhanceData = new FormData();
      enhanceData.append('model_name', selectedModel);
      enhanceData.append('enhance_low_light', enhanceLowLight.toString());

      const endpoint = enhanceLowLight ? 'enhance-combined' : 'enhance';
      const enhanceResponse = await axios.post(
        `${API_BASE_URL}/images/${imageId}/${endpoint}`,
        enhanceData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      clearInterval(progressInterval);
      setProgress(100);

      // Procesar respuesta
      const resultData: ProcessingResult = {
        url: enhanceResponse.data.url,
        processingTime: enhanceResponse.headers['x-processing-time'],
        modelUsed: enhanceResponse.headers['x-model-used'],
        scaleFactor: enhanceResponse.headers['x-scale-factor'],
        originalSize: enhanceResponse.headers['x-original-size'],
        enhancedSize: enhanceResponse.headers['x-enhanced-size']
      };

      setResult(resultData);
      setSuccess(`¡Imagen mejorada exitosamente con ${selectedModel}!`);
      
      // Recargar lista de imágenes del usuario
      loadUserImages();

    } catch (error: any) {
      console.error('Error processing image:', error);
      setError(error.response?.data?.message || 'Error al procesar la imagen');
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const downloadResult = () => {
    if (result?.url) {
      const link = document.createElement('a');
      link.href = `http://localhost:5000${result.url}`;
      link.download = `enhanced_${selectedFile?.name || 'image'}`;
      link.click();
    }
  };

  if (!serviceAvailable) {
    return (
      <Paper sx={{ p: 3, m: 2 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          <Typography variant="h6">Servicio Real-ESRGAN no disponible</Typography>
          <Typography>
            El servicio de mejora de resolución no está ejecutándose. 
            Por favor contacta al administrador.
          </Typography>
        </Alert>
      </Paper>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <AutoFixHigh color="primary" />
        Real-ESRGAN - Mejora de Resolución
      </Typography>

      <Grid container spacing={3}>
        {/* Panel de configuración */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Configuración
            </Typography>

            {/* Selector de modelo */}
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Modelo AI</InputLabel>
              <Select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                disabled={isProcessing}
              >
                {Object.entries(models).map(([key, model]) => (
                  <MenuItem key={key} value={key}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                      <Typography variant="body2">{model.description}</Typography>
                      <Chip 
                        size="small" 
                        label={`${model.scale}x`} 
                        color="primary" 
                        variant="outlined" 
                      />
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Mejora de iluminación */}
            <FormControlLabel
              control={
                <Switch
                  checked={enhanceLowLight}
                  onChange={(e) => setEnhanceLowLight(e.target.checked)}
                  disabled={isProcessing}
                />
              }
              label="Mejorar iluminación también"
            />

            {/* Información del modelo */}
            {selectedModel && models[selectedModel] && (
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  <strong>Escala:</strong> {models[selectedModel].scale}x<br/>
                  <strong>Tipo:</strong> {models[selectedModel].description}<br/>
                  <strong>Estado:</strong> {models[selectedModel].downloaded ? 'Disponible' : 'Descargando...'}
                </Typography>
              </Alert>
            )}
          </Paper>
        </Grid>

        {/* Panel principal */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            {/* Carga de archivo */}
            <Box sx={{ mb: 3 }}>
              <Button
                component="label"
                variant="contained"
                startIcon={<CloudUpload />}
                disabled={isProcessing}
                sx={{ mb: 2 }}
              >
                Seleccionar Imagen
                <VisuallyHiddenInput type="file" onChange={handleFileSelect} accept="image/*" />
              </Button>
              
              {selectedFile && (
                <Typography variant="body2" color="text.secondary">
                  Archivo: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </Typography>
              )}
            </Box>

            {/* Preview de imagen */}
            {previewUrl && (
              <Card sx={{ mb: 3 }}>
                <CardMedia
                  component="img"
                  height="300"
                  image={previewUrl}
                  alt="Preview"
                  sx={{ objectFit: 'contain' }}
                />
                <CardContent>
                  <Typography variant="body2" color="text.secondary">
                    Imagen original - Lista para mejorar
                  </Typography>
                </CardContent>
              </Card>
            )}

            {/* Progreso */}
            {isProcessing && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" gutterBottom>
                  Procesando con Real-ESRGAN...
                </Typography>
                <LinearProgress variant="determinate" value={progress} />
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                  <Typography variant="body2">
                    {progress < 30 ? 'Subiendo imagen...' :
                     progress < 60 ? 'Iniciando Real-ESRGAN...' :
                     progress < 90 ? 'Mejorando resolución...' :
                     'Finalizando...'}
                  </Typography>
                </Box>
              </Box>
            )}

            {/* Botón de procesamiento */}
            <Button
              variant="contained"
              color="primary"
              startIcon={<HighQuality />}
              onClick={uploadAndEnhance}
              disabled={!selectedFile || isProcessing}
              size="large"
              sx={{ mb: 2 }}
            >
              {isProcessing ? 'Procesando...' : 'Mejorar Resolución'}
            </Button>

            {/* Alertas */}
            {error && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                {error}
              </Alert>
            )}

            {success && (
              <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
                {success}
              </Alert>
            )}

            {/* Resultado */}
            {result && (
              <Card>
                <CardMedia
                  component="img"
                  height="400"
                  image={`http://localhost:5000${result.url}`}
                  alt="Enhanced result"
                  sx={{ objectFit: 'contain' }}
                />
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    ¡Imagen Mejorada!
                  </Typography>
                  <Grid container spacing={1}>
                    {result.processingTime && (
                      <Grid item xs={6}>
                        <Chip 
                          icon={<Speed />} 
                          label={`${parseFloat(result.processingTime).toFixed(1)}s`} 
                          size="small" 
                        />
                      </Grid>
                    )}
                    {result.scaleFactor && (
                      <Grid item xs={6}>
                        <Chip 
                          label={`Escala ${result.scaleFactor}x`} 
                          color="primary" 
                          size="small" 
                        />
                      </Grid>
                    )}
                    {result.originalSize && result.enhancedSize && (
                      <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary">
                          {result.originalSize} → {result.enhancedSize}
                        </Typography>
                      </Grid>
                    )}
                  </Grid>
                </CardContent>
                <CardActions>
                  <Button
                    startIcon={<Download />}
                    onClick={downloadResult}
                    variant="contained"
                  >
                    Descargar
                  </Button>
                  <Button
                    startIcon={<CompareArrows />}
                    onClick={() => setCompareDialogOpen(true)}
                    variant="outlined"
                  >
                    Comparar
                  </Button>
                </CardActions>
              </Card>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Dialog de comparación */}
      <Dialog 
        open={compareDialogOpen} 
        onClose={() => setCompareDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>Comparación: Original vs Mejorada</DialogTitle>
        <DialogContent>
          {previewUrl && result && (
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="subtitle1" gutterBottom>Original</Typography>
                <img 
                  src={previewUrl} 
                  alt="Original" 
                  style={{ width: '100%', height: 'auto' }}
                />
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle1" gutterBottom>Mejorada ({result.scaleFactor}x)</Typography>
                <img 
                  src={`http://localhost:5000${result.url}`} 
                  alt="Enhanced" 
                  style={{ width: '100%', height: 'auto' }}
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCompareDialogOpen(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RealESRGAN; 