#!/usr/bin/env python3
import os
import sys
from PIL import Image
import psycopg2
from psycopg2.extras import Json
import shutil

# Configuración de la base de datos desde variables de entorno
DB_PARAMS = {
    'dbname': os.environ.get('POSTGRES_DB', 'mydatabase'),
    'user': os.environ.get('POSTGRES_USER', 'myuser'),
    'password': os.environ.get('POSTGRES_PASSWORD', 'mypassword'),
    'host': os.environ.get('POSTGRES_HOST', 'database'),
    'port': os.environ.get('POSTGRES_PORT', '5432')
}

def create_thumbnail(image_path, thumb_path, size=(200, 200)):
    """Crea una miniatura de la imagen manteniendo la proporción."""
    try:
        with Image.open(image_path) as img:
            # Convertir a RGB si es necesario
            if img.mode in ('RGBA', 'LA'):
                background = Image.new('RGB', img.size, (255, 255, 255))
                background.paste(img, mask=img.split()[-1])
                img = background
            elif img.mode not in ('RGB', 'L'):
                img = img.convert('RGB')
            
            # Crear miniatura manteniendo proporción
            img.thumbnail(size, Image.Resampling.LANCZOS)
            
            # Guardar miniatura
            img.save(thumb_path, 'JPEG', quality=85)
            return True
    except Exception as e:
        print(f"Error procesando {image_path}: {e}")
        return False

def main():
    try:
        # Conectar a la base de datos
        print("Conectando a la base de datos...")
        conn = psycopg2.connect(**DB_PARAMS)
        print("Conexión exitosa!")
        
        # Obtener lista de archivos
        with conn.cursor() as cur:
            cur.execute("SELECT id, filename_disk FROM directus_files")
            files = cur.fetchall()

        # Configurar directorios
        uploads_dir = "/directus/uploads"
        thumbs_dir = "/directus/uploads/thumbs"
        
        # Crear directorio de miniaturas si no existe
        os.makedirs(thumbs_dir, exist_ok=True)

        # Procesar cada archivo
        total = len(files)
        processed = 0

        print(f"Procesando {total} archivos...")

        for file_id, filename in files:
            image_path = os.path.join(uploads_dir, filename)
            thumb_path = os.path.join(thumbs_dir, f"thumb_{filename.rsplit('.', 1)[0]}.jpg")
            
            if os.path.exists(image_path):
                print(f"Procesando {filename}...")
                if create_thumbnail(image_path, thumb_path):
                    processed += 1
                    print(f"✅ Miniatura creada para {filename} ({processed}/{total})")
                    
                    # Actualizar la base de datos con la ruta de la miniatura
                    with conn.cursor() as cur:
                        cur.execute("""
                            UPDATE directus_files 
                            SET thumbnail = %s
                            WHERE id = %s
                        """, (
                            f"thumbs/thumb_{filename.rsplit('.', 1)[0]}.jpg",
                            file_id
                        ))
                    conn.commit()
            else:
                print(f"❌ No encontrado: {image_path}")

        print(f"\nProceso completado: {processed}/{total} miniaturas generadas")
        conn.close()
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main() 