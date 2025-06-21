from fastapi import FastAPI, File, UploadFile
from fastapi.responses import FileResponse
import shutil
import os
from PIL import Image, ImageEnhance
import io

app = FastAPI()

def enhance_image_simple(input_path, output_path):
    """
    Simulación simple de mejora de imagen usando PIL
    Aumenta el brillo y contraste como placeholder para MBLLEN
    """
    try:
        # Abrir la imagen
        with Image.open(input_path) as img:
            # Convertir a RGB si es necesario
            if img.mode != 'RGB':
                img = img.convert('RGB')
            
            # Aplicar mejoras básicas (simulando MBLLEN)
            # Aumentar brillo
            brightness_enhancer = ImageEnhance.Brightness(img)
            img = brightness_enhancer.enhance(1.3)  # Aumentar brillo 30%
            
            # Aumentar contraste
            contrast_enhancer = ImageEnhance.Contrast(img)
            img = contrast_enhancer.enhance(1.2)  # Aumentar contraste 20%
            
            # Guardar la imagen mejorada
            img.save(output_path, 'JPEG', quality=95)
            
    except Exception as e:
        print(f"Error procesando imagen: {e}")
        # Si hay error, copiar la imagen original
        shutil.copy2(input_path, output_path)

@app.post('/mejorar')
async def mejorar(file: UploadFile = File(...)):
    # Crear directorio temp si no existe
    os.makedirs('./temp', exist_ok=True)
    
    input_path = f'./temp/{file.filename}'
    output_path = f'./temp/mejorada_{file.filename}'
    
    # Guardar archivo subido
    with open(input_path, 'wb') as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Procesar imagen
    enhance_image_simple(input_path, output_path)
    
    return FileResponse(output_path, media_type="image/jpeg")

@app.get('/health')
async def health():
    return {"status": "ok", "message": "MBLLEN service is running (simple mode)"}

@app.get('/')
async def root():
    return {"message": "MBLLEN Image Enhancement Service", "mode": "simple"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 