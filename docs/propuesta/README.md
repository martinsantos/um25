# La propuesta (/propuesta): cómo se opera

Sistema "Despiece", octubre de 2026. Vive en `src/pages/propuesta`, `src/components/proto`,
`src/styles/proto-despiece.css` y `public/js/propuesta-apertura.js`. No se indexa (robots noindex en
cada página) hasta que reemplace al sitio.

## Reglas del sistema

- **Un medio por pantalla.** La apertura muestra el lugar real a pantalla completa (película de
  Blender en sectores, foto en portada, servicios y nosotros) y, con el scroll, se retira; recién
  entonces se dibuja la isometría, sola. Nunca los dos a la vez: salen de cámaras distintas.
- **Una pieza por miniatura.** Las partes isométricas van de a una, al lado de su fila del
  inventario. Nunca varias piezas en una misma escena.
- **Nada inventado.** Todo texto sale del catálogo, de SGI o de `relato.ts`. Lo que falta se dice
  ("el registro no detalla el alcance", "obra en curso").
- **Un rojo.** El de marca (`--red`) para marcas, puntos y subrayados; el de texto (`--red-text`)
  cuando el rojo es texto, porque el de marca no llega a 4,5:1 sobre el fondo.

## Datos

| Fuente | Qué aporta | Dónde |
|---|---|---|
| Catálogo web (Directus; copia en `src/data/snapshots/antecedentes.json`) | Título, cliente, descripción, foto, área, id de SGI | `loadStories()` en `src/components/proto/isoData.ts` |
| SGI | Fecha de inicio, cierre y estado de cada proyecto | `src/data/sgi/fechas.json`, por id web, sin datos internos |
| Obras en curso de SGI sin ficha en el catálogo | Título, cliente, fechas, sector y servicios leídos del título | `src/data/propuesta/antecedentes-extra.json` (se retiran cuando entran al catálogo) |
| Relato de la empresa, principios, casos destacados | Portada, nosotros, sectores | `src/components/proto/relato.ts` |

Reglas aplicadas al servir, en `titulos.ts` e `isoData.ts`: limpieza de títulos y clientes, títulos
repetidos distinguidos por descripción, mes o día, sector heredado del cliente cuando es único,
siglas solas escritas completas.

## Traer datos de SGI

```bash
SGI_USER=… SGI_PASS=… node scripts/propuesta/sgi-exportar.mjs
```

Deja el volcado completo en `.sgi/` (fuera de git: es información interna y el repositorio es
público) y actualiza `src/data/sgi/fechas.json`. La credencial no se escribe en ningún archivo.

## Control visual

```bash
npm run dev
node scripts/propuesta/control.mjs --base http://127.0.0.1:4321 --out control-propuesta
```

Recorre dieciséis páginas a cuatro anchos (1440, 1310, 1024, 390), los ocho servicios y los siete
sectores a dos anchos, una muestra de ocho fichas, y rastrea enlaces, imágenes y medios. Falla ante:
`<title>` dentro de un SVG (tooltip), desborde horizontal, figura fuera de pantalla, más pantallas
que el presupuesto, cambio de alto al recorrer la página (contenido que salta), error de consola o de
página, fondo que no cubre al inicio o no desaparece al final de la apertura, película que no
arranca, lugar por dentro que no recorre sus sistemas solo, ficha del muro que no muestra su
sistema al pasar, más de 1,8 MB de recursos en teléfono, cualquier enlace o imagen que devuelva error.

Deja las capturas y `informe.md` en la carpeta de salida. El informe incluye la auditoría de
contenido de las fichas (`/propuesta/auditoria.json`) y el cruce con SGI en cantidades.

Corre solo en cada push a `feature/portada-*` (`.github/workflows/preview.yml`): construye, corre
el control, adjunta las capturas como artefacto `control-propuesta`, abre un túnel temporal y deja
el veredicto y el link en el estado del commit. Cada push cancela la vista previa anterior; el link
nuevo tarda unos veinte minutos.

## Lo que no se resuelve por regla

- Descripciones vacías o mínimas: contenido, en Directus. SGI no tiene descripciones.
- Clientes sin sector: asignar en Directus.
- Fotos de obra reales: hoy son imágenes editoriales generadas.
- Un túnel con nombre fijo para la vista previa: requiere cuenta de Cloudflare.
