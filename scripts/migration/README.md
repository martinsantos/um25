# Scripts de Migración - Sistema de Diseño V4

Scripts para migrar datos de `servicios_completos_v4.js` a Directus CMS.

---

## Pre-requisitos

✅ Schema de Directus creado (ver `docs/DIRECTUS_SCHEMA_SETUP.md`)
✅ Directus corriendo (local o producción)
✅ `.env` configurado con credenciales

```bash
PUBLIC_DIRECTUS_URL=http://localhost:8055
PUBLIC_DIRECTUS_TOKEN=tu-token-aqui
```

---

## Orden de Ejecución

### PASO 1: Actualizar Servicios con Campos V4

Actualiza los servicios existentes (IDs 101-106) con los nuevos campos V4.

```bash
# Modo prueba (sin modificar BD)
node scripts/migration/migrate-servicios-v4-fields.js --dry-run

# Ejecutar migración real
node scripts/migration/migrate-servicios-v4-fields.js
```

**Qué hace**:
- Agrega `subtitulo`, `stats`, `marcas`, `por_que_elegirnos`, `area`, `slug` a servicios existentes
- Genera slugs URL-friendly automáticamente
- No modifica datos existentes, solo agrega campos nuevos

**Output esperado**:
```
✅ Actualizados: 6/6 servicios
📝 Slugs generados:
   101: /infraestructura-de-redes
   102: /sistemas-de-seguridad-electronica
   ...
```

---

### PASO 2: Migrar Productos

Crea ~40 productos en la colección `productos`.

```bash
# Modo prueba
node scripts/migration/migrate-productos-to-directus.js --dry-run

# Ejecutar migración real
node scripts/migration/migrate-productos-to-directus.js
```

**Qué hace**:
- Inserta ~40 productos (8 por servicio promedio)
- Relaciona cada producto con su servicio vía `servicio_id`
- Incluye: título, descripción, features, destacado, marcas, orden

**Output esperado**:
```
📊 Servicios procesados: 6
📦 Productos totales:    ~40
✅ Migrados exitosos:    ~40
```

**NOTA**: Las imágenes de productos quedarán como `null` temporalmente hasta ejecutar el script de upload de imágenes.

---

### PASO 3: Crear Relaciones M2M

Crea relaciones Many-to-Many entre antecedentes y servicios.

```bash
# Modo prueba con límite de 10 antecedentes
node scripts/migration/create-m2m-antecedentes-servicios.js --dry-run --limit=10

# Ejecutar migración real (procesa TODOS los antecedentes)
node scripts/migration/create-m2m-antecedentes-servicios.js

# Procesar solo primeros 50 (recomendado para test inicial)
node scripts/migration/create-m2m-antecedentes-servicios.js --limit=50
```

**Qué hace**:
- Analiza el contenido de cada antecedente (Nombre + Descripcion)
- Busca keywords que indiquen relación con servicios
- Crea relaciones en tabla junction `antecedentes_servicios`
- Marca servicio principal si tiene alta relevancia

**Algoritmo de detección**:
- ≥2 keywords → Crear relación
- ≥5 keywords → Marcar como servicio destacado
- Ordenar por relevancia (más keywords = orden menor)

**Output esperado** (469 antecedentes):
```
📊 Antecedentes procesados:     469
🔗 Relaciones totales:          ~1200
✅ Relaciones creadas:          ~1200
⚠️  Antecedentes sin relación:  ~50-100
```

---

## Scripts NPM (package.json)

Para facilitar la ejecución, se agregaron scripts al `package.json`:

```bash
# Ejecutar TODOS los scripts en orden (dry-run)
npm run migrate:v4:dry

# Ejecutar migración REAL completa
npm run migrate:v4

# Scripts individuales
npm run migrate:servicios-v4       # Actualizar servicios
npm run migrate:productos          # Crear productos
npm run migrate:m2m                # Crear relaciones M2M

# Scripts con dry-run
npm run migrate:servicios-v4:dry
npm run migrate:productos:dry
npm run migrate:m2m:dry
```

---

## Verificación Post-Migración

### 1. Directus Admin UI

```
✅ Content → Servicios → Ver 6 servicios con campos V4 poblados
✅ Content → productos → Ver ~40 productos creados
✅ Content → antecedentes → Editar uno → Ver "servicios_relacionados" poblado
```

### 2. PostgreSQL

```bash
# Conectar a BD
docker exec -it directus-postgres psql -U directus

# Contar productos
SELECT COUNT(*) FROM productos;
-- Esperado: ~40

# Contar relaciones M2M
SELECT COUNT(*) FROM antecedentes_servicios;
-- Esperado: ~1200

# Ver productos por servicio
SELECT s."Titulo", COUNT(p.id) as productos_count
FROM "Servicios" s
LEFT JOIN productos p ON p.servicio_id = s.id
GROUP BY s.id, s."Titulo"
ORDER BY s.id;
-- Esperado: 6 servicios con ~6-8 productos cada uno

# Ver antecedentes más conectados
SELECT a."Nombre", COUNT(aas."Servicios_id") as servicios_count
FROM antecedentes a
JOIN antecedentes_servicios aas ON aas.antecedentes_id = a.id
GROUP BY a.id, a."Nombre"
ORDER BY servicios_count DESC
LIMIT 10;
```

### 3. API de Directus

```bash
# Token de prueba
TOKEN="tu-token-aqui"
URL="http://localhost:8055"

# Ver servicios con productos
curl "$URL/items/Servicios?fields=*,productos.*" \
  -H "Authorization: Bearer $TOKEN" | jq '.data[] | {id, Titulo, productos_count: (.productos | length)}'

# Ver antecedente con servicios relacionados
curl "$URL/items/antecedentes/1?fields=*,servicios_relacionados.*" \
  -H "Authorization: Bearer $TOKEN" | jq '.data.servicios_relacionados'

# Ver productos de un servicio
curl "$URL/items/productos?filter[servicio_id][_eq]=101&sort=orden" \
  -H "Authorization: Bearer $TOKEN" | jq '.data[] | {id, titulo, orden}'
```

---

## Troubleshooting

### Error: "Collection productos does not exist"

**Causa**: Schema no creado en Directus
**Solución**: Ejecutar pasos de `docs/DIRECTUS_SCHEMA_SETUP.md` primero

### Error: "Servicio XXX not found"

**Causa**: Servicios no existen en Directus con IDs 101-106
**Solución**: Verificar que servicios fueron creados correctamente. Revisar mapeo de IDs.

### Error: "Duplicate key violation"

**Causa**: Intentando crear productos/relaciones que ya existen
**Solución**: Normal en re-ejecuciones. Si se desea limpiar:

```sql
-- CUIDADO: Esto borra todos los productos y relaciones
DELETE FROM productos;
DELETE FROM antecedentes_servicios;
```

### Warning: "No se detectaron servicios relacionados"

**Causa**: Antecedente sin keywords que matcheen servicios
**Solución**: Normal, algunos antecedentes no tienen suficiente contenido descriptivo. Se pueden mapear manualmente después.

### Performance lento en M2M

**Causa**: Procesando 469 antecedentes de una vez
**Solución**: Usar `--limit=50` para procesar en lotes:

```bash
node scripts/migration/create-m2m-antecedentes-servicios.js --limit=50
# Verificar resultados, luego aumentar límite o ejecutar completo
```

---

## Rollback / Limpieza

Si necesitas revertir la migración:

```sql
-- Conectar a PostgreSQL
docker exec -it directus-postgres psql -U directus

-- Limpiar productos (cascada elimina relaciones)
DELETE FROM productos;

-- Limpiar relaciones M2M
DELETE FROM antecedentes_servicios;

-- Limpiar campos V4 de servicios (poner en NULL)
UPDATE "Servicios" SET
  subtitulo = NULL,
  stats = NULL,
  marcas = NULL,
  por_que_elegirnos = NULL,
  area = NULL,
  slug = NULL;
```

**ADVERTENCIA**: Estos comandos son irreversibles. Hacer backup antes.

---

## Próximos Pasos

Una vez completada la migración:

✅ **FASE 2 COMPLETA** - Datos migrados a Directus
➡️ **FASE 3 SIGUIENTE**: Crear componentes Astro reutilizables

Componentes a crear:
- `src/components/v4/ProductCard.astro`
- `src/components/v4/StatsBar.astro`
- `src/components/v4/ServiceCard.astro`
- `src/components/v4/CTASection.astro`

---

## Notas Importantes

### Sobre las Imágenes

Los scripts de migración NO suben imágenes a Directus. Las URLs de imágenes en los datos JS apuntan a rutas locales (`/images/services/productos/...`).

**Opciones**:

1. **Usar imágenes actuales** (path local): Las imágenes ya están en `public/images/`
2. **Migrar a Directus**: Crear script de upload (futuro)
3. **Hybrid**: Usar `getDirectusImageUrl()` con fallback a rutas locales

### Sobre los IDs

- **Servicios**: IDs 101-106 (deben existir en Directus antes de migración)
- **Productos**: Auto-increment (Directus asigna IDs automáticamente)
- **Antecedentes**: IDs existentes (no se modifican, solo se agregan relaciones)

### Sobre el Orden de Productos

El campo `orden` en productos determina la secuencia de aparición en la página del servicio. Los scripts mantienen el orden original del array JS.

Para reordenar después de la migración:
```sql
-- Ejemplo: Reordenar productos del servicio 101
UPDATE productos SET orden = 10 WHERE id = 5;
```

---

**Última actualización**: 2026-01-26
**Versión**: 1.0
**Fase**: 2 - Migración de Datos
