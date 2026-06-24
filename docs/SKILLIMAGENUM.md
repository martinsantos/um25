# SKILLIMAGENUM

Sistema reutilizable para generar, revisar, nombrar, procesar, publicar y auditar imagenes numeradas en lotes para ULTIMA MILLA.

Este documento sintetiza el flujo usado para completar las 518 imagenes unicas de antecedentes y lo convierte en una metodologia repetible para N necesidades: antecedentes, servicios, productos, evidencias GEO, landing pages, dossiers, galerias o cualquier conjunto de assets donde cada item necesita una imagen unica, trazable y publicable.

## Objetivo

Generar una imagen unica por item, con prompt controlado, nombre estable, metadatos derivados, version publica optimizada y auditoria final.

El resultado esperado de cada corrida es:

- Un manifest con N items.
- Un prompt individual por item o un prompt de lote que liste todos los items.
- Imagenes crudas preservadas.
- Imagenes web procesadas en `.webp` y, si hace falta, `.jpg`.
- Mapa JSON `id -> public image path`.
- Reporte de rutas, nombres, alt/meta tags, sitemap/structured data.
- Contact sheet o galeria para revision visual.
- Auditoria sin faltantes, duplicados ni assets rotos.

## Trabajo Base Realizado En Antecedentes

Se completo la cobertura de imagenes de antecedentes:

- Lotes: `lote_001` a `lote_052`.
- Total de antecedentes en manifest: `518`.
- Total procesado: `518`.
- Total publicado: `518`.
- Faltantes: `0`.
- Duplicados: `0`.
- Assets rotos: `0`.

Archivos principales:

- Mapa publico: `src/data/antecedentes-generated-image-map.json`.
- Publicadas: `public/images/antecedentes/generated/lote_001` a `lote_052`.
- Crudas: `work/antecedentes-images/generadas_crudas/lote_001` a `lote_052`.
- Procesadas: `work/antecedentes-images/salida_web/lote_001` a `lote_052`.
- Prompts y manifests: `work/antecedentes-images/lotes/lote_XXX`.
- Contact sheets y galerias: `work/antecedentes-images/galerias`.
- Reporte completo: `work/antecedentes-images/reporte-imagenes-generadas.csv`.
- Reporte JSON: `work/antecedentes-images/reporte-imagenes-generadas.json`.
- Progreso historico: `work/antecedentes-images/PROGRESO_GENERACION.md`.

## Scripts Del Flujo

Scripts recuperados y estabilizados:

- `scripts/antecedentes_images/rewrite-prompts.mjs`
  - Forma los prompts.
  - Clasifica cada item.
  - Aplica recetas especificas.
  - Define concepto visual unico, escena concreta, composicion y evitaciones.

- `scripts/antecedentes_images/cli.mjs`
  - `ingest-latest`: toma las ultimas imagenes generadas y las copia al lote.
  - `postprocess`: convierte crudas a `.webp` y `.jpg`, 1600 x 1000, `fit: cover`.
  - `gallery`: genera HTML de revision.
  - `contact-sheet`: genera PNG de revision con ID visible.

- `scripts/publish-antecedentes-generated-images.mjs`
  - Copia `.webp` a `public/images/antecedentes/generated/lote_XXX`.
  - Actualiza el mapa JSON conservando entradas previas.

- `scripts/antecedentes_images/audit.mjs`
  - Verifica manifests, procesadas, publicadas, duplicados, faltantes y assets rotos.

- `scripts/antecedentes_images/watch-generated-images.mjs`
  - Permite continuar cuando vuelve el servicio.
  - Puede revisar cada 15 minutos.

- `scripts/antecedentes_images/report.mjs`
  - Genera inventario completo con nombres, rutas, alt/meta tags y URLs canonicas.

Comandos npm:

```bash
npm run antecedentes:prompts
npm run antecedentes:images:ingest -- --lote lote_XXX
npm run antecedentes:images:postprocess -- --lote lote_XXX
npm run antecedentes:images:gallery -- --lote lote_XXX
npm run antecedentes:images:contact-sheet -- --lote lote_XXX
npm run antecedentes:images:publish -- --lote lote_XXX
npm run antecedentes:images:audit
npm run antecedentes:images:continue-once
npm run antecedentes:images:watch
node scripts/antecedentes_images/report.mjs
```

## Regla De Oro

Cada item debe tener una imagen unica.

No se acepta resolver un lote con el mismo comodin visual repetido. En antecedentes se prohibio explicitamente:

- Tecnico de espaldas frente a rack.
- Persona mirando pantalla de espaldas.
- Sala de servidores generica.
- Rack frontal como solucion universal.
- Collage o grilla.
- Texto legible.
- Logos, marcas inventadas o marcas de clientes.
- Rostros reconocibles.
- Imagen stock generica sin evidencia tecnica.

## Estructura De Manifest

Para aplicar SKILLIMAGENUM a cualquier necesidad, preparar un CSV con una fila por item.

Campos minimos:

```csv
id,slug,titulo,cliente,area,fecha,descripcion,batch_id,expected_filename,status
```

Campos recomendados:

```csv
id,slug,titulo,cliente,sector,unidad,fecha,descripcion,imagen_actual,batch_id,expected_filename,status
```

Reglas:

- `id`: identificador estable.
- `batch_id`: lote, por ejemplo `lote_001`.
- `expected_filename`: nombre base final sin extension.
- `status`: `pending`, `approved`, `discarded` o equivalente.
- El nombre final publicado debe salir de `expected_filename`.

Ejemplo de nombre final:

```text
3580-soporte-de-infraestructura-it-de-alta-disponibilidad-cliente-confidencial-diciembre-2016-2-principal.webp
```

## Formacion De Prompt

Cada prompt debe incluir:

- Contexto de marca.
- Objetivo de la imagen.
- Reglas visuales generales.
- Reglas anti-repeticion.
- ID del item.
- Nombre esperado al descargar.
- Cliente/sector/titulo/descripcion.
- Concepto visual unico.
- Escena concreta.
- Composicion obligatoria.
- Elementos a priorizar.
- Evitaciones explicitas.

Plantilla base:

```text
Actua como director de fotografia documental para una empresa argentina de tecnologia e infraestructura digital.

Objetivo:
Crear una imagen separada por item, apta para el sitio o pieza indicada.

Reglas visuales:
- Estetica documental realista, no render 3D, no stock generico, no ilustracion.
- Escenas tecnicas creibles, con evidencia fisica del trabajo.
- Luz natural o LED de trabajo, composicion sobria, materiales reales.
- Horizontal 16:10 o 16:9, minimo 1600 px de ancho si la herramienta lo permite.
- Sin texto visible agregado, sin marcas de agua, sin logos inventados.
- Evitar rostros reconocibles y personas identificables.
- No generar collage ni grillas.

Reglas anti-repeticion:
- Cada ID debe tener concepto visual unico.
- Variar escala, angulo, fondo y objeto protagonista.
- No usar tecnico de espaldas frente a rack como comodin.
- No repetir sala de servidores, rack frontal o monitor como solucion universal.

Producto:
ID: {id}
Nombre esperado: {expected_filename}.png
Cliente: {cliente}
Sector: {sector}
Titulo: {titulo}
Descripcion: {descripcion}
Concepto visual unico: {concepto}
Escena concreta: {escena}
Composicion obligatoria: {composicion}
Elementos a priorizar: {prioridades}
Evitar: {evitaciones}

Generar UNA imagen separada para este item.
```

## Recetas Visuales

El generador debe evitar clasificaciones ingenuas por palabra clave. En antecedentes hubo falsos positivos como:

- `sistema de deteccion` tratado como software.
- `Fuente Mayor` tratado como hardware por la palabra fuente.
- `Camara de Comercio` tratado como CCTV.
- `software` en titulos que describian SDI o seguridad fisica.
- `soporte IT` que en descripcion era banco de capacitores, corto electrico o mantenimiento industrial.

Para cada dominio conviene crear recetas especificas:

- CCTV: camara instalada, mesa de reemplazo, revision de camaras, monitor apagado o desenfocado.
- SDI/incendio: detector, pulsador, sirena, central cerrada, conduit, multimetro, barreras opticas.
- Redes/fibra: bandeja optica, cordones amarillos, patch cords, tester, medidor optico, rosetas.
- Software/digitalizacion: laptop/tablet con interfaz abstracta sin texto, documentos dados vuelta, periferico o lector secundario.
- Telefonia: telefonos de costado o reverso, fuentes, switches PoE, headsets, sin teclas/pantallas legibles.
- Hardware/provision: cajas anonimas, equipos lisos, checklist en blanco, cables y tester.
- Industrial/electrico: tableros desenergizados, capacitores, termicas, pinza amperometrica, sin chispas.
- Aeropuerto: terminal, manga, campo de vuelo, sala tecnica, sin logos ni pasajeros protagonistas.
- Salud: pasillos limpios, consultorios, detectores, canalizacion, sin pacientes.
- Gobierno: oficina publica sobria, sin escudos ni carteleria.

## Generacion

Modo normal:

1. Generar imagen por imagen usando el prompt.
2. Revisar visualmente cada salida.
3. Si falla, marcar como descarte y generar v2/v3.
4. No borrar crudos descartados salvo pedido explicito.
5. Copiar solo la version aprobada al staging del lote.

Motivos de descarte:

- Texto legible en pantalla, papel, etiqueta o equipo.
- Logo o marca real/inventada.
- Rostro reconocible.
- Imagen demasiado parecida a otra del lote.
- Concepto equivocado.
- Escena comodin.
- Rack, monitor o tecnico dominante sin corresponder.
- UI falsa con palabras, numeros o QR.
- Riesgo visual dramatico no solicitado: chispas, fuego, humo, accidente.

## Ingesta

Si las imagenes se generaron en orden y no hubo descartes:

```bash
npm run antecedentes:images:ingest -- --lote lote_XXX --source-dir /ruta/generated_images/thread
```

Si hubo descartes:

- Copiar manualmente solo las aprobadas.
- Usar el nombre `{expected_filename}.png`.
- Mantener originales generados en su carpeta fuente.

## Postproceso

Convertir a web:

```bash
npm run antecedentes:images:postprocess -- --lote lote_XXX
```

Salida:

```text
work/antecedentes-images/salida_web/lote_XXX/{expected_filename}.webp
work/antecedentes-images/salida_web/lote_XXX/{expected_filename}.jpg
work/antecedentes-images/salida_web/lote_XXX/qa.csv
```

Parametros reales usados:

- Resize: `1600 x 1000`.
- Fit: `cover`.
- Position: `attention`.
- WebP quality: `88`.
- JPEG quality: `88`.

## Revision

Generar galeria:

```bash
npm run antecedentes:images:gallery -- --lote lote_XXX
```

Generar contact sheet:

```bash
npm run antecedentes:images:contact-sheet -- --lote lote_XXX
```

Revisar:

- Correspondencia ID/imagen.
- Variedad intra-lote.
- Ausencia de texto/logos.
- Ausencia de rostros.
- Calidad documental.
- Que la imagen sirva como evidencia visual del alcance.

## Publicacion

Publicar solo despues de aprobar visualmente:

```bash
npm run antecedentes:images:publish -- --lote lote_XXX
```

La publicacion debe:

- Copiar `.webp` a `public/.../generated/lote_XXX`.
- Actualizar mapa JSON `id -> /images/...webp`.
- Conservar entradas anteriores si se publica un solo lote.

## Metadatos

En antecedentes, los metadatos no se escriben imagen por imagen dentro del archivo. Se derivan por codigo desde CMS/snapshot y mapa publicado.

Reglas actuales:

- `img alt`: titulo del antecedente.
- `og:image`: URL canonica del `.webp` publicado.
- `og:image:alt`: `meta_title`.
- `twitter:image`: URL canonica del `.webp` publicado.
- `twitter:image:alt`: `meta_title`.
- structured data `image`: URL canonica del `.webp`.
- `sitemap-images.xml`: usa `<image:loc>` con URL canonica y no emite `<image:title>`.
- `geo/image-evidence.json`: publica `id`, `title`, `pageUrl`, `imageUrl`, `client`, `sector`, `date`.

Fuentes:

- `src/pages/antecedentes/[id]/[slug].astro`
- `src/components/SEO/SEOHead.astro`
- `src/pages/sitemap-images.xml.ts`
- `src/utils/antecedentesImageEvidence.ts`
- `src/data/geoResources.ts`
- `src/utils/seoMetaPolicy.ts`

## Auditoria

Auditoria del flujo:

```bash
npm run antecedentes:images:audit
```

Debe devolver:

- `manifestRows === expected total`.
- `manifestUnique === expected total`.
- `processedUnique === expected total`.
- `publishedUnique === expected total`.
- `missingProcessed === 0`.
- `missingPublished === 0`.
- `duplicateManifestIds === 0`.
- `duplicateProcessedIds === 0`.
- `duplicatePublishedPaths === 0`.
- `brokenPublishedAssets === 0`.

Reporte ampliado:

```bash
node scripts/antecedentes_images/report.mjs
```

Debe devolver:

```json
{
  "rows": 518,
  "missing": 0
}
```

Para una necesidad nueva, reemplazar `518` por N.

## Evocacion Para N Necesidades

Cuando se invoque SKILLIMAGENUM para una nueva necesidad:

1. Definir el conjunto N:
   - Que items necesitan imagen.
   - Que ID estable usara cada item.
   - Donde se publicaran.
   - Que metadatos deben derivarse.

2. Crear manifest:
   - CSV con una fila por item.
   - `batch_id` por lote.
   - `expected_filename` estable.

3. Crear o adaptar generador:
   - Base: `rewrite-prompts.mjs`.
   - Agregar recetas del dominio.
   - Evitar comodines.

4. Generar prompts:
   - Un prompt de lote o uno por item.
   - Incluir reglas anti-repeticion y evitaciones.

5. Generar imagenes:
   - Una por item.
   - Descartar fallos.
   - Guardar crudos.

6. Procesar:
   - WebP/JPG a dimensiones del destino.
   - QA CSV.

7. Revisar:
   - Galeria/contact sheet.
   - Aprobar visualmente antes de publicar.

8. Publicar:
   - Copiar assets finales.
   - Actualizar mapa JSON.
   - Integrar resolver de imagen si aplica.

9. Metadatos:
   - `alt`, OG/Twitter, structured data, sitemap, JSON de evidencia si aplica.

10. Auditar:
    - N manifest.
    - N procesadas.
    - N publicadas.
    - 0 faltantes.
    - 0 duplicados.
    - 0 assets rotos.

## Checklist De Cierre

- [ ] Manifest completo.
- [ ] Prompts generados.
- [ ] Crudos preservados.
- [ ] Descartes no publicados.
- [ ] WebP procesados.
- [ ] Galeria/contact sheet revisada.
- [ ] Publicacion hecha.
- [ ] Mapa JSON actualizado.
- [ ] Metadatos derivados verificados.
- [ ] Sitemap/structured data/JSON evidencia revisados si aplican.
- [ ] Auditoria en cero faltantes.
- [ ] Test especifico pasando si existe.
- [ ] Reporte final generado.
