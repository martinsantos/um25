# Politica de metatags SEO/GEO

Esta politica aplica a paginas institucionales, servicios, sectores, blog, antecedentes y recursos bilingues de ULTIMA MILLA. El objetivo es mejorar SEO y GEO sin perder tono humano ni agregar datos que no existan.

## Principios

- Escribir para personas primero. El metatag debe ayudar a entender la pagina antes de intentar capturar una keyword.
- No inventar nombres propios, clientes, marcas, certificaciones, ubicaciones, precios ni resultados.
- Usar solo informacion visible en la pagina, datos del CMS o recursos GEO versionados.
- Mantener titulos claros y naturales. Evitar formulas repetidas como "Caso de exito" si no agregan informacion.
- Mantener el espanol rioplatense/argentino con tono amable, tecnico y directo.
- Mantener el ingles claro y profesional, sin traducciones literales forzadas.

## Titulos

- Fuente principal: titulo real de la pagina o del CMS.
- Sufijo de marca permitido: `| ULTIMA MILLA`.
- Largo objetivo: hasta 70 caracteres.
- Si el titulo es largo, recortar en una pausa natural, sin cortar palabras.
- No agregar nombres de clientes o marcas para diferenciar si no estan en el contenido original.
- Para duplicados reales, usar redirect 301 al canonico.
- Para titulos repetidos pero contenidos distintos, redactar un titulo editorial basado en el tema real de la nota.

## Descripciones

- Largo objetivo: 70 a 160 caracteres.
- Deben ser frases completas, no listas de keywords.
- Si el resumen del CMS alcanza, usarlo limpio y recortado naturalmente.
- Si falta resumen, combinar titulo, area/tema real y una frase de contexto verificable.
- No prometer resultados, rankings, ahorros o SLA si no estan documentados en la pagina.

## Antecedentes

- Metatitulo: titulo real del antecedente + marca.
- Metadescripcion: descripcion del antecedente; si falta, usar titulo, area y fecha real.
- Imagen social: priorizar imagen generada unica cuando exista; no usar imagen inventada ni generica como si fuera evidencia.
- Schema: describir como `CreativeWork` o evidencia documentada, no como venta agresiva.

## Blog

- Redirigir slugs duplicados a la version canonica.
- Excluir slugs no canonicos del sitemap y de listados.
- Cuando dos notas comparten titulo pero no contenido, escribir titulos editoriales distintos basados en el tema real.
- Mantener el H1 y el metatitulo alineados, pero no necesariamente identicos.

## Ingles

- Las paginas EN deben estar en sitemap cuando sean publicas.
- Hreflang debe apuntar a pares ES/EN reales.
- El copy debe sonar natural para compradores internacionales: clear, practical, business-oriented.
- No traducir nombres de servicios si la traduccion vuelve ambiguo el alcance tecnico.

## GEO y LLMs

- `llms.txt` debe resumir identidad, uso recomendado y limites de inferencia.
- `llms-full.txt` y `/geo/*.json` son las fuentes extendidas.
- Los recursos JSON deben tener canonicals con `www.ultimamilla.com.ar`.
- Los sitemaps no deben declarar `lastmod` dinamico por build; usar fechas reales o versionadas.
- Cada recurso GEO publicado debe estar enlazado desde `/geo` y estar incluido en `sitemap-geo.xml`.

## Control antes de publicar

- No hay metatags vacios.
- No hay titulos duplicados por slugs duplicados.
- No hay canonicals al dominio apex.
- 404 y paginas internas no estrategicas usan `noindex` cuando corresponde.
- Sitemaps contienen solo URLs canonicas y publicas.
- Las imagenes de antecedentes apuntan a archivos `.webp` existentes.
