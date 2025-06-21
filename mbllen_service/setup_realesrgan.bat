@echo off
echo ===================================
echo Configurando Real-ESRGAN Service
echo ===================================

REM Verificar si Python está instalado
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Python no está instalado o no está en PATH
    echo Por favor instale Python 3.8 o superior
    pause
    exit /b 1
)

REM Crear entorno virtual si no existe
if not exist "venv_realesrgan" (
    echo Creando entorno virtual...
    python -m venv venv_realesrgan
)

REM Activar entorno virtual
echo Activando entorno virtual...
call venv_realesrgan\Scripts\activate.bat

REM Actualizar pip
echo Actualizando pip...
python -m pip install --upgrade pip

REM Instalar dependencias
echo Instalando dependencias...
pip install -r requirements_realesrgan.txt

REM Verificar instalación
echo.
echo Verificando instalación...
python -c "import realesrgan_ncnn_py; print('Real-ESRGAN instalado correctamente')"

if %errorlevel% eq 0 (
    echo.
    echo ===================================
    echo Instalación completada con éxito!
    echo ===================================
    echo.
    echo Para ejecutar el servicio:
    echo 1. Activa el entorno virtual: venv_realesrgan\Scripts\activate.bat
    echo 2. Ejecuta: python app_realesrgan.py
    echo.
    echo El servicio estará disponible en http://localhost:8002
) else (
    echo.
    echo ===================================
    echo ERROR en la instalación
    echo ===================================
    echo Por favor revise los mensajes de error anteriores
)

pause 