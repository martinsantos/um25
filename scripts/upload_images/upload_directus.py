#!/usr/bin/env python3
import os
import json
import requests
from pathlib import Path

# Configuración
DIRECTUS_URL = "http://localhost:8055"
TOKEN = "k6P8LAY8_x_y1miB_KTlWnysCnx2Abky"
UPLOADS_DIR = Path("/directus/uploads/local")

# Headers para las peticiones
headers = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json"
}

def get_admin_id():
    """Obtener el ID del usuario administrador"""
    try:
        response = requests.get(
            f"{DIRECTUS_URL}/users?filter[email][_eq]=admin@example.com",
            headers=headers
        )
        response.raise_for_status()
        data = response.json()
        return data.get('data', [{}])[0].get('id')
    except Exception as e:
        print(f"Error al obtener el ID del administrador: {e}")
        return None

def upload_file(file_path):
    """Subir un archivo a Directus"""
    file_name = file_path.name
    
    # Verificar si el archivo ya existe
    try:
        response = requests.get(
            f"{DIRECTUS_URL}/files?filter[filename_download][_eq]={file_name}",
            headers=headers
        )
        response.raise_for_status()
        existing_files = response.json().get('data', [])
        
        if existing_files:
            print(f"El archivo {file_name} ya existe en Directus, omitiendo...")
            return existing_files[0]['id']
    except Exception as e:
        print(f"Error al verificar archivo existente {file_name}: {e}")
        return None
    
    # Subir el archivo
    try:
        admin_id = get_admin_id()
        if not admin_id:
            print("No se pudo obtener el ID del administrador")
            return None
            
        files = {
            'file': (file_name, open(file_path, 'rb'))
        }
        data = {
            'data': json.dumps({
                'title': file_name,
                'filename_download': file_name,
                'storage': 'local',
                'uploaded_by': admin_id
            })
        }
        
        response = requests.post(
            f"{DIRECTUS_URL}/files/import",
            headers={"Authorization": f"Bearer {TOKEN}"},
            files=files,
            data=data
        )
        response.raise_for_status()
        
        file_id = response.json()['data']['id']
        print(f"Archivo {file_name} subido correctamente con ID: {file_id}")
        return file_id
        
    except Exception as e:
        print(f"Error al subir el archivo {file_name}: {e}")
        return None

def link_image_to_post(collection, post_id, file_id):
    """Vincular una imagen a un post"""
    try:
        # Primero obtener el post actual
        response = requests.get(
            f"{DIRECTUS_URL}/items/{collection}/{post_id}",
            headers=headers
        )
        
        if response.status_code != 200:
            print(f"El post con ID {post_id} no existe en la colección {collection}")
            return False
            
        # Actualizar el campo de imagen
        update_data = {
            "Imagen": file_id
        }
        
        response = requests.patch(
            f"{DIRECTUS_URL}/items/{collection}/{post_id}",
            headers=headers,
            json=update_data
        )
        response.raise_for_status()
        
        print(f"Imagen {file_id} vinculada correctamente a {collection} ID {post_id}")
        return True
        
    except Exception as e:
        print(f"Error al vincular imagen a {collection} ID {post_id}: {e}")
        return False

def main():
    # Verificar si el directorio de subidas existe
    if not UPLOADS_DIR.exists() or not UPLOADS_DIR.is_dir():
        print(f"El directorio de subidas no existe: {UPLOADS_DIR}")
        return
    
    # Procesar archivos de imagen
    image_extensions = ('.jpg', '.jpeg', '.png')
    
    for file_path in UPLOADS_DIR.glob('*'):
        if file_path.suffix.lower() in image_extensions and file_path.is_file():
            print(f"\nProcesando: {file_path.name}")
            
            # Subir el archivo
            file_id = upload_file(file_path)
            if not file_id:
                continue
            
            # Extraer información del nombre del archivo
            file_stem = file_path.stem
            parts = file_stem.split('_')
            
            # Verificar si el primer segmento es un ID numérico
            if parts and parts[0].isdigit():
                post_id = parts[0]
                
                # Determinar la colección basada en el nombre del archivo
                if 'ant_' in file_stem or file_stem.startswith(f"{post_id}_ant_"):
                    collection = "Antecedentes"
                else:
                    collection = "Servicios"
                
                # Vincular la imagen al post
                link_image_to_post(collection, post_id, file_id)

if __name__ == "__main__":
    main()
