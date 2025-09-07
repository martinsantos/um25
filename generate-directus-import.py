#!/usr/bin/env python3
"""
Generador de archivos JSON para importación manual a Directus
Convierte los archivos JavaScript a JSON limpio para Directus
2025-01-26 - UltiMilla JSON Generator
"""

import json
import os
import re
from typing import Dict, List, Any

# Archivos de datos
ANTECEDENTES_FILE = "src/data/antecedentes_completos.js"
SERVICIOS_FILE = "src/data/servicios_completos.js"

# Archivos de salida
OUTPUT_ANTECEDENTES = "directus-antecedentes.json"
OUTPUT_SERVICIOS = "directus-servicios.json"

def parse_js_file(filepath: str, variable_name: str) -> List[Dict]:
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
        # Reemplazar comillas simples por dobles, pero cuidando las comillas anidadas
        array_content = re.sub(r"(?<!\\)'", '"', array_content)
        
        # Parsear JSON
        data = json.loads(array_content)
        print(f"✅ Parseados {len(data)} elementos")
        return data
        
    except Exception as e:
        print(f"❌ Error parseando archivo: {e}")
        print("Intentando método alternativo...")
        
        # Método alternativo usando eval (menos seguro pero más flexible)
        try:
            # Leer contenido
            exec_globals = {}
            exec(content, exec_globals)
            data = exec_globals.get(variable_name, [])
            print(f"✅ Parseados {len(data)} elementos (método alternativo)")
            return data
        except Exception as e2:
            print(f"❌ Error con método alternativo: {e2}")
            return []

def clean_antecedente(item: Dict) -> Dict:
    """Limpiar y estructurar un antecedente para Directus"""
    return {
        "id": item.get("id"),
        "Titulo": str(item.get("Titulo", "")).strip()[:255],  # Limitar longitud
        "Descripcion": str(item.get("Descripcion", "")).strip(),
        "Imagen": str(item.get("Imagen", "")).strip(),
        "Fecha": item.get("Fecha"),
        "Cliente": str(item.get("Cliente", "")).strip()[:255],
        "Unidad_de_negocio": str(item.get("Unidad_de_negocio", "")).strip()[:100],
        "Area": str(item.get("Area", "")).strip()[:100],
        "Presupuesto": int(item.get("Presupuesto", 0)) if item.get("Presupuesto") else 0
    }

def clean_servicio(item: Dict) -> Dict:
    """Limpiar y estructurar un servicio para Directus"""
    return {
        "id": item.get("id"),
        "Titulo": str(item.get("Titulo", "")).strip()[:255],
        "Descripcion": str(item.get("Descripcion", "")).strip(),
        "Area": str(item.get("Area", "")).strip()[:100],
        "Cliente": str(item.get("Cliente", "")).strip()[:255],
        "Presupuesto": int(item.get("Presupuesto", 0)) if item.get("Presupuesto") else 0
    }

def generate_collection_schema():
    """Generar esquemas de colecciones para Directus"""
    schemas = {
        "antecedentes": {
            "collection": "antecedentes",
            "meta": {
                "collection": "antecedentes",
                "icon": "folder",
                "note": "Casos de éxito y antecedentes de UltiMilla",
                "display_template": "{{Titulo}}",
                "hidden": False,
                "singleton": False,
                "archive_field": None,
                "archive_app_filter": True,
                "sort_field": "id"
            },
            "schema": {
                "name": "antecedentes"
            },
            "fields": [
                {
                    "field": "id",
                    "type": "integer",
                    "meta": {
                        "field": "id",
                        "interface": "input",
                        "special": None,
                        "required": True,
                        "readonly": False,
                        "hidden": False,
                        "width": "half",
                        "sort": 1
                    },
                    "schema": {
                        "name": "id",
                        "table": "antecedentes",
                        "data_type": "integer",
                        "default_value": None,
                        "max_length": None,
                        "is_nullable": False,
                        "is_unique": True,
                        "is_primary_key": True,
                        "has_auto_increment": True
                    }
                },
                {
                    "field": "Titulo",
                    "type": "string",
                    "meta": {
                        "field": "Titulo",
                        "interface": "input",
                        "width": "full",
                        "sort": 2
                    },
                    "schema": {
                        "name": "Titulo",
                        "table": "antecedentes",
                        "data_type": "varchar",
                        "max_length": 255,
                        "is_nullable": True
                    }
                },
                {
                    "field": "Descripcion",
                    "type": "text",
                    "meta": {
                        "field": "Descripcion",
                        "interface": "input-multiline",
                        "width": "full",
                        "sort": 3
                    },
                    "schema": {
                        "name": "Descripcion",
                        "table": "antecedentes",
                        "data_type": "text",
                        "is_nullable": True
                    }
                },
                {
                    "field": "Cliente",
                    "type": "string",
                    "meta": {
                        "field": "Cliente",
                        "interface": "input",
                        "width": "half",
                        "sort": 4
                    },
                    "schema": {
                        "name": "Cliente",
                        "table": "antecedentes",
                        "data_type": "varchar",
                        "max_length": 255,
                        "is_nullable": True
                    }
                },
                {
                    "field": "Area",
                    "type": "string",
                    "meta": {
                        "field": "Area",
                        "interface": "select-dropdown",
                        "width": "half",
                        "sort": 5,
                        "options": {
                            "choices": [
                                {"text": "Software a medida", "value": "Software a medida"},
                                {"text": "Redes y comunicaciones", "value": "Redes y comunicaciones"},
                                {"text": "Detección Incendios/Corrientes Débiles", "value": "Detección Incendios/Corrientes Débiles"},
                                {"text": "Ciberseguridad", "value": "Ciberseguridad"},
                                {"text": "Consultoría IT", "value": "Consultoría IT"}
                            ]
                        }
                    },
                    "schema": {
                        "name": "Area",
                        "table": "antecedentes",
                        "data_type": "varchar",
                        "max_length": 100,
                        "is_nullable": True
                    }
                },
                {
                    "field": "Presupuesto",
                    "type": "integer",
                    "meta": {
                        "field": "Presupuesto",
                        "interface": "input",
                        "width": "half",
                        "sort": 6
                    },
                    "schema": {
                        "name": "Presupuesto",
                        "table": "antecedentes",
                        "data_type": "integer",
                        "is_nullable": True
                    }
                },
                {
                    "field": "Fecha",
                    "type": "date",
                    "meta": {
                        "field": "Fecha",
                        "interface": "datetime",
                        "width": "half",
                        "sort": 7
                    },
                    "schema": {
                        "name": "Fecha",
                        "table": "antecedentes",
                        "data_type": "date",
                        "is_nullable": True
                    }
                },
                {
                    "field": "Imagen",
                    "type": "uuid",
                    "meta": {
                        "field": "Imagen",
                        "interface": "file-image",
                        "width": "full",
                        "sort": 8
                    },
                    "schema": {
                        "name": "Imagen",
                        "table": "antecedentes",
                        "data_type": "char",
                        "max_length": 36,
                        "is_nullable": True
                    }
                },
                {
                    "field": "Unidad_de_negocio",
                    "type": "string",
                    "meta": {
                        "field": "Unidad_de_negocio",
                        "interface": "input",
                        "width": "half",
                        "sort": 9
                    },
                    "schema": {
                        "name": "Unidad_de_negocio",
                        "table": "antecedentes",
                        "data_type": "varchar",
                        "max_length": 100,
                        "is_nullable": True
                    }
                }
            ]
        }
    }
    
    return schemas

def main():
    print("🏗️  GENERADOR DE ARCHIVOS PARA DIRECTUS")
    print("=======================================")
    print("📊 Generando archivos JSON listos para importar...")
    print()
    
    # Parsear antecedentes
    antecedentes_data = parse_js_file(ANTECEDENTES_FILE, "antecedentesReales")
    servicios_data = parse_js_file(SERVICIOS_FILE, "serviciosReales")
    
    if not antecedentes_data and not servicios_data:
        print("❌ No se pudieron parsear los archivos de datos")
        return
    
    # Limpiar y estructurar datos
    print("\n🧹 LIMPIANDO Y ESTRUCTURANDO DATOS")
    print("==================================")
    
    clean_antecedentes = []
    if antecedentes_data:
        for item in antecedentes_data:
            try:
                clean_item = clean_antecedente(item)
                clean_antecedentes.append(clean_item)
            except Exception as e:
                print(f"⚠️  Error procesando antecedente {item.get('id', 'desconocido')}: {e}")
        
        print(f"✅ {len(clean_antecedentes)} antecedentes procesados")
    
    clean_servicios = []
    if servicios_data:
        for item in servicios_data:
            try:
                clean_item = clean_servicio(item)
                clean_servicios.append(clean_item)
            except Exception as e:
                print(f"⚠️  Error procesando servicio {item.get('id', 'desconocido')}: {e}")
        
        print(f"✅ {len(clean_servicios)} servicios procesados")
    
    # Guardar archivos JSON
    print("\n💾 GUARDANDO ARCHIVOS JSON")
    print("==========================")
    
    if clean_antecedentes:
        with open(OUTPUT_ANTECEDENTES, 'w', encoding='utf-8') as f:
            json.dump(clean_antecedentes, f, indent=2, ensure_ascii=False)
        print(f"✅ Antecedentes guardados en: {OUTPUT_ANTECEDENTES}")
    
    if clean_servicios:
        with open(OUTPUT_SERVICIOS, 'w', encoding='utf-8') as f:
            json.dump(clean_servicios, f, indent=2, ensure_ascii=False)
        print(f"✅ Servicios guardados en: {OUTPUT_SERVICIOS}")
    
    # Generar esquemas de colecciones
    schemas = generate_collection_schema()
    with open("directus-schemas.json", 'w', encoding='utf-8') as f:
        json.dump(schemas, f, indent=2, ensure_ascii=False)
    print(f"✅ Esquemas guardados en: directus-schemas.json")
    
    # Generar script de importación web
    generate_web_import_script(clean_antecedentes, clean_servicios)
    
    print("\n🎉 GENERACIÓN COMPLETADA")
    print("========================")
    print()
    print("📁 Archivos generados:")
    print(f"   • {OUTPUT_ANTECEDENTES} ({len(clean_antecedentes)} registros)")
    print(f"   • {OUTPUT_SERVICIOS} ({len(clean_servicios)} registros)")
    print(f"   • directus-schemas.json (esquemas de colecciones)")
    print(f"   • directus-web-import.html (importador web)")
    print()
    print("📋 Instrucciones de importación:")
    print("   1. Abre directus-web-import.html en tu navegador")
    print("   2. O copia los archivos JSON al servidor Directus")
    print("   3. Importa usando la API de Directus")
    print()
    print("🔗 Panel Directus: https://www.ultimamilla.com.ar:8056/admin")

def generate_web_import_script(antecedentes: List[Dict], servicios: List[Dict]):
    """Generar script HTML para importación via navegador"""
    html_content = f"""<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Importador Directus - UltiMilla</title>
    <style>
        body {{ font-family: Arial, sans-serif; margin: 20px; }}
        .container {{ max-width: 800px; margin: 0 auto; }}
        .button {{ background: #6644ff; color: white; border: none; padding: 10px 20px; 
                  border-radius: 5px; cursor: pointer; margin: 5px; }}
        .button:hover {{ background: #5533ee; }}
        .log {{ background: #f5f5f5; border: 1px solid #ddd; padding: 10px; 
               height: 400px; overflow-y: auto; margin: 10px 0; }}
        .success {{ color: green; }}
        .error {{ color: red; }}
        .info {{ color: blue; }}
        .form-group {{ margin: 10px 0; }}
        label {{ display: block; margin-bottom: 5px; }}
        input {{ width: 100%; padding: 8px; margin-bottom: 10px; }}
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Importador de Contenidos Directus</h1>
        <p>Esta herramienta importa {len(antecedentes)} antecedentes y {len(servicios)} servicios a Directus.</p>
        
        <div class="form-group">
            <label>URL de Directus:</label>
            <input type="text" id="directusUrl" value="https://www.ultimamilla.com.ar:8055" />
        </div>
        
        <div class="form-group">
            <label>Email:</label>
            <input type="email" id="email" value="admin@ultimamilla.com.ar" />
        </div>
        
        <div class="form-group">
            <label>Contraseña:</label>
            <input type="password" id="password" value="UmbotDirectusAdmin2025!" />
        </div>
        
        <button class="button" onclick="authenticate()">🔑 Autenticar</button>
        <button class="button" onclick="createCollections()" disabled id="createBtn">📦 Crear Colecciones</button>
        <button class="button" onclick="importData()" disabled id="importBtn">📥 Importar Datos</button>
        <button class="button" onclick="clearLog()">🧹 Limpiar Log</button>
        
        <div id="log" class="log"></div>
    </div>

    <script>
        let token = null;
        const antecedentes = {json.dumps(antecedentes, ensure_ascii=False)};
        const servicios = {json.dumps(servicios, ensure_ascii=False)};
        
        function log(message, type = 'info') {{
            const logDiv = document.getElementById('log');
            const timestamp = new Date().toLocaleTimeString();
            const className = type === 'error' ? 'error' : type === 'success' ? 'success' : 'info';
            logDiv.innerHTML += `<div class="${{className}}">[{{timestamp}}] ${{message}}</div>`;
            logDiv.scrollTop = logDiv.scrollHeight;
        }}
        
        function clearLog() {{
            document.getElementById('log').innerHTML = '';
        }}
        
        async function authenticate() {{
            const url = document.getElementById('directusUrl').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            log('🔑 Iniciando autenticación...');
            
            try {{
                const response = await fetch(`${{url}}/auth/login`, {{
                    method: 'POST',
                    headers: {{ 'Content-Type': 'application/json' }},
                    body: JSON.stringify({{ email, password }})
                }});
                
                if (response.ok) {{
                    const data = await response.json();
                    token = data.access_token;
                    log('✅ Autenticación exitosa', 'success');
                    document.getElementById('createBtn').disabled = false;
                    document.getElementById('importBtn').disabled = false;
                }} else {{
                    log(`❌ Error de autenticación: ${{response.status}}`, 'error');
                }}
            }} catch (error) {{
                log(`❌ Error conectando: ${{error.message}}`, 'error');
            }}
        }}
        
        async function createCollections() {{
            if (!token) {{
                log('❌ Primero debes autenticarte', 'error');
                return;
            }}
            
            log('📦 Creando colecciones...');
            const url = document.getElementById('directusUrl').value;
            
            // Crear colección antecedentes
            try {{
                const antecedentesCollection = {{
                    collection: 'antecedentes',
                    meta: {{
                        collection: 'antecedentes',
                        icon: 'folder',
                        note: 'Casos de éxito y antecedentes'
                    }},
                    schema: {{ name: 'antecedentes' }}
                }};
                
                const response = await fetch(`${{url}}/collections`, {{
                    method: 'POST',
                    headers: {{
                        'Authorization': `Bearer ${{token}}`,
                        'Content-Type': 'application/json'
                    }},
                    body: JSON.stringify(antecedentesCollection)
                }});
                
                if (response.ok || response.status === 409) {{
                    log('✅ Colección antecedentes configurada', 'success');
                }} else {{
                    log(`⚠️ Error creando colección antecedentes: ${{response.status}}`, 'error');
                }}
                
                // Crear campos básicos
                const fields = [
                    {{ field: 'Titulo', type: 'string' }},
                    {{ field: 'Descripcion', type: 'text' }},
                    {{ field: 'Cliente', type: 'string' }},
                    {{ field: 'Area', type: 'string' }},
                    {{ field: 'Presupuesto', type: 'integer' }},
                    {{ field: 'Fecha', type: 'date' }},
                    {{ field: 'Imagen', type: 'string' }},
                    {{ field: 'Unidad_de_negocio', type: 'string' }}
                ];
                
                for (const fieldConfig of fields) {{
                    try {{
                        await fetch(`${{url}}/fields/antecedentes`, {{
                            method: 'POST',
                            headers: {{
                                'Authorization': `Bearer ${{token}}`,
                                'Content-Type': 'application/json'
                            }},
                            body: JSON.stringify({{
                                field: fieldConfig.field,
                                type: fieldConfig.type,
                                meta: {{ field: fieldConfig.field, interface: 'input' }},
                                schema: {{ name: fieldConfig.field, table: 'antecedentes' }}
                            }})
                        }});
                    }} catch (e) {{
                        // Campo probablemente ya existe
                    }}
                }}
                
                log('✅ Colecciones y campos configurados', 'success');
                
            }} catch (error) {{
                log(`❌ Error configurando colecciones: ${{error.message}}`, 'error');
            }}
        }}
        
        async function importData() {{
            if (!token) {{
                log('❌ Primero debes autenticarte', 'error');
                return;
            }}
            
            log('📥 Iniciando importación de datos...');
            const url = document.getElementById('directusUrl').value;
            
            let successCount = 0;
            let errorCount = 0;
            
            // Importar antecedentes
            for (const [index, item] of antecedentes.entries()) {{
                try {{
                    log(`📝 Importando antecedente ${{index + 1}}: ${{item.Titulo.substring(0, 50)}}...`);
                    
                    const response = await fetch(`${{url}}/items/antecedentes`, {{
                        method: 'POST',
                        headers: {{
                            'Authorization': `Bearer ${{token}}`,
                            'Content-Type': 'application/json'
                        }},
                        body: JSON.stringify(item)
                    }});
                    
                    if (response.ok) {{
                        successCount++;
                        if (index % 10 === 0) {{
                            log(`   ✅ ${{index + 1}} antecedentes procesados`, 'success');
                        }}
                    }} else {{
                        errorCount++;
                        const errorText = await response.text();
                        log(`   ❌ Error ${{response.status}}: ${{errorText.substring(0, 100)}}`, 'error');
                    }}
                    
                    // Pausa para no sobrecargar
                    await new Promise(resolve => setTimeout(resolve, 100));
                    
                }} catch (error) {{
                    errorCount++;
                    log(`   ❌ Error procesando: ${{error.message}}`, 'error');
                }}
            }}
            
            log(`📊 Importación completada: ${{successCount}} éxitos, ${{errorCount}} errores`, 'success');
            log('🎉 ¡Todos los contenidos han sido importados a Directus!', 'success');
            log('🔗 Accede al panel: ' + url + '/admin', 'info');
        }}
    </script>
</body>
</html>"""
    
    with open("directus-web-import.html", 'w', encoding='utf-8') as f:
        f.write(html_content)

if __name__ == "__main__":
    main() 