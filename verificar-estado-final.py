#!/usr/bin/env python3
"""
Script de verificación completa del estado final del sistema
Verifica Directus, antecedentes, servicios e imágenes
"""
import requests
import urllib3
import json
import sys
from typing import Dict, List

# Deshabilitar advertencias SSL
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# Configuración
DIRECTUS_URL = "https://www.ultimamilla.com.ar:8056"
ADMIN_EMAIL = "admin@ultimamilla.com.ar"
ADMIN_PASSWORD = "UmbotDirectusAdmin2025!"

def authenticate() -> str:
    """Obtiene un token de acceso de Directus."""
    try:
        resp = requests.post(
            f"{DIRECTUS_URL}/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
            verify=False,
            timeout=30
        )
        if resp.status_code == 200:
            return resp.json()["data"]["access_token"]
        else:
            print(f"❌ Error de autenticación: {resp.status_code}")
            return None
    except Exception as e:
        print(f"❌ Error de conexión: {e}")
        return None

def check_directus_health():
    """Verifica la salud del servidor Directus."""
    print("🏥 Verificando salud de Directus...")
    try:
        resp = requests.get(f"{DIRECTUS_URL}/server/ping", verify=False, timeout=10)
        if resp.status_code == 200 and resp.text.strip() == "pong":
            print("✅ Directus está funcionando correctamente")
            return True
        else:
            print(f"❌ Directus no responde correctamente: {resp.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error conectando a Directus: {e}")
        return False

def get_collection_stats(token: str, collection: str) -> Dict:
    """Obtiene estadísticas de una colección."""
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        # Contar total de items
        resp = requests.get(
            f"{DIRECTUS_URL}/items/{collection}",
            headers=headers,
            params={"aggregate": {"count": "*"}},
            verify=False,
            timeout=30
        )
        
        if resp.status_code == 200:
            total = resp.json()["data"][0]["count"]
            
            # Si es antecedentes, contar cuántos tienen imagen
            with_image = 0
            if collection == "antecedentes":
                resp_img = requests.get(
                    f"{DIRECTUS_URL}/items/{collection}",
                    headers=headers,
                    params={
                        "filter": {"Imagen": {"_nnull": True}},
                        "aggregate": {"count": "*"}
                    },
                    verify=False,
                    timeout=30
                )
                if resp_img.status_code == 200:
                    with_image = resp_img.json()["data"][0]["count"]
            
            return {
                "total": total,
                "with_image": with_image,
                "success": True
            }
        else:
            return {"success": False, "error": resp.status_code}
            
    except Exception as e:
        return {"success": False, "error": str(e)}

def get_files_stats(token: str) -> Dict:
    """Obtiene estadísticas de archivos subidos."""
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        resp = requests.get(
            f"{DIRECTUS_URL}/files",
            headers=headers,
            params={"aggregate": {"count": "*"}},
            verify=False,
            timeout=30
        )
        
        if resp.status_code == 200:
            total_files = resp.json()["data"][0]["count"]
            
            # Contar archivos PNG (nuestras imágenes)
            resp_png = requests.get(
                f"{DIRECTUS_URL}/files",
                headers=headers,
                params={
                    "filter": {"type": {"_eq": "image/png"}},
                    "aggregate": {"count": "*"}
                },
                verify=False,
                timeout=30
            )
            
            png_files = 0
            if resp_png.status_code == 200:
                png_files = resp_png.json()["data"][0]["count"]
            
            return {
                "total_files": total_files,
                "png_files": png_files,
                "success": True
            }
        else:
            return {"success": False, "error": resp.status_code}
            
    except Exception as e:
        return {"success": False, "error": str(e)}

def main():
    print("🔍 VERIFICACIÓN COMPLETA DEL SISTEMA")
    print("=" * 50)
    
    # 1. Verificar salud de Directus
    if not check_directus_health():
        print("💀 Sistema no funcional")
        sys.exit(1)
    
    # 2. Autenticar
    print("\n🔑 Autenticando...")
    token = authenticate()
    if not token:
        print("💀 No se pudo autenticar")
        sys.exit(1)
    print("✅ Autenticación exitosa")
    
    # 3. Verificar antecedentes
    print("\n📋 Verificando antecedentes...")
    ante_stats = get_collection_stats(token, "antecedentes")
    if ante_stats["success"]:
        print(f"✅ Total antecedentes: {ante_stats['total']}")
        print(f"✅ Con imagen: {ante_stats['with_image']}")
        print(f"⚠️ Sin imagen: {ante_stats['total'] - ante_stats['with_image']}")
        coverage = (ante_stats['with_image'] / ante_stats['total']) * 100 if ante_stats['total'] > 0 else 0
        print(f"📊 Cobertura de imágenes: {coverage:.1f}%")
    else:
        print(f"❌ Error obteniendo antecedentes: {ante_stats['error']}")
    
    # 4. Verificar servicios
    print("\n🛠️ Verificando servicios...")
    serv_stats = get_collection_stats(token, "servicios")
    if serv_stats["success"]:
        print(f"✅ Total servicios: {serv_stats['total']}")
    else:
        print(f"❌ Error obteniendo servicios: {serv_stats['error']}")
    
    # 5. Verificar archivos
    print("\n📁 Verificando archivos...")
    file_stats = get_files_stats(token)
    if file_stats["success"]:
        print(f"✅ Total archivos: {file_stats['total_files']}")
        print(f"✅ Imágenes PNG: {file_stats['png_files']}")
    else:
        print(f"❌ Error obteniendo archivos: {file_stats['error']}")
    
    # 6. Resumen final
    print("\n" + "=" * 50)
    print("📊 RESUMEN FINAL")
    print("=" * 50)
    
    if ante_stats["success"] and serv_stats["success"] and file_stats["success"]:
        print(f"🎯 Contenido total importado:")
        print(f"   • {ante_stats['total']} antecedentes")
        print(f"   • {serv_stats['total']} servicios")
        print(f"   • {file_stats['png_files']} imágenes PNG")
        
        print(f"\n📈 Estado de imágenes:")
        print(f"   • {ante_stats['with_image']} antecedentes con imagen ({coverage:.1f}%)")
        print(f"   • {ante_stats['total'] - ante_stats['with_image']} antecedentes sin imagen")
        
        if ante_stats['with_image'] >= 96:  # Esperamos al menos 96 con las imágenes que ya subimos
            print("\n🎉 ¡IMPORTACIÓN EXITOSA!")
            print("✅ El sistema está listo para producción")
        else:
            print("\n⚠️ Importación parcial")
            print("🔧 Quedan imágenes por subir")
            
        print(f"\n🌐 URLs del sistema:")
        print(f"   • Directus Admin: https://www.ultimamilla.com.ar:8056/admin")
        print(f"   • API Directus: https://www.ultimamilla.com.ar:8056")
        print(f"   • Sitio web: https://www.ultimamilla.com.ar")
    else:
        print("❌ Hay errores en el sistema")
        print("🔧 Revisa los mensajes de error arriba")

if __name__ == "__main__":
    main() 