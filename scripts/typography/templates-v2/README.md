# Plantillas UM Sans 2 — revisión 2026.10.10-r4

Fuentes de generación de los DOCX/DOTX, HTML, XLSX y vistas previas de esta revisión. La familia publicada en `public/fonts/um-sans/v2.0.0` es una entrada inmutable. El logotipo conserva los trazos de `public/images/logo-light.svg`; se ajusta su viewport al contorno visible.

El generador anterior `../build_offer_templates.py` corresponde al paquete histórico dentro de la entrega tipográfica. No regenera esta revisión.

La carta con membrete lleva la marca a la izquierda, alineada con el asunto y el cuerpo. Las ofertas y la planilla conservan la marca a la derecha. Esta distinción debe mantenerse en los archivos nativos, HTML, vistas de lectura y previews A4.

## Entorno

- Python: python-docx, lxml, Pillow, pdfplumber, pypdfium2. openpyxl se usa sólo para comprobar valores recalculados.
- Node: Playwright, Sharp y `@oai/artifact-tool` del runtime de documentos de Codex. Los imports deben resolverse desde este directorio, sin agregar dependencias al sitio publicado.
- Google Chrome, LibreOffice y `pdftocairo`.
- `UM_TEMPLATE_WORK`: directorio absoluto de trabajo; por defecto, `um-sans-template-build` dentro del temporal del sistema.
- `UM_TEMPLATE_REPO`: checkout fuente/destino; por defecto, este repositorio.
- `UM_ARTIFACT_RUNTIME`: runtime de documentos; por defecto `~/.cache/codex-runtimes/codex-primary-runtime`.
- `CHROME_PATH` y `PDFTOCAIRO`: permiten indicar ejecutables distintos.

En el directorio de trabajo, crear `entrega`, `qa` y un `fontconfig.xml` que incluya las fuentes UM Sans 2 y una caché local. `render-refinement.py` usa ese archivo al convertir con LibreOffice.

## Secuencia

Ejecutar desde este directorio, con los intérpretes que contienen las dependencias:

```sh
node prepare-logo.mjs
python3 build-documents.py
node build-workbook.mjs
node build-costing.mjs
python3 build-example.py
python3 print-settings.py
python3 print-costing.py
python3 embed-vector-brand.py
python3 render-refinement.py
python3 compact-odt-fonts.py
python3 align-native-brand.py
python3 render-refinement.py --costing-only
python3 build-html.py
python3 verify-release.py
python3 package-review.py
python3 build-reading-previews.py
```

`build-workbook.mjs` comprueba siete casos de fórmulas y restaura la plantilla vacía. `print-settings.py` añade exclusivamente propiedades de impresión y validación que no expone la API usada. `verify-release.py` verifica tipografía, ubicación de la marca y el cálculo nativo, y prepara un documento descartable para comprobar renumeración y tablas extensas.

`example-tender.json` contiene los datos ficticios compartidos por el ejemplo de Word y el ejemplo de Excel. `build-example.py` conserva el formato aprobado y modifica sólo el contenido del documento. En el ejemplo impreso, la inversión y los totales ocupan una misma página; las condiciones comienzan en la siguiente. Los ejemplos forman parte del ZIP y se identifican como documentos sin validez comercial. Para revisar únicamente estos cambios, usar `render-refinement.py --examples-only`.

`embed-vector-brand.py` agrega el SVG oficial a Word, DOTX y Excel mediante la extensión DrawingML, conservando el PNG como alternativa para aplicaciones antiguas. `build-reading-previews.py` deriva las cuatro plantillas y los dos ejemplos de los HTML y XLSX entregados. La web muestra un documento completo por vez, con cuerpo de 20 px y sin scroll vertical interno. La planilla ocupa todo el ancho; el desplazamiento horizontal queda para pantallas pequeñas. El hash selecciona el documento y `vista=plantilla` selecciona la versión vacía. La composición A4 exacta está disponible por separado. Al regenerar, mantener `public/images/brand-document.svg` sincronizado con `UM_TEMPLATE_WORK/logo.svg`.

Excel conserva un PNG visible como imagen principal y la extensión SVG de Office para impresión vectorial. El PNG de pantalla tiene 408 px, fondo blanco y suavizado; Word conserva su alternativa de alta resolución. La variante con SVG principal se descartó porque el usuario no vio la marca en su visor. La nitidez en ese visor y el control en Microsoft Excel siguen pendientes. `align-native-brand.py` mide el primer PDF del presupuesto interno y corrige exclusivamente los marcadores horizontales de las imágenes; reimprimir con `--costing-only` antes de verificar. No cambia el ancho, la proporción ni los trazos de la marca.

Antes de empaquetar, inspeccionar todas las páginas renderizadas en `qa/r2`, incluidos los casos largos. Revisar también en Chrome los tres HTML, su guardado y su impresión. La interacción de teclado de Microsoft Word/Excel requiere comprobación adicional en esas aplicaciones.

`build-costing.mjs` genera un libro vacío de uso interno con Resultado, Costeo, Parámetros y Proveedores. Conserva el flujo observado en las planillas de referencia: componentes por sector o piso, márgenes sobre la venta, tarifas DH/HH, costos USD/ARS, imprevistos, bonificación e IVA sobre el neto. La selección de proveedor se traslada al costeo manualmente. El generador verifica datos incompletos, margen faltante, cero, tarifas y moneda, y exporta fuera de la entrega una prueba de recálculo nativo. No incorpora datos comerciales de los archivos de referencia.

`compact-odt-fonts.py` conserva los cuatro TTF de UM Sans 2 en ODT y evita empaquetar fuentes del sistema que LibreOffice incrusta como alternativas. Tras compactar, comprobar la impresión de los tres ODT y la identidad del texto y el paginado con los PDF de Word.

El presupuesto vacío imprime cuatro páginas: Resultado y Parámetros en A4 apaisada, Costeo y Proveedores en A3 apaisada, sin reducir el cuerpo de 12 pt. Sus filas de trabajo tienen 18 pt de alto y conservan 30 componentes; textos de varias líneas requieren ampliar el alto. Las tablas fijan las primeras dos columnas y trece filas, y repiten la cabecera completa en impresión. Los campos de oferta y proveedores admiten nombres extensos. `embed-vector-brand.py --costing-only` permite actualizar la marca de este libro sin reescribir los otros documentos.

El espaciador numérico nativo de Excel reserva el margen derecho también en Calc, donde la sangría de algunas celdas numéricas se ignora. El control final con datos conserva los formatos de importe, cantidad y porcentaje; los ocho importes de cierre comparten el mismo borde dentro de 0,05 pt. El cambio no modifica valores ni fórmulas.

`package-review.py` escribe únicamente el directorio local `public/downloads/plantillas-um-sans/2026.10.10-r4`. No despliega ni modifica la fuente tipográfica. Para otra entrega, usar una versión nueva y actualizar sus enlaces; no sobrescribir un paquete publicado.

Todos los números comienzan en la línea izquierda del cuerpo, dentro del bloque. Un espacio tipográfico (0,25 em) separa número y título, sin tabulados de ancho fijo. La numeración multinivel sigue siendo automática. HTML y lectura web usan columnas de ancho natural y separación de 0,25 em.

Ritmo: párrafo normal 8 pt después; títulos 24/18/16 pt antes y 6 pt después; títulos consecutivos 8 pt antes. Esta diferencia conserva aire entre secciones y proximidad entre cada título y su contenido.
