@echo off
echo Procesando imagen con Real-ESRGAN Oficial...
echo.

REM Verificar si existe el ejecutable
if not exist "realesrgan_oficial\realesrgan-ncnn-vulkan.exe" (
    echo ERROR: Real-ESRGAN oficial no encontrado!
    echo Por favor ejecuta primero: download_realesrgan.bat
    pause
    exit /b 1
)

REM Copiar imagen a la carpeta de Real-ESRGAN
if exist "Captura2.PNG" (
    copy "Captura2.PNG" "realesrgan_oficial\"
    echo Imagen copiada a carpeta de Real-ESRGAN
) else (
    echo ERROR: No se encontro Captura2.PNG
    pause
    exit /b 1
)

REM Cambiar a directorio de Real-ESRGAN
cd realesrgan_oficial

echo.
echo Procesando con Real-ESRGAN (modelo x4plus - general)...
realesrgan-ncnn-vulkan.exe -i Captura2.PNG -o Captura2_realesrgan_4x.png -s 4

echo.
echo Procesando con Real-ESRGAN (modelo anime - mejor para ilustraciones)...
realesrgan-ncnn-vulkan.exe -i Captura2.PNG -o Captura2_realesrgan_anime_4x.png -n realesrgan-x4plus-anime -s 4

echo.
echo Procesando con RealESRNet (menos artefactos)...
realesrgan-ncnn-vulkan.exe -i Captura2.PNG -o Captura2_realesrnet_4x.png -n realesrnet-x4plus -s 4

cd ..

REM Copiar resultados de vuelta
if exist "realesrgan_oficial\Captura2_realesrgan_4x.png" (
    copy "realesrgan_oficial\Captura2_realesrgan_4x.png" .
    echo Resultado copiado: Captura2_realesrgan_4x.png
)

if exist "realesrgan_oficial\Captura2_realesrgan_anime_4x.png" (
    copy "realesrgan_oficial\Captura2_realesrgan_anime_4x.png" .
    echo Resultado copiado: Captura2_realesrgan_anime_4x.png
)

if exist "realesrgan_oficial\Captura2_realesrnet_4x.png" (
    copy "realesrgan_oficial\Captura2_realesrnet_4x.png" .
    echo Resultado copiado: Captura2_realesrnet_4x.png
)

echo.
echo ¡Procesamiento completado!
echo.
echo Resultados generados:
echo - Captura2_realesrgan_4x.png (modelo general)
echo - Captura2_realesrgan_anime_4x.png (modelo anime)
echo - Captura2_realesrnet_4x.png (modelo conservativo)
echo.
echo Compara los resultados para ver la diferencia real!
pause 