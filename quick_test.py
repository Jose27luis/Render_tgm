import requests
import sys

def enhance_image(image_path):
    """Mejora rápida de una imagen"""
    print(f"Mejorando: {image_path}")
    
    try:
        with open(image_path, 'rb') as f:
            files = {'file': f}
            data = {'scale': 4, 'tile_size': 512, 'enhance_details': True}
            
            response = requests.post('http://localhost:8002/enhance', files=files, data=data)
            
            if response.status_code == 200:
                output_path = f"enhanced_{image_path}"
                with open(output_path, 'wb') as out:
                    out.write(response.content)
                print(f"✅ Imagen guardada como: {output_path}")
            else:
                print(f"❌ Error: {response.status_code}")
    except Exception as e:
        print(f"❌ Error: {e}")
        print("Asegúrate de que el servicio esté corriendo en el puerto 8002")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        enhance_image(sys.argv[1])
    else:
        print("Uso: python quick_test.py <ruta_imagen>")
        print("Ejemplo: python quick_test.py test_image.jpg") 