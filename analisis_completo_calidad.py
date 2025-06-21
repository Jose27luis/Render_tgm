import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont
import os
import glob

def analizar_calidad_todas_versiones():
    """Analiza la calidad de todas las versiones procesadas"""
    
    print("🔍 ANÁLISIS COMPLETO DE CALIDAD")
    print("=" * 50)
    
    # Encontrar todas las imágenes procesadas
    original = "Captura2.PNG"
    imagenes_procesadas = glob.glob("Captura2_*.png")
    imagenes_procesadas.sort()
    
    if not os.path.exists(original):
        print("❌ No se encontró imagen original")
        return
    
    print(f"📁 Imagen original: {original}")
    print(f"📁 Imágenes procesadas encontradas: {len(imagenes_procesadas)}")
    
    # Cargar imagen original
    img_original = cv2.imread(original)
    original_size = os.path.getsize(original)
    
    resultados = []
    
    print("\n🔬 Analizando cada versión...")
    print("-" * 80)
    
    for img_path in imagenes_procesadas:
        try:
            # Cargar imagen procesada
            img_procesada = cv2.imread(img_path)
            if img_procesada is None:
                continue
                
            # Información básica
            size_kb = os.path.getsize(img_path) / 1024
            height, width = img_procesada.shape[:2]
            
            # Redimensionar original para comparar
            img_original_resized = cv2.resize(img_original, (width, height), interpolation=cv2.INTER_LANCZOS4)
            
            # Calcular métricas de calidad
            metricas = calcular_metricas_calidad(img_original_resized, img_procesada)
            
            resultado = {
                'nombre': img_path,
                'tamano_kb': size_kb,
                'resolucion': f"{width}x{height}",
                'diferencia_promedio': metricas['diferencia_promedio'],
                'nitidez': metricas['nitidez'],
                'contraste': metricas['contraste'],
                'detalles_nuevos': metricas['detalles_nuevos'],
                'score_total': metricas['score_total']
            }
            
            resultados.append(resultado)
            
            print(f"✅ {img_path}")
            print(f"   📏 Resolución: {width}x{height}")
            print(f"   💾 Tamaño: {size_kb:.1f}KB")
            print(f"   🎯 Score total: {metricas['score_total']:.2f}")
            print(f"   🔍 Nitidez: {metricas['nitidez']:.2f}")
            print(f"   🌓 Contraste: {metricas['contraste']:.2f}")
            print()
            
        except Exception as e:
            print(f"❌ Error procesando {img_path}: {e}")
    
    # Ordenar por score total
    resultados.sort(key=lambda x: x['score_total'], reverse=True)
    
    print("🏆 RANKING DE CALIDAD (ordenado por score total)")
    print("=" * 80)
    
    for i, resultado in enumerate(resultados, 1):
        nombre_corto = resultado['nombre'].replace('Captura2_', '').replace('.png', '')
        print(f"{i:2d}. {nombre_corto:25s} | Score: {resultado['score_total']:6.2f} | "
              f"Nitidez: {resultado['nitidez']:5.2f} | Tamaño: {resultado['tamano_kb']:7.1f}KB")
    
    # Crear comparación visual de los mejores
    crear_comparacion_mejores(resultados[:5])
    
    # Guardar reporte
    guardar_reporte_calidad(resultados)
    
    return resultados

def calcular_metricas_calidad(img_original, img_procesada):
    """Calcula métricas de calidad para comparar imágenes"""
    
    # Convertir a escala de grises para análisis
    gray_original = cv2.cvtColor(img_original, cv2.COLOR_BGR2GRAY)
    gray_procesada = cv2.cvtColor(img_procesada, cv2.COLOR_BGR2GRAY)
    
    # 1. Diferencia promedio (menor es mejor, hasta cierto punto)
    diferencia = cv2.absdiff(gray_original, gray_procesada)
    diferencia_promedio = np.mean(diferencia)
    
    # 2. Nitidez (usando Laplaciano)
    laplacian_original = cv2.Laplacian(gray_original, cv2.CV_64F)
    laplacian_procesada = cv2.Laplacian(gray_procesada, cv2.CV_64F)
    
    nitidez_original = np.var(laplacian_original)
    nitidez_procesada = np.var(laplacian_procesada)
    mejora_nitidez = nitidez_procesada / nitidez_original if nitidez_original > 0 else 1
    
    # 3. Contraste
    contraste_original = np.std(gray_original)
    contraste_procesada = np.std(gray_procesada)
    mejora_contraste = contraste_procesada / contraste_original if contraste_original > 0 else 1
    
    # 4. Detalles nuevos (píxeles que cambiaron significativamente)
    cambios_significativos = np.count_nonzero(diferencia > 15)
    total_pixels = diferencia.shape[0] * diferencia.shape[1]
    porcentaje_detalles_nuevos = (cambios_significativos / total_pixels) * 100
    
    # 5. Score total combinado
    # Normalizar diferencia (queremos algo de diferencia, pero no demasiada)
    score_diferencia = min(diferencia_promedio / 20, 1.0)  # Penalizar si es muy alta
    score_nitidez = min(mejora_nitidez, 3.0)  # Limitar mejora extrema
    score_contraste = min(mejora_contraste, 2.0)
    score_detalles = min(porcentaje_detalles_nuevos / 10, 1.0)
    
    score_total = (score_nitidez * 0.4 + score_contraste * 0.3 + 
                   score_detalles * 0.2 + score_diferencia * 0.1)
    
    return {
        'diferencia_promedio': diferencia_promedio,
        'nitidez': mejora_nitidez,
        'contraste': mejora_contraste,
        'detalles_nuevos': porcentaje_detalles_nuevos,
        'score_total': score_total
    }

def crear_comparacion_mejores(mejores_resultados):
    """Crea una comparación visual de las 5 mejores versiones"""
    
    print(f"\n🎨 Creando comparación de los {len(mejores_resultados)} mejores resultados...")
    
    # Cargar imágenes
    imagenes = []
    nombres = []
    
    for resultado in mejores_resultados:
        img = cv2.imread(resultado['nombre'])
        if img is not None:
            # Redimensionar para comparación (mantener aspecto pero reducir tamaño)
            height, width = img.shape[:2]
            new_width = 300
            new_height = int((new_width * height) / width)
            img_resized = cv2.resize(img, (new_width, new_height), interpolation=cv2.INTER_LANCZOS4)
            
            imagenes.append(img_resized)
            nombre_corto = resultado['nombre'].replace('Captura2_', '').replace('.png', '')
            nombres.append(f"{nombre_corto}\nScore: {resultado['score_total']:.2f}")
    
    if not imagenes:
        print("❌ No se pudieron cargar imágenes para comparación")
        return
    
    # Crear mosaico
    num_imagenes = len(imagenes)
    cols = min(3, num_imagenes)
    rows = (num_imagenes + cols - 1) // cols
    
    img_height, img_width = imagenes[0].shape[:2]
    
    # Espacio para texto
    text_height = 60
    
    mosaico_width = img_width * cols + 20 * (cols - 1)
    mosaico_height = (img_height + text_height) * rows + 20 * (rows - 1)
    
    mosaico = np.ones((mosaico_height, mosaico_width, 3), dtype=np.uint8) * 255
    
    for i, (img, nombre) in enumerate(zip(imagenes, nombres)):
        row = i // cols
        col = i % cols
        
        x = col * (img_width + 20)
        y = row * (img_height + text_height + 20)
        
        # Colocar imagen
        mosaico[y:y+img_height, x:x+img_width] = img
        
        # Agregar texto
        mosaico_pil = Image.fromarray(cv2.cvtColor(mosaico, cv2.COLOR_BGR2RGB))
        draw = ImageDraw.Draw(mosaico_pil)
        
        try:
            font = ImageFont.truetype("arial.ttf", 14)
        except:
            font = ImageFont.load_default()
        
        # Texto centrado
        text_x = x + img_width // 2
        text_y = y + img_height + 5
        
        # Calcular ancho del texto para centrarlo
        bbox = draw.textbbox((0, 0), nombre.split('\n')[0], font=font)
        text_width = bbox[2] - bbox[0]
        
        draw.text((text_x - text_width//2, text_y), nombre, fill=(0, 0, 0), font=font)
        
        mosaico = cv2.cvtColor(np.array(mosaico_pil), cv2.COLOR_RGB2BGR)
    
    # Guardar comparación
    cv2.imwrite("Comparacion_Mejores_Versiones.png", mosaico)
    print("✅ Comparación guardada: Comparacion_Mejores_Versiones.png")

def guardar_reporte_calidad(resultados):
    """Guarda un reporte detallado de calidad en texto"""
    
    with open("Reporte_Calidad_Completo.txt", "w", encoding="utf-8") as f:
        f.write("🏆 REPORTE COMPLETO DE CALIDAD - REAL-ESRGAN\n")
        f.write("=" * 60 + "\n\n")
        
        f.write(f"📊 Total de versiones analizadas: {len(resultados)}\n\n")
        
        f.write("🥇 RANKING COMPLETO:\n")
        f.write("-" * 40 + "\n")
        
        for i, resultado in enumerate(resultados, 1):
            f.write(f"{i:2d}. {resultado['nombre']}\n")
            f.write(f"    📏 Resolución: {resultado['resolucion']}\n")
            f.write(f"    💾 Tamaño: {resultado['tamano_kb']:.1f}KB\n")
            f.write(f"    🎯 Score total: {resultado['score_total']:.3f}\n")
            f.write(f"    🔍 Mejora nitidez: {resultado['nitidez']:.3f}x\n")
            f.write(f"    🌓 Mejora contraste: {resultado['contraste']:.3f}x\n")
            f.write(f"    ✨ Detalles nuevos: {resultado['detalles_nuevos']:.1f}%\n")
            f.write(f"    📊 Diferencia promedio: {resultado['diferencia_promedio']:.2f}\n\n")
        
        f.write("\n🎯 RECOMENDACIONES:\n")
        f.write("-" * 20 + "\n")
        
        mejor = resultados[0]
        f.write(f"🥇 MEJOR OPCIÓN: {mejor['nombre']}\n")
        f.write(f"   - Score más alto: {mejor['score_total']:.3f}\n")
        f.write(f"   - Mejor balance entre nitidez y naturalidad\n\n")
        
        # Encontrar la de mayor nitidez
        mas_nitida = max(resultados, key=lambda x: x['nitidez'])
        f.write(f"🔍 MÁS NÍTIDA: {mas_nitida['nombre']}\n")
        f.write(f"   - Nitidez: {mas_nitida['nitidez']:.3f}x\n\n")
        
        # Encontrar la más conservativa
        mas_conservativa = min(resultados, key=lambda x: x['diferencia_promedio'])
        f.write(f"🛡️ MÁS CONSERVATIVA: {mas_conservativa['nombre']}\n")
        f.write(f"   - Cambios mínimos: {mas_conservativa['diferencia_promedio']:.2f}\n\n")
    
    print("✅ Reporte guardado: Reporte_Calidad_Completo.txt")

if __name__ == "__main__":
    print("🎯 ANÁLISIS COMPLETO DE CALIDAD - REAL-ESRGAN")
    print("=" * 60)
    
    resultados = analizar_calidad_todas_versiones()
    
    if resultados:
        mejor = resultados[0]
        print(f"\n🏆 GANADOR: {mejor['nombre']}")
        print(f"🎯 Score: {mejor['score_total']:.3f}")
        print(f"🔍 Mejora de nitidez: {mejor['nitidez']:.2f}x")
        print(f"💾 Tamaño: {mejor['tamano_kb']:.1f}KB")
        
        print(f"\n📁 Archivos generados:")
        print(f"   - Comparacion_Mejores_Versiones.png")
        print(f"   - Reporte_Calidad_Completo.txt")
        
        print(f"\n💡 ¡Usa {mejor['nombre']} para la mejor calidad!") 