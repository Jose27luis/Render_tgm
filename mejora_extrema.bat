@echo off
echo Aplicando mejora EXTREMA con Real-ESRGAN...
echo.

cd realesrgan_oficial

echo ===========================================
echo 1. PROCESANDO CON ESCALA 2X (más conservativo)
echo ===========================================
realesrgan-ncnn-vulkan.exe -i Captura2.PNG -o Captura2_2x_general.png -s 2
realesrgan-ncnn-vulkan.exe -i Captura2.PNG -o Captura2_2x_anime.png -n realesrgan-x4plus-anime -s 2

echo.
echo ===========================================
echo 2. PROCESANDO CON ESCALA 4X (máxima calidad)
echo ===========================================
realesrgan-ncnn-vulkan.exe -i Captura2.PNG -o Captura2_4x_general_hq.png -s 4 -f png -x
realesrgan-ncnn-vulkan.exe -i Captura2.PNG -o Captura2_4x_anime_hq.png -n realesrgan-x4plus-anime -s 4 -f png -x

echo.
echo ===========================================
echo 3. PROCESANDO CON TILES PEQUEÑOS (máximo detalle)
echo ===========================================
realesrgan-ncnn-vulkan.exe -i Captura2.PNG -o Captura2_4x_tiles.png -s 4 -t 128 -f png
realesrgan-ncnn-vulkan.exe -i Captura2.PNG -o Captura2_4x_anime_tiles.png -n realesrgan-x4plus-anime -s 4 -t 128 -f png

echo.
echo ===========================================
echo 4. PROCESANDO CON DIFFERENT GPU SETTINGS
echo ===========================================
realesrgan-ncnn-vulkan.exe -i Captura2.PNG -o Captura2_4x_gpu0.png -s 4 -g 0 -j 1:4:1 -f png
realesrgan-ncnn-vulkan.exe -i Captura2.PNG -o Captura2_4x_anime_gpu0.png -n realesrgan-x4plus-anime -s 4 -g 0 -j 1:4:1 -f png

cd ..

echo.
echo ===========================================
echo COPIANDO RESULTADOS...
echo ===========================================

REM Copiar todos los resultados
for %%f in (realesrgan_oficial\Captura2_*x*.png) do (
    copy "%%f" . >nul
    echo Copiado: %%~nxf
)

echo.
echo ===========================================
echo RESULTADOS GENERADOS:
echo ===========================================
dir Captura2_*x*.png

echo.
echo ¡MEJORA EXTREMA COMPLETADA!
echo.
echo Archivos generados con diferentes configuraciones:
echo - Captura2_2x_*.png (escala conservativa 2x)
echo - Captura2_4x_*.png (escala agresiva 4x con diferentes métodos)
echo.
echo Abre estos archivos al 100%% de zoom para ver las diferencias!
pause 