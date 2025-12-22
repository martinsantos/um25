# Sistema de Manejo de Imágenes de Antecedentes

## 📋 Tabla de Contenidos

1. [Arquitectura General](#arquitectura-general)
2. [Flujo de Resolución de URLs](#flujo-de-resolución-de-urls)
3. [Componentes Clave](#componentes-clave)
4. [Procesos de Mantenimiento](#procesos-de-mantenimiento)
5. [Resolución de Problemas](#resolución-de-problemas)
6. [Historial de Mejoras](#historial-de-mejoras)

---

## 🏗️ Arquitectura General

### Stack Tecnológico

```
┌─────────────────────────────────────────────────┐
│         CLIENTE (Navegador del Usuario)         │
│  - Solicita imagen HTML <img src="">            │
│  - Handler: onerror="..." (fallback)            │
└──────────────┬──────────────────────────────────┘
               │
        ┌──────▼──────────────────────────────────┐
        │    ASTRO SSR (src/utils/directus.js)    │
        │  - getAntecedenteImageUrl() [CENTRAL]   │
        │  - getAntecedenteImageUrlSync()         │
        │  - Resolución de URLs de Imagen         │
        └──────┬──────────────────────────────────┘
               │
      ┌────────┴──────────────────────┐
      │                               │
  ┌───▼───────────────┐    ┌──────────▼──────────┐
  │  UUID Directus    │    │  Filename Local     │
  │  (Directus CMS)   │    │  + Image Fixer      │
  └───┬───────────────┘    └──────────┬──────────┘
      │                               │
  ┌───▼─────────────────┐      ┌──────▼──────────────┐
  │ DIRECTUS ASSETS     │      │ /imagenes_ante...   │
  │ https://...         │      │ + mapeo_imagenes    │
  │ /assets/{uuid}      │      │ + imageFixer        │
  └─────────────────────┘      └──────┬──────────────┘
                                      │
                                 ┌────▼─────────┐
                                 │ PNG Físicos  │
                                 │ (servidor)   │
                                 └──────────────┘
```

### Fuentes de Imágenes (en orden de preferencia)

| Prioridad | Fuente | Ubicación | Ejemplo |
|-----------|--------|-----------|---------|
| **1** | Directus UUID | CMS remoto | `0647312a-c6c9-42fb-bc28-f24b8cbdf0d4` |
| **2** | Filename Local | Servidor local | `/imagenes_antecedentes_versionproduccion/...png` |
| **3** | Mapeo Manual | `mapeo_imagenes_completo.js` | 466 entradas manuales |
| **4** | Correcciones | `imageFixer.js` | 10 casos especiales |
| **5** | Fallback | Profesional gradient | `/images/antecedentes-hero-bg.jpg` |

---

## 🔄 Flujo de Resolución de URLs

### Decisión en Tiempo de Compilación (Astro)

```javascript
// 1. Item con UUID (de Directus)
const item = {
  id: 10768,
  Imagen: "6f535377-5177-4fcd-8c8d-8f41f32ece7c",  // ← UUID
  Titulo: "ISI Solutions",
  Cliente: "ISI Solutions"
}

// 2. Función de resolución
const imageUrl = await getAntecedenteImageUrl(item);
// ↓
// Si: /^[a-f0-9-]{36}$/.test(item.Imagen)
// → https://admin.ultimamilla.com.ar/assets/6f535377-5177-4fcd-8c8d-8f41f32ece7c
```

### Decisión en Tiempo de Ejecución (Navegador)

```html
<!-- 1. Imagen carga correctamente -->
<img src="https://admin.ultimamilla.com.ar/assets/..." alt="...">
<!-- ↓ onload → éxito, mostrar imagen ✓ -->

<!-- 2. Imagen NO carga (404 de Directus u otro error) -->
<img ... onerror="this.src='/images/antecedentes-hero-bg.jpg'; this.onerror=null;">
<!-- ↓ carga fallback profesional (gradient azul) ✓ -->

<!-- 3. Fallback tampoco carga (raro) -->
<!-- → onerror=null evita bucle infinito
     → Usuario ve imagen rota pero sin cascada -->
```

### Casos Especiales

#### Caso 1: Imagen Local (Filename)

```javascript
const item = {
  id: 10862,
  Imagen: "ultimamilla_headcomm_sa_-_soporte_it_20250415_220507_s659537006.png"
}

// 1. Detectar: /\.(jpeg|jpg|gif|png|webp)$/i.test(Imagen)
// 2. Limpiar path (remover / inicial si existe)
// 3. Aplicar imageFixer (10 correcciones especiales)
// 4. Retornar: /imagenes_antecedentes_versionproduccion/{filename}
```

#### Caso 2: Antecedente sin Imagen pero en Mapeo

```javascript
const item = {
  id: 10844,
  Imagen: null,  // ← Sin imagen
  Titulo: "Proyecto X",
  Cliente: "Cliente Y"
}

// 1. Imagen es null/vacío
// 2. Buscar en mapeo_imagenes_completo.js
// 3. buscarImagenPorDatos(Cliente, Area, Titulo, ID)
// 4. Si encuentra → /imagenes_antecedentes_versionproduccion/{filename}
// 5. Si no → Fallback
```

#### Caso 3: Antecedente con Imagen Incorrecta

```javascript
const item = {
  id: 11160,
  Imagen: "imagen_incorrecta.png",
  // ...
}

// 1. Detectar filename
// 2. Pasar a getFixedImage() → busca en imageFixer.js
// 3. Si hay corrección: "imagen_correcta.png"
// 4. Si no: "imagen_incorrecta.png"
```

---

## 📦 Componentes Clave

### 1. `src/utils/directus.js` - Motor Central

**Funciones principales:**

#### `getAntecedenteImageUrl(item)` [RECOMENDADA]

Función asíncrona centralizada que maneja TODA la lógica de resolución.

```javascript
import { getAntecedenteImageUrl } from '@/utils/directus';

// Uso
const imageUrl = await getAntecedenteImageUrl(item);
// Retorna: string (URL completa o fallback)
```

**Pasos internos:**

1. Valida item no vacío
2. Detecta UUID de Directus
3. Detecta filename local + aplica imageFixer
4. Busca en mapeo_imagenes_completo.js
5. Retorna fallback profesional

**Logging:**

```javascript
// Ejemplo de salida en consola
[IMAGE] ✅ UUID resuelto: { id: 10768, url: "https://..." }
[IMAGE] ✅ Filename local: { id: 10862, filename: "..." }
[IMAGE] ✅ Encontrada en mapeo: { id: 10844, filename: "..." }
[IMAGE] ⚠️ Usando fallback para: { id: 99999, titulo: "Título" }
```

#### `getAntecedenteImageUrlSync(item)` [Para casos simples]

Versión síncrona ligera sin async/await.

```javascript
// Uso simple sin await
const imageUrl = getAntecedenteImageUrlSync(item);
```

**⚠️ Limitación:** No busca en mapeo (requeriría async import)

### 2. `src/data/mapeo_imagenes_completo.js` - Mapeo Manual

**Estructura:**

```javascript
export const mapeoImagenes = [
  {
    numero: 10768,
    titulo_original: "ISI Solutions - Redes y comunicaciones",
    cliente: "ISI Solutions",
    area: "Servicios de Telecomunicaciones",
    nombre_archivo_generado: "ultimamilla_isi_solutions_-_redes_y_comunicaciones_....png"
  },
  // ... 468 más
];

export function buscarImagenPorDatos(cliente, area, titulo, id) {
  // Busca por ID, cliente, area, título
  // Retorna nombre de archivo o null
}
```

**Cobertura:**

- ✅ **100%** (469/469 antecedentes mapeados)
- 466 mapeados automáticos
- 3 mapeados manuales (FASE 2)

### 3. `src/utils/imageFixer.js` - Correcciones Especiales

**Propósito:** Corregir 10 casos donde el mapeo automático generó nombres incorrectos.

```javascript
export const imageFixes = {
  "imagen_incorrecta_pattern_*.png": "imagen_correcta_*.png",
  // ...
};

export function getFixedImage(filename) {
  // Si filename coincide con patrón en imageFixes
  // Retorna nombre corregido
  // Si no coincide, retorna filename sin cambios
}
```

**Ejemplos de correcciones:**

| Sector | Patrón Incorrecto | Patrón Correcto |
|--------|---|---|
| Salud | `hospital_perrupato_cctv_*.png` | `hospital_a_italo_perrupato_sdi_*.png` |
| Bodegas | `bodega_modelo_catamarca_*.png` | Varias correcciones |
| Constructoras | 1 corrección | - |
| Gobierno | 2 correcciones | - |

### 4. Fallback Image - Profesional

**Archivo:** `/images/antecedentes-hero-bg.jpg`

**Características:**

- ✅ Profesional: Gradient azul oscuro
- ✅ Consistente: Una única imagen en toda la app
- ❌ NO ALF verde (fue el problema original)
- 📦 Pequeño: ~49KB
- 🎨 Combina con diseño existente

---

## 🛠️ Procesos de Mantenimiento

### Agregar Nuevo Antecedente

**Opción A: Usar Directus UUID** (Recomendado)

```javascript
// En Directus:
1. Subir imagen en CMS
2. Copiar UUID de imagen: 6f535377-5177-4fcd-8c8d-8f41f32ece7c
3. Crear antecedente con UUID en campo "Imagen"

// Automático:
4. getAntecedenteImageUrl() detectará UUID
5. Resolverá a: https://admin.ultimamilla.com.ar/assets/{uuid}
```

**Opción B: Usar Filename Local** (Si tiene archivo local)

```javascript
// En servidor:
1. Subir PNG a: /root/fumbling-field/public/imagenes_antecedentes_versionproduccion/
2. Usar nombre: ultimamilla_{cliente}_{titulo}_{timestamp}_{random}.png

// En Directus:
3. Crear antecedente con filename en campo "Imagen"

// Automático:
4. getAntecedenteImageUrl() detectará filename
5. Aplicará imageFixer si es necesario
6. Resolverá a: /imagenes_antecedentes_versionproduccion/{filename}
```

**Opción C: Agregar a Mapeo Manual** (Last Resort)

```javascript
// Si las opciones A y B no funcionan:
1. Abrir: src/data/mapeo_imagenes_completo.js
2. Agregar entrada antes del cierre del array:

{
  numero: 12345,
  titulo_original: "Título del Antecedente",
  cliente: "Nombre del Cliente",
  area: "Área o Sector",
  nombre_archivo_generado: "ultimamilla_cliente_titulo_....png"
}

// Verificar que el archivo PNG existe en servidor
```

### Validar Sistema

**Comando:**

```bash
npm run validate:images
```

**Qué verifica:**

✓ Cobertura de mapeo (debe ser 100%)
✓ Archivos físicos existen
✓ No hay archivos mapeados que falten
✓ Fallback es consistente
✓ No hay referencias a fallbacks antiguos
✓ Todos los handlers onerror correctos

**Interpretar resultados:**

```
✅ Cobertura: 100.00% ✓ PERFECTO
  → Sistema perfecto, sin cambios necesarios

⚠️ Se encontró 1 advertencia
  → Problemas menores, posible optimización

❌ Se encontraron X problemas graves
  → Requiere atención inmediata
```

### Regenerar Mapeo (Si es necesario)

```bash
# Solo si Directus ha sincronizado TODOS los antecedentes
# y necesitas regenerar mapeo desde cero

# Ver script: scripts/regenerar-mapeo-desde-directus.js
# ⚠️ CUIDADO: Sobrescribe mapeo_imagenes_completo.js
```

---

## 🔧 Resolución de Problemas

### Problema 1: Imagen muestra ALF verde

**Causa:**

1. Fallback image es `/images/default-background.jpg` (ALF verde)
2. O el archivo `/images/antecedentes-hero-bg.jpg` no existe

**Solución:**

```bash
# 1. Verificar fallback en directus.js
grep "DEFAULT_IMAGE:" src/utils/directus.js
# Debe ser: DEFAULT_IMAGE: '/images/antecedentes-hero-bg.jpg'

# 2. Verificar archivo existe
ls -lh public/images/antecedentes-hero-bg.jpg

# 3. Si no existe, restaurar desde backup o regenerar
```

### Problema 2: Imágenes específicas no cargan

**Diagnóstico:**

```bash
# 1. Verificar en mapeo
grep "numero: 12345" src/data/mapeo_imagenes_completo.js

# 2. Verificar archivo existe
ls -lh public/imagenes_antecedentes_versionproduccion/nombre_archivo.png

# 3. Ejecutar validación
npm run validate:images

# 4. Revisar logs en navegador (console.log de getAntecedenteImageUrl)
```

**Solución:**

```javascript
// Si está en mapeo pero archivo no existe:
// 1. Verificar nombre exacto del archivo
// 2. Actualizar mapeo con nombre correcto

// Si no está en mapeo:
// 1. Agregarla manualmente
// 2. O regenerar mapeo completo
```

### Problema 3: Antecedentes sin imagen después de actualizar

**Causa:** Los 3 antecedentes sin mapeo fallaban antes de FASE 2

**Solución:** Ya resuelta (3 entradas agregadas a mapeo)

```bash
# Verificar que estén mapeados
npm run validate:images
# Debe mostrar: Cobertura: 100.00%
```

---

## 📚 Historial de Mejoras

### FASE 1: Unificar Fallback Images ✅

**Objetivo:** Usar UN SOLO fallback en toda la aplicación

**Cambios:**

- ✅ Unified 15 onerror handlers en 13 archivos
- ✅ Cambió de 6 fallbacks diferentes a 1 consistente
- ✅ Eliminó riesgo de ALF verde

**Archivos modificados:**

- 4 componentes
- 3 páginas de antecedentes
- 5 páginas de servicios
- 2 páginas de sectores

### FASE 2: Mapear Antecedentes Faltantes ✅

**Objetivo:** Lograr 100% de cobertura de mapeo

**Cambios:**

- ✅ Identificado 3 antecedentes sin mapeo
- ✅ Agregadas 3 entradas al mapeo_imagenes_completo.js
- ✅ Cobertura: 99.36% → 100.00%

**Antecedentes mapeados:**

- ID 10862: Headcomm S.A - Soporte IT
- ID 11044: Ministerio de Desarrollo Social - Telefonía
- ID 11109: Headcomm S.A - Soporte IT

### FASE 3: Consolidar Lógica ✅

**Objetivo:** Eliminar redundancia de 3 capas de procesamiento

**Cambios:**

- ✅ Agregada función `getAntecedenteImageUrl()` centralizada
- ✅ Agregada función `getAntecedenteImageUrlSync()` simplificada
- ✅ Consolidadas en src/utils/directus.js

**Beneficios:**

- Single source of truth para resolución de imágenes
- Logging comprensivo para debugging
- Mejor mantenibilidad

### FASE 4: Script de Validación ✅

**Objetivo:** Automatizar detección de problemas

**Cambios:**

- ✅ Creado `scripts/validate-image-mappings.cjs`
- ✅ Agregado `npm run validate:images`
- ✅ Verifica 4 áreas clave del sistema

**Capacidades:**

- Cobertura de mapeo
- Integridad de archivos
- Consistencia de fallback
- Correctitud de handlers onerror

### FASE 5: Documentación ✅

**Objetivo:** Documentar completamente el sistema

**Cambios:**

- ✅ Creado `docs/IMAGE_SYSTEM.md` (este archivo)
- ✅ Cubiertos todos los aspectos del sistema
- ✅ Incluye ejemplos prácticos
- ✅ Incluye procedimientos de mantenimiento

---

## 📊 Estadísticas Actuales

| Métrica | Valor | Estado |
|---------|-------|--------|
| **Total Antecedentes** | 469 | ✅ 100% |
| **Mapeados** | 469 | ✅ 100% |
| **Archivos Físicos** | 474 | ✅ Suficiente |
| **Fallbacks Diferentes** | 1 | ✅ Unificado |
| **Fallos Potenciales** | 0 | ✅ Zero ALF verde |
| **Cobertura de Mapeo** | 100% | ✅ Perfecto |

---

## 🎯 Conclusión

El sistema de imágenes de antecedentes es ahora:

- ✅ **Robusto**: 100% cobertura, múltiples fuentes de imagen
- ✅ **Consistente**: Un único fallback profesional
- ✅ **Mantenible**: Lógica centralizada en directus.js
- ✅ **Monitoreable**: Script de validación automática
- ✅ **Documentado**: Guía completa de uso y mantenimiento

**Estado:** Listo para producción con confianza.

---

**Última actualización:** 21 Dic 2025 - FASE 5 Completada
