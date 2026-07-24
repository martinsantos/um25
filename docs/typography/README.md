# UM Sans — índice del activo tipográfico

El sistema editorial público de ULTIMA MILLA usa `UM Sans Text 1.2`, la familia
verificada para impacto, lectura, interfaces, presupuestos, informes y PDF.
Futura PT continúa reservada al logotipo. Los experimentos procedurales 2.0
están en cuarentena porque sus contornos fallaron la revisión visual raster.

## Portfolio visible

- `http://localhost:4322/estilo/um-sans`
- La ruta permanece `noindex` durante la aprobación.
- El portfolio muestra los 18 estilos, los ejes variables, español, funciones
  OpenType, lectura, display, cifras, aplicaciones y gobierno.

## Documentos y reportes

- `UM-SANS-SPEC.md`: construcción y reglas de uso.
- `UM-SANS-2-DISPLAY-SPEC.md`: alcance, límites y promoción del corte original.
- `../../DESIGN.md`: contrato visual general UMSA.
- `../../public/fonts/um-sans/build-report.json`: procedencia y métricas.
- `../../public/fonts/um-sans/qa-report.json`: compuerta técnica.
- `../../public/fonts/um-sans/OFL-1.1.txt`: licencia SIL OFL 1.1 controlante.
- `release/MARKET-DELIVERABLES.md`: matriz de entrega comparable con una familia comercial.
- `release/ORIGINALITY-ROADMAP.md`: frontera de originalidad de 1.x y requisitos para 2.0 propietaria.
- `release/PROCUREMENT-DATASHEET.md`: ficha de adquisición y evaluación del activo.
- `release/ACCESSIBILITY-READABILITY.md`: reglas y límites de lectura accesible.
- `release/EMBEDDING-AND-CHANNELS.md`: desktop, web, app, ebook, servidor, PDF e impresión.
- `release/KNOWN-ISSUES.md`: deuda, compatibilidad externa y claims no realizados.
- `release/SUPPLY-CHAIN-PROVENANCE.md`: SBOM, materiales, sujetos y frontera de firma.
- `release/FORMAT-SUPPORT-POLICY.md`: formatos vigentes, omitidos y criterio de soporte.

## Entregables

- 9 pesos romanos × TTF, OTF y WOFF2.
- 9 pesos cursivos × TTF, OTF y WOFF2.
- Variable romana `opsz 14–32`, `wght 100–900` × TTF y WOFF2.
- Variable cursiva `opsz 14–32`, `wght 100–900` × TTF y WOFF2.
- Kits CSS variable, estático, Latin Core y fallback métrico anti-CLS.
- Metadata de familia/web; inventarios Unicode, caracteres, glifos y 58 binarios;
  modelo variable, tablas de nombres, derechos técnicos de embedding, SBOM y procedencia.
- Matriz visible de 41 entregables con estados verificado, incluido, externo y 2.0 Original.
- Paquete: `public/fonts/um-sans/UMSans-1.2-Production.zip`.
- Prototipo Display bloqueado: 4 romanas de diagnóstico, reportes estructurales
  y evidencia de rechazo en `public/fonts/um-sans-2-display/`. No son entregables
  instalables ni webfonts aprobadas.
- Estructura: Desktop OTF/TTF, Variable, Web WOFF2/CSS/subsets, Metadata, documentación,
  specimen offline, QA, fuente reproducible, manifiesto y checksums.

## Reproducción

```bash
npm run fonts:build:um-sans
npm run fonts:audit:um-sans
npm run fonts:audit:um-sans:fontbakery
npm run fonts:audit:um-sans:pdf
npm run fonts:release:um-sans
npm run fonts:diagnose:um-sans-2-display
```

El source está fijado a un commit de Google Fonts y verificado por SHA-256. El
generador produce 58 binarios, licencia, reporte y archivo determinista. El
auditor usa FontTools, HarfBuzz, ImageMagick y fontconfig.
La compuerta PDF imprime el portfolio con Chrome, exige un documento completo y
comprueba con Poppler que las variables romana y cursiva estén embebidas sin
fallbacks editoriales accidentales. Requiere el localhost activo.

## Gobierno

1. Confirmar `UM Sans` en H1, H2/H3, cuerpo e interfaz, sin referencias activas a los prototipos 2.0.
2. Confirmar que el wordmark usa Futura PT.
3. Probar español, signos de apertura, `l I 1`, cifras, moneda y tabulares.
4. Usar 400 para lectura, 500 para interfaz, 600–700 para H2/H3 y 700–800 para
   H1. El peso 900 se reserva a cifras del specimen, no a títulos públicos.
5. No sintetizar cursivas o negritas; no usar tracking negativo.
6. Mantener texto web visible en 16 px o más.
7. Exportar PDF, comprobar embedding y revisar saltos de línea antes de publicar.

## Aprobación

El gate local debe quedar en `status: pass` y FontBakery en cero `ERROR`,
`FATAL` y `FAIL`. La versión 1.2 está cerrada como release digital reproducible.
La validación física en Windows, Office, Adobe, Android, iOS e impresión sigue
siendo necesaria antes de prometer compatibilidad certificada con esos entornos.

## Clasificación honesta

UM Sans Text 1.x es una **familia modificada derivada de Inter 4.001 bajo OFL**.
Tiene identidad, proporciones, alternativos técnicos, kerning, naming,
documentación y release engineering propios, pero no reclama que su esqueleto
base haya sido dibujado desde cero. UM Sans 2 Display usa contornos geométricos
independientes de UMSA, pero su dibujo actual está rechazado por defectos de
forma, espaciado y acentos. No puede cargarse ni distribuirse; una eventual 2.0
original requiere redibujo profesional completo y nueva revisión independiente.
El brief de producción completo está en `release/UM-SANS-2.0-ORIGINAL-BRIEF.md`.
