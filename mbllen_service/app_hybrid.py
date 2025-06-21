from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import FileResponse
import shutil
import os
import sys
import numpy as np
import cv2 as cv
import time

# Agregar el path del proyecto MBLLEN
sys.path.append('./Low-Light-Image-Enhancement_using_MBLLEN/main')

app = FastAPI()

def imread_color(path):
    """Función tomada de utls.py - leer imagen en color"""
    img = cv.imread(path, cv.IMREAD_COLOR | cv.IMREAD_ANYDEPTH) / 255.
    b, g, r = cv.split(img)
    img_rgb = cv.merge([r, g, b])
    return img_rgb

def imwrite(path, img):
    """Función tomada de utls.py - escribir imagen"""
    r, g, b = cv.split(img*255)
    img_rgb = cv.merge([b, g, r])
    cv.imwrite(path, img_rgb)

def enhance_image_advanced(input_path, output_path):
    """
    Mejora de imagen avanzada usando técnicas de procesamiento de imagen
    Simula el comportamiento de MBLLEN con algoritmos tradicionales
    """
    try:
        print("Processing image with advanced enhancement...")
        start_time = time.time()
        
        # Leer imagen usando la función de MBLLEN
        img = imread_color(input_path)
        
        # Aplicar múltiples técnicas de mejora para imágenes con poca luz
        
        # 1. Corrección gamma adaptativa
        gamma = 0.6  # Para imágenes oscuras
        img_gamma = np.power(img, gamma)
        
        # 2. Ecualización de histograma adaptativa (CLAHE) en espacio LAB
        lab = cv.cvtColor((img_gamma * 255).astype(np.uint8), cv.COLOR_RGB2LAB)
        l, a, b = cv.split(lab)
        
        # Aplicar CLAHE al canal L (luminancia)
        clahe = cv.createCLAHE(clipLimit=3.0, tileGridSize=(8,8))
        l = clahe.apply(l)
        
        # Recombinar canales
        lab = cv.merge([l, a, b])
        img_clahe = cv.cvtColor(lab, cv.COLOR_LAB2RGB) / 255.0
        
        # 3. Ajuste de contraste y brillo
        alpha = 1.3  # Contraste
        beta = 0.1   # Brillo
        img_contrast = np.clip(alpha * img_clahe + beta, 0, 1)
        
        # 4. Filtro bilateral para reducir ruido manteniendo bordes
        img_bilateral = cv.bilateralFilter(
            (img_contrast * 255).astype(np.uint8), 
            9, 75, 75
        ) / 255.0
        
        # 5. Ajuste de saturación en espacio HSV
        hsv = cv.cvtColor((img_bilateral * 255).astype(np.uint8), cv.COLOR_RGB2HSV)
        h, s, v = cv.split(hsv)
        
        # Aumentar saturación
        s = cv.multiply(s, 1.2)
        s = np.clip(s, 0, 255)
        
        # Recombinar
        hsv = cv.merge([h, s, v])
        img_final = cv.cvtColor(hsv, cv.COLOR_HSV2RGB) / 255.0
        
        # 6. Post-procesamiento similar al de MBLLEN
        # Ajuste de rango dinámico
        gray = img_final[:,:,0] * 0.299 + img_final[:,:,1] * 0.587 + img_final[:,:,2] * 0.114
        
        # Escalado adaptativo
        highpercent = 95
        lowpercent = 5
        
        max_value = np.percentile(gray, highpercent)
        min_value = np.percentile(gray, lowpercent)
        
        # Normalizar rango
        img_final = (img_final - min_value) / (max_value - min_value)
        img_final = np.clip(img_final, 0, 1)
        
        # Asegurar rango válido
        img_final = np.minimum(img_final, 1.0)
        img_final = np.maximum(img_final, 0.0)
        
        end_time = time.time()
        print(f"Advanced enhancement processing time: {end_time - start_time:.2f}s")
        
        # Guardar usando la función de MBLLEN
        imwrite(output_path, img_final)
        print(f"Enhanced image saved to: {output_path}")
        
    except Exception as e:
        print(f"Error in advanced processing: {e}")
        # Fallback: copiar imagen original
        shutil.copy2(input_path, output_path)
        raise e

@app.post('/mejorar')
async def mejorar(file: UploadFile = File(...)):
    # Crear directorio temp si no existe
    os.makedirs('./temp', exist_ok=True)
    
    input_path = f'./temp/{file.filename}'
    output_path = f'./temp/mejorada_{file.filename}'
    
    try:
        # Guardar archivo subido
        with open(input_path, 'wb') as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Procesar imagen con algoritmos avanzados
        enhance_image_advanced(input_path, output_path)
        
        return FileResponse(output_path, media_type="image/jpeg")
        
    except Exception as e:
        print(f"Error processing image: {e}")
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")

@app.get('/health')
async def health():
    return {
        "status": "ok", 
        "message": "MBLLEN service is running",
        "mode": "advanced_cv",
        "description": "Using advanced computer vision techniques"
    }

@app.get('/')
async def root():
    return {
        "message": "MBLLEN Image Enhancement Service", 
        "mode": "advanced_cv",
        "description": "Advanced computer vision enhancement without deep learning"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001) 