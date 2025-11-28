#!/usr/bin/env python3
import os
import json
import requests
import logging
from pathlib import Path
from typing import Dict, List, Optional
import time
import urllib3

# Deshabilitar advertencias SSL
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# Configuración de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('migration.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class DirectusMigration:
    def __init__(self):
        self.base_url = "http://localhost:8055"
        self.session = requests.Session()
        self.session.verify = False
        self.token = None
        self.images_dir = Path("imagenes_antecedentes_versionproduccion")

    def authenticate(self) -> None:
        """Autenticar con Directus"""
        try:
            response = self.session.post(
                f"{self.base_url}/auth/login",
                json={
                    "email": "admin@umbot.com.ar",
                    "password": "UmbotHybridAdmin2025!"
                }
            )
            response.raise_for_status()
            self.token = response.json()['data']['access_token']
            self.session.headers.update({
                "Authorization": f"Bearer {self.token}"
            })
            logger.info("Autenticación exitosa")
        except Exception as e:
            logger.error(f"Error en autenticación: {e}")
            raise

    def create_collection(self) -> None:
        """Crear colección de antecedentes"""
        try:
            collection_data = {
                "collection": "antecedentes",
                "meta": {
                    "collection": "antecedentes",
                    "icon": "article",
                    "note": "Antecedentes de proyectos",
                    "display_template": "{{Titulo}}",
                    "archive_field": "status",
                    "archive_value": "archived",
                    "unarchive_value": "draft",
                    "singleton": False,
                    "sort_field": "sort"
                },
                "schema": {
                    "name": "antecedentes",
                    "sql": """CREATE TABLE "antecedentes" (
                        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
                        "status" varchar(255) DEFAULT 'published',
                        "sort" integer,
                        "date_created" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
                        "date_updated" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
                        "Titulo" varchar(255) NOT NULL,
                        "Descripcion" text,
                        "Cliente" varchar(255),
                        "Area" varchar(255),
                        "Fecha" date,
                        "Unidad_de_negocio" varchar(255),
                        "Imagen" uuid REFERENCES directus_files(id) ON DELETE SET NULL
                    );"""
                }
            }
            response = self.session.post(
                f"{self.base_url}/collections",
                json=collection_data
            )
            response.raise_for_status()
            logger.info("Colección creada exitosamente")
        except requests.exceptions.HTTPError as e:
            if e.response.status_code == 400 and "collection already exists" in e.response.text.lower():
                logger.info("La colección ya existe")
            else:
                logger.error(f"Error al crear colección: {e}")
                raise
        except Exception as e:
            logger.error(f"Error inesperado al crear colección: {e}")
            raise

    def upload_image(self, image_path: Path) -> Optional[str]:
        """Subir una imagen a Directus"""
        try:
            if not image_path.exists():
                logger.warning(f"Imagen no encontrada: {image_path}")
                return None

            with open(image_path, 'rb') as image_file:
                files = {
                    'file': (image_path.name, image_file, 'image/png')
                }
                response = self.session.post(
                    f"{self.base_url}/files",
                    files=files
                )
                response.raise_for_status()
                return response.json()['data']['id']
        except Exception as e:
            logger.error(f"Error al subir imagen {image_path}: {e}")
            return None

    def migrate_antecedentes(self, data_file: str) -> None:
        """Migrar antecedentes desde archivo JSON"""
        try:
            with open(data_file, 'r', encoding='utf-8') as f:
                antecedentes = json.load(f)

            total = len(antecedentes)
            for idx, antecedente in enumerate(antecedentes, 1):
                try:
                    # Procesar imagen
                    imagen_id = None
                    if 'Imagen' in antecedente and antecedente['Imagen']:
                        imagen_path = self.images_dir / antecedente['Imagen']
                        imagen_id = self.upload_image(imagen_path)

                    # Preparar datos
                    item_data = {
                        "Titulo": antecedente.get('Titulo', ''),
                        "Descripcion": antecedente.get('Descripcion', ''),
                        "Cliente": antecedente.get('Cliente', ''),
                        "Area": antecedente.get('Area', ''),
                        "Fecha": antecedente.get('Fecha', None),
                        "Unidad_de_negocio": antecedente.get('Unidad_de_negocio', ''),
                        "Imagen": imagen_id,
                        "status": "published"
                    }

                    # Crear antecedente
                    response = self.session.post(
                        f"{self.base_url}/items/antecedentes",
                        json=item_data
                    )
                    response.raise_for_status()
                    logger.info(f"Migrado antecedente {idx}/{total}: {item_data['Titulo']}")

                    # Esperar un poco entre cada item para no sobrecargar el servidor
                    time.sleep(0.5)

                except Exception as e:
                    logger.error(f"Error al migrar antecedente {idx}: {e}")
                    continue

        except Exception as e:
            logger.error(f"Error en la migración: {e}")
            raise

def main():
    try:
        migration = DirectusMigration()
        migration.authenticate()
        migration.create_collection()
        migration.migrate_antecedentes('antev3.json')
        logger.info("Migración completada exitosamente")
    except Exception as e:
        logger.error(f"Error en el proceso de migración: {e}")
        raise

if __name__ == "__main__":
    main() 