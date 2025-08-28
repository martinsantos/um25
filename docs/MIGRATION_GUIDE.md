# Guía de Migración a Directus

## Descripción

Script automatizado para migrar datos de antecedentes y servicios desde archivos JSON a colecciones de Directus. El script procesa los datos, crea las colecciones necesarias con sus campos correspondientes, e importa los registros en lotes.

## Características

- ✅ **Migración automatizada** de antecedentes y servicios
- ✅ **Modo dry-run** para pruebas sin modificar datos
- ✅ **Configuración por variables de entorno**
- ✅ **Importación en lotes** para mejor rendimiento
- ✅ **Manejo robusto de errores**
- ✅ **Logging detallado** del progreso

## Configuración

### Variables de Entorno

Crear archivo `.env.migration` en la raíz del proyecto:

```bash
# URL de Directus (ajustar según el entorno)
DIRECTUS_URL=http://localhost:8055
# Para producción usar: http://23.105.176.45:8055

# Token estático de autenticación
DIRECTUS_STATIC_TOKEN=k6P8LAY8_x_y1miB_KTlWnysCnx2Abky

# Configuración de migración
MIGRATION_BATCH_SIZE=50
MIGRATION_DELAY_MS=100

# Modo dry-run (opcional)
DRY_RUN=false
```

### Archivos de Datos

El script busca los siguientes archivos en `migration_data/`:

- `antev3.json` - Datos de antecedentes
- `servicios.json` - Datos de servicios

## Uso

### Scripts NPM Disponibles

```bash
# Migración en modo dry-run (recomendado para pruebas)
npm run migrate:dry-run

# Migración real a Directus
npm run migrate:directus
```

### Ejecución Directa

```bash
# Dry-run
node scripts/migrate-to-directus.js --dry-run

# Migración real
node scripts/migrate-to-directus.js
```

## Proceso de Migración

### 1. Verificación de Conexión
- Verifica conectividad con Directus API
- Valida token de autenticación

### 2. Creación de Colecciones
- **Antecedentes**: Campos para título, descripción, imagen, fecha, cliente, etc.
- **Servicios**: Campos para título, descripción, imagen, icono, slug, orden

### 3. Procesamiento de Datos
- Limpia y normaliza datos de entrada
- Genera slugs automáticamente
- Asigna valores por defecto

### 4. Importación en Lotes
- Importa registros en lotes de 50 (configurable)
- Manejo de errores por lote
- Logging detallado del progreso

## Estructura de Datos

### Antecedentes
```json
{
  "status": "published",
  "Titulo": "Título del antecedente",
  "Descripcion": "Descripción detallada",
  "Imagen": null,
  "Archivo": null,
  "Fecha": "31-12-2023",
  "Cliente": "Nombre del cliente",
  "Unidad_de_negocio": "SW-001",
  "Presupuesto": "$10000",
  "Area": "Desarrollo",
  "Palabras_clave": "web, desarrollo"
}
```

### Servicios
```json
{
  "status": "published",
  "Titulo": "Nombre del servicio",
  "Descripcion": "Descripción del servicio",
  "Imagen": null,
  "Icono": "settings",
  "Slug": "nombre-del-servicio",
  "Orden": 1
}
```

## Resultados Esperados

### Dry-Run Mode
- **469 antecedentes** procesados y listos para importar
- **9 servicios** procesados y listos para importar
- Sin modificaciones en Directus
- Logging completo de todas las operaciones

### Migración Real
- Colecciones creadas en Directus
- Datos importados exitosamente
- Verificación final de conteos

## Troubleshooting

### Error de Conexión
```bash
❌ Error durante la migración: request to http://localhost:8055/server/health failed
```
**Solución**: Verificar que Directus esté ejecutándose y la URL sea correcta.

### Error de Autenticación
```bash
❌ HTTP 401: {"errors":[{"message":"Invalid token"}]}
```
**Solución**: Verificar que el token en `.env.migration` sea válido.

### Archivos de Datos No Encontrados
```bash
⚠️ Archivo de antecedentes no encontrado
```
**Solución**: Verificar que los archivos JSON estén en `migration_data/`.

## Configuración de Producción

Para migrar a producción, actualizar `.env.migration`:

```bash
DIRECTUS_URL=http://23.105.176.45:8055
DIRECTUS_STATIC_TOKEN=k6P8LAY8_x_y1miB_KTlWnysCnx2Abky
DRY_RUN=false
```

## Logs de Ejemplo

```
🚀 Iniciando migración a Directus...
📍 URL: http://localhost:8055
🔑 Token: k6P8LAY8...
🧪 Modo: DRY RUN

🔍 [DRY RUN] Saltando verificación de conexión...
✅ Conexión a Directus exitosa

📦 Creando colección: Antecedentes
✅ Colección Antecedentes creada exitosamente

📊 Antecedentes procesados: 469
📥 Importando 469 registros a Antecedentes
  ✅ Importados 469/469 registros
🎉 Importación de Antecedentes completada: 469 registros

🎉 Migración completada exitosamente!
```

## Mantenimiento

- Revisar logs regularmente para detectar errores
- Actualizar tokens de autenticación según sea necesario
- Verificar integridad de datos después de migraciones
- Mantener backups de datos antes de migraciones importantes
