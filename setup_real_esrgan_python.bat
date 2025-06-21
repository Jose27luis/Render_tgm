@echo off
echo Configurando Real-ESRGAN con Python (requiere Python 3.8-3.11)...
echo.
echo NOTA: Tu Python 3.13 no es compatible. Necesitas instalar Python 3.11
echo.

REM Verificar Python
python --version
echo.

echo Opcion 1: Instalar Python 3.11 desde https://www.python.org/downloads/release/python-3118/
echo Opcion 2: Usar Conda para crear entorno con Python 3.11
echo.
echo Si tienes Conda, continua presionando cualquier tecla...
pause

REM Crear entorno conda con Python 3.11
conda create -n realesrgan python=3.11 -y
call conda activate realesrgan

REM Instalar dependencias
echo Instalando PyTorch...
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118

echo Instalando Real-ESRGAN...
pip install realesrgan

echo Instalando BasicSR...
pip install basicsr

echo Instalando GFPGAN para faces...
pip install gfpgan

echo Instalando otras dependencias...
pip install opencv-python Pillow numpy

REM Descargar modelos
echo Descargando modelos pre-entrenados...
if not exist "models" mkdir models
cd models

echo Descargando RealESRGAN_x4plus.pth...
curl -L -o "RealESRGAN_x4plus.pth" "https://github.com/xinntao/Real-ESRGAN/releases/download/v0.1.0/RealESRGAN_x4plus.pth"

echo Descargando RealESRGAN_x4plus_anime_6B.pth...
curl -L -o "RealESRGAN_x4plus_anime_6B.pth" "https://github.com/xinntao/Real-ESRGAN/releases/download/v0.2.2.4/RealESRGAN_x4plus_anime_6B.pth"

cd ..

echo.
echo Real-ESRGAN Python configurado!
echo.
echo Para usar:
echo 1. Activa el entorno: conda activate realesrgan
echo 2. Ejecuta: realesrgan-ncnn -i input.jpg -o output.png
echo.
pause 