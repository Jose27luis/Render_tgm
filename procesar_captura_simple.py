import requests
from PIL import Image
import os

print("🖼️  Procesando Captura2.PNG con Real-ESRGAN")
print("   Imagen: 370x306 píxeles")

# Convertir PNG a JPG primero
try:
    img = Image.open("Captura2.PNG")
    if img.mode != 'RGB':
        img = img.convert('RGB')
    img.save("temp_captura.jpg", "JPEG", quality=95)
    print("✅ Imagen convertida a JPG")
except Exception as e:
    print(f"❌ Error al convertir: {e}")
    exit()

# Procesar con Real-ESRGAN
try:
    with open("temp_captura.jpg", 'rb') as f:
        response = requests.post(
            'http://localhost:8002/enhance',
            files={'file': f},
            data={'scale': 4, 'tile_size': 0}  # tile_size 0 = procesar completa
        )
    
    if response.status_code == 200:
        with open("Captura2_mejorada_4x.jpg", 'wb') as out:
            out.write(response.content)
        print("✅ ¡Éxito! Guardada como: Captura2_mejorada_4x.jpg")
        print(f"📐 Nuevas dimensiones: ~1480x1224 píxeles (4x)")
    else:
        print(f"❌ Error: {response.status_code}")
        
except requests.exceptions.ConnectionError:
    print("❌ El servicio no está corriendo")
    print("   Ejecuta 'start_service.bat' en otra terminal")
except Exception as e:
    print(f"❌ Error: {e}")
finally:
    # Limpiar temporal
    if os.path.exists("temp_captura.jpg"):
        os.remove("temp_captura.jpg") 