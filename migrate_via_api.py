#!/usr/bin/env python3
import json
import requests
import time

# Configuración
DIRECTUS_URL = "http://23.105.176.45:8055"
TOKEN = open('directus_token.txt').read().strip()

# Headers para las requests
headers = {
    'Authorization': f'Bearer {TOKEN}',
    'Content-Type': 'application/json'
}

print("🚀 Iniciando migración vía API REST de Directus")

# Cargar datos de antecedentes
with open('antev3.json', 'r', encoding='utf-8') as f:
    antecedentes = json.load(f)

print(f"📄 Migrando {len(antecedentes)} antecedentes...")

# Migrar antecedentes en lotes
batch_size = 10
successful = 0
errors = 0

for i in range(0, len(antecedentes), batch_size):
    batch = antecedentes[i:i+batch_size]
    
    for item in batch:
        try:
            # Preparar datos para Directus
            data = {
                'titulo': (item.get('titulo') or 'Sin título')[:255],
                'cliente': (item.get('cliente') or '')[:255],
                'descripcion': (item.get('descripcion') or '')[:1000],
                'imagen': (item.get('imagen') or '')[:255],
                'unidad_de_negocio': (item.get('unidad_de_negocio') or '')[:255],
                'area': (item.get('area') or '')[:255]
            }
            
            # Crear item en Directus
            response = requests.post(
                f'{DIRECTUS_URL}/items/antecedentes',
                headers=headers,
                json=data
            )
            
            if response.status_code in [200, 201]:
                successful += 1
                if successful % 50 == 0:
                    print(f"✅ {successful} antecedentes migrados...")
            else:
                print(f"❌ Error en item {successful + errors + 1}: {response.status_code}")
                errors += 1
                
        except Exception as e:
            print(f"❌ Excepción en item {successful + errors + 1}: {e}")
            errors += 1
            
    # Pausa entre lotes para no sobrecargar la API
    time.sleep(1)

print(f"🎉 Migración completada: {successful} exitosos, {errors} errores")

# Migrar servicios básicos
servicios = [
    {"titulo": "Servicios IT", "descripcion": "Desarrollo de software a medida, consultoría tecnológica y soporte técnico especializado.", "icono": "computer"},
    {"titulo": "Redes de datos", "descripcion": "Diseño, implementación y mantenimiento de infraestructuras de red robustas y seguras.", "icono": "network"},
    {"titulo": "Seguridad Informática", "descripcion": "Soluciones integrales de ciberseguridad, auditorías y protección de datos.", "icono": "shield"},
    {"titulo": "Telefonía y Citofonía", "descripcion": "Sistemas de comunicación empresarial, telefonía IP y citofonía digital.", "icono": "phone"},
    {"titulo": "Servicios Web", "descripcion": "Desarrollo web, e-commerce, aplicaciones cloud y transformación digital.", "icono": "globe"}
]

print(f"📋 Migrando {len(servicios)} servicios...")
servicios_exitosos = 0

for servicio in servicios:
    try:
        response = requests.post(
            f'{DIRECTUS_URL}/items/Servicios',
            headers=headers,
            json=servicio
        )
        
        if response.status_code in [200, 201]:
            servicios_exitosos += 1
            print(f"✅ Servicio '{servicio['titulo']}' migrado")
        else:
            print(f"❌ Error en servicio '{servicio['titulo']}': {response.status_code}")
            
    except Exception as e:
        print(f"❌ Error en servicio '{servicio['titulo']}': {e}")

print(f"🎉 Servicios migrados: {servicios_exitosos}/{len(servicios)}")
print("✅ Migración completa finalizada")
