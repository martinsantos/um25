# Auditoría de cobertura GSC — 2026-07-10

## Alcance y lectura correcta

Fuente: exportación de Google Search Console `ultimamilla.com.ar-Coverage-2026-07-10.zip`.
La última observación diaria incluida es del 2026-06-29, por lo que el informe no refleja de inmediato los despliegues de julio.

El total de `Sin indexar` de GSC no debe compararse directamente contra el sitemap actual: Search Console conserva URLs históricas, aliases, hosts y slugs antiguos. El corpus canónico publicado al auditar contiene 770 URLs únicas; las 770 responden HTTP 200, sin `noindex`, redirecciones ni canonical divergente.

## Estado cuantitativo

| Señal GSC | URLs | Interpretación |
| --- | ---: | --- |
| Indexadas | 1.101 | Incluye URLs históricas; supera el corpus canónico actual. |
| Sin indexar | 3.128 | Mezcla deuda histórica, duplicados, redirecciones y páginas aún no seleccionadas. |
| No encontrada (404) | 901 | Prioridad alta para depurar enlaces históricos y devolver 404 real. |
| Página con redirección | 715 | Parte esperable; se deben eliminar redirecciones desde enlaces internos y sitemaps. |
| Alternativa con canonical adecuada | 373 | Exclusión generalmente correcta, no un error por sí sola. |
| Bloqueada por 403 | 32 | Requiere exportar ejemplos de URL para identificar origen. |
| Error 5xx | 18 | No se reproduce en el sitemap actual; mantener monitoreo y validar en GSC. |
| Rastreada, sin indexar | 682 | Señal principal de calidad/diferenciación del corpus. |
| Google eligió otra canonical | 267 | Compatible con páginas de antecedentes demasiado similares. |
| Descubierta, sin indexar | 135 | Mejorar prioridad mediante enlaces internos y calidad, no mediante más URLs. |

Las impresiones diarias crecieron de 126 el 2026-04-10 a 1.163 el 2026-06-29. La tendencia es positiva; el objetivo es limpiar el índice sin frenar ese crecimiento.

## Evidencia técnica actual

- `sitemap-index.xml`: HTTP 200.
- 5 sitemaps hijos: HTTP 200.
- 1.294 entradas totales y 770 URLs únicas; la repetición proviene principalmente del sitemap de imágenes.
- 770/770 URLs canónicas actuales: HTTP 200.
- 0 URLs del sitemap con redirect, 404, `noindex` o canonical divergente.
- 757 páginas HTML auditadas: 0 sin title, description o H1.
- Antes de esta corrección: 16 páginas compartían title y 220 compartían H1.
- Antes de esta corrección: 5 destinos internos del blog apuntaban a redirects o slugs codificados.

## Correcciones implementadas en la rama

1. Rutas raíz desconocidas dejan de redirigir a `/sectores` y responden 404 real.
2. Servicios, antecedentes, blog y categorías inexistentes responden 404 real, sin 302 intermedio.
3. Slugs válidos pero antiguos usan 301 permanente hacia su URL canónica.
4. Slugs de blog con tildes codificadas se normalizan a ASCII canónico.
5. Enlaces internos del blog se reescriben directamente a sus destinos canónicos.
6. Titles de antecedentes incorporan año y código `UM-{id}` para evitar colisiones verificables.
7. H1 de antecedentes incorpora la fecha real del proyecto para diferenciar trabajos recurrentes.

## Operación recomendada en GSC

1. Tras desplegar, volver a enviar `https://www.ultimamilla.com.ar/sitemap-index.xml`.
2. Iniciar validación para 404, páginas con redirección, 5xx y canonical elegida por Google.
3. Exportar los ejemplos de URL de los grupos 404, 403, 5xx y canonical diferente. El ZIP agregado no contiene esas URLs y no permite definir redirects históricos seguros.
4. Solicitar indexación manual sólo para home, ocho servicios, nueve sectores, cuatro hubs GEO y casos prioritarios. No solicitar las 518 fichas una por una.
5. Comparar a 7, 14 y 28 días: páginas canónicas indexadas, conflictos de canonical, 5xx y URLs rastreadas sin indexar.

## Compuerta objetivo

- 100% de URLs incluidas en sitemap con HTTP 200 y canonical propia.
- 0 enlaces internos a redirects, 404 o 5xx.
- 0 errores 5xx durante 28 días.
- 100% de servicios, sectores y hubs GEO prioritarios indexados.
- Menos de 1% de URLs canónicas actuales con canonical distinta elegida por Google.
- Reducción sostenida de URLs históricas 404/redirect, sin ampliar artificialmente el sitemap.
