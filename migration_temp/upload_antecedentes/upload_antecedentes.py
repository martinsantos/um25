#!/usr/bin/env python3
"""
Script para cargar imágenes y crear registros de Antecedentes en Directus.
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
DATA_DIR = BASE_DIR / "migration_data"
IMAGES_DIR = BASE_DIR / "imagenes_antecedentes_versionproduccion"

# Configuración de Directus
DIRECTUS_URL = "https://ultimamilla.com.ar"
ADMIN_EMAIL = "admin@example.com"
ADMIN_PASSWORD = "d1r3ctu5"

# Configuración de logging
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

def find_image_path(antecedente_id: str) -> Optional[Path]:
    """Busca una imagen que coincida con el ID del antecedente."""
    # Buscar en el directorio de imágenes
    for img_path in IMAGES_DIR.glob("*"):
        if img_path.suffix.lower() in ['.jpg', '.jpeg', '.png', '.gif', '.webp']:
            # Ignorar archivos que empiezan con ._
            if img_path.name.startswith('._'):
                continue
            if antecedente_id in img_path.stem:
                return img_path
    
    logger.warning(f"No se encontró imagen para el antecedente: {antecedente_id}")
    return None

def process_antecedentes(antecedentes_data: List[Dict], client: DirectusClient) -> None:
    """Procesa y carga los antecedentes en Directus."""
    # Saltar la primera fila si es el encabezado
    if antecedentes_data and 'A' in antecedentes_data[0] and antecedentes_data[0]['A'] == 'Antecedente':
        antecedentes_data = antecedentes_data[1:]
    
    for idx, antecedente in enumerate(antecedentes_data, 1):
        if not antecedente.get('A'):
            logger.warning(f"Antecedente sin ID en la fila {idx}, omitiendo...")
            continue
            
        # Preparar datos del antecedente
        antecedente_id = str(antecedente.get('A', '')).strip()
        titulo = antecedente.get('B', '').strip()
        descripcion = antecedente.get('C', '').strip()
        
        logger.info(f"Procesando antecedente {idx}/{len(antecedentes_data)}: {antecedente_id} - {titulo}")
        
        # Buscar imagen asociada
        imagen_id = None
        image_path = find_image_path(antecedente_id)
        
        if image_path:
            logger.info(f"  - Imagen encontrada: {image_path.name}")
            file_data = client.upload_file(image_path)
            if file_data:
                imagen_id = file_data['id']
                logger.info(f"  - Imagen subida con ID: {imagen_id}")
        
        # Crear el antecedente en Directus
        antecedente_data = {
            "Antecedente_ID": antecedente_id,
            "Titulo": titulo,
            "Descripcion": descripcion,
            "status": "published"
        }
        
        if imagen_id:
            antecedente_data["Imagen"] = imagen_id
        
        # Agregar campos adicionales si existen
        if 'D' in antecedente and antecedente['D']:
            antecedente_data["Fecha"] = antecedente['D']
        if 'E' in antecedente and antecedente['E']:
            antecedente_data["Unidad_Negocio"] = antecedente['E']
        if 'F' in antecedente and antecedente['F']:
            antecedente_data["Monto"] = antecedente['F']
        
        # Crear el antecedente en Directus
        created_antecedente = client.create_item("Antecedentes", antecedente_data)
        
        if created_antecedente:
            logger.info(f"  - Antecedente creado exitosamente con ID: {created_antecedente.get('id')}")
        else:
            logger.error(f"  - Error al crear el antecedente: {antecedente_id}")

def main():
    # Inicializar cliente de Directus
    client = DirectusClient(DIRECTUS_URL, ADMIN_EMAIL, ADMIN_PASSWORD)
    
    # Cargar datos de antecedentes
    antecedentes_file = DATA_DIR / "antev3.json"
    if not antecedentes_file.exists():
        logger.error(f"No se encontró el archivo de antecedentes: {antecedentes_file}")
        return
    
    logger.info(f"Cargando datos de antecedentes desde: {antecedentes_file}")
    antecedentes_data = load_json_file(antecedentes_file)
    
    if not antecedentes_data:
        logger.error("No se pudieron cargar los datos de antecedentes.")
        return
    
    if not isinstance(antecedentes_data, list):
        logger.error("Los datos de antecedentes deben ser una lista.")
        return
    
    # Procesar antecedentes
    logger.info(f"Iniciando carga de {len(antecedentes_data)} antecedentes...")
    process_antecedentes(antecedentes_data, client)
    
    logger.info("Proceso de carga de antecedentes completado.")

if __name__ == "__main__":
    main()
