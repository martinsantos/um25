# Blog API — Guía para agentes

## Endpoint

```
POST https://www.ultimamilla.com.ar/api/blog
```

## Autenticación

Basic Auth — incluir en cada request:

```
Authorization: Basic YWRtaW5AdW1ib3QuY29tLmFyOlVtYm90QWRtaW4yMDI1IQ==
```

> El token es `base64("admin@umbot.com.ar:UmbotAdmin2025!")`.

---

## Publicar un post

### Request

```http
POST https://www.ultimamilla.com.ar/api/blog
Authorization: Basic YWRtaW5AdW1ib3QuY29tLmFyOlVtYm90QWRtaW4yMDI1IQ==
Content-Type: application/json

{
  "titulo": "Título del artículo",
  "resumen": "Una o dos oraciones que resumen el artículo. Aparece en el feed.",
  "contenido": "## Primera sección\n\nTexto del artículo en **Markdown**.\n\n## Segunda sección\n\nMás contenido.",
  "categoria": "noticias",
  "imagen_portada": "https://images.unsplash.com/photo-xxx?w=1200&h=480&fit=crop",
  "tags": ["infraestructura", "redes", "fibra"],
  "tiempo_lectura": 4,
  "fecha_publicacion": "2026-04-23",
  "meta_title": "Título SEO (opcional, ≤60 chars)",
  "meta_description": "Descripción para Google (opcional, ≤160 chars)"
}
```

### Response exitosa

```json
{ "ok": true, "slug": "titulo-del-articulo", "id": 5 }
```

### Response de error

```json
{ "error": "Campos requeridos: titulo, resumen, contenido" }
{ "error": "Unauthorized" }
{ "error": "Directus error", "detail": "..." }
```

---

## Campos

| Campo | Requerido | Tipo | Descripción |
|---|---|---|---|
| `titulo` | ✓ | string | Título del artículo |
| `resumen` | ✓ | string | Texto corto para el feed (1-2 oraciones) |
| `contenido` | ✓ | string | Cuerpo del artículo en Markdown |
| `categoria` | — | string | `noticias` · `proyectos` · `tecnico` · `empresa` (default: `noticias`) |
| `imagen_portada` | — | string | URL pública de imagen (Unsplash, etc.) |
| `tags` | — | string[] | Array de tags: `["tag1","tag2"]` |
| `tiempo_lectura` | — | number | Minutos estimados de lectura (default: 3) |
| `slug` | — | string | URL del post (auto-generado del título si se omite) |
| `fecha_publicacion` | — | string | `YYYY-MM-DD` (default: hoy) |
| `meta_title` | — | string | Título SEO ≤60 chars (default: `titulo`) |
| `meta_description` | — | string | Descripción SEO ≤160 chars (default: `resumen`) |

---

## Contenido en Markdown

El campo `contenido` acepta Markdown estándar. Los `## Subtítulos` generan entradas en el índice (TOC) del post.

```markdown
## Primera sección

Párrafo normal con **negrita** y *itálica*.

## Segunda sección

Lista:
- Ítem uno
- Ítem dos

> Cita destacada con blockquote.

`código inline` y bloques de código:

\`\`\`bash
comando --ejemplo
\`\`\`
```

---

## Imágenes

Usar URLs públicas directas. Recomendaciones gratuitas:

**Unsplash** (alta calidad, sin atribución requerida para uso programático):
```
https://images.unsplash.com/photo-{ID}?w=1200&h=480&fit=crop&q=80
```

IDs sugeridos por categoría:
- Infraestructura IT / servidores: `photo-1558494949-ef010cbdcc31`
- Redes / fibra óptica: `photo-1544197150-b99a580bb7a8`
- Seguridad / cámaras: `photo-1593642632559-0c6d3fc62b89`
- Ciudad / telecomunicaciones: `photo-1477959858617-67f85cf4f1df`
- Data center: `photo-1531297484001-80022131f5a1`
- Energía / electricidad: `photo-1473341304170-971dccb5ac1e`

---

## Categorías y colores

| Valor | Etiqueta | Color |
|---|---|---|
| `noticias` | Noticias | Azul `#3b82f6` |
| `proyectos` | Proyectos | Verde `#10b981` |
| `tecnico` | Técnico | Violeta `#8b5cf6` |
| `empresa` | Empresa | Naranja `#f59e0b` |

---

## Otros endpoints

### Listar posts publicados

```http
GET https://www.ultimamilla.com.ar/api/blog
```

Response:
```json
{
  "data": [
    { "slug": "mi-post", "titulo": "Mi Post", "fecha_publicacion": "2026-04-23", "categoria": "noticias" }
  ]
}
```

### Despublicar un post

```http
DELETE https://www.ultimamilla.com.ar/api/blog/{slug}
Authorization: Basic YWRtaW5AdW1ib3QuY29tLmFyOlVtYm90QWRtaW4yMDI1IQ==
```

Response: `{ "ok": true, "slug": "mi-post", "action": "unpublished" }`

> No borra el post — cambia el status a `draft`. Se puede recuperar desde el admin de Directus.

---

## Ejemplo completo para agente

### Instrucción tipo para Claude / GPT

```
Publicá un artículo en el blog de Ultima Milla sobre [TEMA].

El artículo debe:
- Tener entre 400-600 palabras
- Usar al menos 2 subtítulos (## Sección)
- Ser relevante para infraestructura IT, seguridad electrónica o telecomunicaciones
- Incluir una imagen de Unsplash relacionada al tema
- Tener 3-4 tags descriptivos
- Estimar el tiempo de lectura

Cuando tengas el contenido listo, publicalo con:

POST https://www.ultimamilla.com.ar/api/blog
Authorization: Basic YWRtaW5AdW1ib3QuY29tLmFyOlVtYm90QWRtaW4yMDI1IQ==
Content-Type: application/json

{ ...el JSON del post... }
```

### curl desde terminal

```bash
curl -X POST https://www.ultimamilla.com.ar/api/blog \
  -H "Authorization: Basic YWRtaW5AdW1ib3QuY29tLmFyOlVtYm90QWRtaW4yMDI1IQ==" \
  -H "Content-Type: application/json" \
  -d '{
    "titulo": "Fibra Óptica en Zonas Industriales: Guía Práctica",
    "resumen": "Cómo diseñar e instalar redes de fibra óptica en entornos industriales con alta interferencia electromagnética.",
    "contenido": "## Por qué fibra en entornos industriales\n\nLas redes de cobre sufren interferencias en plantas industriales. La fibra óptica es inmune al ruido electromagnético.\n\n## Tipos de fibra recomendados\n\n- **Monomodo OS2**: largas distancias, hasta 10km sin repetidor\n- **Multimodo OM4**: distancias cortas, alta velocidad dentro del edificio\n\n## Consideraciones de instalación\n\nUsar bandejas metálicas separadas del cableado eléctrico. Los empalmes deben hacerse con fusionadora en campo.",
    "categoria": "tecnico",
    "imagen_portada": "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=1200&h=480&fit=crop&q=80",
    "tags": ["fibra-optica", "redes", "industrial"],
    "tiempo_lectura": 4
  }'
```

---

## Notas importantes para el agente

1. **El slug se genera automáticamente** del título (minúsculas, sin acentos, guiones). Si querés un slug específico, pasalo explícitamente.
2. **La imagen es opcional** — si no hay URL, el post muestra un fallback genérico.
3. **El post se publica inmediatamente** — status `published` desde el momento del POST.
4. **El contenido es Markdown** — no HTML. El sistema convierte `##` en títulos con IDs para el TOC automáticamente.
5. **Verificar publicación**: `GET https://www.ultimamilla.com.ar/api/blog` para ver el post en la lista.
6. **Ver en el sitio**: `https://www.ultimamilla.com.ar/blog/{slug}` una vez publicado.
