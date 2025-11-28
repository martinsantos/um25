#!/usr/bin/env python3
import os
import requests
import json
import re
from pathlib import Path

# Configuración de Directus
DIRECTUS_URL = "http://localhost:8055"
ADMIN_EMAIL = "admin@umbot.com.ar"
ADMIN_PASSWORD = "UmbotHybridAdmin2025!"
UPLOADS_DIR = "/root/fumbling-field/uploads"

def login_to_directus():
    """Iniciar sesión en Directus y obtener token"""
    login_data = {
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    }
    
    response = requests.post(f"{DIRECTUS_URL}/auth/login", json=login_data)
    if response.status_code == 200:
        return response.json()["data"]["access_token"]
    else:
        print(f"Error al iniciar sesión: {response.status_code}")
        return None

def upload_file_to_directus(file_path, token):
    """Subir un archivo a Directus"""
    headers = {
        "Authorization": f"Bearer {token}"
    }
    
    with open(file_path, 'rb') as f:
        files = {'file': f}
        response = requests.post(f"{DIRECTUS_URL}/files", headers=headers, files=files)
        
        if response.status_code == 200:
            return response.json()["data"]["id"]
        else:
            print(f"Error al subir {file_path}: {response.status_code}")
            return None

def update_antecedente_image(antecedente_id, file_id, token):
    """Actualizar el campo imagen de un antecedente"""
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    data = {
        "imagen": file_id
    }
    
    response = requests.patch(
        f"{DIRECTUS_URL}/items/antecedentes/{antecedente_id}",
        headers=headers,
        json=data
    )
    
    if response.status_code == 200:
        return True
    else:
        print(f"Error al actualizar antecedente {antecedente_id}: {response.status_code}")
        return False

def get_antecedentes_without_images(token):
    """Obtener antecedentes sin imágenes"""
    headers = {
        "Authorization": f"Bearer {token}"
    }
    
    response = requests.get(
        f"{DIRECTUS_URL}/items/antecedentes?filter[imagen][_null]=true&limit=-1",
        headers=headers
    )
    
    if response.status_code == 200:
        return response.json()["data"]
    else:
        print(f"Error al obtener antecedentes: {response.status_code}")
        return []

def normalize_text(text):
    """Normalizar texto para búsqueda"""
    if not text:
        return ""
    # Convertir a minúsculas y reemplazar espacios con guiones bajos
    normalized = re.sub(r'[^a-zA-Z0-9\s]', '', text.lower())
    normalized = re.sub(r'\s+', '_', normalized)
    return normalized

def find_best_match_image(cliente, titulo, file_mapping):
    """Encontrar la mejor imagen que coincida con el cliente o título"""
    cliente_norm = normalize_text(cliente)
    titulo_norm = normalize_text(titulo)
    
    best_match = None
    best_score = 0
    
    for filename, filepath in file_mapping.items():
        filename_lower = filename.lower()
        score = 0
        
        # Buscar coincidencias exactas
        if cliente_norm in filename_lower:
            score += 10
        if titulo_norm in filename_lower:
            score += 8
            
        # Buscar palabras clave
        cliente_words = cliente_norm.split('_')
        for word in cliente_words:
            if len(word) > 3 and word in filename_lower:
                score += 2
                
        titulo_words = titulo_norm.split('_')
        for word in titulo_words:
            if len(word) > 3 and word in filename_lower:
                score += 1
        
        if score > best_score:
            best_score = score
            best_match = filepath
    
    return best_match, best_score

def main():
    print("Iniciando proceso de asignación completa de imágenes...")
    
    # Iniciar sesión
    token = login_to_directus()
    if not token:
        print("No se pudo iniciar sesión en Directus")
        return
    
    print("Sesión iniciada correctamente")
    
    # Obtener antecedentes sin imágenes
    antecedentes = get_antecedentes_without_images(token)
    print(f"Encontrados {len(antecedentes)} antecedentes sin imágenes")
    
    # Obtener lista de archivos de imagen
    image_files = []
    for ext in ['*.png', '*.jpg', '*.jpeg', '*.gif', '*.webp']:
        image_files.extend(Path(UPLOADS_DIR).glob(ext))
    
    print(f"Encontrados {len(image_files)} archivos de imagen")
    
    # Crear mapeo de nombres de archivo a rutas
    file_mapping = {}
    for file_path in image_files:
        file_mapping[file_path.name] = str(file_path)
    
    # Procesar cada antecedente
    uploaded_count = 0
    for i, antecedente in enumerate(antecedentes):
        titulo = antecedente.get('Titulo', '')
        cliente = antecedente.get('Cliente', '')
        
        print(f"Procesando {i+1}/{len(antecedentes)}: {titulo} - {cliente}")
        
        # Buscar imagen correspondiente
        found_image, score = find_best_match_image(cliente, titulo, file_mapping)
        
        if found_image and score > 0:
            print(f"  Encontrada imagen con score {score}: {os.path.basename(found_image)}")
            
            # Subir archivo a Directus
            file_id = upload_file_to_directus(found_image, token)
            if file_id:
                # Actualizar antecedente
                if update_antecedente_image(antecedente['id'], file_id, token):
                    uploaded_count += 1
                    print(f"  ✓ Imagen subida y asignada")
                else:
                    print(f"  ✗ Error al asignar imagen")
            else:
                print(f"  ✗ Error al subir imagen")
        else:
            print(f"  ⚠ No se encontró imagen adecuada")
    
    print(f"\nProceso completado. {uploaded_count} imágenes subidas y asignadas.")

if __name__ == "__main__":
    main() 