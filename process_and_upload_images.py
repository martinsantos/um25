#!/usr/bin/env python3
import os
import sys
from PIL import Image
import psycopg2
import shutil
from datetime import datetime

# Configuración de la base de datos
DB_PARAMS = {
    'dbname': os.environ.get('POSTGRES_DB', 'mydatabase'),
    'user': os.environ.get('POSTGRES_USER', 'myuser'),
    'password': os.environ.get('POSTGRES_PASSWORD', 'mypassword'),
    'host': os.environ.get('POSTGRES_HOST', 'database'),
    'port': os.environ.get('POSTGRES_PORT', '5432')
}

def optimize_image(source_path, target_path, max_size=(1920, 1080)):
    """Optimiza la imagen manteniendo la calidad y ajustando el tamaño."""
    try:
        with Image.open(source_path) as img:
            # Convertir a RGB si es necesario
            if img.mode in ('RGBA', 'LA'):
                background = Image.new('RGB', img.size, (255, 255, 255))
                background.paste(img, mask=img.split()[-1])
                img = background
            elif img.mode not in ('RGB', 'L'):
                img = img.convert('RGB')
            
            # Redimensionar si es necesario
            if img.size[0] > max_size[0] or img.size[1] > max_size[1]:
                img.thumbnail(max_size, Image.Resampling.LANCZOS)
            
            # Guardar con optimización
            img.save(target_path, 'JPEG', quality=85, optimize=True)
            return True
    except Exception as e:
        print(f"Error procesando {source_path}: {e}")
        return False

def create_thumbnail(image_path, thumb_path, size=(200, 200)):
    """Crea una miniatura de la imagen."""
    try:
        with Image.open(image_path) as img:
            if img.mode in ('RGBA', 'LA'):
                background = Image.new('RGB', img.size, (255, 255, 255))
                background.paste(img, mask=img.split()[-1])
                img = background
            elif img.mode not in ('RGB', 'L'):
                img = img.convert('RGB')
            
            img.thumbnail(size, Image.Resampling.LANCZOS)
            img.save(thumb_path, 'JPEG', quality=85)
            return True
    except Exception as e:
        print(f"Error creando miniatura {image_path}: {e}")
        return False

def main():
    try:
        # Conectar a la base de datos
        print("Conectando a la base de datos...")
        conn = psycopg2.connect(**DB_PARAMS)
        print("Conexión exitosa!")

        # Configurar directorios
        source_dir = "/directus/uploads"
        processed_dir = "/directus/uploads/processed"
        thumbs_dir = "/directus/uploads/thumbs"
        
        # Crear directorios si no existen
        for directory in [processed_dir, thumbs_dir]:
            os.makedirs(directory, exist_ok=True)

        # Obtener lista de archivos
        with conn.cursor() as cur:
            cur.execute("SELECT id, filename_disk FROM directus_files")
            files = cur.fetchall()

        total = len(files)
        processed = 0
        print(f"Procesando {total} archivos...")

        for file_id, filename in files:
            source_path = os.path.join(source_dir, filename)
            if not os.path.exists(source_path):
                print(f"❌ No encontrado: {source_path}")
                continue

            # Generar nombres de archivo
            base_name = os.path.splitext(filename)[0]
            processed_path = os.path.join(processed_dir, f"{base_name}.jpg")
            thumb_path = os.path.join(thumbs_dir, f"thumb_{base_name}.jpg")

            print(f"Procesando {filename}...")
            
            # Optimizar imagen principal
            if optimize_image(source_path, processed_path):
                # Crear miniatura
                if create_thumbnail(processed_path, thumb_path):
                    processed += 1
                    print(f"✅ Imagen procesada: {filename} ({processed}/{total})")

                    # Obtener metadatos de la imagen procesada
                    with Image.open(processed_path) as img:
                        width, height = img.size
                        filesize = os.path.getsize(processed_path)

                    # Actualizar la base de datos
                    with conn.cursor() as cur:
                        cur.execute("""
                            UPDATE directus_files 
                            SET 
                                width = %s,
                                height = %s,
                                filesize = %s,
                                type = 'image/jpeg',
                                modified_on = %s,
                                filename_disk = %s,
                                thumbnail = %s
                            WHERE id = %s
                        """, (
                            width,
                            height,
                            filesize,
                            datetime.now(),
                            f"{base_name}.jpg",
                            f"thumbs/thumb_{base_name}.jpg",
                            file_id
                        ))
                    conn.commit()

                    # Mover archivo procesado a la ubicación final
                    final_path = os.path.join(source_dir, f"{base_name}.jpg")
                    shutil.move(processed_path, final_path)

        print(f"\nProceso completado: {processed}/{total} imágenes procesadas")
        
        # Limpiar directorio temporal
        shutil.rmtree(processed_dir)
        
        conn.close()
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main() 