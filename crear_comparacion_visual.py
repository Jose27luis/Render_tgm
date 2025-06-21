import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont
import os

def crear_comparacion_lado_a_lado():
    """Crea una imagen de comparación lado a lado para mostrar claramente las diferencias"""
    
    # Archivos a comparar
    original = "Captura2.PNG"
    realesrgan = "Captura2_realesrgan_4x.png"
    
    print("🔍 Creando comparación visual extrema...")
    
    if not os.path.exists(original):
        print(f"❌ No se encontró {original}")
        return
    
    if not os.path.exists(realesrgan):
        print(f"❌ No se encontró {realesrgan}")
        return
    
    # Cargar imágenes
    img_original = cv2.imread(original)
    img_realesrgan = cv2.imread(realesrgan)
    
    print(f"📏 Original: {img_original.shape}")
    print(f"📏 Real-ESRGAN: {img_realesrgan.shape}")
    
    # Redimensionar original para que coincida con Real-ESRGAN
    height_target = img_realesrgan.shape[0]
    width_target = img_realesrgan.shape[1]
    
    # Escalar original usando interpolación básica (para comparar)
    img_original_scaled = cv2.resize(img_original, (width_target, height_target), interpolation=cv2.INTER_LANCZOS4)
    
    # Crear imagen de comparación lado a lado
    comparison_width = width_target * 2 + 20  # Espacio entre imágenes
    comparison_height = height_target + 100   # Espacio para texto
    
    comparison = np.ones((comparison_height, comparison_width, 3), dtype=np.uint8) * 255
    
    # Colocar imágenes
    comparison[50:50+height_target, 10:10+width_target] = img_original_scaled
    comparison[50:50+height_target, 20+width_target:20+width_target*2] = img_realesrgan
    
    # Convertir a PIL para agregar texto
    comparison_pil = Image.fromarray(cv2.cvtColor(comparison, cv2.COLOR_BGR2RGB))
    draw = ImageDraw.Draw(comparison_pil)
    
    # Intentar cargar fuente
    try:
        font = ImageFont.truetype("arial.ttf", 24)
        font_small = ImageFont.truetype("arial.ttf", 16)
    except:
        font = ImageFont.load_default()
        font_small = ImageFont.load_default()
    
    # Agregar títulos
    draw.text((10, 10), "ORIGINAL (escalado con Lanczos)", fill=(255, 0, 0), font=font)
    draw.text((20+width_target, 10), "REAL-ESRGAN (Redes Neuronales)", fill=(0, 128, 0), font=font)
    
    # Agregar información técnica
    draw.text((10, height_target + 60), f"Tamaño: {img_original.shape[1]}x{img_original.shape[0]} → {width_target}x{height_target}", fill=(0, 0, 0), font=font_small)
    draw.text((20+width_target, height_target + 60), f"Archivo: {os.path.getsize(realesrgan)//1024}KB vs {os.path.getsize(original)//1024}KB", fill=(0, 0, 0), font=font_small)
    
    # Guardar comparación
    comparison_final = cv2.cvtColor(np.array(comparison_pil), cv2.COLOR_RGB2BGR)
    cv2.imwrite("Comparacion_Lado_a_Lado.png", comparison_final)
    
    print("✅ Comparación guardada: Comparacion_Lado_a_Lado.png")
    
    # Crear recortes de áreas específicas para mostrar diferencias
    crear_recortes_detalle(img_original_scaled, img_realesrgan)

def crear_recortes_detalle(img_original, img_realesrgan):
    """Crea recortes de áreas específicas para mostrar diferencias en detalle"""
    
    height, width = img_original.shape[:2]
    
    # Definir áreas de interés (recortes)
    areas = [
        {"name": "Centro", "x": width//4, "y": height//4, "w": width//2, "h": height//2},
        {"name": "Esquina_Superior", "x": 0, "y": 0, "w": width//3, "h": height//3},
        {"name": "Esquina_Inferior", "x": 2*width//3, "y": 2*height//3, "w": width//3, "h": height//3}
    ]
    
    for area in areas:
        x, y, w, h = area["x"], area["y"], area["w"], area["h"]
        
        # Recortar áreas
        crop_original = img_original[y:y+h, x:x+w]
        crop_realesrgan = img_realesrgan[y:y+h, x:x+w]
        
        # Escalar para ver mejor (zoom 2x)
        zoom_factor = 2
        crop_original_zoom = cv2.resize(crop_original, None, fx=zoom_factor, fy=zoom_factor, interpolation=cv2.INTER_NEAREST)
        crop_realesrgan_zoom = cv2.resize(crop_realesrgan, None, fx=zoom_factor, fy=zoom_factor, interpolation=cv2.INTER_NEAREST)
        
        # Crear comparación lado a lado del recorte
        h_zoom, w_zoom = crop_original_zoom.shape[:2]
        comparison_crop = np.ones((h_zoom + 60, w_zoom * 2 + 20, 3), dtype=np.uint8) * 255
        
        comparison_crop[30:30+h_zoom, 10:10+w_zoom] = crop_original_zoom
        comparison_crop[30:30+h_zoom, 20+w_zoom:20+w_zoom*2] = crop_realesrgan_zoom
        
        # Agregar títulos con PIL
        comparison_crop_pil = Image.fromarray(cv2.cvtColor(comparison_crop, cv2.COLOR_BGR2RGB))
        draw = ImageDraw.Draw(comparison_crop_pil)
        
        try:
            font = ImageFont.truetype("arial.ttf", 16)
        except:
            font = ImageFont.load_default()
        
        draw.text((10, 5), "ORIGINAL", fill=(255, 0, 0), font=font)
        draw.text((20+w_zoom, 5), "REAL-ESRGAN", fill=(0, 128, 0), font=font)
        
        # Guardar recorte
        comparison_crop_final = cv2.cvtColor(np.array(comparison_crop_pil), cv2.COLOR_RGB2BGR)
        filename = f"Detalle_{area['name']}_Zoom2x.png"
        cv2.imwrite(filename, comparison_crop_final)
        
        print(f"✅ Detalle guardado: {filename}")

def analizar_diferencias():
    """Analiza las diferencias numéricas entre las imágenes"""
    
    original = "Captura2.PNG"
    realesrgan = "Captura2_realesrgan_4x.png"
    
    if not (os.path.exists(original) and os.path.exists(realesrgan)):
        print("❌ No se encontraron los archivos para analizar")
        return
    
    # Cargar y redimensionar
    img1 = cv2.imread(original)
    img2 = cv2.imread(realesrgan)
    
    # Redimensionar original para comparar
    img1_resized = cv2.resize(img1, (img2.shape[1], img2.shape[0]), interpolation=cv2.INTER_LANCZOS4)
    
    # Calcular diferencias
    diff = cv2.absdiff(img1_resized, img2)
    diff_gray = cv2.cvtColor(diff, cv2.COLOR_BGR2GRAY)
    
    # Estadísticas
    mean_diff = np.mean(diff_gray)
    max_diff = np.max(diff_gray)
    pixels_changed = np.count_nonzero(diff_gray > 10)  # Píxeles con diferencia significativa
    total_pixels = diff_gray.shape[0] * diff_gray.shape[1]
    percentage_changed = (pixels_changed / total_pixels) * 100
    
    print(f"\n📊 ANÁLISIS DE DIFERENCIAS:")
    print(f"   Diferencia promedio: {mean_diff:.2f} (0-255)")
    print(f"   Diferencia máxima: {max_diff}")
    print(f"   Píxeles modificados: {pixels_changed:,} de {total_pixels:,}")
    print(f"   Porcentaje modificado: {percentage_changed:.1f}%")
    
    # Guardar imagen de diferencias
    diff_colored = cv2.applyColorMap(diff_gray, cv2.COLORMAP_JET)
    cv2.imwrite("Mapa_Diferencias.png", diff_colored)
    print(f"✅ Mapa de diferencias guardado: Mapa_Diferencias.png")

if __name__ == "__main__":
    print("🎨 CREADOR DE COMPARACIONES VISUALES EXTREMAS")
    print("=" * 50)
    
    crear_comparacion_lado_a_lado()
    analizar_diferencias()
    
    print("\n🎉 ¡Comparaciones creadas!")
    print("\nArchivos generados:")
    print("   📁 Comparacion_Lado_a_Lado.png - Comparación completa")
    print("   📁 Detalle_*_Zoom2x.png - Recortes con zoom")
    print("   📁 Mapa_Diferencias.png - Mapa de diferencias")
    print("\n💡 Abre estos archivos para ver claramente las diferencias!") 