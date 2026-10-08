# Candidata integrada · 8 de octubre de 2026

Estado a las 06:26 UTC. Checkout `/Users/santosma/Documents/Codex/um25-cine-integracion`, rama `feature/isometric-redes-review`, PR #266 a develop, draft. Preview `http://127.0.0.1:4326/` reconstruida en `56b82257`; PID propio 9672. Verificar proceso y cwd antes de reiniciar. No modificar el checkout principal ni desplegar.

Las ocho disciplinas ya usan películas específicas de 24 segundos y 1.440 cuadros nativos 4K/60. Edición móvil, cuatro pósters, hashes, color y continuidad verificados al importar. No queda ninguna película v1 en servicios.

| Servicio | Versión integrada | Render completo | Bytes de sus seis assets |
| --- | --- | --- | ---: |
| Redes 101 | network-project-v2 | 37721892202 | 55.136.530 |
| Seguridad 102 | security-project-v2 | 37725150179 | 32.952.846 |
| Telecomunicaciones 103 | telecom-project-v2 | 37725154508 | 22.544.283 |
| Software 104 | software-system-v5 | 37732092147 | 44.666.046 |
| Soporte 105 | support-project-v2 | 37732222296 | 26.838.088 |
| Consultoría 106 | consulting-project-v2 | 37734092440 | 39.796.059 |
| Incendio 107 | fire-project-v2 | 37716425530 | 51.136.539 |
| Energía 108 | power-project-v2 | 37728931491 | 30.546.459 |

## Verificación actual y siguiente acción

- Software integrado `37733716485`: 20 composiciones Chrome/WebKit, ciclo móvil y color, cero hallazgos; capturas inspeccionadas. Foco de las seis capas `37736011734`: autonomía, encuadre completo, contexto atenuado y movimiento reducido correctos, capturas revisadas. El recorte que aparentaba afectar la capa activa pertenecía al contexto: no presentarlo como un recorte activo corregido.
- Soporte integrado `37734884810`: 10 composiciones y dos ciclos completos, cinco frases ligadas al reloj del video, cero hallazgos. Chrome 10 cuadros descartados de 1.378; WebKit 0 de 1.371. Se inspeccionaron fotogramas nativos y capturas reales de escritorio y móvil.
- Consultoría integrada `37736654589`: 10 composiciones y dos ciclos autónomos, cinco frases sincronizadas, cero hallazgos; reportes y capturas inspeccionados. Chrome 21/1.378 cuadros descartados, WebKit 0/1.374. El render rechazado `37728975470` no fue importado; el nuevo `37734092440` tiene plano general completo y 1.440 cuadros únicos.
- Revisión completa `37735559008` de home, sectores y ocho servicios en ejecución. Fuente `9fe62961`; las únicas diferencias de producto posteriores son Consultoría v2 y el contraste de Software, con revisión dirigida propia.
- `npm run check` en `9fe62961`: 71 suites / 592 pruebas, lint, tipos, CSS y build aprobados; 10 advertencias previas. Build de `56b82257` aprobado. No equivale a aprobación artística.

## Refinamiento de iluminación activo

Prueba de Energía `37736008661`, fuente `8e230d96`: plano general y UPS abierta inspeccionados, mejora visible de contacto bajo baterías y dentro del gabinete, sin el ruido de la prueba anterior. Se conservaron geometría, tipografía y 4K. 273–286 s de preparación y 10,8–12,1 s por fotograma en el runner. La prueba anterior `37735238602` se rechazó por ruido; Cycles y EEVEE completos se descartaron por 440 y 536 s/cuadro respectivamente.

Render completo **power-project-v3 `37736980890`**, fuente `357bd155`, en curso. Debe descargarse, revisarse en movimiento, importarse con archivos nuevos y auditarse en la página antes de sustituir v2. El plan del workflow se comprobó: 12 partes / 1.440 cuadros; rechaza motores no revisados. No relanzar duplicados ni mezclar fuentes.

La home mantiene su gran película. Los mecanismos se preparan antes de entrar en pantalla y conservan SVG estático si falla la descarga. Medición dirigida de arranque `37733323821`: página 4/1.408 cuadros descartados, repetición 5/1.408, video aislado 0/1.405. Es evidencia del runner, no garantía para todos los dispositivos.

Evidencias con SHA256 verificado en `/Volumes/SDTERA/Codex UM25 audits/20261007/`. Render pesado únicamente en GitHub Actions; no Blender local. Campaña protegida y binarios UM Sans sin cambios. Los resultados funcionales no prueban igualdad artística con Ryan, Solvaix o Hill. **Sin GO de producción.**

---

## Historial anterior: no usar sus estados como pendientes actuales

### Continuidad anterior · 8 de octubre de 2026

Rama `feature/isometric-redes-review`, PR #266 (draft), checkout `/Users/santosma/Documents/Codex/um25-cine-integracion`. Preview `http://127.0.0.1:4326/`, compilada hasta `251f9153`, con Redes, Seguridad, Telecomunicaciones y Energía v2, nueva isometría de baterías y preparación diferida de mecanismos. No editar el checkout principal ni desplegar. PID propio en `/private/tmp/um-eight-preview.pid`: verificar proceso y cwd antes de reiniciar.

## Resultado integrado

- **Software v4:** 1.440 cuadros 4K/60, seis assets, 58.415.732 bytes. Auditoría `37712634510`: 20 composiciones, color y repetición en Chrome/WebKit, sin hallazgos.
- **Incendio v2:** render `37716425530`, fuente `83cae61f`, importado en `d17d8c4c`. 1.440 cuadros distintos, 24 s, seis assets, 51.136.539 bytes. Última auditoría `37722704881` sobre `e288360a`: 10 layouts y dos ciclos autónomos con siete estados isométricos cada uno; cero hallazgos. Capturas inspeccionadas. El circuito ahora mantiene contexto a .55 de opacidad y la cámara de escritorio ocupa mejor su escenario.
- **Redes v2:** render `37721892202`, fuente `6e16722f`; importación verificada. 1.440 cuadros distintos, 24 s, 4K/60, seis assets, 55.136.530 bytes. Se inspeccionaron plano general, rack abierto y radio con PCB separada del radomo. Fuente, orden de cuadros, color y SHA256 validados antes de copiar. Auditoría `37724634688` completada: 10 composiciones, dos ciclos nativos Chrome/WebKit, cero hallazgos de encuadre/reproducción; capturas revisadas. WebKit móvil no descartó cuadros. Chrome descartó 51 al inicio y otros 3 durante la primera pasada: se trabaja en preparar la carga antes del arranque.
- **Isometría de Incendio:** central de 576 piezas, 33 geometrías compartidas y 14.391 bytes gzip. Puerta de 102°, electrónica posterior, conductores unidos, detector separable y baterías dentro del gabinete. Namespaces SVG, etiquetas y cámaras corregidos.
- **Cinco cámaras restantes:** Telecomunicaciones, Seguridad, Soporte, Consultoría y Energía encuadran el volumen cerrado y abierto. Auditoría `37721308823`: Chrome/WebKit × escritorio/móvil, 140 estados y 20 vistas con movimiento reducido, cero hallazgos y errores. Capturas de las cinco disciplinas inspeccionadas. El mecanismo activo mantiene contraste; el contexto se atenúa. La cámara exterior de `precision-systems-v6.js` pertenece sólo a Software.

Último `npm run check` completo (candidato con narración del 08/10): 71 suites / 591 pruebas, lint, tipos, CSS y build correctos. Diez advertencias previas de lint. No equivale a aprobación artística.

## Revisión en curso · 08/10 05:49 UTC

- Telecomunicaciones completa `37725154508`: 1.440 cuadros distintos, 22.544.283 bytes de assets, importada en `04e742e1`. Auditoría integrada `37731345742` terminada; se leen reportes y capturas.
- Energía completa `37728931491`: 1.440 cuadros distintos, 30.546.459 bytes, importada en `919ef94d`. Fotogramas nativos revisados. Isometría v3 auditada en `37730364837`: 28 estados + 4 vistas de movimiento reducido, Chrome/WebKit escritorio/móvil, cero hallazgos. Capturas revisadas.
- Soporte original `37728960586` **rechazado**: el plano general cortaba la parte inferior. Blender registraba la excepción del handler sin fallar el proceso; el ensamblador detectó la ausencia de evidencia de encuadre y no publicó la entrega. Cámara corregida y handler con fallo explícito. Prueba `37731805461`: extremos 0/1439 completos, límites [0.143, 0.085, 0.851, 0.860], inspeccionados; nuevo render completo `37732222296`, fuente `6b524161`, terminado e importado. 1.440 cuadros distintos; plano general, instrumento y equipo abierto inspeccionados. No mezclar fragmentos anteriores.
- Consultoría completa `37728975470` rechazada al ensamblar: plano general con base recortada (y mínimo −0.0585). Se baja el objetivo vertical de 0.95 a 0.25 m, preservando los acercamientos ya revisados. Prueba `37733432299` inspeccionada: extremos completos, límites [0.120, 0.097, 0.872, 0.838]. Nuevo render completo `37734092440`, fuente `251f9153`, iniciado; no mezclar fragmentos.
- Software v5: pruebas `37730591177` (detalle UI), `37731201989` (cuatro planos sin ocultar despliegue) y 120 cuadros continuos `37731388098` revisados. El pie de tabla y los iconos están corregidos. Render completo `37732092147`, fuente `6b524161`, terminado e importado: 1.440 cuadros distintos y 44.666.046 bytes, hashes/color/tipografía comprobados. Registry en v5. Auditoría integrada `37733716485` en curso; preview v5 verificada por HTTP. Tipos normalizados deterministas en todos los fragmentos.
- Preparación diferida `d4506581`: SVG presente desde el HTML, mecanismos descargados y preparados a 300 px del recorrido. 13 pruebas de ciclo de vida/pausa/navegación aprobadas. Auditoría real de autonomía `37731923927` terminada en escritorio/móvil y WebKit: apertura, pausa, cambios de servicio y seis capas de software correctos; capturas inspeccionadas. No afirma mejorar decodificación por sí sola.
- Medición `37731342858`: página 60 cuadros descartados, nativo 0, segunda página 3. Las dos páginas tenían runtime `waiting` y ningún módulo de mecanismos cargado, por lo que la diferencia **no demuestra** que la isometría sea su causa. Control invertido `37732413354`: primera página sin módulos 56 descartes; página normal 4; repetida 3; nativa 1. La atribución a los módulos queda descartada como explicación suficiente. Contención del SVG fuera de pantalla `27354474`, medida en `37733323821`: primera página 4/1408 descartes, nativo 0/1405, página repetida 5/1408; sin errores. Mejora observada en ese runner; falta repetir la regresión de autonomía con este CSS.
- Preview propia PID `3028`; comprobar cwd antes de reiniciarla. Último check completo `919ef94d`: 71 suites / 591 pruebas, lint/tipos/CSS/build correctos, diez advertencias existentes.

- Comparación de iluminación: prueba Cycles `37732979176` de Energía, fotograma 925, inspeccionada. Mejora el contacto entre bandejas y baterías, pero el modelado todavía se percibe plano; 440 s/cuadro no justifica un render completo. Se prueba EEVEE en un único fotograma con guardia que impide lanzar una película completa sin revisar. No se modifica la película integrada. EEVEE `37734264717` inspeccionado: 536 s/cuadro, aún más caro que Cycles. No se lanza completo. Prueba de densidad `37735238602` inspeccionada y rechazada: aparece ruido en cuadrícula y sombras ensanchadas de las juntas; 163 s de bake y 8,66 s de cuadro. Se normalizan muestras de vértices coplanares y se excluyen los conductores finos del cálculo de sombra estática para una última prueba acotada que subdivide sólo superficies estáticas para calcular sombras de contacto entre objetos; la forma, cámara y resolución no cambian. API de subdivisión: https://docs.blender.org/api/4.5/bmesh.ops.html#bmesh.ops.subdivide_edges .

- Cámara de Software `02de970b`: medición desde la transformación del padre para evitar mezclar poses de animación. `37734524760` aprobó las seis capas dentro del marco en Chrome escritorio/móvil, más WebKit. Capturas inspeccionadas: el recorte aparente pertenece a planos de contexto. Se atenúa ahora ese contexto a .22 durante la explicación, sin reducir la capa activa. La carga diferida conserva dibujo estático ante fallo del módulo (`06252b2b`, regresión unitaria aprobada).
- Revisión amplia `37735559008` sobre `9fe62961`: todas las rutas en curso. Último check completo: 71 suites / 592 pruebas, lint, tipos, CSS y build aprobados.

Los párrafos siguientes documentan los pasos anteriores; prevalece esta revisión para los estados de ejecución.

## Películas en refinamiento

**Seguridad v2:** acceso a escala, lector y hoja articulada, cámara con óptica separable y sensor, grabador de cuatro discos y electrónica, consola con plano y eventos relacionados. Las pruebas anteriores corrigieron encuadres, ventanas, tapa del NVR y superposición de UI. `37723441700` aprobó composición de óptica/monitor. `37723843785` confirma UM Sans existente sin alterar sus binarios. La prueba `37724627883` corrige las bandas de sombreado de la óptica; fotograma inspeccionado. Render completo `37725150179`, fuente `4be2074d`, terminado: 1.440 cuadros únicos, 24 s, seis assets verificados. Se inspeccionaron los planos general, óptica, grabador y operación; 102 ya apunta a v2. Auditoría integrada `37727617083`: diez layouts y dos ciclos autónomos en Chrome/WebKit, cinco frases sincronizadas, cero solapes/errores; capturas desktop y móvil inspeccionadas. La versión medida todavía tenía fundido inicial.

**Telecomunicaciones v2:** dos sitios, parábolas de doble piel, alimentación y herrajes, montantes, óptica con bandejas y reservas de fibra. Radio y fibra son alternativas distintas, no fases en serie. `37723445754` confirma la parábola lisa y la bandeja precisa, pero revela fibras cruzando el frente del panel. Corregido el recorrido interno por detrás del panel y guía de radio discontinua para que no parezca un cable físico; los dos planos de `37724632154` se inspeccionaron y confirman la corrección. Render completo `37725154508`, fuente `4be2074d`: doce fragmentos completos tras recuperar la instalación de dependencias del fragmento 3; ensamblado pendiente. 103 todavía conserva v1.

**Energía 108:** nuevo modelo a escala con protecciones DIN, terminales y canaletas, UPS con doce baterías contenidas, control y distribución hacia dos cargas IT identificadas. Dos puertas mecánicas, recorrido propio y UM Sans. Prueba `37725156994` rechazada por conectores y lectura de la electrónica. Corrección `97ccbc12`; nueva prueba `37727185973` de tablero, UPS y cargas en curso. Prueba refinada inspeccionada; render completo `37728931491` en marcha, fuente `437bd83b`, tipografía normalizada.

**Soporte 105:** nuevo banco de trabajo a escala, UI que avanza entre señal/diagnóstico/verificación, instrumento de prueba conectado al puerto identificado, notebook e historial. Prueba `37725441653` inspeccionada: la secuencia de estados funciona; corregidos facetado del instrumento y relieve de etiquetas en `97ccbc12`. Prueba dirigida `37727188484` inspeccionada; render completo `37728960586` en marcha, fuente `437bd83b`, tipografía normalizada. La película registrada sigue en v1.

**Consultoría 106:** maqueta de seis espacios con puestos, núcleo, red, energía y servicios superpuestos en las mismas coordenadas. Se separan automáticamente y el recorrido pasa a un documento que relaciona evidencia, impacto, alternativas y etapas. Prueba `37725767517` rechazada por corte superior en la maqueta y defectos de texto. Corrección de cámara confirmada en `37727415482`; contornos de texto corregidos y confirmados visualmente en `37728326918`. Render completo `37728975470` en cola, fuente `437bd83b`. La película registrada sigue en v1.

**Integración en preparación:** player v10 prepara únicamente el video visible antes del arranque y usa tiempo ocioso del navegador. Respeta pausa, movimiento reducido y visibilidad. Las nuevas películas tienen frases breves vinculadas al reloj nativo de cada plano. Se elimina la costura rectangular ajustando el fondo al gris realmente decodificado; no se recorta ni baja la resolución. Auditoría `37726404454`: diez composiciones y dos ciclos autónomos con frases sincronizadas; capturas inspeccionadas, cero solapes/errores. WebKit: cero cuadros descartados; Chrome: 51 descartados al inicio y 103 acumulados al final. No mejoró el arranque. El diagnóstico `37727417874` aisló el fundido inicial de dos capas 4K. Corrección medida en `37728329551`: 54 → 5 cuadros perdidos en los primeros dos segundos; total de página 53, nativo 1, página sin scripts isométricos 4. Aún no está resuelto el remanente. Repetición instrumentada `37729506201` en curso para verificar si coincide con una animación real o con el runner.

**Software v5, en prueba:** interfaz más precisa con superficies redondeadas, jerarquía tipográfica, búsqueda, estados, responsables, contratos de API, datos y registros; conserva la transacción 0248 y el recorrido continuo. Prueba nativa `37729470374`, fuente `f1a44292`. No sustituye v4 antes de revisar fotogramas y movimiento.

**Isometría de Energía v3:** cartucho de seis módulos con tapas, válvulas, identificación, terminales, puentes completos y salida DC. Se preservan ejes, carcasa y mecanismo de extracción. Se corrigió el cruce de un puente sobre una etiqueta. Prueba estática inspeccionada; falta auditoría animada de encuadre. Las seis capas y referencias SVG pasan sus pruebas.

## Flujo de validación y límites

Render pesado sólo en GitHub Actions. El pipeline valida hashes, 1.440 cuadros nativos, 60 fps, color explícito, continuidad y la misma fuente en los doce fragmentos. No interpolación ni escalado artificial. No reusar fragmentos de otra fuente. Cada versión nueva usa archivos nuevos; los assets publicados son inmutables.

El navegador local está bloqueado por política; las auditorías reales se hacen en runners remotos descartables. WebKit Linux no equivale a un iPhone físico. Los runs `37716790081`, `37718185751` y `37718704585` encontraron defectos después corregidos; no son aprobaciones.

La home conserva su película. Arriba Blender, abajo explicación isométrica autónoma. Campaña y binarios UM Sans protegidos. Evidencias durables bajo `/Volumes/SDTERA/Codex UM25 audits/20261007/`. Los controles funcionales no demuestran paridad artística con Ryan, Solvaix o David Hill. **No hay GO de producción.**

## Registro histórico de la entrega anterior

# Continuidad · cine de servicios UM25

Cierre del 7 de octubre de 2026. Rama `feature/isometric-redes-review`, PR #266 a develop (draft). Último commit de producto `62f5952e`. Este cierre entrega una candidata integrada y revisada; no despliega a producción.

## Checkout y preview

- Checkout estable: `/Users/santosma/Documents/Codex/um25-cine-integracion`.
- Preview: `http://127.0.0.1:4326/`; Software v2 en `/software` y servicio 104.
- PID propio: `/private/tmp/um-eight-preview.pid`; launcher `/private/tmp/um-preview-start.py`; log `/private/tmp/um-eight-preview.log`.

Las dos carpetas anteriores bajo `~/.codex/worktrees/` desaparecieron durante la continuidad entre hilos. Los cambios ya estaban guardados y subidos; se recuperó la misma rama en Documents. No recrear otro checkout ni modificar el checkout principal con trabajo ajeno. Verificar PID y directorio antes de reiniciar únicamente esta preview.

## Entrega

Ocho películas específicas para 101–108, de 24 segundos y 576 cuadros cada una. Biblioteca de 48 archivos y 75.506.540 bytes: ancho Full HD, edición cuadrada y cuatro pósters. Cada página carga su edición. Los importadores verificaron hashes, formato, duración y encuadre de todos los cuadros.

- Siete servicios: ensamblado `37675998479`, importados en `fd44e194`.
- Software v2: ensamblado `37690371762`, importado en `165a1b2b`. Parte de una aplicación, revela reglas, integraciones, datos y despliegue y devuelve un resultado al producto. Conserva su composición específica al versionar.
- Player v9: espera `ended` para repetir la película, preserva pausa manual, movimiento reducido y suspensión fuera de pantalla. Corrige el reinicio prematuro observado con `loop` nativo en el WebKit del runner.
- `62f5952e`: pausa móvil situada junto a la película, con objetivo táctil de 44 × 44 px; evita que quede junto a la barra fija inferior.
- Relato inferior: seis capas autónomas por disciplina, equipos reconocibles, inspección opcional y selección editorial por sector. La home conserva su gran película.
- Títulos y bajadas por disciplina, acceso a los proyectos del propio servicio y escala de titulares equilibrada en tablet.

Todos los renders terminaron. **No relanzar los renders ni el seguimiento antiguo.** El estado `/private/tmp/um-software-v2-state.json` marca `imported`. La entrega de Software está en `/Volumes/SDTERA/Codex UM25 audits/20261007/software-v2-delivery-37690371762`.

## Verificación completada

| Control | Resultado |
| --- | --- |
| Código final `62f5952e` | `npm run check`: 67 suites / 573 pruebas, lint, tipos, contrato CSS y build aprobados. Log `/private/tmp/um-mobile-controls-check.log`. |
| `37678895936` | Integración amplia: once rutas Chrome por perfil y 55 composiciones WebKit, sin hallazgos. |
| `37690846436` | 90 composiciones Chrome/WebKit y ocho películas completas y repetidas en WebKit móvil, sin hallazgos. |
| `37690850289` | Software v2 en ambas rutas, Chrome escritorio/móvil, relato autónomo y diez composiciones WebKit, sin hallazgos. |
| `37693270159` | Pausa móvil: 54 composiciones Chrome/WebKit a 820, 390 y 360 px, con hit testing real, sin hallazgos. |
| Preview reconstruida | Nueve rutas 200 (ocho servicios y `/software`), película propia y player v9. |

Se descargaron los reportes y se leyeron capturas reales de banners, capas y controles. Las pruebas de WebKit son del motor en Linux, no de un iPhone físico. La comprobación anterior `37689162361` se canceló al quedar superada; su instalación descargaba lentamente desde el mirror Ubuntu. Los controles finales completaron esa instalación.

No hay renders ni revisiones visuales pendientes de este cierre. El resultado permanece como candidato revisable en el PR; las pruebas funcionales no certifican perfección artística. Producción requiere su cierre de release y los controles del servidor por el flujo autorizado de CI/CD.

Render pesado en GitHub Actions. Evidencias en `/Volumes/SDTERA/Codex UM25 audits/20261007/`. La campaña protegida y los binarios de UM SANS CLOUD no se modifican en este cierre. La dirección permanece: película Blender arriba, explicación isométrica autónoma abajo y antecedentes reales como evidencia.
