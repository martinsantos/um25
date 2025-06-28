#!/usr/bin/env python3
"""
Robust data migration script for UMBot Directus
Handles both antecedentes and servicios with proper error handling and retries
"""

import os
import json
import requests
import logging
import time
from pathlib import Path
from typing import Dict, List, Optional, Union
from datetime import datetime
import urllib3

# Disable SSL warnings for self-signed certificates
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# Configuration
DIRECTUS_URL = "https://www.umbot.com.ar"
ADMIN_EMAIL = "admin@umbot.com.ar"
ADMIN_PASSWORD = "UmbotHybridAdmin2025!"
IMAGES_DIR = Path("imagenes_antecedentes_versionproduccion")
MAX_RETRIES = 3
BATCH_SIZE = 10
SLEEP_BETWEEN_BATCHES = 1

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('migration.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class DirectusClient:
    def __init__(self, base_url: str, email: str, password: str):
        self.base_url = base_url.rstrip('/')
        self.session = requests.Session()
        self.session.verify = False  # For self-signed certificates
        self.authenticate(email, password)
        
    def authenticate(self, email: str, password: str) -> None:
        """Authenticate with Directus and get access token"""
        for attempt in range(MAX_RETRIES):
            try:
                response = self.session.post(
                    f"{self.base_url}/auth/login",
                    json={
                        "email": email,
                        "password": password
                    },
                    timeout=30
                )
                response.raise_for_status()
                token = response.json()['data']['access_token']
                self.session.headers.update({
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json"
                })
                logger.info("Successfully authenticated with Directus")
                return
            except Exception as e:
                if attempt == MAX_RETRIES - 1:
                    logger.error(f"Failed to authenticate after {MAX_RETRIES} attempts: {e}")
                    raise
                logger.warning(f"Authentication attempt {attempt + 1} failed: {e}")
                time.sleep(2 ** attempt)  # Exponential backoff
    
    def upload_file(self, file_path: Path) -> Optional[str]:
        """Upload a file to Directus and return its ID"""
        if not file_path.exists():
            logger.error(f"File not found: {file_path}")
            return None
            
        for attempt in range(MAX_RETRIES):
            try:
                # Check if file already exists
                filename = file_path.name
                response = self.session.get(
                    f"{self.base_url}/files",
                    params={"filter[filename_download][_eq]": filename}
                )
                response.raise_for_status()
                
                existing_files = response.json().get('data', [])
                if existing_files:
                    file_id = existing_files[0]['id']
                    logger.info(f"File {filename} already exists with ID: {file_id}")
                    return file_id
                
                # Upload new file
                with open(file_path, 'rb') as f:
                    files = {
                        'file': (filename, f, 'image/jpeg' if filename.lower().endswith('.jpg') else 'image/png')
                    }
                    response = self.session.post(
                        f"{self.base_url}/files",
                        files=files
                    )
                    response.raise_for_status()
                    file_id = response.json()['data']['id']
                    logger.info(f"Successfully uploaded {filename} with ID: {file_id}")
                    return file_id
                    
            except Exception as e:
                if attempt == MAX_RETRIES - 1:
                    logger.error(f"Failed to upload {file_path.name} after {MAX_RETRIES} attempts: {e}")
                    return None
                logger.warning(f"Upload attempt {attempt + 1} failed for {file_path.name}: {e}")
                time.sleep(2 ** attempt)
    
    def create_item(self, collection: str, data: Dict) -> Optional[Dict]:
        """Create an item in a collection"""
        for attempt in range(MAX_RETRIES):
            try:
                response = self.session.post(
                    f"{self.base_url}/items/{collection}",
                    json=data
                )
                response.raise_for_status()
                item = response.json()['data']
                logger.info(f"Created {collection} item with ID: {item['id']}")
                return item
            except Exception as e:
                if attempt == MAX_RETRIES - 1:
                    logger.error(f"Failed to create {collection} item after {MAX_RETRIES} attempts: {e}")
                    return None
                logger.warning(f"Create attempt {attempt + 1} failed for {collection}: {e}")
                time.sleep(2 ** attempt)

def load_json_data(file_path: str) -> List[Dict]:
    """Load and validate JSON data"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            # Handle JS export format
            if content.startswith('export const'):
                content = content.split('=', 1)[1].strip().rstrip(';')
            data = json.loads(content)
            if not isinstance(data, list):
                raise ValueError("Data must be a list of objects")
            return data
    except Exception as e:
        logger.error(f"Failed to load JSON data from {file_path}: {e}")
        raise

def migrate_antecedentes(client: DirectusClient, data: List[Dict]) -> Dict[str, str]:
    """Migrate antecedentes and return ID mapping"""
    logger.info(f"Starting migration of {len(data)} antecedentes")
    id_mapping = {}
    
    for i in range(0, len(data), BATCH_SIZE):
        batch = data[i:i+BATCH_SIZE]
        logger.info(f"Processing batch {i//BATCH_SIZE + 1} of {len(data)//BATCH_SIZE + 1}")
        
        for item in batch:
            try:
                # Handle image first
                image_id = None
                if item.get('Imagen'):
                    image_path = IMAGES_DIR / item['Imagen']
                    image_id = client.upload_file(image_path)
                
                # Prepare antecedente data
                antecedente_data = {
                    'Titulo': item.get('Titulo', 'Sin título'),
                    'Descripcion': item.get('Descripcion'),
                    'Cliente': item.get('Cliente'),
                    'Area': item.get('Area'),
                    'Fecha': item.get('Fecha'),
                    'Unidad_de_negocio': item.get('Unidad_de_negocio'),
                    'Presupuesto': item.get('Presupuesto'),
                    'Imagen': image_id
                }
                
                # Create antecedente
                result = client.create_item('antecedentes', antecedente_data)
                if result:
                    id_mapping[item['id']] = result['id']
                    
            except Exception as e:
                logger.error(f"Failed to process antecedente {item.get('Titulo')}: {e}")
                
        time.sleep(SLEEP_BETWEEN_BATCHES)
    
    logger.info(f"Completed antecedentes migration. Successful: {len(id_mapping)}, Failed: {len(data) - len(id_mapping)}")
    return id_mapping

def migrate_servicios(client: DirectusClient, data: List[Dict], antecedentes_mapping: Dict[str, str]) -> None:
    """Migrate servicios using antecedentes mapping"""
    logger.info(f"Starting migration of {len(data)} servicios")
    successful = 0
    
    for i in range(0, len(data), BATCH_SIZE):
        batch = data[i:i+BATCH_SIZE]
        logger.info(f"Processing batch {i//BATCH_SIZE + 1} of {len(data)//BATCH_SIZE + 1}")
        
        for item in batch:
            try:
                # Handle image first
                image_id = None
                if item.get('Imagen'):
                    image_path = IMAGES_DIR / item['Imagen']
                    image_id = client.upload_file(image_path)
                
                # Map antecedente ID
                antecedente_id = None
                if item.get('Antecedente'):
                    antecedente_id = antecedentes_mapping.get(item['Antecedente'])
                
                # Prepare servicio data
                servicio_data = {
                    'Titulo': item.get('Titulo', 'Sin título'),
                    'Descripcion': item.get('Descripcion'),
                    'Cliente': item.get('Cliente'),
                    'Area': item.get('Area'),
                    'Fecha': item.get('Fecha'),
                    'Unidad_de_negocio': item.get('Unidad_de_negocio'),
                    'Presupuesto': item.get('Presupuesto'),
                    'Imagen': image_id,
                    'Antecedente': antecedente_id
                }
                
                # Create servicio
                if client.create_item('servicios', servicio_data):
                    successful += 1
                    
            except Exception as e:
                logger.error(f"Failed to process servicio {item.get('Titulo')}: {e}")
                
        time.sleep(SLEEP_BETWEEN_BATCHES)
    
    logger.info(f"Completed servicios migration. Successful: {successful}, Failed: {len(data) - successful}")

def main():
    try:
        # Initialize Directus client
        client = DirectusClient(DIRECTUS_URL, ADMIN_EMAIL, ADMIN_PASSWORD)
        
        # Load antecedentes data
        logger.info("Loading antecedentes data...")
        antecedentes_data = load_json_data('src/data/antecedentes_completos.js')
        
        # Migrate antecedentes and get ID mapping
        antecedentes_mapping = migrate_antecedentes(client, antecedentes_data)
        
        # Load servicios data
        logger.info("Loading servicios data...")
        servicios_data = load_json_data('src/data/servicios_completos.js')
        
        # Migrate servicios
        migrate_servicios(client, servicios_data, antecedentes_mapping)
        
        logger.info("Migration completed successfully")
        
    except Exception as e:
        logger.error(f"Migration failed: {e}")
        raise

if __name__ == "__main__":
    main() 