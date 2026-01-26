# Plan de Migración V4 + PRODUCTOS a Producción

## Resumen Ejecutivo

Migración completa del trabajo realizado en `umnueva25/` a producción, integrando el nuevo subobjeto **PRODUCTOS** en Directus y convirtiendo 11 archivos HTML a componentes Astro reutilizables. Implementación gradual por fases priorizando calidad y zero-downtime.

**Objetivo**: Arquitectura escalable con datos en Directus CMS, relaciones M2M reales, y design system v4 consistente.

**Inicio de Implementación**: Lunes (próxima semana)

---

## Contexto

### Estado Actual

**✅ Completado**:
- 11 archivos HTML v4 en `umnueva25/` (homepage, servicios, antecedentes, sectores, nosotros, contacto)
- Componentes v4: `NavbarV4.astro`, `FooterV4.astro`, `HeroPageV4.astro`
- Layout: `LayoutV4.astro` con SEO completo
- Datos: `servicios_completos_v4.js` con 6 servicios y ~40 productos
- Página funcionando: `/servicios/[id]/[slug].astro` renderiza productos (líneas 314-393)

**⚠️ Pendiente**:
- Schema Directus NO tiene colección `productos`
- Relación Antecedentes↔Servicios usa mapeo por texto (`areaToServiceMap.js`) en vez de M2M real
- 11 páginas HTML necesitan conversión a Astro
- Datos hardcodeados en JS deben migrar a Directus

### Páginas a Migrar

| Archivo HTML | Página Astro | Estado | Prioridad |
|--------------|--------------|--------|-----------|
| `index-v4.html` | `/src/pages/index.astro` | Actualizar | 🔴 ALTA |
| `servicios-v4.html` | `/src/pages/servicios/index.astro` | Actualizar | 🔴 ALTA |
| `servicio-single-v4.html` | `/src/pages/servicios/[id]/[slug].astro` | ✅ Existe, conectar a Directus | 🔴 ALTA |
| `antecedentes-index-v4.html` | `/src/pages/antecedentes/index.astro` | Actualizar UI | 🟡 MEDIA |
| `antecedente-single-v4.html` | `/src/pages/antecedentes/[id]/[slug].astro` | ✅ Existe, agregar M2M | 🔴 ALTA |
| `sectores-v4.html` | `/src/pages/sectores.astro` | ✅ Existe | 🟡 MEDIA |
| `sector-single-v4.html` | `/src/pages/sectores/[slug].astro` | Crear | 🟡 MEDIA |
| `nosotros-v4.html` | `/src/pages/nosotros.astro` | Actualizar | 🟢 BAJA |
| `contacto-v4.html` | `/src/pages/contacto.astro` | Actualizar | 🟡 MEDIA |

---

## Estrategia de Implementación: 7 Fases Incrementales

### FASE 1: Backend - Schema Directus (Semana 1)

**Objetivo**: Crear estructura de datos en Directus sin afectar producción.

#### 1.1 Crear Colección `productos`

**Vía Directus Admin UI** (https://admin.ultimamilla.com.ar):

1. Settings → Data Model → Create Collection: `productos`
2. Agregar campos:
   - `servicio_id` → Many-to-One relation → `Servicios` (Required)
   - `titulo` → String (255 chars, Required)
   - `descripcion` → Text (WYSIWYG)
   - `imagen` → Image (File relation)
   - `features` → JSON (Array: `["feature1", "feature2"]`)
   - `destacado` → Text
   - `marcas` → JSON (Array: `["Cisco", "Ubiquiti"]`)
   - `orden` → Integer (Default: 0, for sorting)
   - `estado` → Dropdown: `publicado`, `borrador` (Default: `publicado`)

3. Configurar relación reversa en `Servicios`:
   - Field: `productos` (Many productos)
   - Related Collection: `productos`
   - Foreign Key: `servicio_id`

#### 1.2 Agregar Campos a `Servicios`

Extender colección existente:
- `subtitulo` → String (Texto corto para hero)
- `stats` → JSON (Array: `[{value: "94+", label: "Proyectos"}]`)
- `marcas` → JSON (Array de strings)
- `por_que_elegirnos` → JSON (Array de bullets)
- `area` → String (Ej: "Redes", "Seguridad", "Software")
- `slug` → String (Auto-generado, unique, hidden from forms)

#### 1.3 Crear Relación M2M: `antecedentes_servicios`

**En Directus Admin**:
1. Go to: `antecedentes` collection
2. Create field: `servicios_relacionados`
3. Type: Many-to-Many
4. Related Collection: `Servicios`
5. Junction Collection: auto-create `antecedentes_servicios`

Esto genera automáticamente la tabla junction con:
- `antecedente_id` → FK to antecedentes
- `servicio_id` → FK to servicios
- `orden` → Integer (para ordenar servicios relacionados)

**Verificación**:
```bash
# Acceder a PostgreSQL
docker exec -it directus-postgres psql -U directus

# Verificar tablas creadas
\dt productos
\dt antecedentes_servicios

# Verificar columnas
\d productos
```

---

### FASE 2: Migración de Datos JS → Directus (Semana 1-2)

**Objetivo**: Poblar Directus con datos de `servicios_completos_v4.js`.

Ver detalles completos de scripts de migración en el plan original.

**Tareas principales**:
1. Subir ~48 imágenes de productos a Directus Files
2. Ejecutar script `migrate-productos-to-directus.js`
3. Generar 469 relaciones M2M con `create-antecedentes-servicios-relations.js`

---

### FASE 3: Frontend - Componentes Reutilizables (Semana 2)

**Crear componentes en** `/src/components/v4/`:

1. **ProductCard.astro** - Card de producto con imagen, features, marcas
2. **StatsBar.astro** - Barra de estadísticas (4 columnas)
3. **ServiceCard.astro** - Card de servicio para listados
4. **CTASection.astro** - Sección de Call-to-Action

**Crear helper**:
- `/src/utils/directusHelpers.ts` - Queries y parsing JSON

---

### FASE 4: Actualizar Páginas Existentes (Semana 2-3)

**Archivos a modificar**:

1. `/src/pages/servicios/[id]/[slug].astro`
   - Conectar a Directus con `getServicioConProductos()`
   - Usar componente `ProductCard`
   - Mantener fallback a datos JS

2. `/src/pages/antecedentes/[id]/[slug].astro`
   - Implementar relación M2M real
   - Mostrar productos de servicios relacionados
   - Mantener fallback a `areaToServiceMap.js`

---

### FASE 5: Convertir Páginas HTML (Semana 3)

1. Homepage `/src/pages/index.astro` - Hero + servicios destacados
2. Sectores `/src/pages/sectores/[slug].astro` - Detalle de sector

---

### FASE 6: Testing y Validación (Semana 3-4)

**Tests a ejecutar**:
1. Tests unitarios (`__tests__/directus-productos.test.js`)
2. Tests de relaciones M2M
3. Validación manual de 9 páginas críticas
4. Performance testing (< 3s por página)

---

### FASE 7: Deployment a Producción (Semana 4)

**Proceso Git Flow**:
1. Pre-deploy checklist (build, tests, lint)
2. PR a develop → testing en CI/CD
3. PR develop → master → deploy automático
4. Monitoreo activo primeros 30 minutos

---

## Archivos Críticos

### Backend (Directus) - Prioridad ALTA
- Crear colección `productos` con 9 campos
- Agregar 6 campos a `Servicios`
- Crear relación M2M `antecedentes_servicios`
- Scripts: `migrate-productos-to-directus.js`, `upload-product-images.js`

### Frontend (Astro) - Prioridad ALTA
- CREAR: `/src/utils/directusHelpers.ts`
- CREAR: `/src/components/v4/ProductCard.astro`
- MODIFICAR: `/src/pages/servicios/[id]/[slug].astro` (líneas 10, 314-393)
- MODIFICAR: `/src/pages/antecedentes/[id]/[slug].astro` (líneas 144-163)

### Datos - Mantener como Fallback
- `/src/data/servicios_completos_v4.js`
- `/src/data/areaToServiceMap.js`

---

## Rollback Plans

### Escenario 1: Build Falla
→ Fixear en feature branch, NO mergear hasta que build pase

### Escenario 2: Páginas 500 en Producción
→ Activar fallback JS o revert a `v0.0.1-production-baseline`

### Escenario 3: Imágenes No Cargan
→ Verificar UUIDs en Directus, editar `directusHelpers.ts` con fallback URLs

### Escenario 4: Relaciones M2M Vacías
→ Código tiene fallback a `areaToServiceMap.js`, ejecutar script de relaciones

---

## Verificación Post-Deploy

**24 horas después**:
- ✅ Health checks pasando
- ✅ PM2 sin restarts múltiples
- ✅ Logs sin errores de Directus
- ✅ HTTP 200 en páginas críticas
- ✅ Memory < 512MB, Response time < 3s

---

## Reglas de Oro

1. **Baseline es Sagrado**: `v0.0.1-production-baseline` nunca modificar
2. **Git Flow Obligatorio**: feature → develop → master (no shortcuts)
3. **Producción Read-Only**: Solo CI/CD escribe en producción
4. **En Duda, Rollback**: Primero rollback, luego analizar

---

**Duración Estimada**: 3-4 semanas
**Riesgo**: BAJO (implementación gradual con rollback en cada fase)
**Impacto**: ALTO (arquitectura escalable, datos en CMS, design system v4 completo)

**Fecha de Inicio**: Lunes (próxima semana)
