# Design QA — consolidación local ULTIMA MILLA

Fecha: 2026-08-13

## Comparación principal

- Verdad visual de origen: `https://www.ultimamilla.com.ar/`
- Captura de origen: `artifacts/design-qa/source-production-home-1280x720.jpg`
- Implementación: `http://127.0.0.1:4323/`
- Captura de implementación: `artifacts/design-qa/implementation-local-home-1280x720.jpg`
- Comparación conjunta: `artifacts/design-qa/comparison-home-1280x720.png`
- Viewport CSS: 1280 × 720 px, densidad 1x.
- Capturas del navegador: origen 1109 × 712 px y local 1265 × 712 px por diferencia de scrollbar/crop del navegador; ambas se normalizaron a paneles de 1265 × 712 px, sin deformar el contenido, para la comparación conjunta.
- Estado: home cargada, animación de entrada finalizada, tema oscuro por defecto, sin autenticación.

## Comparación enfocada

No fue necesaria una segunda región enfocada: la portada completa permite leer y medir logo, navegación, H1, lead, CTAs, imagen y encuadre. La geometría se comprobó además en DOM: hero y H1 local coinciden con producción (`hero 0/66/1265/656`; `h1 32/261.03/718.70/177.47`) y no hay overflow.

## Superficies de fidelidad

- Tipografía: misma UM Sans local, pesos, escala, interlineado, tracking y wrapping en la home. La entrega de fuente usa UM Sans 1.2 Production y no carga cortes 2.x rechazados.
- Espaciado y ritmo: home alineada con producción. La portada de `/estilo/fuente` es una mejora deliberada fuera de la réplica: eliminó la altura artificial y ahora muestra título, explicación, acciones, pruebas y ledger dentro de 720 px.
- Colores y tokens: negros, blancos, gris editorial y rojo operativo coherentes con el sistema vigente; no hay gradientes cosméticos añadidos.
- Imágenes y activos: misma imagen real `/hero/noc.png`; wordmark local usa el SVG canónico trazado. Sin placeholders ni hotlinks de terceros.
- Copia y contenido: home, servicios y la estructura comercial conservan la copia publicada. Las rutas con cambios deliberados quedan en el candidato local y no se presentan como baseline.

## Interacciones y consola

- CTA principal `Ver evidencia operativa` navega a `/antecedentes`.
- CTA tipográfico `Probar familia editorial` navega a `/estilo/fuente#laboratorio`.
- Consola del navegador en el estado final: 0 errores.
- Desktop y móvil de `/estilo/fuente`: sin overflow. En 390 × 844 el H1, acciones y prueba óptica terminan antes del borde inferior; el ledger se oculta como decisión responsive.

## Historial de iteración

1. P1: la home local había derivado de producción en el primer pliegue; el H1 comenzaba 66 px más abajo y tenía menor escala.
   - Corrección: se retiró el override local de baja altura y se restauró el contrato visual publicado.
   - Evidencia posterior: geometría exacta del hero/H1 y comparación conjunta guardada.
2. P2: la portada tipográfica conservaba una franja vertical excesiva y el ledger quedaba debajo del pliegue.
   - Corrección: se eliminó `min-height` artificial y se compactó el padding vertical a 42 px.
   - Evidencia posterior: `artifacts/design-qa/implementation-font-cover-1280x720.jpg`; ledger visible hasta y=661.89 en viewport de 720 px.

## Checkpoint reproducible

- Referencia local limpia del checkpoint `ca6acda9`: `http://127.0.0.1:4324/` (`umsa-production-reference-4324`).
- Candidato local consolidado: `http://127.0.0.1:4323/` (`umsa-local-preview-4323`).
- Entrega tipográfica candidata: `http://127.0.0.1:4323/estilo/fuente`.
- No se desplegó ni se modificó infraestructura de producción.

## Paridad de réplica

- `replica:parity-check`: 33/33 rutas con paridad HTTP, 0 divergencias.
- `replica:content-parity`: 33/33 rutas comparadas contra producción viva, 0 divergencias de H1.
- El gate anterior certificaba un ledger editorial desactualizado; se corrigió para usar producción viva por defecto. El modo histórico queda disponible sólo con `REPLICA_COPY_SOURCE=ledger`.
- `src/data/replica-prod-copy.json` se refrescó exclusivamente mediante GET de producción.
- Los snapshots de Directus contienen 8 servicios, 55 productos y 518 antecedentes. Tienen 15 días: es una advertencia no bloqueante para revisión local, pero deben refrescarse en modo de solo lectura antes de una PR de producción.

## Hallazgos

No quedan hallazgos P0, P1 ni P2 en la portada comparada o en la portada tipográfica. Las diferencias de rutas renovadas (sectores, antecedentes, blog, nosotros, certificaciones, contacto y GEO) son deliberadas del candidato; deben aprobarse ruta por ruta antes de una PR de producción.

## Seguimiento

- P3: completar una aprobación humana breve de las rutas deliberadamente renovadas usando la referencia 4324 y el candidato 4323.
- Mantener la referencia congelada; no seguir iterando la familia tipográfica salvo que falle un gate reproducible.

final result: passed
