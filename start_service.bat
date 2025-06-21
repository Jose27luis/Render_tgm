@echo off
echo ===================================
echo Iniciando Servicio Real-ESRGAN
echo ===================================

cd mbllen_service

if exist venv_realesrgan (
    echo Activando entorno virtual...
    call venv_realesrgan\Scripts\activate.bat
    echo.
    echo Iniciando servicio en puerto 8002...
    echo Presiona Ctrl+C para detener el servicio
    echo.
    python app_realesrgan_simple.py
) else (
    echo ERROR: No se encuentra el entorno virtual.
    echo Por favor ejecuta setup_realesrgan.bat primero
    pause
) 