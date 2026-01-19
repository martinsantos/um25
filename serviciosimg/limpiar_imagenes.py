import sys
import os
from pathlib import Path
from rembg import remove, new_session
from PIL import Image
import numpy as np

def process_images(input_dir, output_dir):
    input_path = Path(input_dir)
    output_path = Path(output_dir)
    
    if not input_path.exists():
        print(f"Error: El directorio de entrada '{input_dir}' no existe.")
        return

    output_path.mkdir(parents=True, exist_ok=True)
    
    # Crear sesión para mayor eficiencia en procesos batch
    print("Iniciando sesión de rembg...")
    session = new_session("u2net")
    
    extensions = ("*.png", "*.jpg", "*.jpeg", "*.webp")
    files_to_process = []
    for ext in extensions:
        files_to_process.extend(list(input_path.glob(ext)))
        files_to_process.extend(list(input_path.glob(ext.upper())))

    if not files_to_process:
        print(f"No se encontraron imágenes en '{input_dir}'")
        return

    print(f"Procesando {len(files_to_process)} imágenes...")

    for img_file in files_to_process:
        try:
            print(f"-> Procesando: {img_file.name}")
            with Image.open(img_file) as img:
                # Convertir a RGBA si es necesario
                img = img.convert("RGBA")
                
                # Remover fondo
                output_img = remove(img, session=session, alpha_matting=True)
                
                # Guardar resultado
                target_file = output_path / f"{img_file.stem}.png"
                output_img.save(target_file, "PNG")
        except Exception as e:
            print(f"Error procesando {img_file.name}: {e}")

    print(f"\n✅ Proceso completado. Imágenes guardadas en: {output_dir}")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Uso: python limpiar_imagenes.py <directorio_entrada> <directorio_salida>")
    else:
        process_images(sys.argv[1], sys.argv[2])
