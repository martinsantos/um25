#!/usr/bin/env python3
"""
Script de verificación simple del estado del sistema
Verifica Directus, antecedentes, servicios e imágenes sin usar agregaciones
"""
import requests
import urllib3
import json
import sys

# Deshabilitar advertencias SSL
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# Configuración
DIRECTUS_URL = "https://www.umbot.com.ar:8056"
ADMIN_EMAIL = "admin@umbot.com.ar"
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

def get_simple_stats(token: str, collection: str, limit: int = 5):
    """Obtiene estadísticas simples de una colección."""
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        # Obtener algunos items para verificar
        resp = requests.get(
            f"{DIRECTUS_URL}/items/{collection}",
            headers=headers,
            params={"limit": limit},
            verify=False,
            timeout=30
        )
        
        if resp.status_code == 200:
            data = resp.json()["data"]
            print(f"✅ {collection.title()}: {len(data)} items encontrados (mostrando primeros {limit})")
            
            # Si es antecedentes, mostrar cuántos tienen imagen
            if collection == "antecedentes" and data:
                with_image = sum(1 for item in data if item.get("Imagen"))
                print(f"   - Con imagen: {with_image}/{len(data)}")
                
                # Mostrar algunos títulos como ejemplo
                print("   Ejemplos:")
                for i, item in enumerate(data[:3]):
                    titulo = item.get("titulo", "Sin título")[:50]
                    imagen_status = "🖼️" if item.get("Imagen") else "❌"
                    print(f"     {i+1}. {titulo}... {imagen_status}")
            
            return True
        else:
            print(f"❌ Error obteniendo {collection}: {resp.status_code}")
            try:
                error_data = resp.json()
                print(f"   Detalle: {error_data}")
            except:
                print(f"   Respuesta: {resp.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error obteniendo {collection}: {str(e)}")
        return False

def get_files_stats(token: str):
    """Obtiene estadísticas de archivos."""
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        resp = requests.get(
            f"{DIRECTUS_URL}/files",
            headers=headers,
            params={"limit": 10},
            verify=False,
            timeout=30
        )
        
        if resp.status_code == 200:
            files = resp.json()["data"]
            print(f"✅ Archivos: {len(files)} encontrados (mostrando primeros 10)")
            
            # Contar tipos de archivo
            png_count = sum(1 for f in files if f.get("type") == "image/png")
            print(f"   - Imágenes PNG: {png_count}")
            
            # Mostrar algunos ejemplos
            print("   Ejemplos:")
            for i, file_info in enumerate(files[:3]):
                filename = file_info.get("filename_download", "Sin nombre")
                file_type = file_info.get("type", "unknown")
                print(f"     {i+1}. {filename} ({file_type})")
            
            return True
        else:
            print(f"❌ Error obteniendo archivos: {resp.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Error obteniendo archivos: {str(e)}")
        return False

def main():
    print("🔍 VERIFICACIÓN SIMPLE DEL SISTEMA")
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
    ante_ok = get_simple_stats(token, "antecedentes", 100)  # Obtener más para mejor estadística
    
    # 4. Verificar servicios
    print("\n🛠️ Verificando servicios...")
    serv_ok = get_simple_stats(token, "servicios", 10)
    
    # 5. Verificar archivos
    print("\n📁 Verificando archivos...")
    files_ok = get_files_stats(token)
    
    # 6. Resumen final
    print("\n" + "=" * 50)
    print("📊 RESUMEN FINAL")
    print("=" * 50)
    
    if ante_ok and serv_ok and files_ok:
        print("🎉 ¡SISTEMA FUNCIONANDO!")
        print("✅ Todas las verificaciones pasaron correctamente")
        
        print(f"\n🌐 URLs del sistema:")
        print(f"   • Directus Admin: https://www.umbot.com.ar:8056/admin")
        print(f"   • API Directus: https://www.umbot.com.ar:8056")
        print(f"   • Sitio web: https://www.umbot.com.ar")
        
        print(f"\n📝 Próximos pasos:")
        print(f"   1. Subir las 3 imágenes restantes (necesita ajustar nginx)")
        print(f"   2. Conectar el sitio web estático con Directus")
        print(f"   3. Configurar la administración de contenido")
    else:
        print("❌ Hay problemas en el sistema")
        print("🔧 Revisa los mensajes de error arriba")

if __name__ == "__main__":
    main() 