# Flujo de imagenes de antecedentes

Este directorio recupera el flujo usado para generar una imagen unica por antecedente.
Los prompts se preparan por lote desde los manifests de `work/antecedentes-images/lotes`.

## 1. Regenerar prompts

```bash
npm run antecedentes:prompts -- --lote lote_046
```

Sin `--lote`, reescribe todos los `prompt_chatgpt.md`.

El generador aplica estas reglas:

- una imagen separada por ID de antecedente;
- concepto visual unico por antecedente;
- escena concreta segun alcance, cliente, sector y palabras clave;
- variacion de escala, angulo, fondo y objeto protagonista;
- prohibicion del comodin "tecnico de espaldas frente a rack";
- sin texto legible, logos inventados, marcas de cliente ni rostros reconocibles.

## 2. Generacion manual

Abrir `work/antecedentes-images/lotes/lote_XXX/prompt_chatgpt.md` y generar las imagenes en ChatGPT Images.
Este flujo no automatiza chatgpt.com.

Descargar cada imagen con el nombre esperado indicado en el prompt, o dejar que `ingest-latest` tome las ultimas imagenes generadas si el orden coincide con el manifest.

## 3. Ingesta y postproceso

```bash
npm run antecedentes:images:ingest -- --lote lote_046
npm run antecedentes:images:postprocess -- --lote lote_046
npm run antecedentes:images:gallery -- --lote lote_046
npm run antecedentes:images:contact-sheet -- --lote lote_046
```

La salida optimizada queda en `work/antecedentes-images/salida_web/lote_XXX`.
La galeria de revision queda en `work/antecedentes-images/galerias/lote_XXX.html`.

## 4. Publicacion al sitio

Despues de aprobar visualmente el lote:

```bash
npm run antecedentes:images:publish -- --lote lote_046
```

El publicador copia `.webp` a `public/images/antecedentes/generated/lote_XXX` y actualiza `src/data/antecedentes-generated-image-map.json`.
Al publicar con `--lote`, conserva las imagenes ya mapeadas.

## 5. Auditoria

```bash
npm run antecedentes:images:audit
npm run antecedentes:images:audit -- --strict
```

El auditor informa manifests definidos, imagenes procesadas, imagenes publicadas, duplicados, assets rotos y faltantes.

## 6. Continuidad cuando vuelve el servicio

Para probar una vez si ya hay suficientes imagenes nuevas para el siguiente lote pendiente:

```bash
npm run antecedentes:images:continue-once
```

Para dejarlo chequeando cada 15 minutos:

```bash
npm run antecedentes:images:watch
```

El watcher detecta el siguiente lote pendiente, cuenta imagenes nuevas en la carpeta de generacion, y cuando alcanza la cantidad requerida ejecuta ingesta, postproceso, galeria, contact sheet, publicacion y auditoria.
