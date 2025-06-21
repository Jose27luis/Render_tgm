import requests
import time
import os
from datetime import datetime

def test_health():
    """Verificar que el servicio esté activo"""
    print("\n1️⃣ Verificando estado del servicio...")
    try:
        response = requests.get('http://localhost:8002/health')
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Servicio activo: {data['service']}")
            print(f"   Versión: {data['version']}")
            print(f"   Método: {data['method']}")
            return True
        else:
            print("❌ El servicio no está respondiendo correctamente")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ No se puede conectar al servicio. Asegúrate de que esté corriendo en el puerto 8002")
        return False

def test_models():
    """Obtener información de los modelos disponibles"""
    print("\n2️⃣ Obteniendo información de modelos...")
    try:
        response = requests.get('http://localhost:8002/models')
        if response.status_code == 200:
            data = response.json()
            print("✅ Métodos disponibles:")
            for method, info in data['methods'].items():
                print(f"\n   📌 {method}: {info['description']}")
                print(f"      Escalas soportadas: {info['scales']}")
                print("      Características:")
                for feature in info['features']:
                    print(f"        • {feature}")
    except Exception as e:
        print(f"❌ Error: {e}")

def test_enhance(image_path, scale=4):
    """Probar la mejora de imagen"""
    print(f"\n3️⃣ Mejorando imagen: {image_path}")
    print(f"   Escala seleccionada: {scale}x")
    
    if not os.path.exists(image_path):
        print(f"❌ No se encuentra la imagen: {image_path}")
        return
    
    try:
        # Preparar la solicitud
        with open(image_path, 'rb') as f:
            files = {'file': (os.path.basename(image_path), f, 'image/jpeg')}
            data = {
                'scale': scale,
                'tile_size': 512,
                'enhance_details': True
            }
            
            print("   Enviando imagen al servicio...")
            start_time = time.time()
            
            # Hacer la solicitud
            response = requests.post('http://localhost:8002/enhance', files=files, data=data)
            
            if response.status_code == 200:
                processing_time = time.time() - start_time
                
                # Guardar imagen mejorada
                output_path = f"enhanced_{scale}x_{os.path.basename(image_path)}"
                with open(output_path, 'wb') as out_file:
                    out_file.write(response.content)
                
                print(f"✅ Imagen mejorada guardada como: {output_path}")
                print(f"   Tiempo de procesamiento: {processing_time:.2f} segundos")
                
                # Mostrar información de headers
                headers = response.headers
                print("\n   📊 Información del procesamiento:")
                print(f"      Tamaño original: {headers.get('X-Original-Size', 'N/A')}")
                print(f"      Tamaño mejorado: {headers.get('X-Enhanced-Size', 'N/A')}")
                print(f"      Factor de escala: {headers.get('X-Scale-Factor', 'N/A')}")
                print(f"      Método usado: {headers.get('X-Method', 'N/A')}")
                
                # Mostrar tamaños de archivo
                original_size = os.path.getsize(image_path) / 1024
                enhanced_size = os.path.getsize(output_path) / 1024
                print(f"\n   💾 Tamaños de archivo:")
                print(f"      Original: {original_size:.2f} KB")
                print(f"      Mejorado: {enhanced_size:.2f} KB")
                
            else:
                print(f"❌ Error del servidor: {response.status_code}")
                error_detail = response.json().get('detail', 'Error desconocido')
                print(f"   Detalle: {error_detail}")
                
    except Exception as e:
        print(f"❌ Error durante el procesamiento: {e}")

def test_combined_enhancement(image_path):
    """Probar la mejora combinada (iluminación + resolución)"""
    print(f"\n4️⃣ Probando mejora combinada en: {image_path}")
    
    if not os.path.exists(image_path):
        print(f"❌ No se encuentra la imagen: {image_path}")
        return
    
    try:
        with open(image_path, 'rb') as f:
            files = {'file': (os.path.basename(image_path), f, 'image/jpeg')}
            data = {
                'scale': 4,
                'enhance_low_light': True
            }
            
            print("   Aplicando mejora de iluminación + resolución...")
            start_time = time.time()
            
            response = requests.post('http://localhost:8002/enhance_combined', files=files, data=data)
            
            if response.status_code == 200:
                processing_time = time.time() - start_time
                
                output_path = f"combined_{os.path.basename(image_path)}"
                with open(output_path, 'wb') as out_file:
                    out_file.write(response.content)
                
                print(f"✅ Imagen con mejora combinada guardada como: {output_path}")
                print(f"   Tiempo de procesamiento: {processing_time:.2f} segundos")
                print(f"   Mejoras aplicadas: {response.headers.get('X-Enhancements', 'N/A')}")
            else:
                print(f"❌ Error: {response.status_code}")
                
    except Exception as e:
        print(f"❌ Error: {e}")

def main():
    print("="*60)
    print("🚀 PRUEBA DEL SERVICIO REAL-ESRGAN")
    print("="*60)
    print(f"Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Verificar servicio
    if not test_health():
        print("\n⚠️  El servicio no está disponible. Por favor:")
        print("1. Abre otra terminal")
        print("2. Ve a la carpeta mbllen_service")
        print("3. Activa el entorno virtual: venv_realesrgan\\Scripts\\activate")
        print("4. Ejecuta: python app_realesrgan_simple.py")
        return
    
    # Obtener información de modelos
    test_models()
    
    # Probar con diferentes escalas
    if os.path.exists('test_image_small.jpg'):
        print("\n📸 Probando mejora de resolución con diferentes escalas:")
        for scale in [2, 3, 4]:
            test_enhance('test_image_small.jpg', scale)
    
    # Probar mejora combinada
    if os.path.exists('test_image.jpg'):
        test_combined_enhancement('test_image.jpg')
    
    print("\n✅ Pruebas completadas!")
    print("\n💡 Consejo: Abre las imágenes generadas para ver los resultados:")
    print("   - enhanced_2x_test_image_small.jpg")
    print("   - enhanced_3x_test_image_small.jpg")
    print("   - enhanced_4x_test_image_small.jpg")
    print("   - combined_test_image.jpg")

if __name__ == "__main__":
    main() 