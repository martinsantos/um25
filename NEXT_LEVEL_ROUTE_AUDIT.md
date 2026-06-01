# UMSA Next Level 2026 — Analisis Maestro Local

Estado: contrato de trabajo local. No implica despliegue ni cambios productivos.

## Criterio general

Cada ruta comercial debe resolver cuatro preguntas en el primer tramo visible:

1. Que problema operativo entiende UMSA.
2. Que alcance tecnico ofrece.
3. Que evidencia respalda la promesa.
4. Que accion concreta sigue.

El diseno se acepta solo si tambien pasa auditoria objetiva: contraste, tipografia, peso, H1 unico, imagenes visibles, canonical limpio, CTA temprano y lectura mobile.

## Matriz de superficie

| Ruta | Intencion | Proxima exigencia visual/editorial |
|---|---|---|
| `/` | Posicionamiento principal | Mantener impacto, bajar ruido, evidenciar servicios y antecedentes sin alargar scroll innecesario. |
| `/servicios` | Comparar familias IT | Dossier compacto: 8 familias, alcance, paquetes sin precios, prueba institucional y CTA por intencion. |
| `/servicios/[id]/[slug]` | Decidir servicio | H1 mas editorial, alcance comprable, imagenes de producto con altura real, evidencia relacionada y CTA especifico. |
| `/antecedentes` | Probar capacidad | Caso protagonista, secundarios y archivo documental; metadata legible y sin toolbar administrativa. |
| `/antecedentes/[id]/[slug]` | Validar caso | Ficha tecnica, alcance ejecutado, servicios relacionados y CTA de continuidad. |
| `/sectores` | Navegar por riesgo operativo | Sectores como mapa de necesidad y evidencia, no galeria de cards repetidas. |
| `/{sector}` | Resolver vertical | Riesgo operativo, servicios aplicados, antecedentes y criterio tecnico por industria. |
| `/blog` | Archivo tecnico premium | Imagen real por nota, protagonista claro, miniaturas en rail y archivo, titulos largos controlados. |
| `/blog/[slug]` | Lectura y autoridad | Imagen destacada, ancho de lectura controlado, H2 proporcionados, enlaces internos y cierre util. |
| `/contacto` | Convertir consulta | Formulario simple de 4 campos, antispam invisible, expectativa clara y respuesta tecnica rapida. |
| Hubs GEO | Captura de intencion comercial | No doorway pages: criterio de compra, evidencia, servicios, sectores, FAQ y media visible tambien en mobile. |
| Labs/utilidades | Soporte no comercial | Mantener noindex donde corresponda y corregir errores visuales/console sin contaminar navegacion. |

## Controles nuevos incorporados

- H1 mobile comercial no puede quedar debajo de 32px.
- H1 desktop/tablet comercial no puede quedar debajo de 40px.
- Imagenes de contenido colapsadas fallan auditoria aunque `naturalWidth` exista.
- La auditoria reporta warnings de copy generico en primer viewport para detectar muletillas antes de una pasada editorial.
- La auditoria estricta bloquea falsa precision comercial visible: `99.xx%` sin fuente y conteos no aprobados como `518+`.
- El plan `REDESIGN_PLAN.md` queda marcado como historico y superado por White Dossier.

## Riesgos aun a revisar en iteraciones siguientes

- Algunas rutas heredadas conservan pesos `700` en labels o modulos; el gate permite `700`, pero la revision visual debe evitar que parezcan titulares.
- Los SVG historicos del blog pueden tener rojo o pesos embebidos que no responden al CSS. Deben auditarse como assets, no como HTML.
- Las paginas de laboratorio pueden tener errores independientes del sistema comercial y deben corregirse sin mezclar su UI con la web publica.
