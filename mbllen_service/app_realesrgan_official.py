from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.responses import FileResponse
import shutil
import os
import cv2
import numpy as np
import time
from PIL import Image
import torch
from basicsr.archs.rrdbnet_arch import RRDBNet
from realesrgan import RealESRGANer
from pathlib import Path
import requests
import threading

app = FastAPI()

# Directorio para modelos
MODELS_DIR = Path('./models')
MODELS_DIR.mkdir(exist_ok=True)

# URLs de los modelos pre-entrenados
MODEL_URLS = {
    "RealESRGAN_x4plus": "https://github.com/xinntao/Real-ESRGAN/releases/download/v0.1.0/RealESRGAN_x4plus.pth",
    "RealESRGAN_x2plus": "https://github.com/xinntao/Real-ESRGAN/releases/download/v0.2.1/RealESRGAN_x2plus.pth",
    "RealESRGAN_x4plus_anime_6B": "https://github.com/xinntao/Real-ESRGAN/releases/download/v0.2.2.4/RealESRGAN_x4plus_anime_6B.pth"
}

# Cache para los modelos cargados
model_cache = {}

def download_model(model_name: str):
    """Descarga un modelo si no existe"""
    model_path = MODELS_DIR / f"{model_name}.pth"
    if not model_path.exists():
        print(f"Descargando modelo {model_name}...")
        url = MODEL_URLS.get(model_name)
        if url:
            response = requests.get(url, stream=True)
            response.raise_for_status()
            with open(model_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
            print(f"Modelo {model_name} descargado exitosamente")
    return model_path

def get_or_create_model(model_name: str = "RealESRGAN_x4plus", tile: int = 0):
    """Obtiene un modelo del cache o crea uno nuevo"""
    cache_key = f"{model_name}_{tile}"
    
    if cache_key not in model_cache:
        # Descargar modelo si no existe
        model_path = download_model(model_name)
        
        # Determinar la arquitectura y escala según el modelo
        if model_name == "RealESRGAN_x4plus_anime_6B":
            model = RRDBNet(num_in_ch=3, num_out_ch=3, num_feat=64, num_block=6, num_grow_ch=32, scale=4)
            netscale = 4
        elif model_name == "RealESRGAN_x2plus":
            model = RRDBNet(num_in_ch=3, num_out_ch=3, num_feat=64, num_block=23, num_grow_ch=32, scale=2)
            netscale = 2
        else:  # RealESRGAN_x4plus
            model = RRDBNet(num_in_ch=3, num_out_ch=3, num_feat=64, num_block=23, num_grow_ch=32, scale=4)
            netscale = 4
        
        # Crear upsampler
        upsampler = RealESRGANer(
            scale=netscale,
            model_path=str(model_path),
            model=model,
            tile=tile,
            tile_pad=10,
            pre_pad=0,
            half=False,  # Usar FP32 para compatibilidad
            device='cuda' if torch.cuda.is_available() else 'cpu'
        )
        
        model_cache[cache_key] = (upsampler, netscale)
    
    return model_cache[cache_key]

@app.on_event("startup")
async def startup_event():
    """Descarga el modelo por defecto al iniciar"""
    try:
        download_model("RealESRGAN_x4plus")
        print("Modelo por defecto listo")
    except Exception as e:
        print(f"Error descargando modelo por defecto: {e}")

@app.post('/enhance')
async def enhance_image(
    file: UploadFile = File(...),
    model_name: str = Form(default="RealESRGAN_x4plus"),
    tile: int = Form(default=0),
    outscale: float = Form(default=None)
):
    """
    Mejora la resolución de una imagen usando Real-ESRGAN
    
    Parámetros:
    - file: Archivo de imagen a procesar
    - model_name: Nombre del modelo ("RealESRGAN_x4plus", "RealESRGAN_x2plus", "RealESRGAN_x4plus_anime_6B")
    - tile: Tamaño del tile para procesar imágenes grandes (0 = sin tiles)
    - outscale: Escala de salida personalizada (opcional)
    """
    
    # Crear directorio temp si no existe
    os.makedirs('./temp', exist_ok=True)
    
    # Generar nombres únicos
    timestamp = int(time.time() * 1000)
    input_path = f'./temp/input_{timestamp}_{file.filename}'
    output_path = f'./temp/enhanced_{timestamp}_{file.filename}'
    
    try:
        # Guardar archivo subido
        with open(input_path, 'wb') as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        print(f"Processing image with Real-ESRGAN Official...")
        print(f"Model: {model_name}, Tile: {tile}")
        
        start_time = time.time()
        
        # Obtener o crear el modelo
        upsampler, default_scale = get_or_create_model(model_name, tile)
        
        # Leer imagen
        img = cv2.imread(input_path, cv2.IMREAD_UNCHANGED)
        if img is None:
            raise ValueError("No se pudo leer la imagen")
        
        # Si la imagen tiene canal alpha, procesarlo separadamente
        if len(img.shape) == 3 and img.shape[2] == 4:
            img_rgb = img[:, :, :3]
            alpha = img[:, :, 3]
            output, _ = upsampler.enhance(img_rgb, outscale=outscale)
            # Escalar el canal alpha
            alpha_scale = output.shape[0] // alpha.shape[0]
            alpha_resized = cv2.resize(alpha, (output.shape[1], output.shape[0]), interpolation=cv2.INTER_LINEAR)
            output = cv2.merge([output[:,:,0], output[:,:,1], output[:,:,2], alpha_resized])
        else:
            # Procesar imagen RGB normal
            output, _ = upsampler.enhance(img, outscale=outscale)
        
        # Guardar imagen
        cv2.imwrite(output_path, output)
        
        end_time = time.time()
        processing_time = end_time - start_time
        
        # Obtener información de las imágenes
        original_height, original_width = img.shape[:2]
        enhanced_height, enhanced_width = output.shape[:2]
        actual_scale = enhanced_width / original_width
        
        print(f"Processing complete in {processing_time:.2f}s")
        print(f"Original size: {original_width}x{original_height}")
        print(f"Enhanced size: {enhanced_width}x{enhanced_height}")
        print(f"Actual scale: {actual_scale:.1f}x")
        
        return FileResponse(
            output_path,
            media_type="image/jpeg",
            headers={
                "X-Processing-Time": str(processing_time),
                "X-Original-Size": f"{original_width}x{original_height}",
                "X-Enhanced-Size": f"{enhanced_width}x{enhanced_height}",
                "X-Model-Used": model_name,
                "X-Scale-Factor": str(actual_scale)
            }
        )
        
    except Exception as e:
        print(f"Error processing image: {e}")
        # Limpiar archivos en caso de error
        if os.path.exists(input_path):
            os.remove(input_path)
        if os.path.exists(output_path):
            os.remove(output_path)
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")
    
    finally:
        # Limpiar archivos después de un tiempo
        def cleanup():
            time.sleep(60)
            for path in [input_path, output_path]:
                if os.path.exists(path):
                    try:
                        os.remove(path)
                    except:
                        pass
        
        cleanup_thread = threading.Thread(target=cleanup)
        cleanup_thread.daemon = True
        cleanup_thread.start()

@app.post('/enhance_combined')
async def enhance_combined(
    file: UploadFile = File(...),
    model_name: str = Form(default="RealESRGAN_x4plus"),
    enhance_low_light: bool = Form(default=False)
):
    """
    Mejora una imagen combinando Real-ESRGAN con mejora de iluminación opcional
    """
    # Crear directorio temp si no existe
    os.makedirs('./temp', exist_ok=True)
    
    timestamp = int(time.time() * 1000)
    input_path = f'./temp/input_{timestamp}_{file.filename}'
    temp_path = f'./temp/temp_{timestamp}_{file.filename}'
    output_path = f'./temp/combined_{timestamp}_{file.filename}'
    
    try:
        # Guardar archivo subido
        with open(input_path, 'wb') as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        current_path = input_path
        
        # Si se solicita mejora de iluminación, aplicar primero
        if enhance_low_light:
            print("Applying low-light enhancement first...")
            from app_hybrid import enhance_image_advanced
            enhance_image_advanced(current_path, temp_path)
            current_path = temp_path
        
        # Aplicar Real-ESRGAN
        print("Applying Real-ESRGAN enhancement...")
        upsampler, _ = get_or_create_model(model_name)
        
        img = cv2.imread(current_path, cv2.IMREAD_UNCHANGED)
        output, _ = upsampler.enhance(img)
        cv2.imwrite(output_path, output)
        
        return FileResponse(
            output_path,
            media_type="image/jpeg",
            headers={
                "X-Enhancements-Applied": "low-light,super-resolution" if enhance_low_light else "super-resolution",
                "X-Model-Used": model_name
            }
        )
        
    except Exception as e:
        print(f"Error in combined enhancement: {e}")
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")
    
    finally:
        # Limpiar archivos temporales
        for path in [input_path, temp_path, output_path]:
            if os.path.exists(path):
                try:
                    os.remove(path)
                except:
                    pass

@app.get('/models')
async def get_available_models():
    """Obtiene la lista de modelos disponibles"""
    models = {
        "RealESRGAN_x4plus": {
            "scale": 4,
            "description": "Modelo general para fotografías, escala 4x",
            "downloaded": (MODELS_DIR / "RealESRGAN_x4plus.pth").exists()
        },
        "RealESRGAN_x2plus": {
            "scale": 2,
            "description": "Modelo general para fotografías, escala 2x",
            "downloaded": (MODELS_DIR / "RealESRGAN_x2plus.pth").exists()
        },
        "RealESRGAN_x4plus_anime_6B": {
            "scale": 4,
            "description": "Modelo optimizado para anime/ilustraciones, escala 4x",
            "downloaded": (MODELS_DIR / "RealESRGAN_x4plus_anime_6B.pth").exists()
        }
    }
    return {
        "models": models,
        "default": "RealESRGAN_x4plus",
        "device": "cuda" if torch.cuda.is_available() else "cpu"
    }

@app.get('/health')
async def health():
    """Endpoint de salud del servicio"""
    return {
        "status": "ok",
        "service": "Real-ESRGAN Official Image Enhancement",
        "version": "1.0.0",
        "pytorch_version": torch.__version__,
        "cuda_available": torch.cuda.is_available(),
        "device": "cuda" if torch.cuda.is_available() else "cpu"
    }

@app.get('/')
async def root():
    """Información del servicio"""
    return {
        "service": "Real-ESRGAN Official Image Enhancement Service",
        "description": "Super-resolution service using official Real-ESRGAN implementation",
        "endpoints": {
            "/enhance": "Enhance image resolution",
            "/enhance_combined": "Combined enhancement (low-light + super-resolution)",
            "/models": "Get available models",
            "/health": "Service health check"
        },
        "note": "Models are downloaded automatically on first use"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002) 