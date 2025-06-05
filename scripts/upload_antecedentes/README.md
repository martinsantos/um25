# Carga de Antecedentes a Directus

Este script permite cargar imágenes y actualizar registros de la colección "Antecedentes" en Directus.

## Requisitos

- Python 3.7 o superior
- Las siguientes dependencias de Python:
  - requests

## Instalación

1. Instalar las dependencias:

```bash
pip install -r requirements.txt
```

## Configuración

1. Asegurarse de que los siguientes archivos estén en el directorio raíz del proyecto:
   - `antev3.json`: Datos de los antecedentes
   - `datos_imagenes_para_directus_20250415_181330.json`: Mapeo de imágenes
   - `imagenes_antecedentes_versionproduccion/`: Directorio con las imágenes

2. Configurar las variables en el script si es necesario:
   - `DIRECTUS_URL`: URL de la instancia de Directus
   - `TOKEN`: Token de autenticación de Directus
   - `COLLECTION`: Nombre de la colección en Directus (por defecto: "Antecedentes")

## Uso

```bash
# Navegar al directorio del script
cd scripts/upload_antecedentes/

# Ejecutar el script
python3 upload_antecedentes.py
```

El script generará un archivo de log (`upload_antecedentes.log`) con información detallada del proceso.

## Estructura de Datos

### Archivo de Antecedentes (`antev3.json`)

Contiene los registros de antecedentes con la siguiente estructura:

```json
[
  {
    "Titulo": "Título del antecedente",
    "Descripcion": "Descripción detallada...",
    "Cliente": "Nombre del cliente",
    "Imagen": null,
    ...
  },
  ...
]
```

### Archivo de Mapeo de Imágenes (`datos_imagenes_para_directus_*.json`)

Relaciona cada registro con su imagen generada:

```json
[
  {
    "numero": 1,
    "titulo_original": "Título original del proyecto",
    "descripcion_original": "Descripción original...",
    "nombre_archivo_generado": "ruta/a/la/imagen.png",
    ...
  },
  ...
]
```

## Directorio de Imágenes

Las imágenes deben estar en el directorio `imagenes_antecedentes_versionproduccion/` en la raíz del proyecto. Los nombres de los archivos deben coincidir con los especificados en el archivo de mapeo.

## Solución de Problemas

- **Error de permisos**: Asegurarse de que el token tenga permisos para crear/actualizar registros en la colección "Antecedentes".
- **Imágenes no encontradas**: Verificar que los nombres de los archivos en el mapeo coincidan exactamente con los nombres de los archivos en el directorio de imágenes.
- **Errores de conexión**: Verificar que la URL de Directus sea correcta y que el servicio esté en ejecución.

## Registro

El script genera un archivo de log (`upload_antecedentes.log`) con información detallada sobre el proceso de carga, incluyendo advertencias y errores.
