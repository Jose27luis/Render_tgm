from PIL import Image
import requests
import time
import os

def convertir_y_procesar():
    """Convierte PNG a JPG y luego procesa con Real-ESRGAN"""
    
    imagen_original = "Captura2.PNG"
    imagen_jpg = "Captura2_temp.jpg"
    
    print("🔄 Convirtiendo PNG a JPG para mejor compatibilidad...")
    
    try:
        # Abrir y convertir imagen
        img = Image.open(imagen_original)
        
        # Si tiene canal alpha (transparencia), convertir a RGB
        if img.mode in ('RGBA', 'LA', 'P'):
            # Crear fondo blanco
            background = Image.new('RGB', img.size, (255, 255, 255))
            if img.mode == 'P':
                img = img.convert('RGBA')
            background.paste(img, mask=img.split()[-1] if 'A' in img.mode else None)
            img = background
        elif img.mode != 'RGB':
            img = img.convert('RGB')
        
        # Guardar como JPG
        img.save(imagen_jpg, 'JPEG', quality=95)
        print(f"✅ Convertido a JPG: {imagen_jpg}")
        print(f"   Dimensiones: {img.size[0]}x{img.size[1]} píxeles")
        
    except Exception as e:
        print(f"❌ Error al convertir imagen: {e}")
        return
    
    # Verificar servicio
    try:
        health = requests.get('http://localhost:8002/health', timeout=2)
        if health.status_code != 200:
            raise Exception("Servicio no disponible")
        print("✅ Servicio Real-ESRGAN activo")
    except:
        print("❌ El servicio no está corriendo")
        print("\n📋 Para iniciar el servicio:")
        print("   1. Abre OTRA terminal")
        print("   2. Ejecuta: start_service.bat")
        return
    
    # Procesar imagen convertida
    print("\n⏳ Procesando imagen...")
    
    try:
        with open(imagen_jpg, 'rb') as f:
            files = {'file': (imagen_jpg, f, 'image/jpeg')}
            data = {
                'scale': '4',
                'tile_size': '256',  # Usar tiles más pequeños
                'enhance_details': 'false'  # Desactivar para evitar errores
            }
            
            start = time.time()
            response = requests.post(
                'http://localhost:8002/enhance',
                files=files,
                data=data,
                timeout=120
            )
            
            if response.status_code == 200:
                output = "Captura2_mejorada_4x.jpg"
                with open(output, 'wb') as out:
                    out.write(response.content)
                
                elapsed = time.time() - start
                print(f"\n✅ ¡Éxito! Procesado en {elapsed:.1f} segundos")
                print(f"📁 Imagen mejorada: {output}")
                
                # Tamaño del archivo
                size_mb = os.path.getsize(output) / (1024 * 1024)
                print(f"💾 Tamaño: {size_mb:.1f} MB")
                
                # Si quieres convertir de vuelta a PNG
                print("\n¿Convertir resultado a PNG? (más grande pero sin pérdida)")
                print("Si quieres PNG, ejecuta:")
                print(f"   python -c \"from PIL import Image; Image.open('{output}').save('Captura2_mejorada_4x.png')\"")
                
            else:
                print(f"❌ Error: {response.status_code}")
                if response.text:
                    print(f"Detalles: {response.text[:200]}")
                    
    except Exception as e:
        print(f"❌ Error: {e}")
    
    finally:
        # Limpiar archivo temporal
        if os.path.exists(imagen_jpg):
            os.remove(imagen_jpg)
            print(f"\n🗑️  Archivo temporal eliminado: {imagen_jpg}")

if __name__ == "__main__":
    convertir_y_procesar() 