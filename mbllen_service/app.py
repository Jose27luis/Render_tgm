from fastapi import FastAPI, File, UploadFile
from fastapi.responses import FileResponse
import shutil
import os
from mbllen import enhance_image

app = FastAPI()

@app.post('/mejorar')
async def mejorar(file: UploadFile = File(...)):
    input_path = f'./temp/{file.filename}'
    output_path = f'./temp/mejorada_{file.filename}'
    
    # Crear directorio temp si no existe
    os.makedirs('./temp', exist_ok=True)
    
    with open(input_path, 'wb') as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    enhance_image(input_path, output_path)
    return FileResponse(output_path, media_type="image/jpeg")

@app.get('/health')
async def health():
    return {"status": "ok", "message": "MBLLEN service is running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 