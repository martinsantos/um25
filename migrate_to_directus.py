#!/usr/bin/env python3
"""
Script de migración completa para UMBot - Directus
Migra antecedentes desde antev3.json y configura permisos públicos
"""

import json
import requests
import logging
import time
from datetime import datetime
import urllib3
import os

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

class DirectusMigrator:
    def __init__(self, base_url="https://www.ultimamilla.com.ar", email="admin@ultimamilla.com.ar", password="UmbotHybridAdmin2025!"):
        self.base_url = base_url
        self.email = email
        self.password = password
        self.session = requests.Session()
        self.session.verify = False
        self.token = None
        
    def authenticate(self):
        """Autenticar con Directus"""
        try:
            response = self.session.post(
                f"{self.base_url}/auth/login",
                json={"email": self.email, "password": self.password},
                timeout=30
            )
            response.raise_for_status()
            self.token = response.json()['data']['access_token']
            self.session.headers.update({
                "Authorization": f"Bearer {self.token}",
                "Content-Type": "application/json"
            })
            logger.info("✅ Autenticación exitosa")
            return True
        except Exception as e:
            logger.error(f"❌ Error de autenticación: {e}")
            return False
    
    def configure_permissions(self):
        """Configurar permisos públicos para la colección antecedentes"""
        try:
            # Obtener rol público
            response = self.session.get(f"{self.base_url}/roles")
            response.raise_for_status()
            
            public_role = None
            for role in response.json()['data']:
                if role['name'] == 'Public':
                    public_role = role['id']
                    break
            
            if not public_role:
                logger.warning("⚠️ Rol público no encontrado, creando...")
                # Crear rol público si no existe
                public_response = self.session.post(
                    f"{self.base_url}/roles",
                    json={
                        "name": "Public",
                        "icon": "public",
                        "description": "Public access role"
                    }
                )
                public_response.raise_for_status()
                public_role = public_response.json()['data']['id']
                logger.info(f"✅ Rol público creado: {public_role}")
            
            # Configurar permisos de lectura para antecedentes
            permissions_data = {
                "role": public_role,
                "collection": "antecedentes",
                "action": "read",
                "permissions": {},
                "validation": {},
                "presets": {},
                "fields": ["*"]
            }
            
            # Verificar si ya existe permiso
            check_response = self.session.get(
                f"{self.base_url}/permissions?filter[collection][_eq]=antecedentes&filter[role][_eq]={public_role}&filter[action][_eq]=read"
            )
            
            if check_response.json()['data']:
                logger.info("✅ Permisos públicos ya configurados")
            else:
                perm_response = self.session.post(
                    f"{self.base_url}/permissions",
                    json=permissions_data
                )
                perm_response.raise_for_status()
                logger.info("✅ Permisos públicos configurados")
                
            return True
            
        except Exception as e:
            logger.error(f"❌ Error configurando permisos: {e}")
            return False
    
    def create_fields(self):
        """Crear campos necesarios en la colección antecedentes"""
        fields = [
            {
                "collection": "antecedentes",
                "field": "Titulo",
                "type": "string",
                "meta": {
                    "interface": "input",
                    "display": "raw",
                    "display_options": {},
                    "required": True,
                    "width": "full"
                }
            },
            {
                "collection": "antecedentes",
                "field": "Descripcion",
                "type": "text",
                "meta": {
                    "interface": "input-multiline",
                    "display": "raw",
                    "width": "full"
                }
            },
            {
                "collection": "antecedentes",
                "field": "Cliente",
                "type": "string",
                "meta": {
                    "interface": "input",
                    "display": "raw",
                    "width": "half"
                }
            },
            {
                "collection": "antecedentes",
                "field": "Area",
                "type": "string",
                "meta": {
                    "interface": "input",
                    "display": "raw",
                    "width": "half"
                }
            },
            {
                "collection": "antecedentes",
                "field": "Fecha",
                "type": "string",
                "meta": {
                    "interface": "input",
                    "display": "raw",
                    "width": "half"
                }
            },
            {
                "collection": "antecedentes",
                "field": "Unidad_de_negocio",
                "type": "string",
                "meta": {
                    "interface": "input",
                    "display": "raw",
                    "width": "half"
                }
            },
            {
                "collection": "antecedentes",
                "field": "Presupuesto",
                "type": "string",
                "meta": {
                    "interface": "input",
                    "display": "raw",
                    "width": "half"
                }
            }
        ]
        
        for field in fields:
            try:
                # Verificar si el campo ya existe
                check_response = self.session.get(
                    f"{self.base_url}/fields/antecedentes/{field['field']}"
                )
                
                if check_response.status_code == 200:
                    logger.info(f"✅ Campo {field['field']} ya existe")
                    continue
                    
                response = self.session.post(
                    f"{self.base_url}/fields/antecedentes",
                    json=field
                )
                
                if response.status_code in [200, 201]:
                    logger.info(f"✅ Campo creado: {field['field']}")
                else:
                    logger.warning(f"⚠️ Campo {field['field']}: {response.status_code}")
                    
            except Exception as e:
                logger.warning(f"⚠️ Error creando campo {field['field']}: {e}")
                
        return True
    
    def migrate_antecedentes(self, batch_size=20):
        """Migrar antecedentes desde antev3.json"""
        try:
            # Cargar datos desde archivo JSON
            with open('antev3.json', 'r', encoding='utf-8') as f:
                antecedentes = json.load(f)
            
            logger.info(f"🔄 Migrando {len(antecedentes)} antecedentes...")
            
            # Procesar en lotes
            for i in range(0, len(antecedentes), batch_size):
                batch = antecedentes[i:i+batch_size]
                
                try:
                    # Preparar datos para Directus
                    batch_data = []
                    for item in batch:
                        directus_item = {
                            "status": "published",
                            "Titulo": item.get("Titulo", ""),
                            "Descripcion": item.get("Descripcion", ""),
                            "Cliente": item.get("Cliente", ""),
                            "Area": item.get("Area", ""),
                            "Fecha": item.get("Fecha", ""),
                            "Unidad_de_negocio": item.get("Unidad_de_negocio", ""),
                            "Presupuesto": item.get("Presupuesto", "")
                        }
                        batch_data.append(directus_item)
                    
                    # Enviar lote a Directus
                    response = self.session.post(
                        f"{self.base_url}/items/antecedentes",
                        json=batch_data,
                        timeout=60
                    )
                    
                    if response.status_code in [200, 201]:
                        logger.info(f"✅ Lote {i//batch_size + 1}: {len(batch)} items migrados")
                    else:
                        logger.error(f"❌ Error lote {i//batch_size + 1}: {response.status_code} - {response.text}")
                        
                    time.sleep(1)  # Pausa entre lotes
                    
                except Exception as e:
                    logger.error(f"❌ Error en lote {i//batch_size + 1}: {e}")
                    continue
            
            logger.info("✅ Migración de antecedentes completada")
            return True
            
        except Exception as e:
            logger.error(f"❌ Error migrando antecedentes: {e}")
            return False
    
    def verify_migration(self):
        """Verificar que los datos se migraron correctamente"""
        try:
            response = self.session.get(f"{self.base_url}/items/antecedentes?limit=1")
            response.raise_for_status()
            
            count_response = self.session.get(f"{self.base_url}/items/antecedentes?aggregate[count]=*")
            count_response.raise_for_status()
            
            total = count_response.json()['data'][0]['count']
            logger.info(f"✅ Verificación: {total} antecedentes en Directus")
            
            return total > 0
            
        except Exception as e:
            logger.error(f"❌ Error verificando migración: {e}")
            return False

def main():
    """Función principal"""
    logger.info("🚀 Iniciando migración completa a Directus")
    
    migrator = DirectusMigrator()
    
    # Paso 1: Autenticación
    if not migrator.authenticate():
        logger.error("❌ Falló la autenticación. Deteniendo migración.")
        return False
    
    # Paso 2: Crear campos
    logger.info("🔧 Creando campos en colección antecedentes...")
    migrator.create_fields()
    
    # Paso 3: Configurar permisos
    logger.info("🔐 Configurando permisos públicos...")
    migrator.configure_permissions()
    
    # Paso 4: Migrar datos
    logger.info("📊 Migrando datos de antecedentes...")
    if migrator.migrate_antecedentes():
        # Paso 5: Verificar migración
        logger.info("✅ Verificando migración...")
        if migrator.verify_migration():
            logger.info("🎉 ¡MIGRACIÓN COMPLETADA EXITOSAMENTE!")
            return True
    
    logger.error("❌ MIGRACIÓN FALLÓ")
    return False

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1) 