#!/usr/bin/env python3
import os
import sys
import psycopg2
from psycopg2.extras import Json
import shutil
from datetime import datetime
import uuid

# Configuración de la base de datos
DB_PARAMS = {
    'dbname': os.environ.get('POSTGRES_DB', 'mydatabase'),
    'user': os.environ.get('POSTGRES_USER', 'myuser'),
    'password': os.environ.get('POSTGRES_PASSWORD', 'mypassword'),
    'host': os.environ.get('POSTGRES_HOST', 'database'),
    'port': os.environ.get('POSTGRES_PORT', '5432')
}

# Mapeo de imágenes y sus descripciones
IMAGES_MAP = {
    'servicios-it.jpg': 'Servicios IT y Consultoría',
    'servicios-web.jpg': 'Servicios Web y Desarrollo',
    'redes-comunicaciones.jpg': 'Redes y Comunicaciones',
    'ciberseguridad.jpg': 'Ciberseguridad',
    'seguridad-informatica.jpg': 'Seguridad Informática',
    'telefonia.jpg': 'Telefonía y Citofonía'
}

def create_folder_if_not_exists(folder_id, conn):
    """Crea la carpeta 'servicios' si no existe."""
    with conn.cursor() as cur:
        # Verificar si la carpeta ya existe
        cur.execute("""
            SELECT id FROM directus_folders 
            WHERE name = 'servicios'
        """)
        result = cur.fetchone()
        if result:
            return result[0]
        
        # Crear la carpeta si no existe
        folder_id = str(uuid.uuid4())
        cur.execute("""
            INSERT INTO directus_folders (id, name, parent)
            VALUES (%s, 'servicios', NULL)
        """, (folder_id,))
        conn.commit()
        return folder_id

def process_image(image_path, folder_id, conn):
    """Procesa y registra una imagen en Directus."""
    filename = os.path.basename(image_path)
    file_id = str(uuid.uuid4())
    
    # Copiar imagen al directorio de uploads de Directus
    dest_path = os.path.join("directus-admin/uploads", f"{file_id}.jpg")
    os.makedirs(os.path.dirname(dest_path), exist_ok=True)
    shutil.copy2(image_path, dest_path)
    
    # Registrar archivo en la base de datos
    with conn.cursor() as cur:
        cur.execute("""
            INSERT INTO directus_files (
                id, 
                storage, 
                filename_disk,
                filename_download,
                title,
                type,
                folder,
                uploaded_by,
                uploaded_on,
                modified_by,
                modified_on,
                metadata
            ) VALUES (
                %s, 'local', %s, %s, %s, 'image/jpeg', %s, NULL, %s, NULL, %s,
                %s
            )
        """, (
            file_id,
            f"{file_id}.jpg",
            filename,
            IMAGES_MAP.get(filename, filename),
            folder_id,
            datetime.now(),
            datetime.now(),
            Json({
                "type": "image/jpeg",
                "description": IMAGES_MAP.get(filename, ""),
                "tags": ["servicios"]
            })
        ))
    
    return file_id

def main():
    conn = None
    try:
        # Conectar a la base de datos
        print("Conectando a la base de datos...")
        conn = psycopg2.connect(**DB_PARAMS)
        print("Conexión exitosa!")
        
        # Crear carpeta servicios
        folder_id = create_folder_if_not_exists('servicios', conn)
        print(f"✅ Carpeta 'servicios' lista (ID: {folder_id})")
        
        # Procesar cada imagen
        source_dir = "public/images/services"
        for filename in IMAGES_MAP.keys():
            image_path = os.path.join(source_dir, filename)
            if os.path.exists(image_path):
                print(f"Procesando {filename}...")
                file_id = process_image(image_path, folder_id, conn)
                print(f"✅ Imagen {filename} migrada exitosamente (ID: {file_id})")
            else:
                print(f"❌ No se encontró la imagen: {filename}")
        
        conn.commit()
        print("\n✨ Migración completada exitosamente!")
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        if conn:
            conn.rollback()
        sys.exit(1)
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    main() 