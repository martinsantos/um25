#!/usr/bin/env python3
"""
Convertidor de archivos JavaScript a JSON para Directus
Convierte los archivos de datos específicos de UltiMilla a formato JSON limpio
2025-01-26 - UltiMilla JS to JSON Converter
"""

import json
import os
import re
from typing import Dict, List, Any

def parse_js_object_literal(js_content: str) -> List[Dict]:
    """Parse JavaScript object literal syntax to Python dict"""
    
    # Normalizar el contenido
    content = js_content.strip()
    
    # Encontrar el array principal
    array_start = content.find('[')
    array_end = content.rfind('];')
    
    if array_start == -1 or array_end == -1:
        raise ValueError("No se encontró array válido en el contenido")
    
    array_content = content[array_start:array_end + 1]
    
    # Reemplazar formato JS por JSON válido
    # Agregar comillas a las claves de objeto
    array_content = re.sub(r'(\n\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:', r'\1"\2":', array_content)
    
    # Manejar valores string sin comillas (pero conservar los que ya las tienen)
    # Esto es más complejo, necesitamos un approach diferente
    
    return eval_js_safely(array_content)

def eval_js_safely(js_array: str) -> List[Dict]:
    """Evaluar JavaScript array de manera segura usando regex y parsing manual"""
    
    # Limitar las funciones disponibles para eval
    safe_dict = {
        "__builtins__": {},
        "true": True,
        "false": False,
        "null": None,
        "True": True,
        "False": False,
        "None": None
    }
    
    try:
        # Convertir el JS array a Python
        result = eval(js_array, safe_dict)
        return result if isinstance(result, list) else []
    except:
        # Si eval falla, intentar parsing manual
        return parse_objects_manually(js_array)

def parse_objects_manually(js_array: str) -> List[Dict]:
    """Parse manual de objetos JavaScript"""
    objects = []
    
    # Encontrar objetos individuales usando regex
    object_pattern = r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}'
    matches = re.findall(object_pattern, js_array, re.DOTALL)
    
    for match in matches:
        try:
            obj = parse_single_object(match)
            if obj:
                objects.append(obj)
        except Exception as e:
            print(f"Error parseando objeto: {e}")
            continue
    
    return objects

def parse_single_object(obj_str: str) -> Dict:
    """Parse un objeto JavaScript individual"""
    obj = {}
    
    # Remover llaves externas
    content = obj_str.strip()[1:-1]
    
    # Split por líneas y procesar
    lines = content.split(',\n')
    
    for line in lines:
        line = line.strip()
        if not line or line == ',':
            continue
            
        # Buscar key: value
        if ':' in line:
            parts = line.split(':', 1)
            key = parts[0].strip()
            value = parts[1].strip().rstrip(',')
            
            # Limpiar key (remover comillas si las tiene)
            key = key.strip('"\'')
            
            # Parse value
            parsed_value = parse_value(value)
            obj[key] = parsed_value
    
    return obj

def parse_value(value_str: str) -> Any:
    """Parse un valor JavaScript a Python"""
    value = value_str.strip()
    
    # Números
    if value.isdigit() or (value.startswith('-') and value[1:].isdigit()):
        return int(value)
    
    # Strings con comillas
    if (value.startswith('"') and value.endswith('"')) or (value.startswith("'") and value.endswith("'")):
        return value[1:-1]
    
    # Booleanos y null
    if value.lower() == 'true':
        return True
    elif value.lower() == 'false':
        return False
    elif value.lower() == 'null':
        return None
    
    # String sin comillas (default)
    return value

def read_and_parse_js_file(filepath: str, variable_name: str) -> List[Dict]:
    """Leer y parsear archivo JavaScript completo"""
    print(f"📂 Leyendo archivo: {filepath}")
    
    if not os.path.exists(filepath):
        print(f"❌ Archivo no encontrado: {filepath}")
        return []
    
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Buscar la declaración de la variable
        pattern = rf'export const {variable_name}\s*=\s*(\[.*?\]);'
        match = re.search(pattern, content, re.DOTALL)
        
        if not match:
            print(f"❌ No se encontró la variable '{variable_name}'")
            return []
        
        array_content = match.group(1)
        
        # Usar Node.js para evaluar JavaScript si está disponible
        try:
            return parse_with_nodejs(content, variable_name)
        except:
            print("⚠️  Node.js no disponible, usando parser Python...")
            return parse_js_object_literal(array_content)
            
    except Exception as e:
        print(f"❌ Error leyendo archivo: {e}")
        return []

def parse_with_nodejs(js_content: str, variable_name: str) -> List[Dict]:
    """Usar Node.js para evaluar JavaScript de manera segura"""
    import subprocess
    import tempfile
    
    # Crear script temporal de Node.js
    with tempfile.NamedTemporaryFile(mode='w', suffix='.js', delete=False) as temp_file:
        script_content = f"""
// Evaluar el contenido JavaScript
{js_content}

// Exportar como JSON
console.log(JSON.stringify({variable_name}));
"""
        temp_file.write(script_content)
        temp_file_path = temp_file.name
    
    try:
        # Ejecutar Node.js
        result = subprocess.run(['node', temp_file_path], 
                              capture_output=True, text=True, timeout=30)
        
        if result.returncode == 0:
            data = json.loads(result.stdout.strip())
            print(f"✅ Parseados {len(data)} elementos con Node.js")
            return data
        else:
            raise Exception(f"Node.js error: {result.stderr}")
            
    finally:
        # Limpiar archivo temporal
        os.unlink(temp_file_path)

def clean_data_for_directus(data: List[Dict], collection_type: str) -> List[Dict]:
    """Limpiar datos para importación a Directus"""
    cleaned = []
    
    for item in data:
        try:
            if collection_type == "antecedentes":
                clean_item = {
                    "id": int(item.get("id", 0)),
                    "Titulo": str(item.get("Titulo", "")).strip()[:255],
                    "Descripcion": str(item.get("Descripcion", "")).strip(),
                    "Imagen": str(item.get("Imagen", "")).strip(),
                    "Fecha": str(item.get("Fecha", "")).strip() if item.get("Fecha") else None,
                    "Cliente": str(item.get("Cliente", "")).strip()[:255],
                    "Unidad_de_negocio": str(item.get("Unidad_de_negocio", "")).strip()[:100],
                    "Area": str(item.get("Area", "")).strip()[:100],
                    "Presupuesto": int(item.get("Presupuesto", 0)) if item.get("Presupuesto") else 0
                }
            elif collection_type == "servicios":
                clean_item = {
                    "id": int(item.get("id", 0)),
                    "Titulo": str(item.get("Titulo", "")).strip()[:255],
                    "Descripcion": str(item.get("Descripcion", "")).strip(),
                    "Area": str(item.get("Area", "")).strip()[:100],
                    "Cliente": str(item.get("Cliente", "")).strip()[:255],
                    "Presupuesto": int(item.get("Presupuesto", 0)) if item.get("Presupuesto") else 0
                }
            else:
                clean_item = item
            
            # Solo agregar si tiene datos válidos
            if clean_item.get("id") and clean_item.get("Titulo"):
                cleaned.append(clean_item)
                
        except Exception as e:
            print(f"⚠️  Error limpiando item {item.get('id', 'desconocido')}: {e}")
            continue
    
    return cleaned

def generate_web_importer(antecedentes: List[Dict], servicios: List[Dict]):
    """Generar importador web HTML/JavaScript"""
    
    html_template = """<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🚀 Importador Directus - UltiMilla</title>
    <style>
        * { box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
               margin: 0; padding: 20px; background: #f8f9fa; }
        .container { max-width: 1000px; margin: 0 auto; background: white; 
                    border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: #6644ff; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { padding: 20px; }
        .form-group { margin: 15px 0; }
        .form-group label { display: block; margin-bottom: 5px; font-weight: 500; }
        .form-group input { width: 100%; padding: 10px; border: 1px solid #ddd; 
                           border-radius: 4px; font-size: 14px; }
        .btn { background: #6644ff; color: white; border: none; padding: 12px 20px; 
               border-radius: 4px; cursor: pointer; margin: 5px; font-size: 14px; 
               transition: background 0.2s; }
        .btn:hover { background: #5533ee; }
        .btn:disabled { background: #ccc; cursor: not-allowed; }
        .btn-secondary { background: #6c757d; }
        .btn-secondary:hover { background: #5a6268; }
        .log { background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 4px;
               padding: 15px; height: 400px; overflow-y: auto; margin: 15px 0; 
               font-family: 'Monaco', 'Consolas', monospace; font-size: 12px; }
        .success { color: #28a745; }
        .error { color: #dc3545; }
        .info { color: #007bff; }
        .warning { color: #ffc107; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
                gap: 15px; margin: 20px 0; }
        .stat-card { background: #f8f9fa; padding: 15px; border-radius: 4px; text-align: center; }
        .stat-number { font-size: 24px; font-weight: bold; color: #6644ff; }
        .stat-label { font-size: 14px; color: #6c757d; }
        .progress { width: 100%; height: 20px; background: #e9ecef; border-radius: 10px; 
                   overflow: hidden; margin: 10px 0; }
        .progress-bar { height: 100%; background: #28a745; transition: width 0.3s; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 Importador de Contenidos Directus</h1>
            <p>Herramienta para importar todos los contenidos de UltiMilla a Directus</p>
        </div>
        
        <div class="content">
            <div class="stats">
                <div class="stat-card">
                    <div class="stat-number">{len_antecedentes}</div>
                    <div class="stat-label">Antecedentes</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">{len_servicios}</div>
                    <div class="stat-label">Servicios</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">{total}</div>
                    <div class="stat-label">Total Registros</div>
                </div>
            </div>
            
            <div class="form-group">
                <label>🌐 URL de Directus:</label>
                <input type="text" id="directusUrl" value="https://www.umbot.com.ar:8055" />
            </div>
            
            <div class="form-group">
                <label>👤 Email:</label>
                <input type="email" id="email" value="admin@umbot.com.ar" />
            </div>
            
            <div class="form-group">
                <label>🔑 Contraseña:</label>
                <input type="password" id="password" value="UmbotDirectusAdmin2025!" />
            </div>
            
            <div>
                <button class="btn" onclick="authenticate()">🔐 Conectar</button>
                <button class="btn" onclick="createCollections()" disabled id="createBtn">📦 Crear Colecciones</button>
                <button class="btn" onclick="importData()" disabled id="importBtn">📥 Importar Todo</button>
                <button class="btn btn-secondary" onclick="clearLog()">🧹 Limpiar Log</button>
            </div>
            
            <div class="progress" style="display: none;" id="progressContainer">
                <div class="progress-bar" id="progressBar" style="width: 0%;"></div>
            </div>
            
            <div id="log" class="log"></div>
        </div>
    </div>

    <script>
        let token = null;
        let baseUrl = '';
        
        const antecedentes = {antecedentes_json};
        const servicios = {servicios_json};
        
        function log(message, type = 'info') {{
            const logDiv = document.getElementById('log');
            const timestamp = new Date().toLocaleTimeString();
            const icon = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : '📝';
            const className = type;
            logDiv.innerHTML += `<div class="${{className}}">[{{timestamp}}] ${{icon}} ${{message}}</div>`;
            logDiv.scrollTop = logDiv.scrollHeight;
        }}
        
        function clearLog() {{
            document.getElementById('log').innerHTML = '';
        }}
        
        function updateProgress(current, total) {{
            const container = document.getElementById('progressContainer');
            const bar = document.getElementById('progressBar');
            const percentage = (current / total) * 100;
            
            container.style.display = 'block';
            bar.style.width = percentage + '%';
            
            if (current >= total) {{
                setTimeout(() => {{
                    container.style.display = 'none';
                }}, 2000);
            }}
        }}
        
        async function authenticate() {{
            baseUrl = document.getElementById('directusUrl').value.replace(/\/$/, '');
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            log('🔐 Iniciando autenticación...');
            
            try {{
                const response = await fetch(`${{baseUrl}}/auth/login`, {{
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
                    const errorText = await response.text();
                    log(`❌ Error de autenticación (${{response.status}}): ${{errorText}}`, 'error');
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
            
            log('📦 Configurando colecciones...');
            
            // Configurar colección antecedentes
            await createCollection('antecedentes', 'Antecedentes - Casos de éxito', [
                {{ field: 'Titulo', type: 'string' }},
                {{ field: 'Descripcion', type: 'text' }},
                {{ field: 'Cliente', type: 'string' }},
                {{ field: 'Area', type: 'string' }},
                {{ field: 'Presupuesto', type: 'integer' }},
                {{ field: 'Fecha', type: 'date' }},
                {{ field: 'Imagen', type: 'string' }},
                {{ field: 'Unidad_de_negocio', type: 'string' }}
            ]);
            
            // Configurar colección servicios
            await createCollection('servicios', 'Servicios', [
                {{ field: 'Titulo', type: 'string' }},
                {{ field: 'Descripcion', type: 'text' }},
                {{ field: 'Area', type: 'string' }},
                {{ field: 'Cliente', type: 'string' }},
                {{ field: 'Presupuesto', type: 'integer' }}
            ]);
            
            log('✅ Colecciones configuradas exitosamente', 'success');
        }}
        
        async function createCollection(name, description, fields) {{
            try {{
                // Crear colección
                const collectionData = {{
                    collection: name,
                    meta: {{
                        collection: name,
                        icon: 'folder',
                        note: description,
                        hidden: false,
                        singleton: false
                    }},
                    schema: {{ name: name }}
                }};
                
                const collectionResponse = await fetch(`${{baseUrl}}/collections`, {{
                    method: 'POST',
                    headers: {{
                        'Authorization': `Bearer ${{token}}`,
                        'Content-Type': 'application/json'
                    }},
                    body: JSON.stringify(collectionData)
                }});
                
                if (collectionResponse.ok || collectionResponse.status === 409) {{
                    log(`📋 Colección '${{name}}' configurada`);
                }} else {{
                    log(`⚠️ Error creando colección '${{name}}': ${{collectionResponse.status}}`, 'warning');
                }}
                
                // Crear campos
                for (const fieldConfig of fields) {{
                    try {{
                        const fieldData = {{
                            field: fieldConfig.field,
                            type: fieldConfig.type,
                            meta: {{
                                field: fieldConfig.field,
                                interface: fieldConfig.type === 'text' ? 'input-multiline' : 'input',
                                readonly: false,
                                hidden: false
                            }},
                            schema: {{
                                name: fieldConfig.field,
                                table: name,
                                data_type: fieldConfig.type,
                                is_nullable: true
                            }}
                        }};
                        
                        await fetch(`${{baseUrl}}/fields/${{name}}`, {{
                            method: 'POST',
                            headers: {{
                                'Authorization': `Bearer ${{token}}`,
                                'Content-Type': 'application/json'
                            }},
                            body: JSON.stringify(fieldData)
                        }});
                    }} catch (fieldError) {{
                        // Campo probablemente ya existe
                    }}
                }}
                
            }} catch (error) {{
                log(`❌ Error configurando colección '${{name}}': ${{error.message}}`, 'error');
            }}
        }}
        
        async function importData() {{
            if (!token) {{
                log('❌ Primero debes autenticarte', 'error');
                return;
            }}
            
            log('📥 Iniciando importación masiva...');
            
            let totalSuccess = 0;
            let totalErrors = 0;
            const totalItems = antecedentes.length + servicios.length;
            let processedItems = 0;
            
            // Importar antecedentes
            log(`📝 Importando ${{antecedentes.length}} antecedentes...`);
            for (const [index, item] of antecedentes.entries()) {{
                try {{
                    const response = await fetch(`${{baseUrl}}/items/antecedentes`, {{
                        method: 'POST',
                        headers: {{
                            'Authorization': `Bearer ${{token}}`,
                            'Content-Type': 'application/json'
                        }},
                        body: JSON.stringify(item)
                    }});
                    
                    if (response.ok) {{
                        totalSuccess++;
                        if (index % 25 === 0) {{
                            log(`   ✅ ${{index + 1}} antecedentes procesados`, 'success');
                        }}
                    }} else {{
                        totalErrors++;
                        if (totalErrors <= 5) {{
                            const errorText = await response.text();
                            log(`   ❌ Error en antecedente ${{item.id}}: ${{response.status}}`, 'error');
                        }}
                    }}
                    
                    processedItems++;
                    updateProgress(processedItems, totalItems);
                    
                    // Pausa para no sobrecargar
                    if (index % 10 === 0) {{
                        await new Promise(resolve => setTimeout(resolve, 50));
                    }}
                    
                }} catch (error) {{
                    totalErrors++;
                    log(`   ❌ Error procesando antecedente: ${{error.message}}`, 'error');
                }}
            }}
            
            // Importar servicios
            log(`🔧 Importando ${{servicios.length}} servicios...`);
            for (const [index, item] of servicios.entries()) {{
                try {{
                    const response = await fetch(`${{baseUrl}}/items/servicios`, {{
                        method: 'POST',
                        headers: {{
                            'Authorization': `Bearer ${{token}}`,
                            'Content-Type': 'application/json'
                        }},
                        body: JSON.stringify(item)
                    }});
                    
                    if (response.ok) {{
                        totalSuccess++;
                        if (index % 10 === 0) {{
                            log(`   ✅ ${{index + 1}} servicios procesados`, 'success');
                        }}
                    }} else {{
                        totalErrors++;
                        if (totalErrors <= 5) {{
                            log(`   ❌ Error en servicio ${{item.id}}: ${{response.status}}`, 'error');
                        }}
                    }}
                    
                    processedItems++;
                    updateProgress(processedItems, totalItems);
                    
                    await new Promise(resolve => setTimeout(resolve, 50));
                    
                }} catch (error) {{
                    totalErrors++;
                    log(`   ❌ Error procesando servicio: ${{error.message}}`, 'error');
                }}
            }}
            
            // Resumen final
            log('', 'info');
            log('🎉 IMPORTACIÓN COMPLETADA', 'success');
            log(`📊 Resumen: ${{totalSuccess}} éxitos, ${{totalErrors}} errores`, 'info');
            log(`🔗 Panel Directus: ${{baseUrl}}/admin`, 'info');
            log('✨ ¡Todos los contenidos están ahora disponibles para administrar!', 'success');
        }}
    </script>
</body>
</html>"""
    
    # Formatear template
    formatted_html = html_template.format(
        len_antecedentes=len(antecedentes),
        len_servicios=len(servicios),
        total=len(antecedentes) + len(servicios),
        antecedentes_json=json.dumps(antecedentes, ensure_ascii=False),
        servicios_json=json.dumps(servicios, ensure_ascii=False)
    )
    
    return formatted_html

def main():
    print("🔄 CONVERTIDOR JS A JSON PARA DIRECTUS")
    print("======================================")
    print("📊 Convirtiendo archivos JavaScript a JSON...")
    print()
    
    # Parsear archivos
    antecedentes_data = read_and_parse_js_file("src/data/antecedentes_completos.js", "antecedentesReales")
    servicios_data = read_and_parse_js_file("src/data/servicios_completos.js", "serviciosReales")
    
    if not antecedentes_data and not servicios_data:
        print("❌ No se pudieron parsear los archivos")
        return
    
    # Limpiar datos
    print("\n🧹 LIMPIANDO DATOS PARA DIRECTUS")
    print("================================")
    
    clean_antecedentes = clean_data_for_directus(antecedentes_data, "antecedentes")
    clean_servicios = clean_data_for_directus(servicios_data, "servicios")
    
    print(f"✅ {len(clean_antecedentes)} antecedentes limpiados")
    print(f"✅ {len(clean_servicios)} servicios limpiados")
    
    # Guardar archivos
    print("\n💾 GENERANDO ARCHIVOS DE SALIDA")
    print("===============================")
    
    # JSON para importación manual
    if clean_antecedentes:
        with open("directus-antecedentes.json", 'w', encoding='utf-8') as f:
            json.dump(clean_antecedentes, f, indent=2, ensure_ascii=False)
        print(f"📄 directus-antecedentes.json ({len(clean_antecedentes)} registros)")
    
    if clean_servicios:
        with open("directus-servicios.json", 'w', encoding='utf-8') as f:
            json.dump(clean_servicios, f, indent=2, ensure_ascii=False)
        print(f"📄 directus-servicios.json ({len(clean_servicios)} registros)")
    
    # Importador web
    html_content = generate_web_importer(clean_antecedentes, clean_servicios)
    with open("directus-importador.html", 'w', encoding='utf-8') as f:
        f.write(html_content)
    print(f"🌐 directus-importador.html (herramienta web)")
    
    print("\n🎉 CONVERSIÓN COMPLETADA")
    print("========================")
    print()
    print("📁 Archivos generados:")
    print("   • directus-antecedentes.json (datos)")
    print("   • directus-servicios.json (datos)")  
    print("   • directus-importador.html (herramienta)")
    print()
    print("🚀 Pasos siguientes:")
    print("   1. Abre directus-importador.html en tu navegador")
    print("   2. Conéctate a Directus")
    print("   3. Crea las colecciones")
    print("   4. Importa todos los datos")
    print()
    print("🔗 Panel Directus: https://www.umbot.com.ar:8056/admin")

if __name__ == "__main__":
    main() 