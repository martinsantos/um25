
import requests
import re
import time
import sys
from collections import Counter

# Configuration
DIRECTUS_URL = "http://localhost:8055"
SITE_URL = "https://www.ultimamilla.com.ar"
TOKEN = "k6P8LAY8_x_y1miB_KTlWnysCnx2Abky"
HEADERS = {"Authorization": f"Bearer {TOKEN}"}

def verify_site():
    print(f"Starting comprehensive site verification...")
    print(f"Directus API: {DIRECTUS_URL}")
    print(f"Site URL: {SITE_URL}")
    
    # 1. Fetch All Antecedentes from Directus
    print("\n[1/3] Fetching all antecedents from Directus...")
    try:
        res = requests.get(f"{DIRECTUS_URL}/items/Antecedentes?limit=-1&fields=id,Titulo,Imagen,original_id", headers=HEADERS)
        if res.status_code != 200:
            print(f"❌ Error fetching data: {res.status_code}")
            return
        
        antecedentes = res.json()['data']
        total_count = len(antecedentes)
        print(f"✅ Retrieved {total_count} records.")
    except Exception as e:
        print(f"❌ Exception fetching data: {e}")
        return

    # 2. Analyze Images
    print("\n[2/3] Verifying Image Integrity and Uniqueness...")
    image_ids = [a['Imagen'] for a in antecedentes if a.get('Imagen')]
    missing_images = [a for a in antecedentes if not a.get('Imagen')]
    unique_images = set(image_ids)
    
    print(f"  - Total Records: {len(antecedentes)}")
    print(f"  - Records with Images: {len(image_ids)}")
    print(f"  - Unique Images: {len(unique_images)}")
    print(f"  - Records Missing Images: {len(missing_images)}")
    
    if len(missing_images) > 0:
        print("  ⚠️ Warning: Some records missing images (listing first 5):")
        for m in missing_images[:5]:
            print(f"    - ID {m['id']}: {m['Titulo']}")
            
    # Check for duplicates if meaningful (some might legitimately share images?)
    img_counter = Counter(image_ids)
    duplicates = {k: v for k, v in img_counter.items() if v > 1}
    print(f"  - Images used more than once: {len(duplicates)}")

    # 3. Verify Public URLs & SEO
    print("\n[3/3] Verifying Public URLs & SEO (Canonical/Status)...")
    success_count = 0
    error_count = 0
    seo_failures = 0
    
    # We will check a sample to avoid taking too long, or all if user wants full check. 
    # User said "revisar... de los 518", so we should try all but fast.
    # We'll use a session for keep-alive
    session = requests.Session()
    session.headers.update({'User-Agent': 'UltimaMillaAuditbot/1.0'})
    
    print("  Checking all URLs (this may take a moment)...")
    
    # Using a subset for immediate feedback in this script run? 
    # No, user asked for "518", let's do batches or fast.
    # 518 requests is fine.
    
    start_time = time.time()
    
    for i, item in enumerate(antecedentes):
        # Construct URL
        # Logic: If original_id exists (UUID), url might be /antecedentes/original_id/slug?
        # IMPORTANT: The dynamic page logic we saw uses Astro.params.id.
        # Directus IDs are integers. Does the page support integer IDs?
        # Checked code: Yes "if (!isNaN(id)) { ... directus.request(...) }"
        
        item_id = item['id']
        # Simple slug generation for logging, actual URL matching depends on ID mainly
        slug_check = item['Titulo'].lower().replace(" ", "-").replace("ñ", "n")[:20]
        
        url = f"{SITE_URL}/antecedentes/{item_id}" 
        
        try:
            r = session.get(url, timeout=5, allow_redirects=True)
            
            status_symbol = "✅" if r.status_code == 200 else "❌"
            
            # Check Canonical
            canonical_match = re.search(r'<link\s+rel="canonical"\s+href="([^"]+)"', r.text)
            canonical = canonical_match.group(1) if canonical_match else "MISSING"
            
            is_seo_ok = True
            if not canonical.startswith("https://www.ultimamilla.com.ar"):
                is_seo_ok = False
                status_symbol = "⚠️ SEO"
            
            if r.status_code == 200 and is_seo_ok:
                success_count += 1
            else:
                if r.status_code != 200:
                    error_count += 1
                if not is_seo_ok:
                    seo_failures += 1
                print(f"  {status_symbol} [{i+1}/{total_count}] ID: {item_id} | Status: {r.status_code} | Canonical: {canonical}")

                
        except Exception as e:
            error_count += 1
            print(f"  ❌ [{i+1}/{total_count}] ID: {item_id} | Exception: {str(e)}")
            
        # Progress every 50
        if (i+1) % 50 == 0:
            print(f"     ... processed {i+1} records ...")

    duration = time.time() - start_time
    print("\n------------------------------------------------")
    print(f"AUDIT COMPLETE in {duration:.2f} seconds")
    print(f"Total Reviewed: {total_count}")
    print(f"✅ Success (200 + Valid SEO): {success_count}")
    print(f"❌ HTTP Errors: {error_count}")
    print(f"⚠️ SEO Failures (Canonical mismatch): {seo_failures}")
    print("------------------------------------------------")

if __name__ == "__main__":
    verify_site()

