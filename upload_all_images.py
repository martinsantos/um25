#!/usr/bin/env python3
import os
import requests
import json
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

def main():
    print("Iniciando proceso de subida de imágenes...")
    
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
    for antecedente in antecedentes:
        titulo = antecedente.get('Titulo', '')
        cliente = antecedente.get('Cliente', '')
        
        # Buscar imagen correspondiente
        found_image = None
        for filename, filepath in file_mapping.items():
            # Buscar por cliente en el nombre del archivo
            if cliente and cliente.lower() in filename.lower():
                found_image = filepath
                break
        
        if found_image:
            print(f"Subiendo imagen para: {titulo} - {cliente}")
            
            # Subir archivo a Directus
            file_id = upload_file_to_directus(found_image, token)
            if file_id:
                # Actualizar antecedente
                if update_antecedente_image(antecedente['id'], file_id, token):
                    uploaded_count += 1
                    print(f"✓ Imagen subida y asignada: {filename}")
                else:
                    print(f"✗ Error al asignar imagen: {filename}")
            else:
                print(f"✗ Error al subir imagen: {filename}")
        else:
            print(f"⚠ No se encontró imagen para: {titulo} - {cliente}")
    
    print(f"\nProceso completado. {uploaded_count} imágenes subidas y asignadas.")

if __name__ == "__main__":
    main() 