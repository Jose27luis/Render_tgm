from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.responses import FileResponse
import shutil
import os
import cv2
import numpy as np
import time
from PIL import Image
from realesrgan_ncnn_py import Realesrgan

app = FastAPI()

# Configuración de modelos disponibles
MODELS = {
    "animevideo2x": {"scale": 2, "model_num": 0, "name": "realesr-animevideov3-x2"},
    "animevideo3x": {"scale": 3, "model_num": 1, "name": "realesr-animevideov3-x3"},
    "animevideo4x": {"scale": 4, "model_num": 2, "name": "realesr-animevideov3-x4"},
    "anime4x": {"scale": 4, "model_num": 3, "name": "realesrgan-x4plus-anime"},
    "real4x": {"scale": 4, "model_num": 4, "name": "realesrgan-x4plus"}
}

# Cache para los modelos ya cargados
model_cache = {}

def get_or_create_model(model_name: str = "real4x", gpu_id: int = 0, tta_mode: bool = False, tilesize: int = 0):
    """Obtiene un modelo del cache o crea uno nuevo si no existe"""
    cache_key = f"{model_name}_{gpu_id}_{tta_mode}_{tilesize}"
    
    if cache_key not in model_cache:
        model_info = MODELS.get(model_name, MODELS["real4x"])
        model_cache[cache_key] = Realesrgan(
            gpuid=gpu_id,
            tta_mode=tta_mode,
            tilesize=tilesize,
            model=model_info["model_num"]
        )
    
    return model_cache[cache_key], model_info

@app.post('/enhance')
async def enhance_image(
    file: UploadFile = File(...),
    model_name: str = Form(default="real4x"),
    gpu_id: int = Form(default=0),
    tta_mode: bool = Form(default=False),
    tilesize: int = Form(default=0)
):
    """
    Mejora la resolución de una imagen usando Real-ESRGAN
    
    Parámetros:
    - file: Archivo de imagen a procesar
    - model_name: Nombre del modelo ("animevideo2x", "animevideo3x", "animevideo4x", "anime4x", "real4x")
    - gpu_id: ID de GPU a usar (-1 para CPU)
    - tta_mode: Activar Test Time Augmentation para mejor calidad (más lento)
    - tilesize: Tamaño del tile para procesar imágenes grandes (0 = automático, >= 32)
    """
    
    # Crear directorio temp si no existe
    os.makedirs('./temp', exist_ok=True)
    
    # Generar nombres únicos para archivos
    timestamp = int(time.time() * 1000)
    input_path = f'./temp/input_{timestamp}_{file.filename}'
    output_path = f'./temp/enhanced_{timestamp}_{file.filename}'
    
    try:
        # Guardar archivo subido
        with open(input_path, 'wb') as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        print(f"Processing image with Real-ESRGAN...")
        print(f"Model: {model_name}, GPU: {gpu_id}, TTA: {tta_mode}, Tilesize: {tilesize}")
        
        start_time = time.time()
        
        # Obtener o crear el modelo
        realesrgan, model_info = get_or_create_model(model_name, gpu_id, tta_mode, tilesize)
        
        # Procesar imagen usando PIL (más compatible)
        with Image.open(input_path) as image:
            # Convertir a RGB si es necesario
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            # Procesar con Real-ESRGAN
            enhanced_image = realesrgan.process_pil(image)
            
            # Guardar imagen mejorada
            if output_path.lower().endswith(('.jpg', '.jpeg')):
                enhanced_image.save(output_path, quality=95)
            else:
                enhanced_image.save(output_path)
        
        end_time = time.time()
        processing_time = end_time - start_time
        
        # Obtener información de las imágenes
        original_image = cv2.imread(input_path)
        enhanced_image_cv = cv2.imread(output_path)
        
        original_height, original_width = original_image.shape[:2]
        enhanced_height, enhanced_width = enhanced_image_cv.shape[:2]
        
        print(f"Processing complete in {processing_time:.2f}s")
        print(f"Original size: {original_width}x{original_height}")
        print(f"Enhanced size: {enhanced_width}x{enhanced_height}")
        print(f"Scale factor: {model_info['scale']}x")
        
        return FileResponse(
            output_path, 
            media_type="image/jpeg",
            headers={
                "X-Processing-Time": str(processing_time),
                "X-Original-Size": f"{original_width}x{original_height}",
                "X-Enhanced-Size": f"{enhanced_width}x{enhanced_height}",
                "X-Model-Used": model_info['name'],
                "X-Scale-Factor": str(model_info['scale'])
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
        # Limpiar archivo de entrada después de un tiempo
        def cleanup():
            time.sleep(60)  # Esperar 60 segundos antes de limpiar
            if os.path.exists(input_path):
                os.remove(input_path)
            if os.path.exists(output_path):
                os.remove(output_path)
        
        # Ejecutar limpieza en un thread separado
        import threading
        cleanup_thread = threading.Thread(target=cleanup)
        cleanup_thread.daemon = True
        cleanup_thread.start()

@app.post('/enhance_combined')
async def enhance_combined(
    file: UploadFile = File(...),
    model_name: str = Form(default="real4x"),
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
        realesrgan, model_info = get_or_create_model(model_name)
        
        with Image.open(current_path) as image:
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            enhanced_image = realesrgan.process_pil(image)
            
            if output_path.lower().endswith(('.jpg', '.jpeg')):
                enhanced_image.save(output_path, quality=95)
            else:
                enhanced_image.save(output_path)
        
        return FileResponse(
            output_path,
            media_type="image/jpeg",
            headers={
                "X-Enhancements-Applied": "low-light,super-resolution" if enhance_low_light else "super-resolution",
                "X-Model-Used": model_info['name']
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
    return {
        "models": MODELS,
        "default": "real4x"
    }

@app.get('/health')
async def health():
    """Endpoint de salud del servicio"""
    return {
        "status": "ok",
        "service": "Real-ESRGAN Image Enhancement",
        "version": "1.0.0",
        "available_models": list(MODELS.keys())
    }

@app.get('/')
async def root():
    """Información del servicio"""
    return {
        "service": "Real-ESRGAN Image Enhancement Service",
        "description": "Super-resolution service using Real-ESRGAN models",
        "endpoints": {
            "/enhance": "Enhance image resolution",
            "/enhance_combined": "Combined enhancement (low-light + super-resolution)",
            "/models": "Get available models",
            "/health": "Service health check"
        },
        "models": MODELS
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002) 