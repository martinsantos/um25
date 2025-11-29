# Guía Completa: Generación de Imágenes con OLLAMA para Antecedentes

**Fecha**: 2025-11-29
**Versión**: 1.0
**Estado**: Documentación Completa
**Ubicación de Scripts**: `antecedentes-scripts-01/antecedentes-scripts-01/`

---

## 📋 Tabla de Contenidos

1. [Descripción General](#descripción-general)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Requisitos de Hardware y Software](#requisitos)
4. [Configuración Inicial](#configuración-inicial)
5. [Proceso de Generación Paso a Paso](#proceso-paso-a-paso)
6. [Scripts Disponibles](#scripts-disponibles)
7. [Mejores Prácticas](#mejores-prácticas)
8. [Solución de Problemas](#solución-de-problemas)
9. [Resultados y Validación](#resultados-y-validación)
10. [Integración con Directus](#integración-con-directus)

---

## 1. Descripción General

### Propósito

El sistema de generación de imágenes con OLLAMA automatiza la creación de imágenes profesionales y fotorrealistas para cada antecedente (proyecto) de ULTIMA MILLA.

**Pipeline completo**:
```
JSON con antecedentes
    ↓
Procesar cada proyecto
    ↓
OLLAMA genera prompt detallado
    ↓
Stable Diffusion XL genera imagen
    ↓
Refiner optimiza calidad
    ↓
Guardar imagen en disco
    ↓
Generar JSON para importar a Directus
    ↓
Directus ingesta imágenes
```

### Beneficios

✅ **Automatización completa**: De 469 antecedentes a 469 imágenes en horas
✅ **Consistencia visual**: Mismo estilo profesional para todos
✅ **Fotorrealismo técnico**: Imágenes de infraestructura realistas
✅ **Contexto realista**: Escenarios empresariales auténticos
✅ **Zero costo**: Modelos open-source, sin API pagadas

---

## 2. Arquitectura del Sistema

### Componentes Principales

```
┌─────────────────────────────────────────────────────────────────┐
│                    SISTEMA OLLAMA IMAGE GEN                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  INPUT LAYER                                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ JSON Files (antecedentes_*.json)                         │  │
│  │ - Titulo, Descripcion, Palabras_clave, Areas            │  │
│  │ - 469+ proyectos                                         │  │
│  └──────────────────────────────────────────────────────────┘  │
│                            ↓                                     │
│  PROMPT GENERATION LAYER                                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ OLLAMA API (http://localhost:11434)                      │  │
│  │ Models: Llama3, Mistral, Gemma                           │  │
│  │ Role: Generate 70-word image prompts                     │  │
│  │ Temperature: 0.7 (creative but focused)                  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                            ↓                                     │
│  IMAGE GENERATION LAYER                                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Stable Diffusion XL (Diffusers + PyTorch)               │  │
│  │ - Base Model: stabilityai/stable-diffusion-xl-base      │  │
│  │ - Refiner: stabilityai/stable-diffusion-xl-refiner      │  │
│  │ - Resolution: 768x768 pixels                            │  │
│  │ - Steps: Base=15, Refiner=10                            │  │
│  │ - Device: GPU (Apple Silicon MPS or CUDA)              │  │
│  └──────────────────────────────────────────────────────────┘  │
│                            ↓                                     │
│  OUTPUT LAYER                                                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Generated Images + Metadata                              │  │
│  │ - Directory: imagenes_ollama_mps_refinadas/             │  │
│  │ - Format: PNG                                            │  │
│  │ - Metadata JSON: datos_imagenes_para_directus_*.json    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                            ↓                                     │
│  DIRECTUS IMPORT LAYER                                           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Directus REST API                                         │  │
│  │ - Carga imágenes al servidor                            │  │
│  │ - Asocia con antecedentes                               │  │
│  │ - Actualiza URLs en BD                                  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Tecnologías

| Componente | Herramienta | Versión | Propósito |
|-----------|-----------|---------|----------|
| **LLM** | Ollama | 0.1+ | Generar prompts detallados |
| **Modelos LLM** | Llama3, Mistral, Gemma | Última | Generación de texto |
| **Generador de Imágenes** | Stable Diffusion XL | 1.0 | Crear imágenes |
| **Framework de IA** | PyTorch | 2.0+ | Backend computacional |
| **Pipeline** | Diffusers (HF) | 0.24+ | Orquestación SDXL |
| **GPU** | Apple Silicon MPS / CUDA | - | Aceleración |
| **Lenguaje** | Python | 3.10+ | Scripting |

---

## 3. Requisitos de Hardware y Software

### Hardware Mínimo Recomendado

**Opción A: Apple Silicon (Mac M1/M2/M3)**
```
CPU: Apple Silicon (M1/M2/M3)
RAM: 16GB+ (8GB mínimo)
GPU: Integrada (MPS) - optimizada para Diffusers
Almacenamiento: 50GB disponibles (modelos + imágenes)
Tiempo estimado: 5-8 segundos por imagen
```

**Opción B: CUDA (NVIDIA GPU)**
```
GPU: NVIDIA RTX 3060+ o similar
VRAM: 8GB+ (12GB recomendado)
RAM: 16GB+
Almacenamiento: 50GB disponibles
Tiempo estimado: 3-5 segundos por imagen
```

**Opción C: CPU (fallback - lento)**
```
CPU: 8+ cores
RAM: 32GB+
Almacenamiento: 50GB disponibles
Tiempo estimado: 30-60 segundos por imagen
```

### Software Requerido

```bash
# Python 3.10+
python --version
# Python 3.10.12

# Ollama (para LLM)
ollama --version
# ollama version is 0.1.28

# Sistema operativo
# macOS 12+ (MPS) o Linux/Windows (CUDA)
```

### Dependencias Python

```bash
# Instalar desde requirements.txt
pip install -r requirements.txt

# O manualmente:
pip install ollama
pip install diffusers transformers torch torchvision
pip install pillow
pip install tqdm
pip install torch-nightly  # Para MPS optimizado
```

---

## 4. Configuración Inicial

### 4.1 Instalar OLLAMA

**macOS**:
```bash
# Descargar desde https://ollama.ai
# O via brew
brew install ollama

# Iniciar servicio
ollama serve

# En otra terminal, descargar modelos
ollama pull llama3
ollama pull mistral
ollama pull gemma
```

**Linux**:
```bash
curl -fsSL https://ollama.ai/install.sh | sh
ollama serve &
ollama pull llama3
```

**Verificar que OLLAMA está corriendo**:
```bash
curl http://localhost:11434/api/tags
# Debe devolver lista de modelos disponibles
```

### 4.2 Instalar PyTorch con Soporte GPU

**Para Apple Silicon (MPS)**:
```bash
# Versión nightly con MPS optimizado
pip install torch::torch torchvision torch-nightly

# Verificar
python -c "import torch; print(torch.backends.mps.is_available())"
# True
```

**Para NVIDIA CUDA**:
```bash
# CUDA 12.1
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121

# Verificar
python -c "import torch; print(torch.cuda.is_available())"
# True
```

### 4.3 Descargar Modelos Stable Diffusion

Primer inicio descargará automáticamente (~25GB):
- `stabilityai/stable-diffusion-xl-base-1.0` (~6GB)
- `stabilityai/stable-diffusion-xl-refiner-1.0` (~6GB)

Esto ocurre durante la **primera ejecución** del script (puede tomar 5-10 minutos).

### 4.4 Preparar Datos de Entrada

**Estructura requerida**:
```
antecedentes-scripts-01/
├── imagenv4.py                          # Script principal
├── importgemmav2.py                     # Importador Gemma v2
├── antecedentes_STUDIOAI_gemma_v2.json  # ← Usar ESTE archivo
├── antecedentes_gemma_segunda_gen_v91.json
└── antecedentes_corregidos_enriquecidos_v7.json
```

**Formato JSON requerido**:
```json
[
  {
    "id": 10769,
    "Titulo": "Ministerio de Deportes - Redes",
    "Descripcion": "Instalación completa de red LAN/WAN...",
    "Palabras_clave": "networking, firewall, seguridad, redundancia",
    "Areas": ["Redes", "Telecomunicaciones"],
    "Cliente": "Gobierno de Mendoza"
  },
  ...
]
```

---

## 5. Proceso de Generación Paso a Paso

### 5.1 Ejecución del Script Principal

```bash
# Navegar a directorio
cd fumbling-field/antecedentes-scripts-01/antecedentes-scripts-01/

# Ejecutar script
python imagenv4.py

# Esperar respuesta
# > Ingrese el nombre del archivo JSON de entrada (en el mismo directorio):
# Ingresar: antecedentes_STUDIOAI_gemma_v2.json
```

### 5.2 Flujo de Ejecución Detallado

**Fase 1: Inicialización (30 segundos)**
```
✓ Cargar archivo JSON
✓ Verificar dispositivo MPS/CUDA
✓ Cargar pipelines Stable Diffusion
✓ Conectar con OLLAMA API
```

**Fase 2: Por cada antecedente (5-8 seg)**
```
[1/469] Procesando: Ministerio de Deportes - Redes
  ├─ Título: "Ministerio de Deportes - Redes"
  ├─ Descripción: "Instalación completa..."
  ├─ Generando prompt con Llama3...
  │  └─ Output: "Professional photo of network infrastructure
  │              in modern government office, fiber optic cables,
  │              network switches, real-world installation scenario..."
  ├─ Generando imagen con SDXL Base...
  ├─ Refinando con SDXL Refiner...
  ├─ Guardando: imagenes_ollama_mps_refinadas/ministerio_de_deportes_redes_10769.png
  ├─ Metadata: 768x768px, Real, PNG
  └─ Tiempo: 6.23 segundos
```

**Fase 3: Guardar resultados (10 segundos)**
```
✓ Crear JSON: datos_imagenes_para_directus_20251129_094530.json
✓ Incluir URLs de imágenes
✓ Incluir metadata (título, descripción, cliente)
✓ Listo para importar a Directus
```

**Tiempo total estimado**:
```
469 imágenes × 6.5 seg/imagen = 50 minutos (con GPU optimizada)
469 imágenes × 30 seg/imagen = 234 minutos (CPU)
```

### 5.3 Configuración Avanzada (Opcional)

**Dentro de imagenv4.py, líneas 13-36**:

```python
# CONFIGURACIÓN CRÍTICA

# Resolución (reducir para menos memoria)
RESOLUTION = 768  # Reducir a 512 si hay OutOfMemory

# Pasos de inferencia (reducir para más velocidad)
NUM_INFERENCE_STEPS_BASE = 15  # Default
NUM_INFERENCE_STEPS_REFINER = 10  # Default

# Usar refinador (desactivar para velocidad)
USE_REFINER = True  # Set to False si memoria insuficiente

# Modelo LLM para prompts
LLM_FOR_PROMPTING = "llama3"  # Options: llama3, mistral, gemma

# Guidance scale (cuánto seguir el prompt)
GUIDANCE_SCALE = 7.5  # 7-8 es recomendado
```

---

## 6. Scripts Disponibles

### 6.1 Comparativa de Versiones

| Script | Líneas | Propósito | Generación | Refinamiento | Notas |
|--------|--------|----------|-----------|--------------|-------|
| **imagenv4.py** | 497 | 🎯 **ACTUAL** | SDXL Base | SDXL Refiner | Versión recomendada, optimizada MPS |
| imagenv3.py | 424 | Generación | SDXL | Refiner | Anterior, sin MPS |
| imagenv2.py | 319 | Generación | Stable Diffusion v1.5 | No | Legacy |
| importgemmav2.py | 685 | 🎯 **DESCRIPCIÓN** | - | - | Última versión Gemma, 70+ palabras |
| importllama3v6.py | 516 | Descripción | - | - | Llama3 v6 enhancement |
| importmistralv1.py | 515 | Descripción | - | - | Mistral descriptions |

### 6.2 Script Recomendado: imagenv4.py

**Ubicación**: `antecedentes-scripts-01/antecedentes-scripts-01/imagenv4.py`

**Funciones principales**:

```python
# 1. Verificar GPU disponible
check_mps_device()

# 2. Generar prompt con OLLAMA
generate_detailed_prompt(client, 'llama3', project_data)

# 3. Cargar modelos Stable Diffusion
load_diffusion_pipelines(base_model, refiner_model, device)

# 4. Generar imagen
image = pipe_base(prompt=prompt, negative_prompt=negative).images[0]

# 5. Refinar imagen
image_refined = pipe_refiner(prompt=prompt, image=image).images[0]

# 6. Guardar con metadata
image.save(f'{output_dir}/proyecto_{id}.png')
metadata.append({'id': id, 'image_url': image_url})

# 7. Exportar JSON para Directus
json.dump(metadata, output_file)
```

---

## 7. Mejores Prácticas

### 7.1 Preparación de Datos

✅ **DO:**
- Asegurar que cada antecedente tiene: Título, Descripción, Palabras_clave
- Usar palabras clave técnicas y específicas
- Verificar que el JSON está correctamente formado

❌ **DON'T:**
- Dejar campos vacíos (usar fallback o valores por defecto)
- Usar descripciones genéricas
- Incluir caracteres especiales sin escaping

**Validar JSON antes**:
```bash
python -m json.tool antecedentes_STUDIOAI_gemma_v2.json > /dev/null && echo "✓ JSON válido"
```

### 7.2 Optimización de Prompts

**Prompt generado por OLLAMA** (ejemplo):
```
"Professional photo of network infrastructure installation by Última Milla.
Corporate office environment with fiber optic cables, network switches,
cable management racks. Sharp focus, 8k resolution, real-world technical
setting. Day lighting, clean workspace, professional installation in progress."
```

**Características del buen prompt**:
- ✅ Especifica el contexto (oficina corporativa, sitio técnico)
- ✅ Incluye detalles técnicos (fibra óptica, switches, racks)
- ✅ Define iluminación y estética (sharp focus, 8k, professional)
- ✅ Menciona la empresa (Última Milla)
- ✅ Máximo 70 palabras (equilibrio entre detalle y velocidad)

### 7.3 Gestión de Memoria

**Para sistemas con RAM limitada**:

```python
# En imagenv4.py, modificar línea 29:
RESOLUTION = 512  # Reducir de 768 a 512

# Y líneas 30-31:
NUM_INFERENCE_STEPS_BASE = 10   # Reducir de 15
NUM_INFERENCE_STEPS_REFINER = 8  # Reducir de 10

# Y línea 33:
USE_REFINER = False  # Desactivar refinador

# Resultado: Más rápido, menos VRAM, calidad ligeramente menor
```

**Monitoreo durante ejecución**:
```bash
# En otra terminal (macOS)
watch -n 1 'ps aux | grep python'

# O si tienes GPU NVIDIA
watch -n 1 'nvidia-smi'
```

### 7.4 Recuperación de Errores

**Reintentos automáticos** (ya incluidos):
```python
OLLAMA_PROMPT_RETRIES = 3     # Reintentos para OLLAMA
DIFFUSERS_RETRIES = 2         # Reintentos para SDXL

# Si OLLAMA falla, usa fallback:
fallback_prompt = f"professional photo of {title}. {keywords}"
```

**Continuar desde el punto de fallo**:
```bash
# El script genera checkpoint cada 10 imágenes
# Si se interrumpe, copiar JSON de salida y continuar manualmente

python imagenv4.py
# Ingrese archivo: antecedentes_STUDIOAI_gemma_v2.json
# [Continúa desde donde se pausó]
```

---

## 8. Solución de Problemas

### Error: "MPS no está disponible"

```
Error: Se requiere soporte MPS (GPU Apple Silicon)
```

**Solución**:
```bash
# Reinstalar PyTorch con soporte MPS
pip uninstall torch torchvision
pip install torch::torch torchvision --index-url https://download.pytorch.org/whl/nightly/cpu

# O cambiar a CUDA si tienes NVIDIA
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
```

### Error: "OLLAMA API unreachable"

```
ERROR al contactar Ollama o generar prompt: Connection refused
```

**Solución**:
```bash
# Verificar que OLLAMA está corriendo
ollama serve

# En otra terminal, verificar
curl http://localhost:11434/api/tags

# Si no funciona, descargar modelos
ollama pull llama3
```

### Error: "Out of Memory"

```
RuntimeError: CUDA out of memory. Tried to allocate ...
```

**Solución**:
1. Reducir RESOLUTION a 512 (línea 29)
2. Reducir NUM_INFERENCE_STEPS a 10 (línea 30)
3. Desactivar refiner USE_REFINER = False (línea 33)
4. Limpiar cache: `python -c "import torch; torch.cuda.empty_cache()"`

### Error: "JSON no válido"

```
json.JSONDecodeError: Expecting value
```

**Solución**:
```bash
# Validar JSON
python -m json.tool antecedentes_STUDIOAI_gemma_v2.json > /dev/null

# Si tiene error, reparar con
python -c "
import json
with open('archivo.json', 'r', encoding='utf-8') as f:
    data = json.load(f)
with open('archivo_reparado.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)
"
```

### Advertencia: "Modelos descargándose"

```
Downloading (…)4e1d2/model.safetensors: 100%|████| 6.94G/6.94G
```

**Esto es normal**. Primera ejecución descarga ~25GB de modelos.

---

## 9. Resultados y Validación

### 9.1 Output Esperado

Después de ejecutar `python imagenv4.py`:

**Directorio**: `imagenes_ollama_mps_refinadas/`
```bash
imagenes_ollama_mps_refinadas/
├── ministerio_de_deportes_redes_10769.png         (768x768)
├── bodega_domaine_bousquet_redes_10771.png        (768x768)
├── municipalidad_de_san_isidro_redes_10773.png    (768x768)
├── ... (467 más)
```

**Archivo JSON**: `datos_imagenes_para_directus_20251129_094530.json`
```json
[
  {
    "id": 10769,
    "titulo": "Ministerio de Deportes - Redes",
    "descripcion": "Instalación completa de red LAN/WAN...",
    "cliente": "Gobierno de Mendoza",
    "imagen_archivo": "ministerio_de_deportes_redes_10769.png",
    "imagen_url": "/imagenes_ollama_mps_refinadas/ministerio_de_deportes_redes_10769.png",
    "prompt_generado": "Professional photo of network infrastructure...",
    "fecha_generacion": "2025-11-29T09:45:30"
  },
  ...
]
```

### 9.2 Validación de Calidad

**Checklist visual**:
- ✅ Imagen es fotorrealista (no cartoon/anime)
- ✅ Tema relacionado con infraestructura técnica
- ✅ Profesional y limpia
- ✅ Resolución clara (768x768)
- ✅ Colores naturales

**Validación técnica**:
```bash
# Verificar que todas las imágenes existen
ls imagenes_ollama_mps_refinadas/ | wc -l
# 469

# Verificar tamaño
du -sh imagenes_ollama_mps_refinadas/
# ~1.2GB

# Verificar que JSON es válido
python -m json.tool datos_imagenes_para_directus_*.json > /dev/null && echo "✓ JSON válido"
```

---

## 10. Integración con Directus

### 10.1 Preparar Imágenes para Directus

**Crear carpeta en servidor**:
```bash
ssh ultimamilla
mkdir -p /root/fumbling-field/public/imagenes_antecedentes
chmod 755 /root/fumbling-field/public/imagenes_antecedentes
```

**Copiar imágenes**:
```bash
scp -r imagenes_ollama_mps_refinadas/* ultimamilla:/root/fumbling-field/public/imagenes_antecedentes/
```

### 10.2 Importar a Directus

**Opción A: Mediante API REST**:
```python
import requests
import json

# Cargar metadata
with open('datos_imagenes_para_directus_*.json', 'r') as f:
    images_data = json.load(f)

# Headers de autenticación
headers = {
    'Authorization': 'Bearer tu_directus_token',
    'Content-Type': 'application/json'
}

# Directus API
DIRECTUS_URL = 'http://23.105.176.45:8055'

for image in images_data:
    # Actualizar antecedente con URL de imagen
    data = {
        'imagen_url': image['imagen_url'],
        'imagen_alt': image['titulo']
    }

    response = requests.patch(
        f'{DIRECTUS_URL}/items/Antecedentes/{image["id"]}',
        json=data,
        headers=headers
    )

    if response.status_code == 200:
        print(f"✓ Actualizado: {image['titulo']}")
    else:
        print(f"✗ Error: {image['titulo']}: {response.text}")
```

**Opción B: Manualmente en UI de Directus**:
1. Abrir https://23.105.176.45:8055/admin
2. Ir a Colección: Antecedentes
3. Para cada registro, agregar imagen en campo `imagen`

### 10.3 Verificación Final

```bash
# Visitar el sitio y verificar
curl https://www.ultimamilla.com.ar/antecedentes/10769
# Debe mostrar imagen en página
```

---

## 11. Variantes y Extensiones

### 11.1 Usar Diferentes Modelos LLM

**Cambiar modelo en imagenv4.py**:

```python
# Línea 19 - Cambiar modelo
LLM_FOR_PROMPTING = "mistral"  # o "gemma"

# O usar script específico:
python importgemmav2.py          # Para descripciones Gemma
python importllama3v6.py         # Para descripciones Llama3
python importmistralv1.py        # Para descripciones Mistral
```

### 11.2 Generar Solo Descripciones (Sin Imágenes)

**Usar llmesteroides.py**:
```bash
python llmesteroides.py antecedentes_STUDIOAI_gemma_v2.json

# Genera nuevo JSON con descripciones mejoradas
# Sin generar imágenes (más rápido)
```

### 11.3 Procesar por Lotes

**Para evitar OutOfMemory con 469 imágenes**:

```bash
# Dividir JSON en lotes de 50
python -c "
import json
with open('antecedentes_STUDIOAI_gemma_v2.json') as f:
    data = json.load(f)

for i in range(0, len(data), 50):
    batch = data[i:i+50]
    with open(f'batch_{i//50 + 1}.json', 'w') as f:
        json.dump(batch, f)
"

# Procesar cada lote
for file in batch_*.json; do
    python imagenv4.py
    # Ingrese: $file
done

# Combinar resultados
python -c "
import json
import glob
all_images = []
for f in glob.glob('datos_imagenes_para_directus_*.json'):
    with open(f) as file:
        all_images.extend(json.load(file))
with open('datos_imagenes_para_directus_FINAL.json', 'w') as f:
    json.dump(all_images, f)
"
```

---

## 12. FAQ y Preguntas Frecuentes

### ¿Cuánto tiempo toma generar 469 imágenes?

Con GPU optimizada (Apple M2/M3 o RTX 3080+): **50-80 minutos**

### ¿Puedo usar CPU en lugar de GPU?

Sí, pero será **500-1000% más lento**. GPU es altamente recomendado.

### ¿Las imágenes son únicas o hay duplicados?

Cada imagen es única. Usa diferentes prompts (generados por OLLAMA) y semilla aleatoria.

### ¿Puedo mejorar la calidad de las imágenes?

Sí:
- Aumentar RESOLUTION a 1024 (más lento)
- Aumentar NUM_INFERENCE_STEPS a 20-30
- Activar USE_REFINER = True
- Usar GUIDANCE_SCALE = 9-10

### ¿Qué hacer si las imágenes no se ven técnicas?

El prompt generado por OLLAMA podría no ser suficientemente técnico. Modificar en imagenv4.py línea 78-93 para dar más énfasis a términos técnicos específicos.

### ¿Cómo integro esto en el CI/CD de GitHub Actions?

Crear workflow en `.github/workflows/generate-images.yml`:
```yaml
name: Generate Images
on: workflow_dispatch
jobs:
  generate:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4
      - run: |
          pip install -r antecedentes-scripts-01/requirements.txt
          cd antecedentes-scripts-01/antecedentes-scripts-01
          python imagenv4.py << EOF
          antecedentes_STUDIOAI_gemma_v2.json
          EOF
      - run: |
          scp -r imagenes_ollama_mps_refinadas/* ultimamilla:/root/fumbling-field/public/
```

---

## Conclusión

**Estado**: ✅ Sistema funcional y documentado

**Próximos Pasos**:
1. Validar que OLLAMA está instalado y corriendo
2. Ejecutar `python imagenv4.py` con antecedentes_STUDIOAI_gemma_v2.json
3. Revisar imágenes generadas en `imagenes_ollama_mps_refinadas/`
4. Importar a Directus usando JSON generado
5. Verificar en www.ultimamilla.com.ar/antecedentes

---

**Documento creado**: 2025-11-29
**Versión**: 1.0
**Autor**: Claude Code
**Estado**: ✅ DOCUMENTACIÓN COMPLETA Y LISTA PARA IMPLEMENTACIÓN
