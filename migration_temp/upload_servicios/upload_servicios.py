#!/usr/bin/env python3
"""
Script para cargar imágenes y crear registros de Servicios en Directus.
"""

import os
import json
import requests
from pathlib import Path
from datetime import datetime
import logging
from typing import Dict, List, Optional, Any, Union
import re

# Configuración básica
BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BASE_DIR / "src" / "data"
IMAGES_DIR = BASE_DIR / "imagenes_antecedentes_versionproduccion"

# Configuración de Directus
DIRECTUS_URL = "http://www.umbot.com.ar:8055"
ADMIN_EMAIL = "admin@umbot.com.ar"
ADMIN_PASSWORD = "UmbotAdmin2025!"

# Configuración de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(BASE_DIR / 'upload_servicios.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class DirectusClient:
    """Cliente para interactuar con la API de Directus."""
    
    def __init__(self, base_url: str, email: str, password: str):
        self.base_url = base_url.rstrip('/')
        self.session = requests.Session()
        self.authenticate(email, password)
    
    def authenticate(self, email: str, password: str) -> None:
        """Autenticar con Directus y obtener token."""
        url = f"{self.base_url}/auth/login"
        try:
            response = self.session.post(url, json={
                "email": email,
                "password": password
            })
            response.raise_for_status()
            token = response.json()['data']['access_token']
            self.session.headers.update({
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            })
            logger.info("Autenticación exitosa con Directus")
        except requests.exceptions.RequestException as e:
            logger.error(f"Error en la autenticación: {str(e)}")
            if hasattr(e, 'response') and e.response is not None:
                logger.error(f"Respuesta del servidor: {e.response.text}")
            raise
    
    def upload_file(self, file_path: Path) -> Optional[Dict]:
        """Sube un archivo a Directus y devuelve los metadatos."""
        url = f"{self.base_url}/files"
        
        try:
            # Limpiar el nombre del archivo
            clean_name = re.sub(r'[^\w\-_\.]', '_', file_path.name)
            if clean_name.startswith('._'):
                clean_name = clean_name[2:]
            
            with open(file_path, 'rb') as f:
                files = {'file': (clean_name, f, 'image/png')}
                response = self.session.post(url, files=files)
                response.raise_for_status()
                return response.json()['data']
        except requests.exceptions.RequestException as e:
            logger.error(f"Error al subir archivo {file_path.name}: {str(e)}")
            if hasattr(e, 'response') and e.response is not None:
                logger.error(f"Respuesta del servidor: {e.response.text}")
            return None
    
    def create_item(self, collection: str, data: Dict) -> Optional[Dict]:
        """Crea un nuevo ítem en la colección especificada."""
        url = f"{self.base_url}/items/{collection}"
        
        try:
            response = self.session.post(url, json=data)
            response.raise_for_status()
            return response.json()['data']
        except requests.exceptions.RequestException as e:
            logger.error(f"Error al crear ítem en {collection}: {str(e)}")
            if hasattr(e, 'response') and e.response is not None:
                logger.error(f"Respuesta del servidor: {e.response.text}")
            return None

def load_json_file(file_path: Path) -> Optional[Union[Dict, List[Dict]]]:
    """Carga un archivo JSON."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Error al cargar el archivo {file_path}: {str(e)}")
        return None

def find_image_path(service_name: str) -> Optional[Path]:
    """Busca una imagen que coincida con el nombre del servicio."""
    # Limpiar el nombre del servicio para la búsqueda
    search_terms = service_name.lower().split()
    
    # Buscar en el directorio de imágenes
    for img_path in IMAGES_DIR.glob("*"):
        if img_path.suffix.lower() in ['.jpg', '.jpeg', '.png', '.gif', '.webp']:
            img_name = img_path.stem.lower()
            # Ignorar archivos que empiezan con ._
            if img_path.name.startswith('._'):
                continue
            if all(term in img_name for term in search_terms if len(term) > 3):  # Solo términos con más de 3 caracteres
                return img_path
    
    logger.warning(f"No se encontró imagen para el servicio: {service_name}")
    return None

def process_services(services_data: List[Dict], client: DirectusClient) -> None:
    """Procesa y carga los servicios en Directus."""
    # Saltar la primera fila si es el encabezado
    if services_data and 'A' in services_data[0] and services_data[0]['A'] == 'Antecedente':
        services_data = services_data[1:]
    
    for idx, servicio in enumerate(services_data, 1):
        if not servicio.get('D') or not servicio.get('B'):
            logger.warning(f"Servicio sin descripción o área en la fila {idx}, omitiendo...")
            continue
            
        # Preparar datos del servicio
        titulo = f"{servicio.get('B', '').strip()}: {servicio.get('C', '').strip()}"
        descripcion = servicio.get('D', '').strip()
        
        logger.info(f"Procesando servicio {idx}/{len(services_data)}: {titulo}")
        
        # Buscar imagen asociada
        imagen_id = None
        image_path = find_image_path(servicio.get('B', '').strip())
        
        if image_path:
            logger.info(f"  - Imagen encontrada: {image_path.name}")
            file_data = client.upload_file(image_path)
            if file_data:
                imagen_id = file_data['id']
                logger.info(f"  - Imagen subida con ID: {imagen_id}")
        
        # Crear el servicio en Directus
        servicio_data = {
            "Titulo": titulo,
            "Descripcion": descripcion,
            "status": "published"
        }
        
        if imagen_id:
            servicio_data["Imagen"] = imagen_id
        
        # Agregar campos adicionales si existen
        if 'E' in servicio and servicio['E']:
            servicio_data["Contacto"] = servicio['E']
        if 'F' in servicio and servicio['F']:
            servicio_data["Contacto_Responsable"] = servicio['F']
        if 'G' in servicio and servicio['G']:
            servicio_data["Monto"] = servicio['G']
        if 'I' in servicio and servicio['I']:
            servicio_data["Unidad_Negocio_ID"] = servicio['I']
        
        # Crear el servicio en Directus
        created_service = client.create_item("Servicios", servicio_data)
        
        if created_service:
            logger.info(f"  - Servicio creado exitosamente con ID: {created_service.get('id')}")
        else:
            logger.error(f"  - Error al crear el servicio: {titulo}")

def main():
    # Inicializar cliente de Directus
    client = DirectusClient(DIRECTUS_URL, ADMIN_EMAIL, ADMIN_PASSWORD)
    
    # Cargar datos de servicios
    servicios_file = DATA_DIR / "servicios.json"
    if not servicios_file.exists():
        logger.error(f"No se encontró el archivo de servicios: {servicios_file}")
        return
    
    logger.info(f"Cargando datos de servicios desde: {servicios_file}")
    servicios_data = load_json_file(servicios_file)
    
    if not servicios_data:
        logger.error("No se pudieron cargar los datos de servicios.")
        return
    
    if not isinstance(servicios_data, list):
        logger.error("Los datos de servicios deben ser una lista.")
        return
    
    # Procesar servicios
    logger.info(f"Iniciando carga de {len(servicios_data)} servicios...")
    process_services(servicios_data, client)
    
    logger.info("Proceso de carga de servicios completado.")

if __name__ == "__main__":
    main()
