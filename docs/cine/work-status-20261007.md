# Continuidad activa · 8 de octubre de 2026

Rama `feature/isometric-redes-review`, PR #266 (draft), checkout `/Users/santosma/Documents/Codex/um25-cine-integracion`. Preview `http://127.0.0.1:4326/`, compilada hasta `f7f13c38`, con Redes v2, Seguridad v2, narración sincronizada y sin superposición de capas 4K al inicio. No editar el checkout principal ni desplegar. PID propio en `/private/tmp/um-eight-preview.pid`: verificar proceso y cwd antes de reiniciar.

## Resultado integrado

- **Software v4:** 1.440 cuadros 4K/60, seis assets, 58.415.732 bytes. Auditoría `37712634510`: 20 composiciones, color y repetición en Chrome/WebKit, sin hallazgos.
- **Incendio v2:** render `37716425530`, fuente `83cae61f`, importado en `d17d8c4c`. 1.440 cuadros distintos, 24 s, seis assets, 51.136.539 bytes. Última auditoría `37722704881` sobre `e288360a`: 10 layouts y dos ciclos autónomos con siete estados isométricos cada uno; cero hallazgos. Capturas inspeccionadas. El circuito ahora mantiene contexto a .55 de opacidad y la cámara de escritorio ocupa mejor su escenario.
- **Redes v2:** render `37721892202`, fuente `6e16722f`; importación verificada. 1.440 cuadros distintos, 24 s, 4K/60, seis assets, 55.136.530 bytes. Se inspeccionaron plano general, rack abierto y radio con PCB separada del radomo. Fuente, orden de cuadros, color y SHA256 validados antes de copiar. Auditoría `37724634688` completada: 10 composiciones, dos ciclos nativos Chrome/WebKit, cero hallazgos de encuadre/reproducción; capturas revisadas. WebKit móvil no descartó cuadros. Chrome descartó 51 al inicio y otros 3 durante la primera pasada: se trabaja en preparar la carga antes del arranque.
- **Isometría de Incendio:** central de 576 piezas, 33 geometrías compartidas y 14.391 bytes gzip. Puerta de 102°, electrónica posterior, conductores unidos, detector separable y baterías dentro del gabinete. Namespaces SVG, etiquetas y cámaras corregidos.
- **Cinco cámaras restantes:** Telecomunicaciones, Seguridad, Soporte, Consultoría y Energía encuadran el volumen cerrado y abierto. Auditoría `37721308823`: Chrome/WebKit × escritorio/móvil, 140 estados y 20 vistas con movimiento reducido, cero hallazgos y errores. Capturas de las cinco disciplinas inspeccionadas. El mecanismo activo mantiene contraste; el contexto se atenúa. La cámara exterior de `precision-systems-v6.js` pertenece sólo a Software.

Último `npm run check` completo (candidato con narración del 08/10): 70 suites / 588 pruebas, lint, tipos, CSS y build correctos. Diez advertencias previas de lint. No equivale a aprobación artística.

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
