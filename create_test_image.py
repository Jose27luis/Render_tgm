from PIL import Image, ImageDraw, ImageFont
import numpy as np

def create_test_image():
    # Crear una imagen de 256x256 con degradado y texto
    width, height = 256, 256
    
    # Crear degradado de colores
    img = Image.new('RGB', (width, height))
    pixels = img.load()
    
    for y in range(height):
        for x in range(width):
            # Crear un patrón de colores
            r = int((x / width) * 255)
            g = int((y / height) * 255)
            b = int(((x + y) / (width + height)) * 255)
            pixels[x, y] = (r, g, b)
    
    # Añadir formas geométricas
    draw = ImageDraw.Draw(img)
    
    # Círculos
    draw.ellipse([20, 20, 80, 80], fill=(255, 255, 0), outline=(0, 0, 0))
    draw.ellipse([176, 20, 236, 80], fill=(0, 255, 255), outline=(0, 0, 0))
    
    # Rectángulos
    draw.rectangle([20, 176, 80, 236], fill=(255, 0, 255), outline=(0, 0, 0))
    draw.rectangle([176, 176, 236, 236], fill=(128, 255, 128), outline=(0, 0, 0))
    
    # Líneas
    draw.line([0, 128, 256, 128], fill=(255, 255, 255), width=2)
    draw.line([128, 0, 128, 256], fill=(255, 255, 255), width=2)
    
    # Texto
    draw.text((128, 128), "TEST", fill=(255, 255, 255), anchor="mm")
    
    # Añadir algo de ruido para hacer la imagen más realista
    img_array = np.array(img)
    noise = np.random.randint(-10, 10, img_array.shape)
    img_array = np.clip(img_array + noise, 0, 255).astype(np.uint8)
    img = Image.fromarray(img_array)
    
    # Guardar imagen
    img.save('test_image.jpg', quality=85)
    print("✅ Imagen de prueba creada: test_image.jpg")
    print(f"   Tamaño: {width}x{height} píxeles")
    
    # Crear también una versión más pequeña
    small = img.resize((128, 128), Image.Resampling.LANCZOS)
    small.save('test_image_small.jpg', quality=85)
    print("✅ Imagen pequeña creada: test_image_small.jpg")
    print(f"   Tamaño: 128x128 píxeles")

if __name__ == "__main__":
    create_test_image() 