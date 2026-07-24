# Market deliverables and status

UM Sans 1.2 se entrega con la misma disciplina documental que una familia
tipográfica profesional. Esta matriz separa lo incluido de lo que requiere una
certificación externa o una futura familia propietaria.

Estados usados en este documento:

- **Verificado**: existe un artefacto y el pipeline lo prueba automáticamente.
- **Incluido**: existe un documento o recurso de distribución inspeccionable.
- **Externo**: requiere una aplicación, dispositivo, imprenta o revisor independiente.
- **2.0 Original**: exige nuevos masters y contornos dibujados de forma independiente.

## Incluido en 1.2 Production

| Estado | Área | Entregable |
|---|---|---|
| Verificado | Desktop | 18 OTF y 18 TTF, romano/cursiva, nueve pesos y style linking |
| Verificado | Variable | Roman e Italic TTF/WOFF2, ejes `wght 100–900` y `opsz 14–32` |
| Verificado | Modelo variable | `fvar`, `STAT`, `avar`, `gvar`, `HVAR`, `MVAR`, ejes e instancias inventariados |
| Verificado | Web completo | 20 WOFF2 y hojas separadas para variable y estáticos |
| Verificado | Web optimizado | Latin Core variable, `unicode-range`, `font-display: swap` y preload recomendado |
| Verificado | Fallback | Arial calibrada con `size-adjust` y overrides verticales para reducir CLS |
| Verificado | OpenType | Kerning, cifras, fracciones, ordinales, super/subíndices, cero barrado y `ss01–ss08` |
| Verificado | Repertorio | `character-set.txt`, `glyph-order.txt` y `unicode-coverage.json` generados desde los binarios |
| Verificado | Metadata | `family-metadata.json`, `webfont-manifest.json`, nombres, `STAT`, `fvar`, `OS/2`, vendor y licencia |
| Verificado | Inventario binario | 58 archivos con tablas, nombres, glifos, PANOSE, ejes, tamaño y SHA-256 |
| Verificado | Render | TrueType autohint, `gasp`, smart dropout, métricas horizontales y caret |
| Verificado | Embedding | `fsType 0` en todos los binarios y matriz de canales bajo OFL |
| Incluido | Legal | OFL oficial, autores, atribución, trademark, guía de licencia y aviso EULA |
| Incluido | Producto | README, instalación, changelog, FONTLOG, soporte, specimen HTML/PDF y ejemplos |
| Incluido | Accesibilidad | Tamaños, interlínea, síntesis, fallback, zoom y límites de claims |
| Incluido | Procurement | Ficha resumida de producto, proveedor, formatos, QA, licencia e integridad |
| Incluido | Migración | Mapeo del stack anterior, caché, coexistencia y control responsive |
| Incluido | Incidencias | Warnings, plataformas externas, scripts no cubiertos y límites de propiedad |
| Incluido | Impresión/PDF | Gate de embedding, checklist de exportación y frontera de preprensa física |
| Verificado | Reproducción | Upstream fijado por commit/SHA-256 y scripts de build, audit y package |
| Verificado | Integridad | Manifiestos, SHA-256 por archivo, ZIP determinista y descriptor de paquete web |
| Verificado | Cadena de suministro | SBOM SPDX 2.3, procedencia reproducible, materiales y 58 sujetos con hashes |
| Incluido | Formatos | Política de OTF, TTF, WOFF2, variable y exclusión de formatos obsoletos |
| Externo | Firma | Atestación criptográfica con identidad organizacional y verificador independiente |
| Verificado | QA | Gate propio, HarfBuzz, raster 11/16/56 px, fontconfig, FontBakery y PDF embedding |
| Incluido | Gobierno | Naming, versionado, checklist, protocolo de diseño y matriz de compatibilidad |
| Externo | Aplicaciones | Office, Adobe, iOS, Android e impresión física firmada |
| 2.0 Original | Propiedad formal | Masters nuevos, historial de dibujo y contornos independientes del upstream |

## Evidencia del gate

- 58 binarios generados y abiertos correctamente.
- 18 identidades desktop por OTF y TTF.
- 54 pruebas de rasterización.
- 16 esquinas de interpolación variable.
- FontBakery: 1533 `PASS`, 0 `ERROR`, 0 `FATAL`, 0 `FAIL`.
- Reportes completos en `QA/` y en el portfolio local.
- Cuatro kits CSS y dos WOFF2 Latin Core con manifiesto propio.
- Metadata e inventarios reproducibles en `Metadata/`.
- Modelo variable, derechos de embedding, tabla de nombres e inventario de cada binario.
- SBOM SPDX, procedencia de build y política explícita de formatos soportados.
- Guías de accesibilidad, procurement, migración, canales, PDF e incidencias conocidas.

## No incluido ni afirmado

- certificado de una fundición tipográfica independiente;
- pruebas físicas firmadas de Office, Adobe, iOS, Android o impresión offset;
- scripts no latinos;
- app instaladora, portal de activación o DRM;
- firma criptográfica organizacional o atestación externa de la release;
- EULA propietaria: la licencia controlante es SIL OFL 1.1;
- copyright independiente sobre el esqueleto upstream de Inter.

## Criterio de compra

La familia es apta como activo editorial corporativo, webfont, interfaz,
documentación y PDF bajo OFL. Un comprador debe recibir el ZIP completo, no
archivos sueltos, para conservar licencia, atribución, soporte, checksums y QA.
