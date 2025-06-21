from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
import shutil
import os
import subprocess
import time
import threading
from pathlib import Path

app = FastAPI()

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rutas
REALESRGAN_EXE = Path("../realesrgan_oficial/realesrgan-ncnn-vulkan.exe")
TEMP_DIR = Path("./temp")
TEMP_DIR.mkdir(exist_ok=True)

# Modelos disponibles
MODELS = {
    "realesr-animevideov3-x2": {"scale": 2, "description": "Anime/Video 2x"},
    "realesr-animevideov3-x3": {"scale": 3, "description": "Anime/Video 3x"},  
    "realesr-animevideov3-x4": {"scale": 4, "description": "Anime/Video 4x"},
    "realesrgan-x4plus-anime": {"scale": 4, "description": "Anime/Illustration 4x"},
    "realesrgan-x4plus": {"scale": 4, "description": "General Photography 4x"}
}

def run_realesrgan(input_path: str, output_path: str, model: str = "realesrgan-x4plus", scale: int = 4):
    try:
        # Convertir rutas a absolutas para evitar problemas con cwd
        input_abs = Path(input_path).resolve()
        output_abs = Path(output_path).resolve()
        
        cmd = [
            str(REALESRGAN_EXE.resolve()),
            "-i", str(input_abs),
            "-o", str(output_abs),
            "-n", model,
            "-s", str(scale),
            "-t", "256",  # Tile size para optimizar memoria
            "-g", "0"     # GPU ID (0 para la primera GPU/integrada)
        ]

        print(f"Ejecutando Real-ESRGAN: {' '.join(cmd)}")
        print(f"Input path: {input_abs}")
        print(f"Output path: {output_abs}")
        print(f"Input exists: {input_abs.exists()}")
        
        # Mostrar información del archivo y ajustar tile size
        tile_size = "256"  # Default
        if input_abs.exists():
            file_size_mb = input_abs.stat().st_size / (1024 * 1024)
            print(f"📊 Tamaño del archivo: {file_size_mb:.2f} MB")
            
            # Ajustar tile size según tamaño del archivo
            if file_size_mb > 10:
                tile_size = "128"  # Tile más pequeño para archivos grandes
                print(f"🔧 Archivo grande detectado, usando tile size: {tile_size}")
            elif file_size_mb > 50:
                tile_size = "64"   # Tile aún más pequeño para archivos muy grandes
                print(f"🔧 Archivo muy grande detectado, usando tile size: {tile_size}")
        
        # Actualizar comando con tile size optimizado
        cmd[cmd.index("-t") + 1] = tile_size
        
        print("🚀 Iniciando procesamiento (puede tardar varios minutos)...")
        print(f"📋 Comando final: {' '.join(cmd)}")
        
        # Ejecutar con output en tiempo real para ver progreso
        result = subprocess.run(
            cmd,
            cwd=REALESRGAN_EXE.parent,
            capture_output=False,  # Permitir que se vea el output en tiempo real
            timeout=600  # 10 minutos
        )

        print(f"✅ Real-ESRGAN completado con código: {result.returncode}")

        if result.returncode != 0:
            raise Exception(f"Real-ESRGAN falló con código: {result.returncode}")

        # Pequeña espera para asegurar que el archivo se escriba completamente
        time.sleep(0.5)
        return True

    except subprocess.TimeoutExpired:
        raise Exception("⏳ Tiempo de procesamiento excedido (10 min). La imagen puede ser demasiado grande o compleja.")
    except Exception as e:
        raise Exception(f"❌ Error de ejecución: {str(e)}")


@app.post('/enhance')
async def enhance_image(
    file: UploadFile = File(...),
    model_name: str = Form(default="realesrgan-x4plus"),
    gpu_id: int = Form(default=0),
    tta_mode: bool = Form(default=False),
    tilesize: int = Form(default=0)
):
    """
    Mejora la resolución usando Real-ESRGAN executable
    """
    
    # Validar modelo
    if model_name not in MODELS:
        raise HTTPException(status_code=400, detail=f"Invalid model. Available: {list(MODELS.keys())}")
    
    timestamp = int(time.time() * 1000)
    input_path = TEMP_DIR / f"input_{timestamp}_{file.filename}"
    output_path = TEMP_DIR / f"enhanced_{timestamp}_{file.filename}"
    
    try:
        # Guardar archivo subido
        with open(input_path, 'wb') as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        print(f"Processing with Real-ESRGAN: {model_name}")
        start_time = time.time()
        
        # Ejecutar Real-ESRGAN
        run_realesrgan(
            str(input_path), 
            str(output_path),
            model_name,
            MODELS[model_name]["scale"]
        )
        
        # Debug: Verificar archivos después del procesamiento
        print(f"🔍 DEBUG: Checking output file existence")
        print(f"Output path: {output_path}")
        print(f"Output path exists: {output_path.exists()}")
        
        # Listar archivos en el directorio temp
        print(f"Files in temp directory after processing:")
        for file in TEMP_DIR.iterdir():
            if file.is_file():
                print(f"  - {file.name} ({file.stat().st_size} bytes)")
        
        # Buscar archivos que contengan el timestamp
        timestamp_str = str(timestamp)
        matching_files = [f for f in TEMP_DIR.iterdir() if f.is_file() and timestamp_str in f.name]
        print(f"Files matching timestamp {timestamp}:")
        for file in matching_files:
            print(f"  - {file.name} ({file.stat().st_size} bytes)")
        
        if not output_path.exists():
            raise Exception(f"Output file was not created at {output_path}")
        
        end_time = time.time()
        processing_time = end_time - start_time
        
        print(f"Processing complete in {processing_time:.2f}s")
        
        return FileResponse(
            str(output_path),
            media_type="image/jpeg",
            headers={
                "X-Processing-Time": str(processing_time),
                "X-Model-Used": model_name,
                "X-Scale-Factor": str(MODELS[model_name]["scale"]),
                "X-Method": "realesrgan-executable"
            }
        )
        
    except Exception as e:
        print(f"Error processing image: {e}")
        # Limpiar archivos en caso de error
        for path in [input_path, output_path]:
            if path.exists():
                path.unlink()
        raise HTTPException(status_code=500, detail=str(e))
    
    finally:
        # Limpieza automática después de 60 segundos
        def cleanup():
            time.sleep(60)
            for path in [input_path, output_path]:
                if path.exists():
                    try:
                        path.unlink()
                    except:
                        pass
        
        cleanup_thread = threading.Thread(target=cleanup)
        cleanup_thread.daemon = True
        cleanup_thread.start()

@app.post('/enhance_combined')
async def enhance_combined(
    file: UploadFile = File(...),
    model_name: str = Form(default="realesrgan-x4plus"),
    enhance_low_light: bool = Form(default=False)
):
    """
    Mejora combinada: iluminación + resolución
    """
    timestamp = int(time.time() * 1000)
    input_path = TEMP_DIR / f"input_{timestamp}_{file.filename}"
    temp_path = TEMP_DIR / f"temp_{timestamp}_{file.filename}"
    output_path = TEMP_DIR / f"combined_{timestamp}_{file.filename}"
    
    try:
        # Guardar archivo
        with open(input_path, 'wb') as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        current_path = input_path
        
        # Mejora de iluminación si se solicita
        if enhance_low_light:
            print("Applying low-light enhancement first...")
            try:
                from app_hybrid import enhance_image_advanced
                enhance_image_advanced(str(current_path), str(temp_path))
                current_path = temp_path
            except ImportError:
                print("Low-light enhancement not available, skipping...")
        
        # Aplicar Real-ESRGAN
        print("Applying Real-ESRGAN...")
        run_realesrgan(str(current_path), str(output_path), model_name, MODELS[model_name]["scale"])
        
        return FileResponse(
            str(output_path),
            media_type="image/jpeg",
            headers={
                "X-Enhancements-Applied": "low-light,super-resolution" if enhance_low_light else "super-resolution",
                "X-Model-Used": model_name
            }
        )
        
    except Exception as e:
        print(f"Error in combined enhancement: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    
    finally:
        # Limpiar archivos temporales
        for path in [input_path, temp_path, output_path]:
            if path.exists():
                try:
                    path.unlink()
                except:
                    pass

@app.get('/models')
async def get_available_models():
    """Lista de modelos disponibles"""
    return {
        "models": {
            "realesr-animevideov3-x2": {
                "scale": 2,
                "description": "Anime/Video 2x",
                "downloaded": True
            },
            "realesr-animevideov3-x3": {
                "scale": 3, 
                "description": "Anime/Video 3x",
                "downloaded": True
            },
            "realesr-animevideov3-x4": {
                "scale": 4,
                "description": "Anime/Video 4x", 
                "downloaded": True
            },
            "realesrgan-x4plus-anime": {
                "scale": 4,
                "description": "Anime/Illustration 4x",
                "downloaded": True
            },
            "realesrgan-x4plus": {
                "scale": 4,
                "description": "General Photography 4x",
                "downloaded": True
            }
        },
        "default": "realesrgan-x4plus",
        "device": "vulkan",
        "executable": str(REALESRGAN_EXE),
        "available": REALESRGAN_EXE.exists()
    }

@app.get('/health')
async def health():
    """Estado del servicio"""
    return {
        "status": "ok" if REALESRGAN_EXE.exists() else "error",
        "service": "Real-ESRGAN Executable Service",
        "version": "1.0.0",
        "executable_found": REALESRGAN_EXE.exists(),
        "executable_path": str(REALESRGAN_EXE)
    }

@app.get('/')
async def root():
    """Información del servicio"""
    return {
        "service": "Real-ESRGAN Executable Service",
        "description": "Super-resolution using Real-ESRGAN ncnn executable",
        "endpoints": {
            "/enhance": "Enhance image resolution",
            "/enhance_combined": "Combined enhancement",
            "/models": "Get available models",
            "/health": "Service health check"
        },
        "models": MODELS,
        "executable_status": "found" if REALESRGAN_EXE.exists() else "not_found"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002) 