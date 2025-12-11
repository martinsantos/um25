# Guía de Monitoreo SEO - ULTIMA MILLA

## 1. MONITOREO EN GOOGLE SEARCH CONSOLE

### 1.1 Validación de Sitemaps

**Pasos:**
1. Acceder a https://search.google.com/search-console
2. Seleccionar propiedad: https://ultimamilla.com.ar
3. Ir a **Sitemaps** (menú izquierdo)
4. Verificar que los 3 sitemaps estén presentes:
   - `sitemap.xml` - Páginas estáticas
   - `sitemap-index.xml` - Índice maestro
   - `sitemap-antecedentes.xml` - 469 proyectos dinámicos

**Acciones si falta alguno:**
```bash
# Enviar sitemap manualmente
POST /submit?sitemap=https://ultimamilla.com.ar/sitemap-antecedentes.xml
```

**Métricas a monitorear:**
- Total de URLs enviadas
- Total de URLs indexadas
- Tasa de indexación (% indexed/submitted)
- Errores de crawl

---

### 1.2 Validación de Indexación

**Páginas clave a verificar:**

| URL | Parámetro de Búsqueda | Estado Esperado |
|-----|----------------------|-----------------|
| `/antecedentes` | `site:ultimamilla.com.ar/antecedentes` | Indexada |
| `/antecedentes/[id]/[slug]` (sample) | `site:ultimamilla.com.ar/antecedentes/10768` | Indexada |
| `/servicios` | `site:ultimamilla.com.ar/servicios` | Indexada |
| `/seguridad-electronica` | `site:ultimamilla.com.ar/seguridad-electronica` | Indexada |
| `/mineria` | `site:ultimamilla.com.ar/mineria` | Indexada |

**Verificación rápida en terminal:**
```bash
# Verificar indexación de antecedentes
curl -s "https://ultimamilla.com.ar/antecedentes/10768/isi-solutions-redes-y-comunicaciones" \
  -H "User-Agent: Googlebot" | grep -o '<title>.*</title>'

# Resultado esperado: <title>ISI Solutions - Redes ... | Caso de Éxito</title>
```

---

### 1.3 Monitoreo de Keywords

**Keywords Primarias a Trackear (30-60 días):**

| Keyword | Posición Objetivo | Prioridad |
|---------|------------------|-----------|
| servicios it mendoza | Top 10 | 🔴 Alta |
| redes de datos mendoza | Top 10 | 🔴 Alta |
| corrientes débiles mendoza | Top 5 | 🔴 Alta |
| cctv videovigilancia mendoza | Top 10 | 🟡 Media |
| telecomunicaciones cuyo | Top 15 | 🟡 Media |
| detección incendio mendoza | Top 15 | 🟡 Media |
| software a medida mendoza | Top 10 | 🟡 Media |

**Cómo trackear en GSC:**
1. Ir a **Performance** (menú izquierdo)
2. Filtrar por:
   - Date range: Últimos 90 días
   - Query: Agregar filtros por palabras clave
3. Monitorear:
   - **Impressions** (# de veces que apareció)
   - **Click-through Rate (CTR)**
   - **Average Position**

**Baseline Esperado (Primeros 30 días):**
- Impresiones: 50-200 (keywords nuevas)
- CTR: 1-3%
- Posición media: 25-50

---

### 1.4 Monitoreo de Páginas de Antecedentes

**Métrica clave:** Indexación de las 469 páginas dinámicas

**Pasos:**
1. En Performance, filtrar por:
   - Page: `/antecedentes/` (partial match)
2. Verificar:
   - Total de páginas en resultados
   - CTR promedio
   - Posición media

**Meta de Éxito:**
- Mes 1: 50-100 antecedentes indexados
- Mes 2: 200-300 antecedentes indexados
- Mes 3: 400+ antecedentes indexados

---

### 1.5 Análisis de Click-through Rate (CTR)

**Mejora esperada por Rich Snippets (FAQs):**

| Métrica | Antes | Después (Mes 3) |
|---------|-------|-----------------|
| CTR en SERP | 2-3% | 4-6% |
| Clicks de FAQPage queries | 0 | 10-20/mes |
| Impresiones ricas | 0% | 15-25% |

**Páginas con FAQ Schema:**
- `/seguridad-electronica` → FAQ: "¿Qué sistemas de detección instalan?"
- `/mineria` → FAQ: "¿Qué servicios ofrecen para minería?"

---

## 2. VALIDACIÓN DE STRUCTURED DATA

### 2.1 Google Rich Results Test

**Validar FAQ Schema:**

```bash
# URL de test
https://search.google.com/test/rich-results

# Pegar URL:
https://ultimamilla.com.ar/seguridad-electronica

# Esperado:
✅ FAQPage schema detected
✅ 4 questions/answers parsed correctly
✅ No errors or warnings
```

**Checklist:**
- [ ] FAQPage schema válido
- [ ] Questions bien formateadas
- [ ] Answers completos
- [ ] Sin errores de sintaxis

---

### 2.2 Schema.org Validator

**Validar CreativeWork en antecedentes:**

```bash
# URL
https://validator.schema.org/

# Pegar JSON-LD de ejemplo:
{
  "@context": "https://schema.org",
  "@type": "CreativeWork",
  "name": "ISI Solutions - Redes y comunicaciones",
  "description": "Caso de éxito...",
  "client": "ISI Solutions",
  "about": "Telecomunicaciones"
}

# Esperado:
✅ No errors
✅ CreativeWork type recognized
✅ All required properties present
```

---

### 2.3 Verificación de Meta Tags

**Script para validar meta tags en página de antecedentes:**

```bash
# Validar meta description (debe ser ~160 caracteres)
curl -s https://ultimamilla.com.ar/antecedentes/10768/isi-solutions-redes-y-comunicaciones \
  | grep -o '<meta name="description" content="[^"]*"' | wc -c

# Resultado esperado: 140-180 caracteres

# Validar og:image
curl -s https://ultimamilla.com.ar/antecedentes/10768/isi-solutions-redes-y-comunicaciones \
  | grep 'og:image' | head -1

# Resultado esperado: <meta property="og:image" content="https://..."
```

---

## 3. TESTING DE PERFORMANCE

### 3.1 PageSpeed Insights

**URLs a testear:**
1. https://ultimamilla.com.ar/antecedentes (Mobile + Desktop)
2. https://ultimamilla.com.ar/servicios (Mobile + Desktop)
3. https://ultimamilla.com.ar/seguridad-electronica (Mobile + Desktop)

**Métricas objetivo:**
- Core Web Vitals: All "Good"
- Performance Score: 75+ (Mobile), 85+ (Desktop)
- LCP (Largest Contentful Paint): < 2.5s
- FID (First Input Delay): < 100ms
- CLS (Cumulative Layout Shift): < 0.1

**Áreas críticas post-SEO:**
- Carga de imágenes en grid de antecedentes (lazy loading)
- Tamaño de JSON-LD schemas
- Rendering de FAQs

---

### 3.2 Google Lighthouse

```bash
# Instalar lighthouse globalmente
npm install -g lighthouse

# Auditar página de antecedentes
lighthouse https://ultimamilla.com.ar/antecedentes --output=html --output-path=./lighthouse-report.html

# Auditar página de servicio
lighthouse https://ultimamilla.com.ar/servicios --output=html --output-path=./lighthouse-servicios.html
```

**Checklist:**
- [ ] Accessibility: 90+
- [ ] Best Practices: 90+
- [ ] SEO: 90+
- [ ] Performance: 75+

---

## 4. MONITORING AUTOMÁTICO

### 4.1 Monitoreo Semanal (5 minutos)

**Crear un script o usar Google Sheets:**

```markdown
## SEO Health Check - Semanal

| Métrica | Semana 1 | Semana 2 | Semana 3 | Target |
|---------|----------|----------|----------|--------|
| GSC Impresiones | 0 | 50 | 150 | 300+ |
| GSC Clicks | 0 | 5 | 15 | 30+ |
| CTR Promedio | 0% | 2% | 2.5% | 3%+ |
| URLs Indexadas | 50 | 75 | 125 | 500+ |
| Posición Media | N/A | 45 | 38 | <30 |
| PageSpeed (Mobile) | 65 | 68 | 70 | 75+ |
| FAQ Rich Results | 0 | 2 | 2 | 2 |
```

**Acciones si números bajos:**
- Bajo impresiones: Revisar keywords en titles/descriptions
- Bajo CTR: Mejorar meta descriptions (más llamativas)
- Baja indexación: Verificar robots.txt y canonical URLs

---

### 4.2 Monitoreo Mensual (30 minutos)

**Reporte mensual incluir:**

1. **Análisis de Keywords**
   - Top 10 keywords con más impresiones
   - Keywords con mejor CTR
   - Keywords sin clicks (oportunidad)

2. **Análisis de Páginas**
   - Top 10 páginas con más impresiones
   - Antecedentes más visitados
   - Páginas con bajo CTR

3. **Análisis de Estructura**
   - % de antecedentes indexados
   - Status de sitemaps
   - Errores de crawl

4. **Comparativa vs Competencia**
   - Posicionamiento vs competidores clave
   - Gaps en cobertura de keywords

---

## 5. HERRAMIENTAS RECOMENDADAS

### Herramientas Gratuitas
- **Google Search Console** - Monitoreo oficial
- **Google Rich Results Test** - Validación de schemas
- **Schema.org Validator** - Verificación de JSON-LD
- **PageSpeed Insights** - Performance
- **Google Lighthouse** - Audits completos
- **MozBar** - MRank, DA/PA (extensión Chrome)

### Herramientas de Pago (Opcional)
- **Semrush** - Keyword research, competitor analysis
- **Ahrefs** - Backlinks, SEO audit
- **SE Ranking** - Rank tracking, keyword monitoring
- **Screaming Frog** - Website crawl audit

---

## 6. CHECKLIST DE VALIDACIÓN INICIAL

### Antes de comenzar a monitorear (Día 1)

- [ ] Google Search Console: Verificada propiedad
- [ ] Sitemaps: 3 sitemaps enviados y procesados
- [ ] Meta tags: Validados en muestra de 5 antecedentes
- [ ] Rich Snippets: FAQs validadas en Google Rich Results
- [ ] PageSpeed: Mediciones baseline capturadas
- [ ] Lighthouse: Reportes iniciales guardados
- [ ] Spreadsheet: Creada hoja de monitoreo
- [ ] Keywords: Lista de 20-30 keywords objetivo lista

### Semana 1-2

- [ ] Validar sitemaps en GSC
- [ ] Revisar primeros errores de crawl
- [ ] Capturar primeras impresiones en GSC
- [ ] Validar indexación de 10-20 antecedentes
- [ ] Revisar CTR en primeros keywords

### Semana 3-4

- [ ] Analizar performance de antecedentes
- [ ] Revisar posiciones de keywords principales
- [ ] Identificar oportunidades de mejora
- [ ] Comenzar internal linking strategy

---

## 7. PRÓXIMOS PASOS POST-MONITOREO

### Mes 1-2: Optimizaciones Reactivas
- [ ] Mejorar meta descriptions de keywords con bajo CTR
- [ ] Añadir keywords faltantes a titles
- [ ] Investigar por qué algunos antecedentes no se indexan
- [ ] Revisar enlaces rotos en antecedentes

### Mes 2-3: Optimizaciones Estratégicas
- [ ] Implementar internal linking entre antecedentes
- [ ] Crear contenido hub para keywords principales
- [ ] Agregar schema adicionales (Article, BreadcrumbList)
- [ ] Crear plan de content marketing

### Mes 3+: Escala
- [ ] Expandir a keywords secundarias
- [ ] Crear landing pages para sectores
- [ ] Desarrollar estrategia de links (backlinks)
- [ ] Expandir contenido de blog

---

## 8. CONTACTOS Y REFERENCIAS

**Google Support:**
- Search Console Help: https://support.google.com/webmasters
- Rich Results Test: https://search.google.com/test/rich-results
- Mobile-Friendly Test: https://search.google.com/test/mobile-friendly

**Documentación Técnica:**
- Schema.org Documentation: https://schema.org/
- Google's SEO Starter Guide: https://developers.google.com/search/docs/beginner/seo-starter-guide
- Astro SEO Best Practices: https://docs.astro.build/en/guides/integrations-guide/sitemap/

---

**Última Actualización:** 2025-12-11
**Versión:** 1.0
**Estado:** Listo para implementar
