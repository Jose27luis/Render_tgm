@echo off
echo Descargando Real-ESRGAN Ejecutable Oficial...
echo.

REM Crear carpeta para Real-ESRGAN
if not exist "realesrgan_oficial" mkdir realesrgan_oficial
cd realesrgan_oficial

echo Descargando Real-ESRGAN-ncnn-vulkan para Windows...
curl -L -o "RealESRGAN-ncnn-vulkan-windows.zip" "https://github.com/xinntao/Real-ESRGAN/releases/download/v0.2.5.0/realesrgan-ncnn-vulkan-20220424-windows.zip"

echo.
echo Extrayendo archivos...
tar -xf "RealESRGAN-ncnn-vulkan-windows.zip"

echo.
echo Real-ESRGAN oficial descargado!
echo Ubicacion: %cd%
echo.
echo INSTRUCCIONES DE USO:
echo 1. Coloca tu imagen en esta carpeta
echo 2. Abre cmd aqui y ejecuta:
echo    realesrgan-ncnn-vulkan.exe -i tu_imagen.jpg -o imagen_mejorada.png
echo.
echo MODELOS DISPONIBLES:
echo - realesrgan-x4plus (por defecto)
echo - realesrgan-x4plus-anime (para anime)
echo - realesrnet-x4plus
echo - realesr-animevideov3
echo.
echo Para usar un modelo especifico:
echo realesrgan-ncnn-vulkan.exe -i input.jpg -o output.png -n realesrgan-x4plus-anime
echo.
pause 