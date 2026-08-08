# UM Sans 1.2 — entrega auditable de fuente y aplicación

## Qué se entrega

Esta entrega congela una única familia utilizable: **UM Sans 1.2 Production**. La fuente conserva los contornos y métricas de Inter 4.001; el trabajo de ULTIMA MILLA queda limitado a identidad, metadatos, empaquetado y controles. No contiene los alfabetos experimentales UM Sans 2 ni alternates inventados.

- Commit de referencia: `3bdfc49e fix(type): lock contour-equivalent UM Sans release`
- Rama: `codex/umsans-next-2026-07-29`
- Paquete instalable: [`UMSans-1.2-Production.zip`](../../public/fonts/um-sans/UMSans-1.2-Production.zip)
- Licencia: SIL Open Font License 1.1 (`OFL-1.1.txt`)
- Cobertura entregada: 18 estilos estáticos + 2 variables, en OTF, TTF y WOFF2.
- Estado de infraestructura: **sin despliegue ni cambios en producción**.

## Evidencia verificable

Todos estos archivos están versionados junto con los binarios y se pueden inspeccionar sin confiar en una captura de pantalla:

- [`optical-audit.json`](../../public/fonts/um-sans/optical-audit.json): comparación de contornos contra las fuentes Inter 4.001 fijadas; `status: pass`.
- [`qa-report.json`](../../public/fonts/um-sans/qa-report.json): gates de cmap, glifos, métricas, kerning y estructura.
- [`fontbakery-report.json`](../../public/fonts/um-sans/fontbakery-report.json) y [`fontbakery-report.md`](../../public/fonts/um-sans/fontbakery-report.md): 1533 PASS, 0 FAIL, 0 ERROR, 0 FATAL; las advertencias son heredadas de la fuente upstream.
- [`build-report.json`](../../public/fonts/um-sans/build-report.json): entradas, salidas y política de compilación.
- [`release-provenance.json`](../../public/fonts/um-sans/release-provenance.json): upstream, commit de Google Fonts, hashes de fuentes de entrada y materiales de build.
- [`release-manifest.json`](../../public/fonts/um-sans/release-manifest.json) y [`CHECKSUMS.sha256`](../../public/fonts/um-sans/CHECKSUMS.sha256): inventario y hashes de entrega.
- [`specimen-audit.pdf`](../../public/fonts/um-sans/specimen-audit.pdf): lámina de inspección tipográfica local.

La prueba óptica fija, entre otros caracteres, `Fibra certificada, operación continua. ¿Qué operación necesita continuidad? ÁÉÍÓÚÜÑ áéíóúüñ · 24/7 · $ 1.234.567,89`. El informe compara 1.899 contornos romanos y 1.861 itálicos, además de verificar forma sin `.notdef`, sustituciones privadas ni fallback.

## Reproducir la entrega

Desde la raíz del repositorio:

```bash
npm ci
npm run fonts:build:um-sans
npm run fonts:audit:um-sans
npm run fonts:audit:um-sans:optical
npm run fonts:audit:um-sans:fontbakery
npx jest __tests__/umSansFontContract.test.js --runInBand --config=jest.config.cjs
npm test -- --runInBand
npm run build
```

El build de fuentes regenera los artefactos y los tres audits. Como el manifiesto de hashes usa las rutas internas del paquete, se revisa descomprimiendo el ZIP en una carpeta temporal:

```bash
verify_dir=$(mktemp -d)
unzip -q public/fonts/um-sans/UMSans-1.2-Production.zip -d "$verify_dir"
(cd "$verify_dir/UMSans-1.2-Production" && shasum -a 256 -c CHECKSUMS.sha256)
rm -rf "$verify_dir"
```

Resultados registrados para el commit de referencia: auditoría UM Sans PASS (58 archivos), auditoría óptica PASS, FontBakery PASS, contrato de fuente 11/11, suite Jest 54 suites/395 tests y build Astro PASS.

## Probar la aplicación localmente

```bash
npm run dev -- --host 127.0.0.1 --port 4322
```

Abrir:

1. [`http://127.0.0.1:4322/estilo/um-sans`](http://127.0.0.1:4322/estilo/um-sans) — muestra completa y controles de lectura.
2. [`http://127.0.0.1:4322/`](http://127.0.0.1:4322/) — aplicación real con UM Sans aplicada en la interfaz.
3. [`http://127.0.0.1:4322/estilo/um-sans-2-manual`](http://127.0.0.1:4322/estilo/um-sans-2-manual) — cuarentena histórica; no es la fuente de esta entrega.

La verificación visual local realizada en escritorio y viewport móvil de 390 px confirmó: `UM Sans` cargada en Regular y Bold, sin overflow, sin referencias Alpha y sin glifos privados/fallback en la muestra. La prueba visual es una aceptación local reproducible; aún no sustituye una certificación externa en Windows DirectWrite, Office, iOS/Android, Adobe o impresión.

## Regla de mantenimiento

No se debe modificar `e`, `a`, `c`, `o`, `s` ni añadir alternates manuales dentro de esta línea de release. Cualquier nueva propuesta debe vivir en una rama experimental separada, generar sus propios artefactos y pasar primero el mismo control de contornos antes de tocar la demo o el paquete de producción.
