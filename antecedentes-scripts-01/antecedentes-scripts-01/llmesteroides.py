import json
from ollama import Client
from tqdm import tqdm

def generate_description(title, areas, client):
    """Genera una descripción para un antecedente."""
    prompt = f"""
    Eres un experto en marketing y debes generar una descripción detallada para un proyecto.
    El título del proyecto es: {title}.
    Las áreas de trabajo involucradas son: {', '.join(areas)}.
    Describe el proyecto, los objetivos, las tareas realizadas y los resultados obtenidos.
    La descripción debe tener entre 100 y 200 palabras.
    """
    response = client.generate(model='mistral', prompt=prompt)
    return response['response']

def process_antecedentes(filepath):
    """Procesa el archivo JSON de antecedentes."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            antecedentes = json.load(f)
    except FileNotFoundError:
        print(f"Error: Archivo no encontrado en {filepath}")
        return
    except json.JSONDecodeError:
        print(f"Error: El archivo {filepath} no es un JSON válido.")
        return

    client = Client(host='http://localhost:11434')

    for antecedente in tqdm(antecedentes, desc="Procesando antecedentes"):
        if not antecedente.get("Descripcion"):
            antecedente["Descripcion"] = generate_description(antecedente["Titulo"], antecedente["Areas"], client)

    # Guardar el JSON actualizado
    with open(filepath.replace('.json', '_updated.json'), 'w', encoding='utf-8') as f:
        json.dump(antecedentes, f, indent=2, ensure_ascii=False)

    print("Proceso completado. Archivo actualizado guardado.")

# Ejemplo de uso
process_antecedentes('antecedentes.json')
