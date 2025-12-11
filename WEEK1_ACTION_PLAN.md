# Plan de Acción - SEMANA 1 (Implementación Inmediata)

## 📋 OBJETIVO SEMANAL

Validar que los cambios SEO implementados estén siendo detectados correctamente por Google y que los rich snippets funcionen como se espera.

**Tiempo estimado:** 3-4 horas (distribuidas en la semana)
**Responsable:** Marketing/SEO Manager
**Herramientas necesarias:** Google Search Console, Google Rich Results Test

---

## DÍA 1: SETUP INICIAL EN GOOGLE SEARCH CONSOLE

### Paso 1: Verificar acceso a GSC
```
1. Acceder a: https://search.google.com/search-console
2. Seleccionar propiedad: ultimamilla.com.ar
3. Verificar que estés en la vista de "Resumen"
```

**Checklist:**
- [ ] Acceso confirmado a GSC
- [ ] Propiedad mostrada como "verificada"
- [ ] Datos visibles (impresiones, clicks)

---

### Paso 2: Navegar a Sitemaps
```
GSC Menu → Sitemaps (en la sección de Indexación)
```

**Estado Actual (Before):**
- Únicamente: `sitemap.xml`
- Antecedentes: No descubiertos

**Lo que deberías ver (After):**
- `sitemap.xml` ✅
- `sitemap-index.xml` (NUEVO)
- `sitemap-antecedentes.xml` (NUEVO)

---

### Paso 3: Validar el nuevo sitemap de antecedentes
```
1. En la sección "Sitemaps", buscar entrada:
   "sitemap-antecedentes.xml"

2. Si NO aparece, hacer click en "Agregar nuevo sitemap"
   - URL: https://ultimamilla.com.ar/sitemap-antecedentes.xml
   - Click "Enviar"

3. Esperar confirmación (pueden pasar 1-2 minutos)
```

**Resultado esperado:**
```
sitemap-antecedentes.xml
├─ Estado: ✅ Éxito
├─ URLs enviadas: 469
├─ URLs indexadas: (irá aumentando, comienza en 0-50)
└─ Última lectura: [timestamp actual]
```

**Métricas iniciales a documentar:**
- URLs enviadas: _____ (debe ser ~469)
- URLs indexadas: _____ (puede ser 0-50 inicialmente)
- Errores: _____ (debe ser 0)

---

## DÍA 2: VALIDACIÓN DE STRUCTURE DATA (RICH SNIPPETS)

### Paso 1: Testing de FAQPage Schema

**URL a testear:** https://ultimamilla.com.ar/seguridad-electronica

```
1. Acceder a: https://search.google.com/test/rich-results
2. Pegar URL: https://ultimamilla.com.ar/seguridad-electronica
3. Click "PROBAR URL"
4. Esperar análisis (5-10 segundos)
```

**Resultado esperado:**

```
✅ VÁLIDO

Rich results found:
├─ FAQPage
│  ├─ Question 1: "¿Qué sistemas de detección instalan?"
│  ├─ Question 2: "¿Qué tipos de cámaras CCTV ofrecen?"
│  ├─ Question 3: "¿Qué es el control de acceso biométrico?"
│  └─ Question 4: "¿Qué son las corrientes débiles?"
└─ BreadcrumbList (adicional)
```

**Checklist:**
- [ ] No hay errores reportados
- [ ] 4 preguntas detectadas
- [ ] Respuestas parseadas correctamente

---

### Paso 2: Testing de CreativeWork Schema (Antecedentes)

**URL a testear:** https://ultimamilla.com.ar/antecedentes/10768/isi-solutions-redes-y-comunicaciones

```
1. Acceder a: https://search.google.com/test/rich-results
2. Pegar URL: https://ultimamilla.com.ar/antecedentes/10768/isi-solutions-redes-y-comunicaciones
3. Click "PROBAR URL"
4. Esperar análisis (5-10 segundos)
```

**Resultado esperado:**

```
✅ VÁLIDO

Rich results found:
├─ BreadcrumbList
│  ├─ Inicio → /
│  ├─ Antecedentes → /antecedentes
│  └─ [Proyecto Title] → [URL actual]
└─ Structured data (general)
   ├─ name: "ISI Solutions - Redes y comunicaciones"
   ├─ description: "[descripción del proyecto]"
   ├─ image: "https://..."
   └─ url: "[URL actual]"
```

**Checklist:**
- [ ] No hay errores
- [ ] CreativeWork o schema similar detectado
- [ ] Breadcrumb funcional
- [ ] Imagen parseada correctamente

---

### Paso 3: Testing de Minería (con FAQ)

**URL a testear:** https://ultimamilla.com.ar/mineria

```
1. Acceder a: https://search.google.com/test/rich-results
2. Pegar URL: https://ultimamilla.com.ar/mineria
3. Click "PROBAR URL"
```

**Resultado esperado:**

```
✅ VÁLIDO

Rich results found:
└─ FAQPage
   ├─ 4 preguntas sobre minería
   └─ Todas con respuestas completas
```

---

## DÍA 3: VALIDACIÓN DE META TAGS

### Paso 1: Validar Meta Tags en Antecedentes (Listado)

**URL:** https://ultimamilla.com.ar/antecedentes

```
En el navegador:
1. Click derecho → "Inspeccionar" (o F12)
2. Ir a pestaña "Elements/Inspector"
3. Buscar: Ctrl+F → "meta"
4. Revisar siguientes meta tags:

[Esperado]
<title>Proyectos IT y Telecomunicaciones | 469+ Casos de Éxito | ULTIMA MILLA</title>

<meta name="description" content="Más de 469 proyectos...">

<meta property="og:title" content="Proyectos IT y Telecomunicaciones...">

<meta property="og:image" content="https://...servicios-it.jpg">

<meta property="twitter:title" content="Proyectos IT y Telecomunicaciones...">
```

**Checklist:**
- [ ] Title tiene 60-70 caracteres (óptimo)
- [ ] Description tiene 150-160 caracteres
- [ ] og:image presente y accesible
- [ ] og:type = "website"
- [ ] canonical URL presente

---

### Paso 2: Validar Meta Tags en Antecedente Individual

**URL:** https://ultimamilla.com.ar/antecedentes/10768/isi-solutions-redes-y-comunicaciones

```
En el navegador:
1. Click derecho → "Inspeccionar"
2. Buscar meta tags

[Esperado - Dinámico]
<title>ISI Solutions - Redes y comunicaciones | Telecomunicaciones para ISI Solutions | Caso de Éxito</title>

<meta name="description" content="[Primera parte de descripción del proyecto]">

<meta name="keywords" content="Telecomunicaciones, ISI Solutions, Unidad...">

<meta property="og:image" content="https://[imagen del proyecto]">
```

**Checklist:**
- [ ] Title contiene nombre del proyecto
- [ ] Title contiene Area y Cliente
- [ ] Description es único (no genérico)
- [ ] Keywords dinámicos presentes
- [ ] og:image presente

---

## DÍA 4: VALIDACIÓN DE SITEMAPS (CRAWL)

### Paso 1: Revisar Cobertura en GSC

**En Google Search Console:**
```
GSC Menu → Cobertura (en Indexación)
```

**Documentar estado actual:**
```
Fecha: ____________
Resumen:
├─ Indexadas: _____ URLs
├─ Excluidas: _____ URLs
├─ Errores: _____ URLs
└─ Válidas con advertencia: _____ URLs
```

**Esperado (Semana 1):**
- Indexadas: 50-100 antecedentes (irá aumentando)
- Errores: 0-5 máximo
- Excluidas: 0 (a menos que haya canonicals)

---

### Paso 2: Buscar antecedentes indexados

**En Google Search:**
```
Búsqueda: site:ultimamilla.com.ar/antecedentes/

Resultado esperado:
"Aproximadamente X resultados (0.XX segundos)"

Donde X debería aumentar a lo largo de los días
```

**Documentar:**
- Resultados encontrados Day 1: _____
- Resultados encontrados Day 3: _____
- Resultados encontrados Day 7: _____

**Patrón esperado:**
```
Day 1: 0-10 antecedentes indexados
Day 2: 5-15
Day 3: 10-30
Day 5: 30-50
Day 7: 50-100+
```

---

### Paso 3: Validar URLs Específicas

**Abrir GSC → Inspección de URLs**

Testear 3 URLs de antecedentes:

```
URL 1: https://ultimamilla.com.ar/antecedentes/10768/isi-solutions-redes-y-comunicaciones
URL 2: https://ultimamilla.com.ar/antecedentes/1/municipalidad-maipu-software
URL 3: https://ultimamilla.com.ar/antecedentes/500/[proyecto-aleatorio]
```

Para cada URL:
```
1. Copiar URL en "Inspección de URLs"
2. Presionar Enter
3. Revisar:
   ├─ Status: "URL disponible"
   ├─ Indexable: "Sí"
   └─ Última visitada: [fecha reciente]
```

**Resultado esperado:**
```
✅ URL disponible para la indexación
✅ Se encontró en el Sitemap
✅ No hay problemas de carga
```

---

## DÍA 5: DOCUMENTACIÓN Y REPORTE

### Paso 1: Completar Checklist de Validación

```
SITEMAPS
├─ [x] sitemap.xml enviado y procesado
├─ [x] sitemap-index.xml visible en GSC
├─ [x] sitemap-antecedentes.xml enviado
│       URLs enviadas: _____
│       URLs indexadas: _____
└─ [x] Sin errores críticos

RICH SNIPPETS
├─ [x] FAQPage en /seguridad-electronica - VÁLIDO
├─ [x] FAQPage en /mineria - VÁLIDO
├─ [x] CreativeWork en antecedentes dinámicos - VÁLIDO
└─ [x] BreadcrumbList en todas las páginas - VÁLIDO

META TAGS
├─ [x] /antecedentes - Títulos optimizados
├─ [x] /antecedentes/[id]/[slug] - Dinámicos presentes
├─ [x] og:image en 9 páginas de sectores
└─ [x] canonical URLs correctas

INDEXACIÓN
├─ [x] Cobertura: _____ URLs indexadas
├─ [x] site: query retorna resultados
├─ [x] 3 URLs de antecedentes validadas en GSC
└─ [x] Sin errores de crawl críticos
```

---

### Paso 2: Crear Reporte Inicial

**Documento: SEO_WEEK1_BASELINE.txt**

```
BASELINE SEO - SEMANA 1
======================
Fecha: [Hoy]

SITEMAPS ENVIADOS
├─ sitemap.xml: ✅ Activo desde [fecha]
├─ sitemap-index.xml: ✅ Activo desde [fecha]
└─ sitemap-antecedentes.xml: ✅ Activo desde [fecha]

URLS INDEXADAS
├─ /antecedentes: _____ resultados (site: query)
├─ Total estimado: _____ URLs
└─ % indexación: _____% (actual/total)

RICH SNIPPETS
├─ FAQPage: ✅ 2 páginas validadas
├─ CreativeWork: ✅ Detectado en antecedentes
└─ BreadcrumbList: ✅ Presente en todas

ERRORES ENCONTRADOS
├─ Errores críticos: _____
├─ Advertencias: _____
└─ Acciones tomadas: _____

PRÓXIMOS PASOS
├─ Monitorear indexación a lo largo de la semana
├─ Si < 20 antecedentes indexados en Day 5, re-enviar sitemap
├─ Verificar en Day 14 progreso de indexación
└─ Comenzar internal linking strategy (Semana 2)
```

---

## 📊 MÉTRICAS A DOCUMENTAR (Día 1 al Día 5)

### Tabla de Seguimiento Diario

```
DÍA | ANTECEDENTES | ERRORES | RICH SNIPPETS | NOTAS
    | INDEXADOS    | GSC     | VÁLIDOS       |
----|--------------|---------|---------------|--------
 1  | ____         | ____    | 2/2 ✅       |
 2  | ____         | ____    | 2/2 ✅       |
 3  | ____         | ____    | 2/2 ✅       | Verificar meta tags
 4  | ____         | ____    | 2/2 ✅       |
 5  | ____         | ____    | 2/2 ✅       | Reporte final
```

---

## ⚠️ TROUBLESHOOTING

### Si no aparece sitemap-antecedentes.xml en GSC

**Acción 1:** Esperar 24 horas
- GSC puede tardar en detectar nuevos sitemaps

**Acción 2:** Re-enviar manualmente
```
GSC → Sitemaps → "Agregar nuevo sitemap"
URL: https://ultimamilla.com.ar/sitemap-antecedentes.xml
Click "Enviar"
```

**Acción 3:** Verificar que el archivo exista
```
Abrir en navegador: https://ultimamilla.com.ar/sitemap-antecedentes.xml
Debe mostrar XML válido (469 URLs)
```

---

### Si las FAQs no aparecen en Rich Results Test

**Acción 1:** Verificar estructura HTML
```
Abrir: https://search.google.com/test/rich-results
Pegar URL de página
Si hay errores, revisar JSON-LD en el inspector
```

**Acción 2:** Validar JSON-LD
```
1. Inspeccionar página (F12)
2. Buscar: <script type="application/ld+json">
3. Copiar contenido y validar en:
   https://validator.schema.org/
4. Debe mostrar "No errors"
```

**Acción 3:** Re-compilar si fue actualización
```
npm run build
Esperar a que la página se regenere en el servidor
```

---

### Si antecedentes no se indexan rápidamente

**Esperado:** 50-100 en 7 días (es NORMAL que sea lento)

**Acciones si < 10 en Day 7:**

1. Verificar robots.txt
```
Abrir: https://ultimamilla.com.ar/robots.txt
Debe contener:
  Sitemap: https://ultimamilla.com.ar/sitemap-antecedentes.xml
```

2. Verificar canonical URLs
```
Inspeccionar: https://ultimamilla.com.ar/antecedentes/10768/...
Buscar: <link rel="canonical" ...
Debe ser: https://ultimamilla.com.ar/antecedentes/10768/isi-solutions-...
```

3. Re-solicitar indexación
```
GSC → Inspección de URLs
Pegar: https://ultimamilla.com.ar/antecedentes/10768/...
Click "SOLICITAR INDEXACIÓN"
Esperar confirmación
```

---

## 📝 TAREAS DIARIAS CHECKLIST

### LUNES (Día 1)
```
Mañana:
- [ ] Verificar acceso a GSC
- [ ] Navegar a sección de Sitemaps
- [ ] Documentar estado actual
- [ ] Agregar sitemap-antecedentes.xml si no existe

Tarde:
- [ ] Tomar screenshot del sitemap enviado
- [ ] Documentar URLs enviadas y estado
```

### MARTES (Día 2)
```
Mañana:
- [ ] Testing de /seguridad-electronica en Google Rich Results Test
- [ ] Testing de /mineria en Google Rich Results Test
- [ ] Documentar resultados

Tarde:
- [ ] Testing de antecedente individual
- [ ] Revisar errores (si los hay)
- [ ] Tomar screenshots para reporte
```

### MIÉRCOLES (Día 3)
```
Mañana:
- [ ] Validar meta tags en /antecedentes
- [ ] Validar meta tags en antecedente individual
- [ ] Revisar og:image en sectores

Tarde:
- [ ] Inspeccionar HTML con DevTools
- [ ] Verificar que canonical URLs sean correctas
- [ ] Documentar hallazgos
```

### JUEVES (Día 4)
```
Mañana:
- [ ] Revisar Cobertura en GSC
- [ ] Documentar estado de indexación
- [ ] Hacer site: query para contar resultados

Tarde:
- [ ] Usar Inspección de URLs para 3 antecedentes
- [ ] Revisar fecha de última visita de Googlebot
- [ ] Si status es "No indexada", solicitar indexación
```

### VIERNES (Día 5)
```
Mañana:
- [ ] Compilar reporte de la semana
- [ ] Comparar métricas Day 1 vs Day 5
- [ ] Crear tabla de evolución

Tarde:
- [ ] Identificar cualquier problema a resolver
- [ ] Documentar próximos pasos (Semana 2)
- [ ] Presentar hallazgos al equipo
```

---

## 📞 CONTACTOS DE SOPORTE

Si necesitas ayuda:

**Google Support:**
- Search Console Help: https://support.google.com/webmasters
- Rich Results Test Issue: https://support.google.com/webmasters/contact/search-console

**Herramientas:**
- Google Rich Results Test: https://search.google.com/test/rich-results
- GSC Inspector: https://search.google.com/search-console/about
- Schema Validator: https://validator.schema.org/

---

## ✅ RESUMEN SEMANAL

**Objetivo alcanzado si al final de la semana:**
- ✅ Sitemap de antecedentes está siendo procesado
- ✅ 50+ antecedentes indexados
- ✅ Rich snippets validados sin errores
- ✅ Meta tags dinámicos funcionando
- ✅ Sin errores críticos de indexación

**Próximos pasos:**
- Semana 2: Implementar internal linking
- Semana 3: Crear primeros blog posts
- Semana 4: Análisis de resultados y optimizaciones

---

**Última Actualización:** 2025-12-11
**Versión:** 1.0
**Estado:** Listo para implementación
