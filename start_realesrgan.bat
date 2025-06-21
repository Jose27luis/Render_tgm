@echo off
echo ================================
echo   INICIANDO SERVICIO REAL-ESRGAN
echo ================================
echo.

echo Navegando al directorio...
cd /d "%~dp0mbllen_service"

echo Verificando dependencias...
python -c "import fastapi, uvicorn; print('✓ Dependencias OK')" 2>nul
if errorlevel 1 (
    echo ⚠ Instalando dependencias...
    pip install -r requirements_exe.txt
)

echo.
echo Iniciando servicio Real-ESRGAN en puerto 8002...
echo ✓ Ejecutable encontrado en: ..\realesrgan_oficial\realesrgan-ncnn-vulkan.exe
echo ✓ Modelos disponibles: 5 modelos
echo.
echo Presiona Ctrl+C para detener el servicio
echo ========================================
echo.

python app_realesrgan_service.py 