
import json
import requests
import os
import time

# Config
DIRECTUS_URL = "http://localhost:8055"
TOKEN = "k6P8LAY8_x_y1miB_KTlWnysCnx2Abky"
HEADERS = {"Authorization": f"Bearer {TOKEN}"}
JS_FILE = "/var/www/ultimamilla.com.ar/src/data/antecedentes_enhanced.js"
IMG_BASE_DIR = "/var/www/ultimamilla.com.ar/public"

def run_sync():
    print("Starting sync process...")
    
    # 1. Read JS data
    try:
        with open(JS_FILE, "r") as f:
            content = f.read()
            # Extract JSON array part
            start = content.find("[")
            end = content.rfind("]") + 1
            if start == -1 or end == 0:
                print("Error parsing JS file: JSON array not found")
                return
            json_str = content[start:end]
            data = json.loads(json_str)
            print(f"Loaded {len(data)} records from JS file.")
    except Exception as e:
        print(f"Error reading JS file: {e}")
        return

    # 2. Get existing IDs from Directus (using original_id field for UUIDs)
    try:
        res = requests.get(f"{DIRECTUS_URL}/items/Antecedentes?limit=-1&fields=original_id", headers=HEADERS)
        if res.status_code != 200:
            print(f"Error fetching existing items: {res.text}")
            return
        
        existing_ids = set(item["original_id"] for item in res.json()["data"] if item.get("original_id"))
        print(f"Found {len(existing_ids)} existing records in Directus.")
    except Exception as e:
        print(f"Error connecting to Directus: {e}")
        return

    # 3. Identify missing items
    missing_items = [item for item in data if item["id"] not in existing_ids]
    print(f"Identified {len(missing_items)} missing items to sync.")

    if not missing_items:
        print("Nothing to sync.")
        return

    # 4. Sync loop
    success_count = 0
    fail_count = 0
    
    for i, item in enumerate(missing_items):
        print(f"[{i+1}/{len(missing_items)}] Processing: {item['Titulo']}")
        
        # Upload Image
        img_id = None
        if item.get("Imagen"):
            img_path = item["Imagen"]
            # Handle potential relative paths or different formats if needed
            # Assuming format like /imagenes_antecedentes_versionproduccion/...
            clean_path = img_path.lstrip("/")
            full_path = os.path.join(IMG_BASE_DIR, clean_path)
            
            if os.path.exists(full_path):
                try:
                    files = {'file': open(full_path, 'rb')}
                    img_title = os.path.basename(full_path)
                    
                    # Check if file already exists in Directus to avoid duplicates? 
                    # For now just upload. Directus might duplicate, but better safe than missing ref.
                    # Ideally we search by filename, but let's stick to simple upload for now.
                    
                    upload_res = requests.post(
                        f"{DIRECTUS_URL}/files", 
                        headers=HEADERS, 
                        files=files, 
                        data={'title': img_title}
                    )
                    
                    if upload_res.status_code == 200:
                        img_id = upload_res.json()['data']['id']
                        # print(f"  - Image uploaded: {img_id}")
                    else:
                        print(f"  - Image upload failed: {upload_res.status_code} {upload_res.text}")
                except Exception as e:
                    print(f"  - Image upload error: {e}")
            else:
                print(f"  - Image file not found at: {full_path}")
        
        # Prepare Item Payload
        payload = {
            "Titulo": item.get("Titulo"),
            "Descripcion": item.get("Descripcion"),
            "Fecha": item.get("Fecha"),
            "Cliente": item.get("Cliente"),
            "Unidad_de_negocio": item.get("Unidad_de_negocio"),
            "Area": item.get("Area"),
            "Presupuesto": item.get("Presupuesto"),
            "original_id": item.get("id"), # Map JS UUID to original_id
            "Imagen": img_id,
            "status": "published" # Ensure it's published
        }

        # create item
        try:
            create_res = requests.post(f"{DIRECTUS_URL}/items/Antecedentes", headers=HEADERS, json=payload)
            if create_res.status_code == 200:
                print("  - Item created successfully.")
                success_count += 1
            else:
                print(f"  - Item creation failed: {create_res.status_code} {create_res.text}")
                fail_count += 1
        except Exception as e:
            print(f"  - Item creation error: {e}")
            fail_count += 1
            
        # Rate limit prevent
        time.sleep(0.1)

    print("-" * 30)
    print(f"Sync Complete. Success: {success_count}, Failed: {fail_count}")

if __name__ == "__main__":
    run_sync()
