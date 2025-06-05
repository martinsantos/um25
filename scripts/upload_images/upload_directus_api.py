#!/usr/bin/env python3
import os
import json
import csv
import requests
from pathlib import Path

# Configuración
DIRECTUS_URL = "http://localhost:8055"
TOKEN = "k6P8LAY8_x_y1miB_KTlWnysCnx2Abky"
UPLOADS_DIRS = [
    "./local-uploads/uploads",  # Directorio principal de subidas
    "./directus-admin/uploads"   # Directorio alternativo
]
MAPPING_FILE = "./file_mapping.csv"
LOG_FILE = "./upload_directus.log"

# Mapeo de tipos de colección
COLLECTION_TYPES = {
    'antecedentes': 'Antecedentes',
    'servicios': 'Servicios'
}

# Headers para las peticiones
headers = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json"
}

def log_message(message):
    """Escribe un mensaje en el archivo de log"""
    with open(LOG_FILE, 'a', encoding='utf-8') as f:
        f.write(f"{message}\n")
    print(message)

def get_admin_id():
    """Obtener el ID del usuario administrador"""
    try:
        response = requests.get(
            f"{DIRECTUS_URL}/users/me",
            headers=headers
        )
        response.raise_for_status()
        return response.json()['data']['id']
    except Exception as e:
        log_message(f"Error al obtener el ID del administrador: {str(e)}")
        return None

def upload_file(file_path, admin_id):
    """Subir un archivo a Directus"""
    file_name = os.path.basename(file_path)
    
    try:
        # Verificar si el archivo ya existe
        response = requests.get(
            f"{DIRECTUS_URL}/files",
            headers=headers,
            params={"filter[filename_download][_eq]": file_name}
        )
        response.raise_for_status()
        
        existing_files = response.json().get('data', [])
        if existing_files:
            log_message(f"El archivo {file_name} ya existe en Directus, omitiendo...")
            return existing_files[0]['id']
            
        # Subir el archivo
        with open(file_path, 'rb') as f:
            files = {
                'file': (file_name, f, 'image/png' if file_name.lower().endswith('.png') else 'image/jpeg')
            }
            
            data = {
                'title': file_name,
                'filename_download': file_name,
                'storage': 'local',
                'uploaded_by': admin_id
            }
            
            upload_headers = {
                'Authorization': f'Bearer {TOKEN}'
            }
            
            response = requests.post(
                f"{DIRECTUS_URL}/files",
                headers=upload_headers,
                files=files,
                data=data
            )
            
            response.raise_for_status()
            file_id = response.json()['data']['id']
            log_message(f"Archivo {file_name} subido correctamente con ID: {file_id}")
            return file_id
            
    except Exception as e:
        log_message(f"Error al subir el archivo {file_name}: {str(e)}")
        if hasattr(e, 'response') and e.response is not None:
            log_message(f"Respuesta del servidor: {e.response.text}")
        return None

def link_image_to_post(collection, post_id, file_id):
    """Vincular una imagen a un post"""
    try:
        # Actualizar el campo de imagen en el post
        update_data = {
            "Imagen": file_id
        }
        
        response = requests.patch(
            f"{DIRECTUS_URL}/items/{collection}/{post_id}",
            headers=headers,
            json=update_data
        )
        response.raise_for_status()
        
        log_message(f"Imagen {file_id} vinculada correctamente a {collection} ID {post_id}")
        return True
        
    except Exception as e:
        log_message(f"Error al vincular imagen a {collection} ID {post_id}: {str(e)}")
        if hasattr(e, 'response') and e.response is not None:
            log_message(f"Respuesta del servidor: {e.response.text}")
        return False

def load_mapping():
    """Cargar el mapeo de archivos a posts desde el archivo CSV"""
    mapping = {}
    try:
        with open(MAPPING_FILE, 'r') as f:
            reader = csv.reader(f)
            for row in reader:
                if len(row) >= 2:
                    # Extraer el nombre del archivo (última parte de la ruta)
                    file_path = row[0].strip()
                    # Extraer el UUID del nombre del archivo (sin la ruta y sin extensión)
                    file_name = os.path.basename(file_path)
                    file_uuid = os.path.splitext(file_name)[0]
                    post_id = row[1].strip()
                    mapping[file_uuid] = post_id
                    
                    # Log para depuración (solo los primeros 5)
                    if len(mapping) <= 5:
                        log_message(f"  - Mapeo cargado: {file_uuid} -> {post_id}")
                    
                    if len(mapping) == 5:
                        log_message("  - ... (mostrando solo los primeros 5 mapeos)")
            
            log_message(f"Se cargaron {len(mapping)} mapeos de archivos en total.")
            return mapping
    except Exception as e:
        log_message(f"Error al cargar el archivo de mapeo: {str(e)}")
        if hasattr(e, 'args') and e.args:
            log_message(f"Detalles: {e.args}")
        return {}

def get_collection_for_post(post_id):
    """Determinar la colección a la que pertenece un post"""
    # Primero intentamos con Antecedentes
    try:
        response = requests.get(
            f"{DIRECTUS_URL}/items/Antecedentes/{post_id}",
            headers={"Authorization": f"Bearer {TOKEN}"}
        )
        if response.status_code == 200:
            return "Antecedentes"
    except:
        pass
    
    # Si no está en Antecedentes, asumimos que está en Servicios
    return "Servicios"

def find_file_in_uploads(file_name):
    """Busca un archivo en todos los directorios de subidas"""
    for upload_dir in UPLOADS_DIRS:
        file_path = Path(upload_dir) / file_name
        if file_path.exists() and file_path.is_file():
            return file_path
    return None

def main():
    # Verificar si al menos un directorio de subidas existe
    valid_upload_dirs = []
    for upload_dir in UPLOADS_DIRS:
        upload_path = Path(upload_dir)
        if upload_path.exists() and upload_path.is_dir():
            valid_upload_dirs.append(upload_path)
    
    if not valid_upload_dirs:
        log_message(f"No se encontraron directorios de subidas válidos. Directorios probados: {', '.join(UPLOADS_DIRS)}")
        return
    
    log_message(f"Directorios de subidas válidos: {', '.join(str(d) for d in valid_upload_dirs)}")
    
    # Cargar el mapeo de archivos
    log_message("Cargando mapeo de archivos...")
    file_mapping = load_mapping()
    if not file_mapping:
        log_message("No se pudo cargar el mapeo de archivos. Saliendo...")
        return
    
    # Obtener ID del administrador
    log_message("Obteniendo ID del administrador...")
    admin_id = get_admin_id()
    if not admin_id:
        log_message("No se pudo obtener el ID del administrador. Saliendo...")
        return
    
    log_message(f"ID del administrador: {admin_id}")
    
    # Procesar archivos del mapeo
    image_extensions = ('.jpg', '.jpeg', '.png')
    uploaded_count = 0
    linked_count = 0
    processed_files = set()
    
    # Primero, procesar los archivos que están en el mapeo
    for file_uuid, post_id in file_mapping.items():
        log_message(f"\nBuscando archivo con UUID: {file_uuid}")
        
        # Buscar el archivo en todos los directorios de subidas
        file_found = False
        file_path = None
        
        for ext in image_extensions:
            temp_path = find_file_in_uploads(f"{file_uuid}{ext}")
            if temp_path:
                file_path = temp_path
                file_found = True
                break
        
        if not file_found or not file_path:
            log_message(f"  - No se encontró el archivo para el UUID: {file_uuid}")
            continue
            
        log_message(f"  - Archivo encontrado: {file_path}")
        
        # Evitar procesar el mismo archivo varias veces
        if str(file_path) in processed_files:
            log_message("  - Archivo ya procesado, omitiendo...")
            continue
            
        processed_files.add(str(file_path))
        
        # Subir el archivo si no existe
        file_id = None
        try:
            # Verificar si el archivo ya existe
            response = requests.get(
                f"{DIRECTUS_URL}/files",
                headers={"Authorization": f"Bearer {TOKEN}"},
                params={"filter[filename_download][_eq]": file_path.name}
            )
            response.raise_for_status()
            
            existing_files = response.json().get('data', [])
            if existing_files:
                file_id = existing_files[0]['id']
                log_message(f"  - Archivo ya existe en Directus con ID: {file_id}")
            else:
                # Subir el archivo
                with open(file_path, 'rb') as f:
                    files = {
                        'file': (file_path.name, f, 'image/png' if file_path.suffix.lower() == '.png' else 'image/jpeg')
                    }
                    
                    data = {
                        'title': file_path.name,
                        'filename_download': file_path.name,
                        'storage': 'local',
                        'uploaded_by': admin_id
                    }
                    
                    upload_headers = {
                        'Authorization': f'Bearer {TOKEN}'
                    }
                    
                    response = requests.post(
                        f"{DIRECTUS_URL}/files",
                        headers=upload_headers,
                        files=files,
                        data=data
                    )
                    
                    response.raise_for_status()
                    file_id = response.json()['data']['id']
                    log_message(f"  - Archivo subido correctamente con ID: {file_id}")
                    uploaded_count += 1
            
            # Determinar la colección (Antecedentes o Servicios)
            collection = get_collection_for_post(post_id)
            log_message(f"  - Post ID: {post_id}, Colección: {collection}")
            
            # Vincular la imagen al post
            if link_image_to_post(collection, post_id, file_id):
                linked_count += 1
            
        except Exception as e:
            log_message(f"  - Error al procesar el archivo: {str(e)}")
            if hasattr(e, 'response') and e.response is not None:
                log_message(f"  - Respuesta del servidor: {e.response.text}")
    
    log_message(f"\nResumen:")
    log_message(f"- Archivos subidos: {uploaded_count}")
    log_message(f"- Imágenes vinculadas: {linked_count}")
    log_message("\nProceso completado.")

if __name__ == "__main__":
    # Limpiar archivo de log anterior
    if os.path.exists(LOG_FILE):
        os.remove(LOG_FILE)
    
    main()
