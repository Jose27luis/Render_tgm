# Real-ESRGAN Service

Este servicio proporciona mejora de resolución de imágenes usando Real-ESRGAN (Real-World Super-Resolution).

## ¿Qué es Real-ESRGAN?

Real-ESRGAN es un modelo de inteligencia artificial que mejora la resolución de las imágenes, aumentando su tamaño mientras mejora los detalles y reduce el ruido. Es especialmente útil para:

- Mejorar fotos antiguas o de baja resolución
- Aumentar el tamaño de imágenes sin perder calidad
- Mejorar imágenes de anime/manga
- Restaurar imágenes con ruido o compresión JPEG

## Instalación

### Requisitos previos
- Python 3.8 o superior
- Windows 10/11 (para el script .bat) o Linux/Mac
- GPU NVIDIA (opcional pero recomendado para mejor rendimiento)

### Pasos de instalación

1. **Para Windows:**
   ```bash
   # Ejecutar el script de instalación
   setup_realesrgan.bat
   ```

2. **Para Linux/Mac:**
   ```bash
   # Crear entorno virtual
   python3 -m venv venv_realesrgan
   
   # Activar entorno virtual
   source venv_realesrgan/bin/activate  # Linux/Mac
   
   # Instalar dependencias
   pip install -r requirements_realesrgan.txt
   ```

## Uso

### Iniciar el servicio

```bash
# Activar entorno virtual
venv_realesrgan\Scripts\activate.bat  # Windows
source venv_realesrgan/bin/activate    # Linux/Mac

# Ejecutar el servicio
python app_realesrgan.py
```

El servicio estará disponible en `http://localhost:8002`

### Endpoints disponibles

#### 1. Mejorar resolución de imagen
- **URL:** `POST /enhance`
- **Parámetros:**
  - `file`: Archivo de imagen (requerido)
  - `model_name`: Modelo a usar (opcional, default: "real4x")
    - `"animevideo2x"`: Para videos/anime, escala 2x
    - `"animevideo3x"`: Para videos/anime, escala 3x
    - `"animevideo4x"`: Para videos/anime, escala 4x
    - `"anime4x"`: Optimizado para imágenes anime, escala 4x
    - `"real4x"`: General purpose, escala 4x (default)
  - `gpu_id`: ID de GPU (opcional, default: 0, usar -1 para CPU)
  - `tta_mode`: Test Time Augmentation (opcional, default: false)
  - `tilesize`: Tamaño de tile para imágenes grandes (opcional, default: 0 = auto)

#### 2. Mejora combinada (iluminación + resolución)
- **URL:** `POST /enhance_combined`
- **Parámetros:**
  - `file`: Archivo de imagen (requerido)
  - `model_name`: Modelo Real-ESRGAN (opcional, default: "real4x")
  - `enhance_low_light`: Aplicar mejora de iluminación primero (opcional, default: false)

#### 3. Obtener modelos disponibles
- **URL:** `GET /models`
- **Respuesta:** Lista de modelos disponibles y sus características

#### 4. Estado del servicio
- **URL:** `GET /health`
- **Respuesta:** Estado del servicio y modelos disponibles

### Ejemplo de uso con curl

```bash
# Mejorar resolución con modelo por defecto
curl -X POST -F "file=@imagen.jpg" http://localhost:8002/enhance -o mejorada.jpg

# Usar modelo específico para anime
curl -X POST -F "file=@anime.jpg" -F "model_name=anime4x" http://localhost:8002/enhance -o anime_4x.jpg

# Mejora combinada (iluminación + resolución)
curl -X POST -F "file=@oscura.jpg" -F "enhance_low_light=true" http://localhost:8002/enhance_combined -o combinada.jpg
```

### Integración con el backend Node.js

El backend ya está configurado con los siguientes endpoints:

- `POST /api/images/:imageId/enhance` - Mejora la resolución de una imagen
- `POST /api/images/:imageId/enhance-combined` - Mejora combinada
- `GET /api/images/models` - Obtener modelos disponibles

## Rendimiento

### Tiempos estimados (GPU NVIDIA)
- Imagen 512x512 → 2048x2048: ~2-3 segundos
- Imagen 1024x1024 → 4096x4096: ~5-8 segundos

### Tiempos estimados (CPU)
- Imagen 512x512 → 2048x2048: ~30-60 segundos
- Imagen 1024x1024 → 4096x4096: ~2-5 minutos

## Solución de problemas

### Error: "CUDA out of memory"
- Reducir el `tilesize` (ej: 256 o 512)
- Usar CPU con `gpu_id=-1`

### Error al instalar realesrgan-ncnn-py
- Verificar que tienes Python 3.8+ instalado
- En Windows, instalar Visual C++ Redistributable

### Imágenes muy grandes
- El servicio automáticamente divide imágenes grandes en tiles
- Puedes ajustar manualmente con el parámetro `tilesize`

## Modelos disponibles

1. **realesr-animevideov3-x2/x3/x4**: Optimizado para videos y animación
2. **realesrgan-x4plus-anime**: Específico para imágenes de anime/manga
3. **realesrgan-x4plus**: Modelo general, mejor para fotografías reales

## Notas adicionales

- Los archivos temporales se limpian automáticamente después de 60 segundos
- El servicio mantiene un cache de modelos para mejor rendimiento
- Se recomienda GPU NVIDIA para mejor velocidad
- Compatible con formatos: JPG, PNG, WebP 