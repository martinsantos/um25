#!/usr/bin/env python3
"""
Script para cargar imágenes y actualizar registros de Antecedentes en Directus.
"""

import os
import json
import requests
from pathlib import Path
from datetime import datetime
import logging
from typing import Dict, List, Optional, Any

# Configuración básica
BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BASE_DIR
IMAGES_DIR = BASE_DIR / "imagenes_antecedentes_versionproduccion"

# Configuración de Directus
DIRECTUS_URL = "http://localhost:8055"
TOKEN = "k6P8LAY8_x_y1miB_KTlWnysCnx2Abky"
COLLECTION = "Antecedentes"

# Configuración de logs
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(BASE_DIR / 'upload_antecedentes.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class DirectusClient:
    """Cliente para interactuar con la API de Directus."""
    
    def __init__(self, base_url: str, token: str):
        self.base_url = base_url.rstrip('/')
        self.token = token
        self.session = requests.Session()
        self.session.headers.update({
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        })
    
    def upload_file(self, file_path: Path) -> Optional[Dict]:
        """Sube un archivo a Directus y devuelve los metadatos."""
        url = f"{self.base_url}/files"
        
        try:
            with open(file_path, 'rb') as f:
                files = {'file': (file_path.name, f, 'image/png' if str(file_path).lower().endswith('.png') else 'image/jpeg')}
                
                # Datos adicionales para el archivo
                data = {
                    'title': file_path.name,
                    'filename_download': file_path.name,
                    'storage': 'local',
                    'uploaded_by': '93bfdf28-e8b1-4e79-a73a-92cd7cfe119b'  # ID del usuario admin
                }
                
                # Usar un diccionario separado para los headers
                headers = {
                    'Authorization': f'Bearer {self.token}'
                }
                
                response = requests.post(
                    url,
                    headers=headers,
                    files=files,
                    data=data
                )
                
                response.raise_for_status()
                return response.json()['data']
                
        except Exception as e:
            logger.error(f"Error al subir el archivo {file_path}: {str(e)}")
            if hasattr(e, 'response') and e.response is not None:
                logger.error(f"Respuesta del servidor: {e.response.text}")
            return None
    
    def format_fecha(self, fecha_str: str) -> str:
        """Convierte una fecha de formato DD-MM-YYYY a YYYY-MM-DD."""
        try:
            if not fecha_str or not isinstance(fecha_str, str):
                return None
                
            # Intentar convertir la fecha
            from datetime import datetime
            fecha_obj = datetime.strptime(fecha_str, '%d-%m-%Y')
            return fecha_obj.strftime('%Y-%m-%d')
        except Exception as e:
            logger.warning(f"No se pudo formatear la fecha '{fecha_str}': {str(e)}")
            return None
    
    def create_item(self, collection: str, data: Dict) -> Optional[Dict]:
        """Crea un nuevo ítem en la colección especificada."""
        url = f"{self.base_url}/items/{collection}"
        
        try:
            # Formatear la fecha si existe
            if 'Fecha' in data and data['Fecha']:
                fecha_formateada = self.format_fecha(data['Fecha'])
                if fecha_formateada:
                    data['Fecha'] = fecha_formateada
                else:
                    # Si no se puede formatear, eliminar el campo para evitar errores
                    del data['Fecha']
            
            response = self.session.post(url, json=data)
            response.raise_for_status()
            return response.json()['data']
        except Exception as e:
            logger.error(f"Error al crear ítem en {collection}: {str(e)}")
            if hasattr(e, 'response') and e.response is not None:
                logger.error(f"Respuesta del servidor: {e.response.text}")
            return None
    
    def update_item(self, collection: str, id: str, data: Dict) -> bool:
        """Actualiza un ítem existente."""
        url = f"{self.base_url}/items/{collection}/{id}"
        
        try:
            # Formatear la fecha si existe
            if 'Fecha' in data and data['Fecha']:
                fecha_formateada = self.format_fecha(data['Fecha'])
                if fecha_formateada:
                    data['Fecha'] = fecha_formateada
                else:
                    # Si no se puede formatear, eliminar el campo para evitar errores
                    del data['Fecha']
            
            response = self.session.patch(url, json=data)
            response.raise_for_status()
            return True
        except Exception as e:
            logger.error(f"Error al actualizar ítem {id} en {collection}: {str(e)}")
            if hasattr(e, 'response') and e.response is not None:
                logger.error(f"Respuesta del servidor: {e.response.text}")
            return False

def load_json_file(file_path: Path) -> Any:
    """Carga un archivo JSON."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Error al cargar el archivo {file_path}: {str(e)}")
        return None

def find_image_path(image_name: str) -> Optional[Path]:
    """Busca una imagen en el directorio de imágenes."""
    # Buscar con diferentes extensiones
    for ext in ['.png', '.jpg', '.jpeg']:
        image_path = IMAGES_DIR / f"{image_name}{ext}"
        if image_path.exists():
            return image_path
    
    # Si no se encuentra con extensión, buscar por nombre parcial
    for file_path in IMAGES_DIR.glob(f"*{image_name}*"):
        if file_path.is_file():
            return file_path
    
    return None

def main():
    logger.info("Iniciando proceso de carga de antecedentes...")
    
    # Cargar datos
    antecedentes = load_json_file(DATA_DIR / "antev3.json")
    if not antecedentes:
        logger.error("No se pudieron cargar los datos de antecedentes")
        return
    
    mapeo_imagenes = load_json_file(DATA_DIR / "datos_imagenes_para_directus_20250415_181330.json")
    if not mapeo_imagenes:
        logger.error("No se pudo cargar el mapeo de imágenes")
        return
    
    # Crear cliente de Directus
    client = DirectusClient(DIRECTUS_URL, TOKEN)
    
    # Crear un diccionario para mapear títulos a índices (para búsqueda más rápida)
    titulos_antecedentes = {item['Titulo'].lower(): idx for idx, item in enumerate(antecedentes)}
    
    # Procesar cada entrada del mapeo de imágenes
    for entrada in mapeo_imagenes:
        titulo_original = entrada.get('titulo_original', '')
        if not titulo_original:
            logger.warning("Entrada sin título, omitiendo...")
            continue
        
        # Buscar el antecedente correspondiente
        idx = titulos_antecedentes.get(titulo_original.lower())
        if idx is None:
            logger.warning(f"No se encontró el antecedente: {titulo_original}")
            continue
        
        antecedente = antecedentes[idx]
        
        # Obtener el nombre del archivo de imagen
        nombre_archivo = entrada.get('nombre_archivo_generado', '')
        if not nombre_archivo:
            logger.warning(f"No hay imagen para: {titulo_original}")
            continue
        
        # Extraer solo el nombre del archivo (sin la ruta)
        nombre_archivo = os.path.basename(nombre_archivo)
        
        # Buscar la imagen
        image_path = find_image_path(nombre_archivo.split('.')[0])
        if not image_path:
            logger.warning(f"No se encontró la imagen: {nombre_archivo}")
            continue
        
        logger.info(f"Procesando: {titulo_original}")
        logger.info(f"  - Imagen: {image_path.name}")
        
        # Subir la imagen a Directus
        file_data = client.upload_file(image_path)
        if not file_data:
            logger.error(f"No se pudo subir la imagen: {image_path.name}")
            continue
        
        logger.info(f"  - Imagen subida con ID: {file_data['id']}")
        
        # Actualizar el antecedente con la imagen
        update_data = {
            'Imagen': file_data['id']
        }
        
        # Si el antecedente ya tiene un ID, actualizarlo
        if 'id' in antecedente:
            if client.update_item(COLLECTION, antecedente['id'], update_data):
                logger.info(f"  - Antecedente actualizado exitosamente")
            else:
                logger.error("  - Error al actualizar el antecedente")
        else:
            # Si no tiene ID, crear un nuevo registro
            nuevo_antecedente = {**antecedente, **update_data}
            if client.create_item(COLLECTION, nuevo_antecedente):
                logger.info("  - Nuevo antecedente creado exitosamente")
            else:
                logger.error("  - Error al crear el antecedente")
    
    logger.info("Proceso de carga completado")

if __name__ == "__main__":
    main()
