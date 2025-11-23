#!/usr/bin/env python3
"""
Importador de imágenes a Directus y vinculación con antecedentes.
Usa el archivo datos_imagenes_para_directus_20250415_181330.json para mapear títulos a imágenes.
"""
import os
import sys
import json
import time
import requests
import urllib3
from pathlib import Path
from typing import Dict, Optional, Tuple

# Deshabilitar advertencias SSL
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# Configuración
DIRECTUS_URL = "https://www.umbot.com.ar:8056"
ADMIN_EMAIL = "admin@umbot.com.ar"
ADMIN_PASSWORD = "UmbotDirectusAdmin2025!"
IMAGES_DIR = Path("imagenes_antecedentes_versionproduccion")
MAPPING_FILE = Path("datos_imagenes_para_directus_20250415_181330.json")

def authenticate() -> str:
    """Obtiene un token de acceso de Directus."""
    print("🔑 Autenticando con Directus...")
    try:
        resp = requests.post(
            f"{DIRECTUS_URL}/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
            verify=False,
            timeout=30
        )
        resp.raise_for_status()
        data = resp.json()
        token = data.get("data", {}).get("access_token")
        if not token:
            raise RuntimeError("No se pudo obtener token de acceso")
        return token
    except Exception as e:
        print(f"❌ Error de autenticación: {e}")
        sys.exit(1)

def load_mapping() -> Dict[str, str]:
    """Carga el mapeo de títulos a nombres de archivo."""
    try:
        with open(MAPPING_FILE) as f:
            data = json.load(f)
            # Crear un diccionario que mapea títulos a nombres de archivo
            return {item["titulo_original"]: item["nombre_archivo_generado"].split("/")[-1] 
                   for item in data if "titulo_original" in item and "nombre_archivo_generado" in item}
    except Exception as e:
        print(f"❌ Error cargando archivo de mapeo: {e}")
        sys.exit(1)

def upload_image(filepath: Path, token: str) -> Optional[str]:
    """Sube una imagen y retorna su ID."""
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/json"
    }
    
    try:
        # Verificar que el archivo existe y obtener su tamaño
        if not filepath.exists():
            print(f"❌ El archivo no existe: {filepath}")
            return None
            
        file_size = filepath.stat().st_size
        print(f"📁 Tamaño del archivo: {file_size / 1024 / 1024:.2f} MB")
        
        # Leer el archivo
        with open(filepath, "rb") as f:
            # Crear el multipart form-data correctamente
            files = {
                "file": (
                    filepath.name,  # filename
                    f,              # file object
                    "image/png"     # content-type
                )
            }
            
            # Intentar la subida
            print(f"📤 Subiendo {filepath.name}...")
            resp = requests.post(
                f"{DIRECTUS_URL}/files",
                headers=headers,
                files=files,
                verify=False,
                timeout=120
            )
            
            # Procesar la respuesta
            if resp.status_code == 200:
                data = resp.json()
                file_id = data.get("data", {}).get("id")
                if file_id:
                    print(f"✅ {filepath.name} subido exitosamente (ID: {file_id})")
                    return file_id
                else:
                    print(f"❌ Error: Respuesta sin ID de archivo")
                    print(f"   Respuesta completa: {data}")
            else:
                print(f"❌ Error subiendo {filepath.name} (Status: {resp.status_code})")
                try:
                    error_data = resp.json()
                    print(f"   Detalle del error: {json.dumps(error_data, indent=2)}")
                except:
                    print(f"   Respuesta: {resp.text}")
            return None
                
    except Exception as e:
        print(f"❌ Error subiendo {filepath.name}: {str(e)}")
        return None

def get_antecedentes(token: str) -> list:
    """Obtiene todos los antecedentes de Directus."""
    headers = {"Authorization": f"Bearer {token}"}
    try:
        resp = requests.get(
            f"{DIRECTUS_URL}/items/antecedentes",
            headers=headers,
            verify=False,
            timeout=30
        )
        resp.raise_for_status()
        return resp.json()["data"]
    except Exception as e:
        print(f"❌ Error obteniendo antecedentes: {e}")
        sys.exit(1)

def update_antecedente(id: str, image_id: str, token: str) -> bool:
    """Actualiza el campo Imagen de un antecedente."""
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    try:
        resp = requests.patch(
            f"{DIRECTUS_URL}/items/antecedentes/{id}",
            headers=headers,
            json={"Imagen": image_id},
            verify=False,
            timeout=30
        )
        resp.raise_for_status()
        return True
    except Exception as e:
        print(f"❌ Error actualizando antecedente {id}: {e}")
        return False

def main():
    print("🚀 Iniciando proceso de importación de imágenes...")
    
    # Obtener token de acceso
    token = authenticate()
    
    # Cargar mapeo de títulos a imágenes
    print("📖 Cargando archivo de mapeo...")
    mapping = load_mapping()
    print(f"✅ {len(mapping)} mapeos cargados")
    
    # Obtener antecedentes
    print("\n📋 Obteniendo antecedentes de Directus...")
    antecedentes = get_antecedentes(token)
    print(f"✅ {len(antecedentes)} antecedentes encontrados")
    
    # Estadísticas
    stats = {
        "total": len(antecedentes),
        "imagenes_subidas": 0,
        "antecedentes_actualizados": 0,
        "errores": 0,
        "sin_imagen": 0
    }
    
    # Procesar cada antecedente
    print("\n🔄 Procesando antecedentes...")
    for antecedente in antecedentes:
        titulo = antecedente.get("Titulo", "")
        if not titulo:
            print(f"⚠️ Antecedente {antecedente['id']} sin título, omitiendo...")
            stats["sin_imagen"] += 1
            continue
            
        # Buscar imagen correspondiente
        if titulo not in mapping:
            print(f"⚠️ No se encontró imagen para: {titulo}")
            stats["sin_imagen"] += 1
            continue
            
        imagen_nombre = mapping[titulo]
        imagen_path = IMAGES_DIR / imagen_nombre
        
        if not imagen_path.exists():
            print(f"❌ No se encontró el archivo: {imagen_path}")
            stats["errores"] += 1
            continue
            
        # Subir imagen
        print(f"\n📤 Procesando: {titulo}")
        image_id = upload_image(imagen_path, token)
        if not image_id:
            stats["errores"] += 1
            continue
            
        stats["imagenes_subidas"] += 1
        
        # Actualizar antecedente
        if update_antecedente(antecedente["id"], image_id, token):
            stats["antecedentes_actualizados"] += 1
            print(f"✅ Antecedente actualizado con imagen: {image_id}")
        else:
            stats["errores"] += 1
    
    # Mostrar resumen
    print("\n📊 RESUMEN")
    print(f"Total antecedentes: {stats['total']}")
    print(f"✅ Imágenes subidas: {stats['imagenes_subidas']}")
    print(f"✅ Antecedentes actualizados: {stats['antecedentes_actualizados']}")
    print(f"⚠️ Sin imagen encontrada: {stats['sin_imagen']}")
    print(f"❌ Errores: {stats['errores']}")

if __name__ == "__main__":
    main() 