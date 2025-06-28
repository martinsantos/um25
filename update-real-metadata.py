#!/usr/bin/env python3
import os
import sys
from PIL import Image
import psycopg2
from psycopg2.extras import Json
import uuid

# Configuración de la base de datos desde variables de entorno
DB_PARAMS = {
    'dbname': os.environ.get('POSTGRES_DB', 'mydatabase'),
    'user': os.environ.get('POSTGRES_USER', 'myuser'),
    'password': os.environ.get('POSTGRES_PASSWORD', 'mypassword'),
    'host': os.environ.get('POSTGRES_HOST', 'database'),
    'port': os.environ.get('POSTGRES_PORT', '5432')
}

def get_image_metadata(image_path):
    """Obtiene los metadatos reales de una imagen."""
    try:
        with Image.open(image_path) as img:
            return {
                'width': img.width,
                'height': img.height,
                'format': img.format.lower(),
                'mode': img.mode,
                'filesize': os.path.getsize(image_path),
                'metadata': {
                    'format': img.format,
                    'mode': img.mode,
                    'size': img.size,
                    'hasAlpha': img.mode == 'RGBA',
                    'colorSpace': 'sRGB' if img.mode in ('RGB', 'RGBA') else img.mode
                }
            }
    except Exception as e:
        print(f"Error procesando {image_path}: {e}")
        return None

def update_db_metadata(conn, file_id, metadata):
    """Actualiza los metadatos en la base de datos."""
    try:
        with conn.cursor() as cur:
            cur.execute("""
                UPDATE directus_files 
                SET width = %s, 
                    height = %s, 
                    filesize = %s,
                    type = %s,
                    metadata = %s,
                    modified_on = NOW()
                WHERE id = %s
            """, (
                metadata['width'],
                metadata['height'],
                metadata['filesize'],
                f"image/{metadata['format']}",
                Json(metadata['metadata']),
                file_id
            ))
        conn.commit()
        return True
    except Exception as e:
        print(f"Error actualizando metadata para {file_id}: {e}")
        conn.rollback()
        return False

def main():
    try:
        # Conectar a la base de datos
        print("Conectando a la base de datos...")
        print(f"Host: {DB_PARAMS['host']}, Puerto: {DB_PARAMS['port']}")
        conn = psycopg2.connect(**DB_PARAMS)
        print("Conexión exitosa!")
        
        # Obtener lista de archivos
        with conn.cursor() as cur:
            cur.execute("SELECT id, filename_disk FROM directus_files")
            files = cur.fetchall()

        # Procesar cada archivo
        uploads_dir = "/directus/uploads"  # Directorio de uploads en el servidor
        total = len(files)
        updated = 0

        print(f"Procesando {total} archivos...")

        for file_id, filename in files:
            image_path = os.path.join(uploads_dir, filename)
            if os.path.exists(image_path):
                print(f"Procesando {filename}...")
                metadata = get_image_metadata(image_path)
                if metadata and update_db_metadata(conn, file_id, metadata):
                    updated += 1
                    print(f"✅ Actualizado {filename} ({updated}/{total})")
            else:
                print(f"❌ No encontrado: {image_path}")

        print(f"\nActualización completa: {updated}/{total} archivos procesados")
        conn.close()
    except Exception as e:
        print(f"Error de conexión: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main() 