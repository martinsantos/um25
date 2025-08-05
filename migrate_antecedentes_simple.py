#!/usr/bin/env python3
import json
import requests
import logging
import time

# Configuración de logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def migrate_antecedentes():
    """Migrar antecedentes usando token estático"""
    base_url = "http://localhost:8055"
    token = "k6P8LAY8_x_y1miB_KTlWnysCnx2Abky"
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    try:
        # Cargar datos de antecedentes
        with open('antev3.json', 'r', encoding='utf-8') as f:
            antecedentes = json.load(f)
        
        logger.info(f"Cargados {len(antecedentes)} antecedentes para migrar")
        
        # Verificar conexión con Directus
        response = requests.get(f"{base_url}/items/Antecedentes", headers=headers)
        if response.status_code != 200:
            logger.error(f"Error al conectar con Directus: {response.status_code}")
            return
        
        logger.info("Conexión con Directus exitosa")
        
        # Migrar cada antecedente
        migrated = 0
        for idx, antecedente in enumerate(antecedentes, 1):
            try:
                # Preparar datos para Directus
                item_data = {
                    "status": "published",
                    "Titulo": antecedente.get('Titulo', ''),
                    "Descripcion": antecedente.get('Descripcion', ''),
                    "Cliente": antecedente.get('Cliente', ''),
                    "Area": antecedente.get('Area', ''),
                    "Fecha": antecedente.get('Fecha', None),
                    "Unidad_de_negocio": antecedente.get('Unidad_de_negocio', ''),
                    "Presupuesto": antecedente.get('Presupuesto', ''),
                    "Presupuesto_original": antecedente.get('Presupuesto_original', ''),
                    "Palabras_clave": antecedente.get('Palabras_clave', '')
                }
                
                # Crear antecedente en Directus
                response = requests.post(
                    f"{base_url}/items/Antecedentes",
                    headers=headers,
                    json=item_data
                )
                
                if response.status_code in [200, 201]:
                    migrated += 1
                    if migrated % 50 == 0:  # Log cada 50 items
                        logger.info(f"Migrados {migrated}/{len(antecedentes)} antecedentes")
                else:
                    logger.warning(f"Error al crear antecedente {idx}: {response.status_code} - {response.text}")
                
                # Pausa pequeña para no sobrecargar
                time.sleep(0.1)
                
            except Exception as e:
                logger.error(f"Error al procesar antecedente {idx}: {e}")
                continue
        
        logger.info(f"Migración completada: {migrated}/{len(antecedentes)} antecedentes migrados")
        
    except Exception as e:
        logger.error(f"Error en la migración: {e}")
        raise

if __name__ == "__main__":
    migrate_antecedentes()
