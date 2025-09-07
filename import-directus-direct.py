#!/usr/bin/env python3
"""
Importador directo de contenidos a Directus
Evita problemas de CORS importando directamente desde terminal
"""

import json
import requests
import time
import sys

# Configuración
DIRECTUS_URL = "https://www.ultimamilla.com.ar:8056"
ADMIN_EMAIL = "admin@ultimamilla.com.ar"
ADMIN_PASSWORD = "UmbotDirectusAdmin2025!"

def log_with_icon(message, icon="📝"):
    print(f"{icon} {message}")

def authenticate():
    """Autenticar con Directus"""
    log_with_icon("Iniciando autenticación...", "🔐")
    
    try:
        response = requests.post(
            f"{DIRECTUS_URL}/auth/login",
            json={
                "email": ADMIN_EMAIL,
                "password": ADMIN_PASSWORD
            },
            timeout=30,
            verify=False  # Ignorar SSL para desarrollo
        )
        
        if response.status_code == 200:
            data = response.json()
            # Directus puede devolver {"data": {...}} o directamente {...}
            token = data.get("access_token") or data.get("data", {}).get("access_token")
            if token:
                log_with_icon("Autenticación exitosa", "✅")
                return token
        
        log_with_icon(f"Error de autenticación: {response.status_code}", "❌")
        log_with_icon(f"Respuesta: {response.text}", "📄")
        return None
        
    except Exception as e:
        log_with_icon(f"Error conectando: {e}", "❌")
        return None

def create_collection(token, collection_name, description):
    """Crear colección en Directus"""
    log_with_icon(f"Creando colección '{collection_name}'...", "📦")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    # Crear colección
    collection_data = {
        "collection": collection_name,
        "meta": {
            "collection": collection_name,
            "icon": "folder",
            "note": description,
            "hidden": False,
            "singleton": False
        },
        "schema": {"name": collection_name}
    }
    
    try:
        response = requests.post(
            f"{DIRECTUS_URL}/collections",
            json=collection_data,
            headers=headers,
            verify=False
        )
        
        if response.status_code in [200, 201, 409]:  # 409 = ya existe
            log_with_icon(f"Colección '{collection_name}' configurada", "✅")
            
            # Crear campos básicos
            fields = []
            if collection_name == "antecedentes":
                fields = [
                    {"field": "Titulo", "type": "string"},
                    {"field": "Descripcion", "type": "text"},
                    {"field": "Cliente", "type": "string"},
                    {"field": "Area", "type": "string"},
                    {"field": "Presupuesto", "type": "integer"},
                    {"field": "Fecha", "type": "date"},
                    {"field": "Imagen", "type": "string"},
                    {"field": "Unidad_de_negocio", "type": "string"}
                ]
            elif collection_name == "servicios":
                fields = [
                    {"field": "Titulo", "type": "string"},
                    {"field": "Descripcion", "type": "text"},
                    {"field": "Area", "type": "string"},
                    {"field": "Cliente", "type": "string"},
                    {"field": "Presupuesto", "type": "integer"}
                ]
            
            # Crear campos
            for field_config in fields:
                try:
                    field_data = {
                        "field": field_config["field"],
                        "type": field_config["type"],
                        "meta": {
                            "field": field_config["field"],
                            "interface": "input-multiline" if field_config["type"] == "text" else "input",
                            "readonly": False,
                            "hidden": False
                        },
                        "schema": {
                            "name": field_config["field"],
                            "table": collection_name,
                            "data_type": field_config["type"],
                            "is_nullable": True
                        }
                    }
                    
                    requests.post(
                        f"{DIRECTUS_URL}/fields/{collection_name}",
                        json=field_data,
                        headers=headers,
                        verify=False
                    )
                except:
                    pass  # Campo probablemente ya existe
            
            return True
        else:
            log_with_icon(f"Error creando colección: {response.text}", "❌")
            return False
            
    except Exception as e:
        log_with_icon(f"Error: {e}", "❌")
        return False

def import_data(token, collection_name, data, batch_size=25):
    """Importar datos a una colección"""
    log_with_icon(f"Importando {len(data)} registros a '{collection_name}'...", "📥")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    success_count = 0
    error_count = 0
    
    for i, item in enumerate(data):
        try:
            response = requests.post(
                f"{DIRECTUS_URL}/items/{collection_name}",
                json=item,
                headers=headers,
                verify=False
            )
            
            if response.status_code in [200, 201]:
                success_count += 1
                if (i + 1) % batch_size == 0:
                    log_with_icon(f"   {i + 1} registros procesados...", "✅")
            else:
                error_count += 1
                if error_count <= 3:  # Solo mostrar primeros errores
                    log_with_icon(f"   Error en registro {item.get('id', i+1)}: {response.status_code}", "⚠️")
            
            # Pausa pequeña para no sobrecargar
            time.sleep(0.05)
            
        except Exception as e:
            error_count += 1
            if error_count <= 3:
                log_with_icon(f"   Error procesando registro: {e}", "❌")
    
    return success_count, error_count

def main():
    print("🚀 IMPORTADOR DIRECTO DIRECTUS - ULTIMILLA")
    print("==========================================")
    print(f"🌐 Conectando a: {DIRECTUS_URL}")
    print(f"👤 Usuario: {ADMIN_EMAIL}")
    print()
    
    # Deshabilitar warnings SSL
    import urllib3
    urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
    
    # Autenticar
    token = authenticate()
    if not token:
        log_with_icon("Error en autenticación", "❌")
        sys.exit(1)
    
    # Cargar datos
    log_with_icon("Cargando archivos de datos...", "📂")
    
    try:
        with open("directus-antecedentes.json", "r", encoding="utf-8") as f:
            antecedentes_data = json.load(f)
        log_with_icon(f"Cargados {len(antecedentes_data)} antecedentes", "✅")
    except:
        log_with_icon("Error cargando antecedentes", "❌")
        antecedentes_data = []
    
    try:
        with open("directus-servicios.json", "r", encoding="utf-8") as f:
            servicios_data = json.load(f)
        log_with_icon(f"Cargados {len(servicios_data)} servicios", "✅")
    except:
        log_with_icon("Error cargando servicios", "❌")
        servicios_data = []
    
    if not antecedentes_data and not servicios_data:
        log_with_icon("No hay datos para importar", "❌")
        sys.exit(1)
    
    # Crear colecciones
    print("\n📦 CREANDO COLECCIONES")
    print("======================")
    
    if antecedentes_data:
        create_collection(token, "antecedentes", "Casos de éxito y antecedentes")
    
    if servicios_data:
        create_collection(token, "servicios", "Servicios de la empresa")
    
    # Importar datos
    print("\n📥 IMPORTANDO DATOS")
    print("==================")
    
    total_success = 0
    total_errors = 0
    
    if antecedentes_data:
        success, errors = import_data(token, "antecedentes", antecedentes_data)
        total_success += success
        total_errors += errors
        log_with_icon(f"Antecedentes: {success} éxitos, {errors} errores", "📊")
    
    if servicios_data:
        success, errors = import_data(token, "servicios", servicios_data)
        total_success += success
        total_errors += errors
        log_with_icon(f"Servicios: {success} éxitos, {errors} errores", "📊")
    
    # Resumen final
    print("\n🎉 IMPORTACIÓN COMPLETADA")
    print("=========================")
    print(f"📊 Total: {total_success} éxitos, {total_errors} errores")
    print(f"🔗 Panel Directus: {DIRECTUS_URL}/admin")
    print("✨ ¡Todos los contenidos están ahora disponibles para administrar!")

if __name__ == "__main__":
    main() 