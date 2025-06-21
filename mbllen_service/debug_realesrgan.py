import subprocess
import os
from pathlib import Path
import time

# Rutas
REALESRGAN_EXE = Path("../realesrgan_oficial/realesrgan-ncnn-vulkan.exe")
TEMP_DIR = Path("./temp")
input_test = Path("./temp/cecia.jpg")  # Archivo que existe
output_test = Path("./temp/debug_output.png")

def debug_realesrgan():
    print(f"🔍 DEBUG Real-ESRGAN - WITH ABSOLUTE PATHS")
    print(f"Current working directory: {os.getcwd()}")
    print(f"Executable path: {REALESRGAN_EXE}")
    print(f"Executable exists: {REALESRGAN_EXE.exists()}")
    print(f"Executable absolute path: {REALESRGAN_EXE.resolve()}")
    print(f"Input file: {input_test}")
    print(f"Input file exists: {input_test.exists()}")
    print(f"Input absolute path: {input_test.resolve()}")
    print(f"Output file: {output_test}")
    print(f"Output absolute path: {output_test.resolve()}")
    print()

    if not input_test.exists():
        print("❌ Input file does not exist")
        return

    if not REALESRGAN_EXE.exists():
        print("❌ Executable does not exist")
        return

    try:
        # Using absolute paths like the fixed service
        input_abs = input_test.resolve()
        output_abs = output_test.resolve()
        
        cmd = [
            str(REALESRGAN_EXE.resolve()),
            "-i", str(input_abs),
            "-o", str(output_abs),
            "-n", "realesrgan-x4plus",
            "-s", "4"
        ]

        print(f"🚀 Command: {' '.join(cmd)}")
        print(f"Working directory for subprocess: {REALESRGAN_EXE.parent}")
        
        result = subprocess.run(
            cmd,
            cwd=REALESRGAN_EXE.parent,
            capture_output=True,
            text=True,
            timeout=300
        )

        print(f"Return code: {result.returncode}")
        print("=== STDOUT ===")
        print(result.stdout)
        print("=== STDERR ===")
        print(result.stderr)
        print("==============")

        # Verificar si el archivo se creó
        print(f"Output file exists after subprocess: {output_test.exists()}")
        if output_test.exists():
            print(f"Output file size: {output_test.stat().st_size} bytes")
        
        # Verificar contenido del directorio temp
        print(f"Files in temp directory:")
        for file in TEMP_DIR.iterdir():
            if file.is_file():
                print(f"  - {file.name} ({file.stat().st_size} bytes)")

        return result.returncode == 0 and output_test.exists()

    except subprocess.TimeoutExpired:
        print("⏳ Timeout expired")
        return False
    except Exception as e:
        print(f"❌ Exception: {e}")
        return False

if __name__ == "__main__":
    success = debug_realesrgan()
    print(f"\n✅ Success: {success}")