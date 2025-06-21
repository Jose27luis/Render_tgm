import requests
import time

def procesar_captura():
    imagen = "Captura2.PNG"
    print(f"🖼️  Procesando: {imagen}")
    print("   Tamaño: 293 KB")
    print("   Formato: PNG")
    
    # Verificar servicio primero
    try:
        health = requests.get('http://localhost:8002/health', timeout=2)
        if health.status_code != 200:
            raise Exception("Servicio no disponible")
        print("✅ Servicio Real-ESRGAN activo")
    except:
        print("❌ El servicio no está corriendo")
        print("\n📋 Para iniciar el servicio:")
        print("   1. Abre OTRA terminal (Command Prompt)")
        print("   2. Ejecuta: start_service.bat")
        print("   3. Espera a que aparezca 'Uvicorn running on http://0.0.0.0:8002'")
        print("   4. Vuelve aquí y ejecuta este script de nuevo")
        return
    
    # Procesar imagen
    try:
        with open(imagen, 'rb') as f:
            files = {'file': (imagen, f, 'image/png')}
            data = {
                'scale': '4',  # Escala 4x
                'tile_size': '512',
                'enhance_details': 'true'
            }
            
            print("\n⏳ Procesando imagen (esto puede tomar 10-30 segundos)...")
            start = time.time()
            
            response = requests.post(
                'http://localhost:8002/enhance', 
                files=files, 
                data=data,
                timeout=120  # 2 minutos timeout para imágenes grandes
            )
            
            if response.status_code == 200:
                output = "Captura2_mejorada_4x.PNG"
                with open(output, 'wb') as out:
                    out.write(response.content)
                
                elapsed = time.time() - start
                print(f"\n✅ ¡Éxito! Imagen procesada en {elapsed:.1f} segundos")
                print(f"📁 Guardada como: {output}")
                
                # Información adicional
                if 'X-Enhanced-Size' in response.headers:
                    print(f"📐 Nuevas dimensiones: {response.headers['X-Enhanced-Size']}")
                
                import os
                size_mb = os.path.getsize(output) / (1024 * 1024)
                print(f"💾 Tamaño del archivo: {size_mb:.1f} MB")
                
            else:
                print(f"\n❌ Error del servidor: {response.status_code}")
                try:
                    error = response.json()
                    print(f"   Detalles: {error.get('detail', 'Sin detalles')}")
                except:
                    print(f"   Respuesta: {response.text[:200]}")
                    
    except requests.exceptions.Timeout:
        print("❌ Timeout - la imagen es muy grande o el servidor está sobrecargado")
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    procesar_captura()
    print("\n💡 Consejos:")
    print("   - Si falla, asegúrate de que el servicio esté corriendo")
    print("   - Para imágenes muy grandes, el proceso puede tardar más")
    print("   - La imagen mejorada será 4x más grande en dimensiones") 