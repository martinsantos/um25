# DIRECTUS SCHEMA SETUP - Sistema de Diseño V4

**Objetivo**: Crear schema de Directus para soportar el sistema de diseño V4 sin afectar producción.

**Duración estimada**: 20-30 minutos
**Nivel de riesgo**: BAJO (no modifica datos existentes)

---

## Pre-requisitos

✅ Acceso a Directus Admin (http://localhost:8055 o https://admin.ultimamilla.com.ar)
✅ Credenciales de admin en `.env`
✅ Backup de base de datos (recomendado)

---

## PARTE 1: Crear Colección `productos` (NUEVO)

### 1.1 Crear colección base

1. Ir a **Settings** → **Data Model**
2. Click **"Create Collection"**
3. Configurar:
   - **Collection Name**: `productos`
   - **Primary Key Field**: `id` (Auto-Increment Integer)
   - **Icon**: `inventory_2`
   - **Note**: `Productos/soluciones específicas dentro de cada servicio`
   - **Singleton**: NO
4. Click **"Save"**

### 1.2 Agregar campos

#### Campo: `servicio_id` (Relación Many-to-One)

```
Type: Many-to-One Relationship
Related Collection: Servicios
Field Name: servicio_id
Display Template: {{Titulo}}
Required: YES
Width: Half
Note: Servicio al que pertenece este producto
```

**Pasos**:
1. Click **"Create Field"** en colección `productos`
2. Seleccionar **"Many to One"**
3. Related Collection: `Servicios`
4. Field Name (This Collection): `servicio_id`
5. Display Template: `{{Titulo}}`
6. En tab "Validation": Check **Required**
7. Save

#### Campo: `titulo` (String)

```
Type: String
Field Name: titulo
Interface: Input
Max Length: 255
Required: YES
Placeholder: "Nombre del producto (ej: Fibra Óptica de Alta Capacidad)"
Width: Full
```

#### Campo: `descripcion` (Text)

```
Type: Text
Field Name: descripcion
Interface: WYSIWYG Editor (Rich Text HTML)
Toolbar: bold, italic, underline, link, bullist, numlist
Width: Full
Note: Descripción completa del producto (acepta HTML)
```

#### Campo: `imagen` (File - Image)

```
Type: UUID (File Relationship)
Field Name: imagen
Interface: File Image
Related Collection: directus_files
Width: Half
Note: Imagen principal del producto
```

**Pasos**:
1. Create Field → Select "File"
2. Field Name: `imagen`
3. Interface: "Image"
4. En tab "Relationship": Related Collection = `directus_files`
5. Width: Half
6. Save

#### Campo: `features` (JSON - Lista)

```
Type: JSON
Field Name: features
Interface: List
Placeholder: "Agregar característica"
Template: {{ value }}
Add Label: "Agregar Feature"
Width: Full
Note: Lista de características principales (bullets)
```

**Pasos**:
1. Create Field → Select "Standard Field" → "JSON"
2. Field Name: `features`
3. Interface: "List"
4. En options:
   - Placeholder: "Agregar característica"
   - Template: `{{ value }}`
   - Add Label: "Agregar Feature"
5. Save

#### Campo: `destacado` (Text - Multiline)

```
Type: Text
Field Name: destacado
Interface: Input Multiline
Placeholder: "Texto destacado o diferenciador del producto"
Width: Full
Note: Frase destacada que diferencia este producto
```

#### Campo: `marcas` (JSON - Tags)

```
Type: JSON
Field Name: marcas
Interface: Tags
Placeholder: "Agregar marca"
Icon Right: local_offer
Width: Half
Note: Marcas específicas para este producto
```

#### Campo: `orden` (Integer)

```
Type: Integer
Field Name: orden
Interface: Input
Default Value: 0
Placeholder: "0"
Width: Half
Note: Orden de aparición (menor número = primero)
```

#### Campo: `estado` (String - Dropdown)

```
Type: String
Field Name: estado
Interface: Select Dropdown
Choices:
  - Text: "Publicado" | Value: "publicado"
  - Text: "Borrador" | Value: "borrador"
Default Value: "publicado"
Width: Half
Note: Estado de publicación
```

#### Campos de timestamp (Automáticos)

```
Field: date_created
Type: Timestamp
Interface: Datetime
Special: date-created
Hidden: YES
Read Only: YES

Field: date_updated
Type: Timestamp
Interface: Datetime
Special: date-updated
Hidden: YES
Read Only: YES
```

### 1.3 Configurar Display Template

1. En Settings → Data Model → `productos`
2. Click en el ícono de configuración (⚙️)
3. En "Display Template": `{{titulo}}`
4. Save

### 1.4 Verificación

- [ ] Colección `productos` visible en menú lateral
- [ ] Botón "Create Item" funciona
- [ ] Selector de `servicio_id` muestra servicios existentes
- [ ] Campos JSON aceptan arrays

---

## PARTE 2: Extender Colección `Servicios` (EXISTENTE)

**IMPORTANTE**: Esta colección YA EXISTE. Solo agregaremos campos NUEVOS.

### 2.1 Agregar campos V4

#### Campo: `subtitulo` (String)

```
Type: String
Field Name: subtitulo
Interface: Input
Max Length: 255
Placeholder: "Texto corto para hero (ej: Cableado, Fibra Óptica, Radioenlaces)"
Width: Full
Note: Texto descriptivo corto que aparece bajo el título en la página del servicio
```

**Pasos**:
1. Settings → Data Model → `Servicios`
2. Click **"Create Field"**
3. Type: "Standard Field" → "String"
4. Configure según specs arriba
5. Save

#### Campo: `stats` (JSON - Code)

```
Type: JSON
Field Name: stats
Interface: Input Code
Language: JSON
Placeholder: [{"value": "94+", "label": "Proyectos Completados"}]
Template:
[
  {"value": "94+", "label": "Proyectos Completados"},
  {"value": "22+", "label": "Años de Experiencia"},
  {"value": "25", "label": "Años de Garantía"},
  {"value": "24/7", "label": "Soporte Técnico"}
]
Width: Full
Note: Array de estadísticas para mostrar en el hero
```

**Importante**: Usar interfaz "Input Code" (no "List") para mantener formato JSON exacto.

#### Campo: `marcas` (JSON - Tags)

```
Type: JSON
Field Name: marcas
Interface: Tags
Placeholder: "Agregar marca (ej: Cisco, Ubiquiti)"
Icon Right: local_offer
Width: Half
Note: Marcas/fabricantes con los que trabaja este servicio
```

#### Campo: `por_que_elegirnos` (JSON - List)

```
Type: JSON
Field Name: por_que_elegirnos
Interface: List
Placeholder: "Agregar razón"
Template: {{ value }}
Add Label: "Agregar Razón"
Width: Full
Note: Lista de razones por las que elegir este servicio (bullets)
```

#### Campo: `area` (String - Dropdown)

```
Type: String
Field Name: area
Interface: Select Dropdown
Max Length: 100
Choices:
  - Text: "Redes" | Value: "Redes"
  - Text: "Seguridad" | Value: "Seguridad"
  - Text: "Telecomunicaciones" | Value: "Telecomunicaciones"
  - Text: "Software" | Value: "Software"
  - Text: "Soporte" | Value: "Soporte"
  - Text: "Consultoría" | Value: "Consultoría"
Width: Half
Note: Área o categoría del servicio
```

#### Campo: `slug` (String - Unique)

```
Type: String
Field Name: slug
Interface: Input
Max Length: 255
Placeholder: "URL-friendly (ej: infraestructura-redes)"
Unique: YES
Slug: YES (auto-generate from Titulo)
Width: Half
Note: Identificador único para URLs (se auto-genera del título)
```

**Para habilitar auto-generación de slug**:
1. En options del campo, buscar "Slug"
2. Check "Enable slug mode"
3. Slug Template: `{{Titulo}}`

### 2.2 Verificación

- [ ] 6 campos nuevos agregados a `Servicios`
- [ ] Campo `slug` tiene constraint UNIQUE
- [ ] Campo `stats` acepta JSON con formato de array
- [ ] Campo `area` muestra dropdown con 6 opciones

---

## PARTE 3: Crear Relación M2M `antecedentes_servicios`

**Objetivo**: Conectar antecedentes con servicios (Many-to-Many).

### 3.1 Crear relación desde `antecedentes`

1. Settings → Data Model → `antecedentes`
2. Click **"Create Field"**
3. Seleccionar **"Many to Many"**

### 3.2 Configurar relación

```
Field Name (This Collection): servicios_relacionados
Interface: List M2M
Related Collection: Servicios
Junction Collection: antecedentes_servicios (auto-creada)
Display Template: {{Servicios_id.Titulo}}
Width: Full
Note: Servicios relacionados con este proyecto/antecedente
```

**Configuración detallada**:

- **Current Collection**: `antecedentes`
- **Field Name**: `servicios_relacionados`
- **Related Collection**: `Servicios`
- **Junction Collection Name**: `antecedentes_servicios` (se creará automáticamente)
- **Current Collection Field** (en junction): `antecedentes_id`
- **Related Collection Field** (en junction): `Servicios_id`

### 3.3 Agregar campos adicionales a la junction table

Después de crear la relación M2M, ir a la junction table para agregar metadatos:

1. Settings → Data Model → `antecedentes_servicios`
2. Agregar campo `orden` (Integer, default: 0)
3. Agregar campo `destacado` (Boolean, default: false)

#### Campo: `orden` (Integer)

```
Type: Integer
Field Name: orden
Interface: Input
Default Value: 0
Width: Half
Note: Orden de aparición del servicio en el antecedente
```

#### Campo: `destacado` (Boolean)

```
Type: Boolean
Field Name: destacado
Interface: Boolean (Toggle)
Default Value: false
Width: Half
Note: Marcar como servicio principal del proyecto
```

### 3.4 Verificación

- [ ] Campo `servicios_relacionados` visible en formulario de `antecedentes`
- [ ] Al agregar relación, muestra selector de servicios
- [ ] Junction table `antecedentes_servicios` creada automáticamente
- [ ] Junction table tiene campos: `id`, `antecedentes_id`, `Servicios_id`, `orden`, `destacado`

---

## PARTE 4: Verificación Final en PostgreSQL

Conectarse a la base de datos para verificar que el schema fue creado correctamente:

```bash
# SSH a producción (o Docker local)
ssh ultimamilla  # o: docker exec -it directus-postgres psql -U directus

# Conectar a PostgreSQL
psql -U directus -d directus

# Verificar tablas
\dt productos
\dt antecedentes_servicios

# Ver estructura de productos
\d productos

# Ver estructura de Servicios (con campos nuevos)
\d "Servicios"

# Ver estructura de junction table
\d antecedentes_servicios

# Salir
\q
```

**Resultados esperados**:

```sql
-- Tabla productos debe existir con ~15 columnas
-- Tabla antecedentes_servicios debe existir con ~6 columnas
-- Tabla Servicios debe tener 6 campos adicionales
```

---

## PARTE 5: Test de Inserción Manual

Antes de ejecutar los scripts de migración, probar insertar datos manualmente:

### 5.1 Crear un producto de prueba

1. Ir a **Content** → `productos`
2. Click **"Create Item"**
3. Llenar campos:
   - `servicio_id`: Seleccionar un servicio existente
   - `titulo`: "TEST - Producto de Prueba"
   - `descripcion`: "Este es un producto de prueba"
   - `features`: `["Feature 1", "Feature 2", "Feature 3"]`
   - `orden`: 0
   - `estado`: "borrador"
4. Click **"Save"**

### 5.2 Actualizar un servicio existente

1. Ir a **Content** → `Servicios`
2. Editar un servicio existente
3. Agregar datos en campos nuevos:
   - `subtitulo`: "Prueba de subtítulo"
   - `stats`: `[{"value": "10+", "label": "Test"}]`
   - `marcas`: `["Marca1", "Marca2"]`
   - `area`: "Redes"
4. Click **"Save"**

### 5.3 Crear relación M2M de prueba

1. Ir a **Content** → `antecedentes`
2. Editar un antecedente existente
3. En campo `servicios_relacionados`:
   - Click **"+"**
   - Seleccionar un servicio
   - Opcionalmente ajustar `orden` y `destacado`
4. Click **"Save"**

### 5.4 Verificar en API

```bash
# Test API de productos
curl -X GET 'http://localhost:8055/items/productos' \
  -H 'Authorization: Bearer YOUR_TOKEN'

# Test API de servicios con productos
curl -X GET 'http://localhost:8055/items/Servicios?fields=*,productos.*' \
  -H 'Authorization: Bearer YOUR_TOKEN'

# Test API de antecedentes con M2M
curl -X GET 'http://localhost:8055/items/antecedentes?fields=*,servicios_relacionados.*' \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

---

## Troubleshooting

### Error: "Collection already exists"

**Solución**: La colección ya fue creada. Saltear paso de creación y solo agregar campos faltantes.

### Error: "Foreign key constraint fails"

**Solución**: Verificar que la colección relacionada existe y tiene datos. Para `servicio_id`, debe existir al menos un servicio en `Servicios`.

### Error: "Invalid JSON format"

**Solución**: Validar JSON antes de insertar. Usar herramientas como jsonlint.com o formatear correctamente:

```json
// ✅ Correcto
["item1", "item2", "item3"]

// ❌ Incorrecto
['item1', 'item2', 'item3']  // Comillas simples no válidas
```

### Error: "Unique constraint violated" en slug

**Solución**: El campo `slug` debe ser único. Asegurarse de que cada servicio tenga un slug diferente. Si el slug se auto-genera, verificar que no haya duplicados en los títulos.

---

## Rollback Plan

Si algo sale mal, revertir los cambios:

### Eliminar colección `productos`

```sql
-- Conectar a PostgreSQL
psql -U directus -d directus

-- Eliminar tabla (DROP CASCADE elimina también las relaciones)
DROP TABLE IF EXISTS productos CASCADE;
```

O desde Directus Admin:
1. Settings → Data Model → `productos`
2. Click en ⚙️ → **"Delete Collection"**
3. Confirmar

### Eliminar relación M2M

```sql
-- Eliminar junction table
DROP TABLE IF EXISTS antecedentes_servicios CASCADE;

-- Eliminar campo alias de antecedentes (manual desde Admin UI)
```

### Eliminar campos V4 de `Servicios`

Desde Directus Admin:
1. Settings → Data Model → `Servicios`
2. Para cada campo nuevo (`subtitulo`, `stats`, `marcas`, etc.):
   - Click en el campo → ⚙️ → **"Delete Field"**
   - Confirmar

**ADVERTENCIA**: Esto eliminará los datos almacenados en esos campos. Hacer backup antes.

---

## Próximos Pasos

Una vez completado el schema:

✅ **FASE 1 COMPLETA** - Schema Directus creado
➡️ **FASE 2 SIGUIENTE**: Ejecutar scripts de migración de datos

Scripts a ejecutar (en orden):
1. `scripts/upload-product-images.js` - Subir ~48 imágenes de productos
2. `scripts/migrate-productos-to-directus.js` - Migrar 40 productos
3. `scripts/migrate-servicios-v4-fields.js` - Actualizar servicios con campos V4
4. `scripts/create-antecedentes-servicios-relations.js` - Crear 469 relaciones M2M

---

## Referencias

- **Directus Docs**: https://docs.directus.io/
- **API Reference**: https://docs.directus.io/reference/introduction
- **Field Types**: https://docs.directus.io/app/data-model/fields
- **Relationships**: https://docs.directus.io/app/data-model/relationships

---

**Fecha de creación**: 2026-01-26
**Versión**: 1.0
**Autor**: Sistema de Diseño V4 - FASE 1
