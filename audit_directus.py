
import json
import requests

# Configuration
DIRECTUS_URL = "http://localhost:8055"
# TOKEN is needed if the collection is not public
headers = {
    # "Authorization": "Bearer YOUR_TOKEN"
}

def get_directus_data():
    all_data = []
    page = 1
    limit = 100
    while True:
        url = f"{DIRECTUS_URL}/items/Antecedentes?limit={limit}&page={page}&fields=id,Titulo,original_id,Cliente,Area"
        response = requests.get(url, headers=headers)
        data = response.json().get('data', [])
        if not data:
            break
        all_data.extend(data)
        page += 1
    return all_data

# This script would be run on the server to count and map correctly
if __name__ == "__main__":
    try:
        data = get_directus_data()
        print(f"Total records in Directus: {len(data)}")
        # Output the first few for inspection
        print(json.dumps(data[:5], indent=2))
    except Exception as e:
        print(f"Error: {e}")
