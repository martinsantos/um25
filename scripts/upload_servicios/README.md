# Cargador de Servicios para Directus

Este script carga automáticamente servicios desde un archivo JSON a la colección de "Servicios" en Directus, incluyendo la asociación de imágenes cuando están disponibles.

## Requisitos

- Python 3.8 o superior
- Acceso a la instancia de Directus
- Token de autenticación de Directus con permisos suficientes

## Instalación

1. Clona el repositorio o descarga los archivos
2. Instala las dependencias:

```bash
pip install -r requirements.txt
```

## Configuración

Asegúrate de que el archivo `servicios.json` esté en la ruta correcta (`src/data/servicios.json`).

Las imágenes deben estar en el directorio `imagenes_antecedentes_versionproduccion` en la raíz del proyecto.

## Uso

```bash
python upload_servicios.py
```

El script generará un archivo de log (`upload_servicios.log`) con información detallada del proceso.

## Estructura de datos esperada

El script espera un archivo JSON con un array de objetos, donde cada objeto representa un servicio con los siguientes campos:

- `B`: Área del servicio
- `C`: Cliente/Organismo
- `D`: Descripción del servicio
- `E`: Datos de contacto (opcional)
- `F`: Nombre del contacto responsable (opcional)
- `G`: Monto contratado (opcional)
- `I`: Unidad de Negocio ID (opcional)

## Notas

- El script intentará encontrar imágenes que coincidan con el nombre del servicio en el directorio de imágenes.
- Los servicios se crearán con estado "published" por defecto.
- Se generará un registro detallado en `upload_servicios.log`.
