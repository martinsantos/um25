#!/usr/bin/env python3
"""
Script para subir solo las 3 imágenes que fallaron con error 413
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
DIRECTUS_URL = "https://www.ultimamilla.com.ar:8056"
ADMIN_EMAIL = "admin@ultimamilla.com.ar"
ADMIN_PASSWORD = "UmbotDirectusAdmin2025!"
IMAGES_DIR = Path("imagenes_antecedentes_versionproduccion")

# Solo las 3 imágenes que fallaron
FAILED_IMAGES = [
    "ultimamilla_vinoteca_ligier_-_software_a_medida_20250415_203621_s2659346857.png",
    "ultimamilla_inspección_montecaseros_-_software_a_medida_20250415_210439_s1986713597.png",
    "ultimamilla_bodega_domaine_bousquet_-_software_a_medida_20250415_214834_s2822889194.png"
]

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
        if resp.status_code == 200:
            token = resp.json()["data"]["access_token"]
            print("✅ Autenticación exitosa")
            return token
        else:
            print(f"❌ Error de autenticación: {resp.status_code}")
            sys.exit(1)
    except Exception as e:
        print(f"❌ Error de conexión: {e}")
        sys.exit(1)

def upload_image(filepath: Path, token: str) -> Optional[str]:
    """Sube una imagen y retorna su ID."""
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/json"
    }
    
    try:
        if not filepath.exists():
            print(f"❌ El archivo no existe: {filepath}")
            return None
            
        file_size = filepath.stat().st_size
        print(f"📁 Tamaño del archivo: {file_size / 1024 / 1024:.2f} MB")
        
        with open(filepath, "rb") as f:
            files = {
                "file": (
                    filepath.name,
                    f,
                    "image/png"
                )
            }
            
            print(f"📤 Subiendo {filepath.name}...")
            resp = requests.post(
                f"{DIRECTUS_URL}/files",
                headers=headers,
                files=files,
                verify=False,
                timeout=120
            )
            
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

def main():
    print("🚀 Subiendo las 3 imágenes restantes...")
    
    # Autenticar
    token = authenticate()
    
    # Subir cada imagen
    for img_name in FAILED_IMAGES:
        img_path = IMAGES_DIR / img_name
        if img_path.exists():
            print(f"\n📤 Procesando: {img_name}")
            file_id = upload_image(img_path, token)
            if file_id:
                print(f"✅ Imagen subida exitosamente: {file_id}")
            else:
                print(f"❌ Falló la subida de: {img_name}")
            time.sleep(1)  # Pausa entre subidas
        else:
            print(f"❌ No se encontró el archivo: {img_name}")
    
    print("\n🎉 Proceso completado!")

if __name__ == "__main__":
    main()
