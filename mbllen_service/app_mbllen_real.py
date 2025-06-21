from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import FileResponse
import shutil
import os
import sys
import numpy as np
import cv2
import time

# --- LÓGICA DE RUTA MEJORADA ---
# Obtener la ruta absoluta del directorio actual del script
script_dir = os.path.dirname(os.path.abspath(__file__))
# Construir la ruta absoluta al directorio de los módulos MBLLEN
mbllen_module_path = os.path.join(script_dir, 'Low-Light-Image-Enhancement_using_MBLLEN', 'main')
# Añadir la ruta absoluta al path de Python
sys.path.append(mbllen_module_path)

try:
    import Network
    import utls
    import keras
    MBLLEN_AVAILABLE = True
    print("MBLLEN modules loaded successfully")
except ImportError as e:
    print(f"Error importing MBLLEN modules: {e}")
    MBLLEN_AVAILABLE = False

app = FastAPI()

# Variables globales para el modelo
mbllen_model = None

def load_mbllen_model():
    """Cargar el modelo MBLLEN pre-entrenado"""
    global mbllen_model
    try:
        if not MBLLEN_AVAILABLE:
            raise Exception("MBLLEN modules not available")
            
        model_path = './Low-Light-Image-Enhancement_using_MBLLEN/models/Syn_img_lowlight_withnoise.h5'
        if not os.path.exists(model_path):
            raise Exception(f"Model file not found: {model_path}")
            
        mbllen_model = Network.build_mbllen((None, None, 3))
        mbllen_model.load_weights(model_path)
        opt = keras.optimizers.Adam(learning_rate=2 * 1e-04, beta_1=0.9, beta_2=0.999, epsilon=1e-08)
        mbllen_model.compile(loss='mse', optimizer=opt)
        print("MBLLEN model loaded successfully")
        return True
    except Exception as e:
        print(f"Error loading MBLLEN model: {e}")
        return False

def enhance_image_mbllen(input_path, output_path):
    """Mejorar imagen usando MBLLEN real"""
    try:
        if mbllen_model is None:
            raise Exception("MBLLEN model not loaded")
            
        # Leer la imagen
        img_A = utls.imread_color(input_path)
        img_A = img_A[np.newaxis, :]
        
        # Predecir con MBLLEN
        print("Processing image with MBLLEN...")
        start_time = time.time()
        out_pred = mbllen_model.predict(img_A)
        end_time = time.time()
        print(f"MBLLEN processing time: {end_time - start_time:.2f}s")
        
        # Post-procesamiento (basado en test.py)
        fake_B = out_pred[0, :, :, :3]
        
        # Aplicar post-procesamiento para mejorar la calidad (versión ajustada)
        gray_fake_B = fake_B[:, :, 0] * 0.299 + fake_B[:, :, 1] * 0.587 + fake_B[:, :, 2] * 0.114
        
        # --- PARÁMETROS AJUSTADOS ---
        # Escalado adaptativo
        highpercent = 98  # Ser más selectivo con los blancos
        lowpercent = 2    # Preservar más los negros
        maxrange = 0.75   # Bajar el techo de brillo
        
        max_value = np.percentile(gray_fake_B[:], highpercent)
        percent_max = sum(sum(gray_fake_B >= maxrange))/sum(sum(gray_fake_B <= 1.0))
        
        if percent_max < (100-highpercent)/100.:
            scale = maxrange / max_value if max_value > 0 else 1
            fake_B = fake_B * scale
            fake_B = np.minimum(fake_B, 1.0)
        
        # Ajuste de rango
        gray_fake_B = fake_B[:,:,0]*0.299 + fake_B[:,:,1]*0.587 + fake_B[:,:,2]*0.114
        sub_value = np.percentile(gray_fake_B[:], lowpercent)
        
        # Evitar dividir por cero o valores cercanos
        denominator = 1 - sub_value
        if denominator > 1e-6:
            fake_B = (fake_B - sub_value)*(1./denominator)
        
        # Ajuste de saturación (menos agresivo)
        imgHSV = cv2.cvtColor(fake_B, cv2.COLOR_RGB2HSV)
        H, S, V = cv2.split(imgHSV)
        S = np.power(S, 0.9)  # gamma = 9/10, más cercano a 1
        imgHSV = cv2.merge([H, S, V])
        fake_B = cv2.cvtColor(imgHSV, cv2.COLOR_HSV2RGB)
        
        # Asegurar rango válido
        fake_B = np.minimum(fake_B, 1.0)
        fake_B = np.maximum(fake_B, 0.0)
        
        # Guardar imagen
        utls.imwrite(output_path, fake_B)
        print(f"Enhanced image saved to: {output_path}")
        
    except Exception as e:
        print(f"Error in MBLLEN processing: {e}")
        # Fallback: copiar imagen original
        shutil.copy2(input_path, output_path)
        raise e

@app.on_event("startup")
async def startup_event():
    """Cargar el modelo al iniciar la aplicación"""
    print("Starting MBLLEN service...")
    success = load_mbllen_model()
    if not success:
        print("Warning: MBLLEN model could not be loaded. Service will use fallback mode.")

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
        
        # Procesar imagen con MBLLEN
        enhance_image_mbllen(input_path, output_path)
        
        return FileResponse(output_path, media_type="image/jpeg")
        
    except Exception as e:
        print(f"Error processing image: {e}")
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")

@app.get('/health')
async def health():
    model_status = "loaded" if mbllen_model is not None else "not loaded"
    return {
        "status": "ok", 
        "message": "MBLLEN service is running",
        "model_status": model_status,
        "mbllen_available": MBLLEN_AVAILABLE
    }

@app.get('/')
async def root():
    return {
        "message": "MBLLEN Image Enhancement Service", 
        "mode": "real_mbllen",
        "model_loaded": mbllen_model is not None
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 