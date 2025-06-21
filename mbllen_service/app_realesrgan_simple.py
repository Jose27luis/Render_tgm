from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
import shutil
import os
import cv2
import numpy as np
import time
from PIL import Image
import threading

app = FastAPI()

# Configurar CORS para permitir peticiones desde el navegador
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permite cualquier origen
    allow_credentials=True,
    allow_methods=["*"],  # Permite todos los métodos (GET, POST, etc.)
    allow_headers=["*"],  # Permite todos los headers
)

def upscale_image_simple(img, scale=4):
    """
    Mejora la resolución de una imagen usando técnicas de procesamiento clásicas
    Similar a Real-ESRGAN pero sin redes neuronales
    """
    # Obtener dimensiones originales
    h, w = img.shape[:2]
    new_h, new_w = h * scale, w * scale
    
    # 1. Upscale inicial con interpolación Lanczos
    upscaled = cv2.resize(img, (new_w, new_h), interpolation=cv2.INTER_LANCZOS4)
    
    # 2. Aplicar sharpening para mejorar detalles
    kernel = np.array([[-1,-1,-1],
                       [-1, 9,-1],
                       [-1,-1,-1]])
    sharpened = cv2.filter2D(upscaled, -1, kernel * 0.3)
    
    # 3. Reducción de ruido manteniendo bordes
    denoised = cv2.bilateralFilter(sharpened, 9, 75, 75)
    
    # 4. Ajuste de contraste adaptativo
    if len(img.shape) == 3:
        # Convertir a LAB para mejor procesamiento
        lab = cv2.cvtColor(denoised, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)
        
        # Aplicar CLAHE al canal L
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
        l = clahe.apply(l)
        
        # Recombinar
        enhanced = cv2.merge([l, a, b])
        enhanced = cv2.cvtColor(enhanced, cv2.COLOR_LAB2BGR)
    else:
        # Imagen en escala de grises
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
        enhanced = clahe.apply(denoised)
    
    # 5. Unsharp masking final
    gaussian = cv2.GaussianBlur(enhanced, (0, 0), 2.0)
    final = cv2.addWeighted(enhanced, 1.5, gaussian, -0.5, 0)
    
    return final

def process_image_tiles(img, scale=4, tile_size=512):
    """
    Procesa la imagen por tiles para manejar imágenes grandes
    """
    h, w = img.shape[:2]
    
    # Si la imagen es pequeña, procesarla completa
    if h <= tile_size and w <= tile_size:
        return upscale_image_simple(img, scale)
    
    # Calcular tamaño de salida
    new_h, new_w = h * scale, w * scale
    
    # Crear imagen de salida
    if len(img.shape) == 3:
        output = np.zeros((new_h, new_w, img.shape[2]), dtype=img.dtype)
    else:
        output = np.zeros((new_h, new_w), dtype=img.dtype)
    
    # Procesar por tiles con overlap
    overlap = 32
    
    for y in range(0, h, tile_size - overlap):
        for x in range(0, w, tile_size - overlap):
            # Extraer tile
            y_end = min(y + tile_size, h)
            x_end = min(x + tile_size, w)
            
            tile = img[y:y_end, x:x_end]
            
            # Procesar tile
            tile_upscaled = upscale_image_simple(tile, scale)
            
            # Colocar en la imagen de salida
            out_y = y * scale
            out_x = x * scale
            out_y_end = min(out_y + tile_upscaled.shape[0], new_h)
            out_x_end = min(out_x + tile_upscaled.shape[1], new_w)
            
            # Inicializar blend values
            blend_y = 0
            blend_x = 0
            
            # Mezclar con overlap si es necesario
            if y > 0 or x > 0:
                # Crear máscara de blend
                blend_y = overlap * scale if y > 0 else 0
                blend_x = overlap * scale if x > 0 else 0
                
                # Aplicar blend suave en las zonas de overlap
                if blend_y > 0:
                    for i in range(blend_y):
                        alpha = i / blend_y
                        output[out_y + i, out_x:out_x_end] = (
                            output[out_y + i, out_x:out_x_end] * (1 - alpha) +
                            tile_upscaled[i, :] * alpha
                        )
                
                if blend_x > 0:
                    for j in range(blend_x):
                        alpha = j / blend_x
                        output[out_y:out_y_end, out_x + j] = (
                            output[out_y:out_y_end, out_x + j] * (1 - alpha) +
                            tile_upscaled[:, j] * alpha
                        )
            
            # Copiar la parte sin overlap
            output[out_y + blend_y:out_y_end, out_x + blend_x:out_x_end] = \
                tile_upscaled[blend_y:, blend_x:]
    
    return output

@app.post('/enhance')
async def enhance_image(
    file: UploadFile = File(...),
    scale: int = Form(default=4),
    tile_size: int = Form(default=512),
    enhance_details: bool = Form(default=True)
):
    """
    Mejora la resolución de una imagen usando procesamiento clásico
    
    Parámetros:
    - file: Archivo de imagen
    - scale: Factor de escala (2, 3 o 4)
    - tile_size: Tamaño de tile para imágenes grandes
    - enhance_details: Aplicar mejora de detalles adicional
    """
    
    # Validar escala
    if scale not in [2, 3, 4]:
        raise HTTPException(status_code=400, detail="Scale must be 2, 3, or 4")
    
    # Crear directorio temp
    os.makedirs('./temp', exist_ok=True)
    
    timestamp = int(time.time() * 1000)
    input_path = f'./temp/input_{timestamp}_{file.filename}'
    output_path = f'./temp/enhanced_{timestamp}_{file.filename}'
    
    try:
        # Guardar archivo
        with open(input_path, 'wb') as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        print(f"Processing image with simple upscaling...")
        print(f"Scale: {scale}x, Tile size: {tile_size}")
        
        start_time = time.time()
        
        # Leer imagen
        img = cv2.imread(input_path, cv2.IMREAD_UNCHANGED)
        if img is None:
            raise ValueError("Could not read image")
        
        # Procesar imagen
        if tile_size > 0:
            output = process_image_tiles(img, scale, tile_size)
        else:
            output = upscale_image_simple(img, scale)
        
        # Mejora adicional de detalles si se solicita
        if enhance_details and scale == 4:
            # Edge enhancement adicional para escala 4x
            edges = cv2.Canny(output.astype(np.uint8), 50, 150)
            edges_colored = cv2.cvtColor(edges, cv2.COLOR_GRAY2BGR) if len(output.shape) == 3 else edges
            output = cv2.addWeighted(output, 0.95, edges_colored, 0.05, 0)
        
        # Asegurar que los valores estén en rango válido
        output = np.clip(output, 0, 255).astype(np.uint8)
        
        # Guardar imagen
        cv2.imwrite(output_path, output)
        
        end_time = time.time()
        processing_time = end_time - start_time
        
        # Información de las imágenes
        original_h, original_w = img.shape[:2]
        enhanced_h, enhanced_w = output.shape[:2]
        
        print(f"Processing complete in {processing_time:.2f}s")
        print(f"Original: {original_w}x{original_h} → Enhanced: {enhanced_w}x{enhanced_h}")
        
        return FileResponse(
            output_path,
            media_type="image/jpeg",
            headers={
                "X-Processing-Time": str(processing_time),
                "X-Original-Size": f"{original_w}x{original_h}",
                "X-Enhanced-Size": f"{enhanced_w}x{enhanced_h}",
                "X-Scale-Factor": str(scale),
                "X-Method": "classical-upscaling"
            }
        )
        
    except Exception as e:
        print(f"Error processing image: {e}")
        if os.path.exists(input_path):
            os.remove(input_path)
        if os.path.exists(output_path):
            os.remove(output_path)
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
    
    finally:
        # Limpieza automática
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
    scale: int = Form(default=4),
    enhance_low_light: bool = Form(default=False)
):
    """
    Mejora combinada: iluminación + resolución
    """
    os.makedirs('./temp', exist_ok=True)
    
    timestamp = int(time.time() * 1000)
    input_path = f'./temp/input_{timestamp}_{file.filename}'
    temp_path = f'./temp/temp_{timestamp}_{file.filename}'
    output_path = f'./temp/combined_{timestamp}_{file.filename}'
    
    try:
        # Guardar archivo
        with open(input_path, 'wb') as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        current_path = input_path
        
        # Aplicar mejora de iluminación si se solicita
        if enhance_low_light:
            print("Applying low-light enhancement...")
            from app_hybrid import enhance_image_advanced
            enhance_image_advanced(current_path, temp_path)
            current_path = temp_path
        
        # Aplicar upscaling
        print("Applying resolution enhancement...")
        img = cv2.imread(current_path, cv2.IMREAD_UNCHANGED)
        output = process_image_tiles(img, scale)
        output = np.clip(output, 0, 255).astype(np.uint8)
        cv2.imwrite(output_path, output)
        
        return FileResponse(
            output_path,
            media_type="image/jpeg",
            headers={
                "X-Enhancements": "low-light,upscaling" if enhance_low_light else "upscaling",
                "X-Scale": str(scale)
            }
        )
        
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
    
    finally:
        # Limpiar archivos temporales
        for path in [input_path, temp_path, output_path]:
            if os.path.exists(path):
                try:
                    os.remove(path)
                except:
                    pass

@app.get('/models')
async def get_models():
    """Información sobre los métodos disponibles"""
    return {
        "methods": {
            "classical": {
                "description": "Upscaling clásico con mejoras",
                "scales": [2, 3, 4],
                "features": [
                    "Interpolación Lanczos4",
                    "Sharpening adaptativo", 
                    "Reducción de ruido bilateral",
                    "Mejora de contraste CLAHE",
                    "Procesamiento por tiles para imágenes grandes"
                ]
            }
        },
        "note": "Esta es una versión simplificada sin redes neuronales"
    }

@app.get('/health')
async def health():
    """Estado del servicio"""
    return {
        "status": "ok",
        "service": "Simple Image Upscaling Service",
        "version": "1.0.0",
        "method": "classical-processing"
    }

@app.get('/')
async def root():
    """Información del servicio"""
    return {
        "service": "Simple Image Upscaling Service",
        "description": "Servicio de mejora de resolución usando procesamiento clásico",
        "endpoints": {
            "/enhance": "Mejorar resolución",
            "/enhance_combined": "Mejora combinada (iluminación + resolución)",
            "/models": "Métodos disponibles",
            "/health": "Estado del servicio"
        },
        "note": "Versión simplificada compatible con Python 3.13+"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002) 