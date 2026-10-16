# UM25 · memoria y traspaso · 16/10/2026

## Dictamen de cierre
Trabajo incompleto. Los seis sectores se renderizaron íntegramente en remoto, pero sólo Constructoras, Salud y Aeropuertos se ensamblaron e importaron a los archivos locales. Industria, Bodegas y Minería aún no están ensamblados. No se completó la comparación de las películas enteras con Solvaix ni la revisión visual de la integración. No afirmar equivalencia visual, calidad indistinguible, perfección o aprobación para producción.

La preview responde en http://127.0.0.1:4326/ y sigue mostrando Software v27 y las películas ANTERIORES de obras. Importar archivos no equivale a activar la integración. No hubo despliegue ni merge de este trabajo.

## Objetivo y decisiones del usuario
- Película Blender en el banner, arriba; isometría explicativa debajo. Ambas deben contar una historia técnica coherente.
- Cada sector debe mostrar una operación propia, sus instalaciones y cómo se relacionan los servicios. Evitar acabar siempre en el mismo rack y repetir edificios genéricos.
- Recorridos autónomos, suaves y legibles; el visitante no debe pulsar cada etapa para recibir la explicación. Mantener pausa explícita y preferencias de movimiento reducido.
- Referencia de obras: https://x.com/Solvaix/status/2106830508797706560 . Interesan arquitectura reconocible, capas registradas, conexiones distinguibles, transparencia selectiva, detalle y fluidez.
- Referencia de Software: https://x.com/iamdavidhill/status/2107616166713655476 . Isometrías: https://x.com/wheresryan22/status/2106439475551154186 . Hairline fue otra inspiración: https://github.com/lucasmarkes/hairline . No atribuir a estas referencias una comparación completa que no ocurrió.
- Software v27 fue aceptado como «más o menos bien»; conservarlo y conservar la mejora de su isometría. El pedido posterior pasó a los seis sectores.
- Blender se ejecuta remotamente para evitar consumo de RAM del Mac. El ensamblado y los pósteres se procesan localmente. No instalar/ejecutar Blender en el Mac.
- El usuario pide autonomía, correcciones y comprobaciones propias, evitando diagnósticos que detengan la implementación. El último pedido reemplaza la continuación inmediata por este cierre para otra IA.

## Checkout correcto y Git
Checkout activo: /Users/santosma/Documents/Codex/um25-cine-integracion
Repositorio: martinsantos/um25
Rama: feature/isometric-redes-review
HEAD: 1f9dc9f1 (pusheado durante esta sesión).
PR #266: https://github.com/martinsantos/um25/pull/266 — OPEN, DRAFT, destino develop, confirmado en este cierre.

El cwd suministrado por el entorno (/Users/Shared/Files From d.localized/D/ultima milla/2024/MKT 2024/umw141024/umw46-main/fumbling-field) NO es el checkout donde están estos cambios. Usar workdir explícito. No crear otro worktree por defecto.

Commits relevantes:
- 8eeeb423: narración automática de la isometría Software; introducción de 900 ms, ciclo de 38 s, seis capítulos y frases sincronizadas; elimina lecturas de layout por fotograma.
- 44382d0c: encuadre de todas las capas expandidas y eliminación de pasadas de sombras redundantes.
- 23bedada: biseles estáticos calculados una sola vez por tramo.
- f2d8a980: renderer final usado por el lote completo, Cycles CPU.
- 1f9dc9f1: integración local por flag, reproductor v13, capítulos, pruebas e importador inicial.

Cambios SIN COMMIT en este cierre:
- scripts/cine/assemble-sector-v5.py: ensamblado selectivo por sector y corrección de póster AVIF mediante Sharp.
- src/data/cine/sector-movies-v5.json: registros de building, clinic y terminal con sus hashes.
- 18 archivos públicos nuevos de estos tres sectores: seis MP4 y doce pósteres JPG/AVIF.
- Este paquete de traspaso.

cambios-pendientes.patch conserva el diff de los dos archivos de código/datos. NO contiene los binarios. No aplicarlo encima del checkout actual: los cambios ya están presentes.

## Producción remota y material disponible
Run completo: https://github.com/martinsantos/um25/actions/runs/38188171524
Resultado verificado: success. 108 jobs de render completos, además de planificación/steps omitidos.
Commit fuente: f2d8a980ea241d4f8ef9b3973fccb827785035f3.
SHA-256 del renderer: b3b76435663b29e5a6fe2f381b597a59c9bfc06facc1cc33e60ce54a6db5faf4.
Cada película: 18 s, 1.080 fotogramas a 60 fps. Horizontal 3840×2160; móvil 2160×2160 con encuadre propio. Seis sectores × dos composiciones = 12 películas, 12.960 fotogramas.
Blender 4.5.3, Cycles CPU, 8 muestras, sombreado por normales direccionales, sin rebotes indirectos. Materiales y biseles pertenecen a geometría real. No describir esta iluminación como un acabado PBR fotorrealista.

Archivo externo:
/Volumes/SDTERA/Codex UM25 audits/20261011/sectors-v5/
- parts/: segmentos codificados y metadatos descargados.
- delivery/: seis películas completas y pósteres de los tres sectores ensamblados.
- proof-a, proof-b, proof-c, proof-d, proof-e, proof-g: iteraciones de vistas nativas; no son sustituto del control de películas completas.

Estado de las copias locales, verificado el 16/10:
| Sector | Tramos locales / 18 | Ensamblado e importado |
| --- | --- | --- |
| building / Constructoras | 18 | Sí, horizontal y cuadrado |
| clinic / Salud | 18 | Sí, horizontal y cuadrado |
| terminal / Aeropuertos | 18 | Sí, horizontal y cuadrado |
| plant / Industria | 15 | No |
| winery / Bodegas | 6 | No |
| mine / Minería | 5 | No |

Total: 80 tramos locales; faltan 28. Los 18 archivos importados suman 276.058.921 bytes y sus SHA-256 se verificaron contra el manifiesto durante este cierre.

ATENCIÓN: la API de GitHub ahora devuelve CERO artefactos para ese run. La retención configurada era de cuatro días. No seguir suponiendo que pueden descargarse los faltantes del lote original. estado-verificado.json identifica cada tramo faltante, el job original y el comando de rerun correspondiente. No se relanzó nada durante el cierre.

## Qué se cambió visualmente
- Constructoras: planta de oficinas representativa, puestos, cajas de piso, reunión y distribución.
- Salud: camas con herrajes, cabeceros, monitores y puesto de enfermería.
- Aeropuertos: check-in, rodillos de equipaje, lectores y accesos.
- Industria: celdas productivas, conexiones, tablero, protecciones y estructura de nave.
- Bodegas: tanques, instrumentación, válvulas y línea de fraccionamiento.
- Minería: módulos, red a nivel del terreno, mástiles y línea de vista; se retiraron elementos de interior impropios.
- Dos protagonistas operativos distintos por sector; cámara suave, apertura de capas y retorno al encuadre inicial.
- Energía dorada, datos verde agua, seguridad violeta, detección coral; rótulos separados de la instalación.
- Se corrigieron textos de piso invertidos, colisiones de rótulos y recorte de capas expandidas.

La comparación parcial encontró mejoras de contexto y lectura; sigue habiendo una brecha de densidad arquitectónica y acabado respecto de Solvaix. No hay una aprobación visual final.

## Archivos clave
- scripts/cine/render-sector-project-v5.py: autoría geométrica, cámaras y render remoto; --validate-only funciona sin Blender.
- src/assets/cine/isometric/site-projects-v1.json: geometría base.
- .github/workflows/cine-project-render.yml: entrada workflow_dispatch; renderer=v5.
- .github/workflows/cine-sector-v5.yml: matriz 6×2×9, tramos de 120 cuadros, 20 jobs simultáneos, retención de cuatro días.
- scripts/cine/assemble-sector-v5.py: valida rangos, hashes, dimensiones, fps; concatena sin recodificación y decodifica la película completa; genera pósteres e importa activos inmutables.
- src/data/cine/sector-movies-v5.json: estado de entrega, no de aprobación visual.
- src/data/cine/projectCinema.ts: UM_SECTOR_REVIEW=v5 selecciona candidatos locales; UM_SOFTWARE_REVIEW=v27 conserva Software.
- src/data/cine/filmChapters.ts: explicaciones específicas a 0, 2.8, 6.6, 10.8 y 15.6 segundos.
- src/components/cine/CineBanner.astro: cuadro completo, encabezado arriba, explicación y CTA debajo, móvil cuadrado.
- public/cine/cine-banner-v13.js: arranca al ser visible el escenario, pausa fuera de vista, respeta pausa manual, cambia de sector automáticamente.
- __tests__/cineMotionLifecycle.test.js y __tests__/sectorProjectJourney.test.js.
- docs/cine/software-v27-review-20261011.md: evidencia previa de Software.
- docs/cine/sector-v5-review-20261011.md: registro anterior, complementado/superado por este traspaso.

## Comprobaciones y límites reales
Realizadas durante la implementación: validación de cámaras/rutas para los seis sectores; typecheck y build; pruebas de ciclo de reproducción y narración. Última ejecución de lifecycle: 43 tests aprobados, incluidos dos ciclos completos de los seis sectores a 390 y 1440 px sin clic. El registro previo combina 78 tests entre las dos suites; no confundirlo con una nueva ejecución de ambas en este cierre.

El ensamblador completó con éxito building/clinic/terminal después de corregir AVIF: 6.480 cuadros decodificados, resoluciones y duración verificadas. En este cierre se verificaron nuevamente los hashes de los 18 activos, no se reejecutó todo el render.

Preview comprobada por HTTP en este cierre:
- /software: 200, software-system-v27.
- /constructoras: 200, fachada-proyecto-v2.
- /salud: 200, hospital-proyecto-v3.
- /aeropuertos: 200, aeropuerto-proyecto-v3.
Esto NO prueba reproducción visual ni activa los sectores v5.

Interrupciones concretas:
1. La descarga se interrumpió con HTTP 401 en winery-wide-480. Luego gh auth status y la lectura del run funcionaron. Hoy los artefactos ya no se listan.
2. El ffmpeg instalado no tenía libaom/--still-picture; se corrigió el importador para usar Sharp en AVIF. El ensamblado de tres sectores terminó correctamente.
3. El navegador Chrome dejó de estar disponible; el navegador integrado también falló. El intento de Safari fue rechazado por el control de Computer Use («not approved to use Safari»). No sortear esa restricción. Recuperar una superficie de navegador permitida para la revisión pendiente.
4. La copia temporal /private/tmp/um-solvaix-reference.mp4 ya no existe. Subsistía /private/tmp/um-comparison-solvaix.jpg. Una imagen comparativa no basta para evaluar fluidez; recuperar la referencia original mediante acceso permitido.

## Continuación recomendada
1. Leer este documento, estado-verificado.json, las reglas vigentes del repo y el diff local. Conservar los archivos y cambios existentes.
2. Recuperar los 28 tramos faltantes. Preferir rerun de los jobs originales para conservar exactamente renderer y fuente. Los comandos individuales están en el JSON; confirmar primero que GitHub conserva los jobs y que el relanzamiento admite ese mecanismo. Descargar los artefactos nuevos antes de que expire su retención. Si debe usarse un workflow nuevo, preservar los hashes de fuente y geometría; no mezclar revisiones.
3. Ensamblar plant, winery y mine con --scenes plant winery mine --import-assets. El manifiesto de delivery conserva los tres ya ensamblados. No regenerar innecesariamente los 80 tramos existentes.
4. Comparar las 12 películas completas con la referencia, incluyendo continuidad, encuadres intermedios, separación de capas, detalles y lectura a tamaño real. Corregir hallazgos y volver a renderizar los tramos afectados si corresponde. No sustituir esto por fotogramas.
5. Ejecutar pruebas/build con UM_SOFTWARE_REVIEW=v27 UM_SECTOR_REVIEW=v5. Reiniciar sólo el proceso de preview identificado por PID y cwd, preservando Software. Los helpers temporales previos estaban en /private/tmp/um-v27-restart-preview.py y /private/tmp/um-preview-start.py; comprobarlos, no ejecutarlos a ciegas.
6. Revisar las seis páginas y la home en navegador permitido, desktop y móvil: reproducción completa, avance automático, captions sincronizados, pausa/reanudación, movimiento reducido y ausencia de errores/cortes/solapamientos.
7. Guardar evidencia real; actualizar el informe y el PR draft con un dictamen honesto. No merge ni despliegue sin cerrar la revisión.

Comando base de ensamblado (desde el checkout activo):

    python3 scripts/cine/assemble-sector-v5.py '/Volumes/SDTERA/Codex UM25 audits/20261011/sectors-v5/parts' --output '/Volumes/SDTERA/Codex UM25 audits/20261011/sectors-v5/delivery' --run https://github.com/martinsantos/um25/actions/runs/38188171524 --scenes plant winery mine --import-assets

Build local, una vez completos y verificados los activos:

    UM_SOFTWARE_REVIEW=v27 UM_SECTOR_REVIEW=v5 NODE_OPTIONS=--max-old-space-size=1024 npm run build

## Límites operativos
Producción sólo por Git Flow y GitHub Actions. Leer AGENTS.md, REGLAS_ARQUITECTURA_SERVIDOR.md y reglas asociadas. No editar servidor ni .env de producción, no borrar respaldos ni cambiar infraestructura por este trabajo. Preservar campaña /software/gestion-de-comunidades-profesionales, su demo, GIF y sw.js. No crear más worktrees o sesiones para resolver esta continuación por defecto. No se programaron automatizaciones para retomar el trabajo al cerrar este chat.
