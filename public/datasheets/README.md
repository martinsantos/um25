# Fichas técnicas (datasheets)

Colocá aquí un PDF por servicio, con el **mismo slug** que la URL del detalle:

- Ejemplo: servicio `https://ultimamilla.com.ar/servicios/107/deteccion-de-incendios`
- Archivo: `deteccion-de-incendios.pdf`

El botón **Ficha técnica** en la página del servicio aparece automáticamente cuando el archivo existe. Si no hay PDF, el botón no se muestra.

## Convención de nombres

- Solo letras minúsculas, números y guiones (`a-z`, `0-9`, `-`).
- Extensión `.pdf`.
- Sin espacios ni tildes en el nombre del archivo.

## Entrega

Los PDFs los provee el cliente (marketing / ingeniería). No commitear archivos confidenciales sin revisión legal.

## Generación automática desde la ficha técnica (fase 3)

Las fichas de los ocho frentes salen de `src/data/serviceSpecs.ts` y de la
página imprimible `/servicios/<id>/ficha`. Para regenerar los PDF:

```bash
npm run build
HOST=127.0.0.1 PORT=4399 node dist/server/entry.mjs &
DATASHEET_BASE=http://127.0.0.1:4399 npm run datasheets:build
```

El script usa `playwright-core` (y `CHROME_BIN` si hay un Chrome propio).
Los PDF generados se versionan en esta carpeta con el slug del detalle.
