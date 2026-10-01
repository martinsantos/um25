# Imágenes con IA para el sitio UMSA — dirección de arte y flujo

Fecha: 2026-09-23 · Estado: flujo listo, **sin ejecutar** (falta `OPENAI_API_KEY` en el entorno).

## Hallazgo

Las fotos actuales de antecedentes (`umsa-sitio-alfa/imagenes_antecedentes_versionproduccion/*.png`, 474 archivos, y `public/img/antecedentes/*.webp`) **ya son imágenes generadas** (estilo y semillas `_s1899918460` en el nombre). Hoy se publican como si ilustraran casos reales, sin leyenda. Recomendación: rehacerlas con una dirección de arte única y marcarlas "Imagen ilustrativa"; reemplazar por fotos reales de obra cuando existan.

## Dirección de arte: "Cine técnico mendocino"

Misma luz y paleta que los renders Cycles del hero (`work/cine`):

- **Luz:** sol bajo de la mañana, sombras largas, grafito profundo y un único acento rojo UM (#dc2626).
- **Materiales:** reales y con textura.
- **Exteriores:** la cordillera nevada en el horizonte.
- **Composición:** espacio libre en el tercio izquierdo para el titular.
- **Nunca:**
  - texto, logos ni marcas de terceros;
  - banderas, hologramas, neón ni destellos;
  - sonrisas de stock;
  - la típica sala de servidores azul.

## Reglas de uso

1. **Antecedentes:** la imagen ilustra el sector y el tipo de servicio, nunca "documenta" la obra. El prompt no incluye cliente, marcas ni datos del caso (`antecedentes-briefs.mjs`), y la web muestra la leyenda "Imagen ilustrativa".
2. **Edición (`mode: "edit"`):** solo para realzar fotos reales propias (luz, color, limpieza). Nunca agregar equipos, personas ni instalaciones que no estaban.
3. **Revisión humana:** todo se genera en `work/cine/ai/` con un `manifest.json` (prompt, modelo, fecha, estado "para revisar"). Lo aprobado se copia a mano a `public/`.
4. **Texturas** (`textura-*`): alimentan los materiales de Blender. No se publican.

## Cómo correrlo

```bash
node work/cine/scripts/openai-images.mjs --dry                     # 10 fichas editoriales, costo estimado
node work/cine/scripts/antecedentes-briefs.mjs                     # 518 fichas de antecedentes
node work/cine/scripts/openai-images.mjs --briefs work/cine/image-briefs-antecedentes.json --dry
OPENAI_API_KEY=… node work/cine/scripts/openai-images.mjs --only andes-plano-general,sector-bodegas
OPENAI_IMAGE_QUALITY=medium OPENAI_API_KEY=… node work/cine/scripts/openai-images.mjs --briefs work/cine/image-briefs-antecedentes.json
```

Costo orientativo con `gpt-image-1` a 1536×1024 (verificar precios vigentes):

| Lote | Calidad alta | Calidad media |
| --- | --- | --- |
| 10 fichas editoriales | ~US$2 | — |
| 518 antecedentes | ~US$130 | ~US$33 |

Conviene empezar por 10 antecedentes en calidad media, revisarlos y recién después correr el lote completo.

Enviar imágenes o prompts a OpenAI es publicarlos fuera de la empresa: no incluir datos de clientes ni fotos con información sensible.
