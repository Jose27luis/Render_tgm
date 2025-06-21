import requests
import os

# CONFIGURA AQUÍ TU IMAGEN
IMAGEN_ENTRADA = "Captura2.PNG"  # <- Cambia esto por el nombre de tu imagen
ESCALA = 4  # Opciones: 2, 3, o 4
MEJORAR_DETALLES = True
TAMAÑO_TILE = 512  # Para imágenes grandes, usa 256 o 512

def procesar_imagen():
    """Procesa tu imagen con configuración personalizada"""
    
    if not os.path.exists(IMAGEN_ENTRADA):
        print(f"❌ No se encuentra la imagen: {IMAGEN_ENTRADA}")
        print("   Asegúrate de:")
        print("   1. Poner tu imagen en esta carpeta")
        print("   2. O cambiar IMAGEN_ENTRADA con la ruta completa")
        return
    
    print(f"📸 Procesando: {IMAGEN_ENTRADA}")
    print(f"   Escala: {ESCALA}x")
    print(f"   Mejorar detalles: {'Sí' if MEJORAR_DETALLES else 'No'}")
    
    try:
        with open(IMAGEN_ENTRADA, 'rb') as f:
            files = {'file': f}
            data = {
                'scale': ESCALA,
                'tile_size': TAMAÑO_TILE,
                'enhance_details': MEJORAR_DETALLES
            }
            
            print("⏳ Procesando... (esto puede tomar unos segundos)")
            response = requests.post('http://localhost:8002/enhance', files=files, data=data)
            
            if response.status_code == 200:
                # Crear nombre de salida
                nombre_base = os.path.splitext(IMAGEN_ENTRADA)[0]
                extension = os.path.splitext(IMAGEN_ENTRADA)[1]
                salida = f"{nombre_base}_mejorada_{ESCALA}x{extension}"
                
                # Guardar imagen mejorada
                with open(salida, 'wb') as out:
                    out.write(response.content)
                
                print(f"✅ ¡Listo! Imagen guardada como: {salida}")
                
                # Mostrar información
                tamaño_original = os.path.getsize(IMAGEN_ENTRADA) / 1024
                tamaño_mejorado = os.path.getsize(salida) / 1024
                print(f"\n📊 Información:")
                print(f"   Tamaño original: {tamaño_original:.1f} KB")
                print(f"   Tamaño mejorado: {tamaño_mejorado:.1f} KB")
                print(f"   Dimensiones: {response.headers.get('X-Enhanced-Size', 'N/A')}")
                
            else:
                print(f"❌ Error: {response.status_code}")
                
    except requests.exceptions.ConnectionError:
        print("❌ No se puede conectar al servicio")
        print("   Asegúrate de que el servicio esté corriendo:")
        print("   1. Abre otra terminal")
        print("   2. Ejecuta: start_service.bat")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    procesar_imagen()
    print("\n💡 Consejo: Puedes editar este archivo para cambiar:")
    print("   - IMAGEN_ENTRADA: el nombre de tu imagen")
    print("   - ESCALA: 2, 3 o 4")
    print("   - MEJORAR_DETALLES: True o False") 