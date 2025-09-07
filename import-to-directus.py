#!/usr/bin/env python3
"""
Script para importar contenidos de UltiMilla a Directus
Importa 469 antecedentes y servicios desde archivos JSON
2025-01-26 - UltiMilla Content Import
"""

import json
import requests
import sys
import os
import re
from typing import Dict, List, Any
import time

# Configuración
DIRECTUS_URL = "https://www.ultimamilla.com.ar:8055"
ADMIN_EMAIL = "admin@ultimamilla.com.ar"
ADMIN_PASSWORD = "UmbotDirectusAdmin2025!"

# Archivos de datos
ANTECEDENTES_FILE = "src/data/antecedentes_completos.js"
SERVICIOS_FILE = "src/data/servicios_completos.js"

class DirectusImporter:
    def __init__(self):
        self.base_url = DIRECTUS_URL
        self.token = None
        self.session = requests.Session()
        
    def authenticate(self) -> bool:
        """Obtener token de autenticación"""
        print("🔑 Obteniendo token de acceso...")
        
        try:
            response = self.session.post(
                f"{self.base_url}/auth/login",
                json={
                    "email": ADMIN_EMAIL,
                    "password": ADMIN_PASSWORD
                },
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                self.token = data.get("access_token")
                if self.token:
                    self.session.headers.update({
                        "Authorization": f"Bearer {self.token}"
                    })
                    print("✅ Token obtenido exitosamente")
                    return True
            
            print(f"❌ Error en autenticación: {response.status_code}")
            print(f"Respuesta: {response.text}")
            return False
            
        except Exception as e:
            print(f"❌ Error conectando a Directus: {e}")
            return False
    
    def create_collections(self) -> bool:
        """Crear colecciones si no existen"""
        print("\n📦 VERIFICANDO/CREANDO COLECCIONES")
        print("=================================")
        
        collections = [
            {
                "name": "antecedentes", 
                "fields": [
                    {"field": "id", "type": "integer", "primary_key": True},
                    {"field": "Titulo", "type": "string"},
                    {"field": "Descripcion", "type": "text"},
                    {"field": "Imagen", "type": "string"},
                    {"field": "Fecha", "type": "date"},
                    {"field": "Cliente", "type": "string"},
                    {"field": "Unidad_de_negocio", "type": "string"},
                    {"field": "Area", "type": "string"},
                    {"field": "Presupuesto", "type": "integer"}
                ]
            },
            {
                "name": "servicios",
                "fields": [
                    {"field": "id", "type": "integer", "primary_key": True},
                    {"field": "Titulo", "type": "string"},
                    {"field": "Descripcion", "type": "text"},
                    {"field": "Area", "type": "string"},
                    {"field": "Cliente", "type": "string"},
                    {"field": "Presupuesto", "type": "integer"}
                ]
            }
        ]
        
        for collection in collections:
            if self.create_collection(collection):
                print(f"✅ Colección '{collection['name']}' configurada")
            else:
                print(f"⚠️  Error configurando colección '{collection['name']}'")
        
        return True
    
    def create_collection(self, collection_config: Dict) -> bool:
        """Crear una colección específica"""
        collection_name = collection_config["name"]
        
        # Verificar si la colección ya existe
        try:
            response = self.session.get(f"{self.base_url}/collections/{collection_name}")
            if response.status_code == 200:
                print(f"📋 Colección '{collection_name}' ya existe")
                return True
        except:
            pass
        
        # Crear colección
        print(f"📦 Creando colección '{collection_name}'...")
        try:
            collection_data = {
                "collection": collection_name,
                "meta": {
                    "collection": collection_name,
                    "icon": "folder",
                    "note": "Colección creada automáticamente",
                    "hidden": False,
                    "singleton": False,
                    "accountability": "all"
                },
                "schema": {"name": collection_name}
            }
            
            response = self.session.post(
                f"{self.base_url}/collections",
                json=collection_data
            )
            
            if response.status_code not in [200, 201]:
                print(f"Error creando colección: {response.text}")
                return False
                
            # Crear campos
            for field in collection_config["fields"]:
                self.create_field(collection_name, field)
                
            return True
            
        except Exception as e:
            print(f"Error: {e}")
            return False
    
    def create_field(self, collection: str, field_config: Dict) -> bool:
        """Crear un campo en la colección"""
        field_name = field_config["field"]
        field_type = field_config["type"]
        is_primary = field_config.get("primary_key", False)
        
        try:
            field_data = {
                "field": field_name,
                "type": field_type,
                "meta": {
                    "field": field_name,
                    "interface": "input",
                    "readonly": False,
                    "hidden": False,
                    "required": is_primary,
                    "sort": None
                },
                "schema": {
                    "name": field_name,
                    "table": collection,
                    "data_type": field_type,
                    "default_value": None,
                    "is_nullable": not is_primary,
                    "is_unique": is_primary,
                    "has_auto_increment": is_primary
                }
            }
            
            if is_primary:
                field_data["schema"]["primary_key"] = True
                field_data["schema"]["auto_increment"] = True
            
            response = self.session.post(
                f"{self.base_url}/fields/{collection}",
                json=field_data
            )
            
            return response.status_code in [200, 201]
            
        except Exception as e:
            return False
    
    def parse_js_file(self, filepath: str, variable_name: str) -> List[Dict]:
        """Parsear archivo JavaScript para extraer datos"""
        print(f"📂 Parseando archivo: {filepath}")
        
        if not os.path.exists(filepath):
            print(f"❌ Archivo no encontrado: {filepath}")
            return []
        
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Buscar el array de datos usando regex
            pattern = rf'export const {variable_name}\s*=\s*(\[.*?\]);'
            match = re.search(pattern, content, re.DOTALL)
            
            if not match:
                print(f"❌ No se encontró la variable '{variable_name}' en el archivo")
                return []
            
            array_content = match.group(1)
            
            # Limpiar y convertir a JSON válido
            # Reemplazar comillas simples por dobles
            array_content = re.sub(r"'", '"', array_content)
            
            # Parsear JSON
            data = json.loads(array_content)
            print(f"✅ Parseados {len(data)} elementos")
            return data
            
        except Exception as e:
            print(f"❌ Error parseando archivo: {e}")
            return []
    
    def import_antecedentes(self) -> Dict[str, int]:
        """Importar antecedentes a Directus"""
        print("\n📋 IMPORTANDO ANTECEDENTES")
        print("==========================")
        
        data = self.parse_js_file(ANTECEDENTES_FILE, "antecedentesReales")
        if not data:
            return {"total": 0, "success": 0, "errors": 0}
        
        success_count = 0
        error_count = 0
        
        for i, item in enumerate(data):
            try:
                # Limpiar y preparar datos
                clean_item = {
                    "id": item.get("id"),
                    "Titulo": str(item.get("Titulo", "")).strip(),
                    "Descripcion": str(item.get("Descripcion", "")).strip(),
                    "Imagen": str(item.get("Imagen", "")).strip(),
                    "Fecha": item.get("Fecha"),
                    "Cliente": str(item.get("Cliente", "")).strip(),
                    "Unidad_de_negocio": str(item.get("Unidad_de_negocio", "")).strip(),
                    "Area": str(item.get("Area", "")).strip(),
                    "Presupuesto": int(item.get("Presupuesto", 0)) if item.get("Presupuesto") else 0
                }
                
                print(f"📝 Importando antecedente {i+1}: {clean_item['Titulo'][:50]}...")
                
                response = self.session.post(
                    f"{self.base_url}/items/antecedentes",
                    json=clean_item
                )
                
                if response.status_code in [200, 201]:
                    success_count += 1
                    print(f"   ✅ Éxito")
                else:
                    error_count += 1
                    print(f"   ❌ Error: {response.status_code} - {response.text[:100]}")
                
                # Pausa para no sobrecargar
                time.sleep(0.1)
                
            except Exception as e:
                error_count += 1
                print(f"   ❌ Error procesando: {e}")
        
        return {
            "total": len(data),
            "success": success_count,
            "errors": error_count
        }
    
    def import_servicios(self) -> Dict[str, int]:
        """Importar servicios a Directus"""
        print("\n🔧 IMPORTANDO SERVICIOS")
        print("=======================")
        
        data = self.parse_js_file(SERVICIOS_FILE, "serviciosReales")
        if not data:
            return {"total": 0, "success": 0, "errors": 0}
        
        success_count = 0
        error_count = 0
        
        for i, item in enumerate(data):
            try:
                clean_item = {
                    "id": item.get("id"),
                    "Titulo": str(item.get("Titulo", "")).strip(),
                    "Descripcion": str(item.get("Descripcion", "")).strip(),
                    "Area": str(item.get("Area", "")).strip(),
                    "Cliente": str(item.get("Cliente", "")).strip(),
                    "Presupuesto": int(item.get("Presupuesto", 0)) if item.get("Presupuesto") else 0
                }
                
                print(f"🔧 Importando servicio {i+1}: {clean_item['Titulo'][:50]}...")
                
                response = self.session.post(
                    f"{self.base_url}/items/servicios",
                    json=clean_item
                )
                
                if response.status_code in [200, 201]:
                    success_count += 1
                    print(f"   ✅ Éxito")
                else:
                    error_count += 1
                    print(f"   ❌ Error: {response.status_code} - {response.text[:100]}")
                
                time.sleep(0.1)
                
            except Exception as e:
                error_count += 1
                print(f"   ❌ Error procesando: {e}")
        
        return {
            "total": len(data),
            "success": success_count,
            "errors": error_count
        }

def main():
    print("📥 IMPORTADOR DE CONTENIDOS DIRECTUS")
    print("====================================")
    print(f"🌐 Conectando a: {DIRECTUS_URL}")
    print(f"👤 Usuario: {ADMIN_EMAIL}")
    print()
    
    # Crear importador
    importer = DirectusImporter()
    
    # Autenticar
    if not importer.authenticate():
        print("❌ Error en autenticación")
        sys.exit(1)
    
    # Crear colecciones
    importer.create_collections()
    
    # Importar contenidos
    antecedentes_result = importer.import_antecedentes()
    servicios_result = importer.import_servicios()
    
    # Mostrar resumen
    print("\n🎉 IMPORTACIÓN COMPLETADA")
    print("=========================")
    print()
    print("📊 RESUMEN ANTECEDENTES:")
    print(f"   Total: {antecedentes_result['total']}")
    print(f"   Éxitos: {antecedentes_result['success']}")
    print(f"   Errores: {antecedentes_result['errors']}")
    print()
    print("📊 RESUMEN SERVICIOS:")
    print(f"   Total: {servicios_result['total']}")
    print(f"   Éxitos: {servicios_result['success']}")
    print(f"   Errores: {servicios_result['errors']}")
    print()
    print("🔗 Accede a Directus en:")
    print(f"   • Principal: {DIRECTUS_URL}/admin")
    print(f"   • Alternativo: https://www.ultimamilla.com.ar:8056/admin")
    print()
    print("✨ Todos los contenidos del sitio web están ahora disponibles para administrar!")

if __name__ == "__main__":
    main() 