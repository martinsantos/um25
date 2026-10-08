# Revisión de precisión · 7 de octubre de 2026

Registro inicial de interfaz y color: `74242c92`, rama `feature/isometric-redes-review`, PR #266 a develop. Trabajo en la preview `http://127.0.0.1:4326/`. La evaluación anterior encontró una diferencia sustancial de calidad frente a Ryan, Solvaix y David Hill. Esta iteración reconstruye partes de la propuesta; un control funcional verde no constituye aprobación artística ni autorización de release.

## Cambios visibles

- **Redes:** gabinete nuevo a 30°, herrajes, perforaciones, terminaciones ópticas, contactos RJ45, placas, disipador, memoria, ventilación, organizadores y cables. La puerta gira sobre su eje y el switch se extrae con sus guías; los latiguillos conservan sus extremos unidos. El punto de acceso abre su tapa y expone las antenas y la electrónica. La instalación contiene puestos, sala técnica, bandejas, derivaciones y terminales; usa la misma geometría del gabinete y de los equipos de detalle.
- **Software:** seis superficies opacas y finas con una interfaz concreta, reglas, contratos de API, relaciones de datos, publicación y operación. La capa seleccionada se desplaza desde el conjunto. Sus contenidos conservan jerarquía y ocultación; las líneas de las capas inferiores no atraviesan la superficie activa.
- **Otras disciplinas:** se conserva su equipamiento propio y se unifica el trazo. Las planillas de Telecomunicaciones, Soporte, Consultoría, Seguridad y Energía ahora tienen contenido técnico específico: extremos y servicios del enlace, registro de incidente, prioridad, alternativas, dependencias, alcance, eventos y transferencia eléctrica. Los ordinales grandes encerrados en círculos se reemplazan por anotaciones discretas.
- **Contexto:** los sectores muestran su instalación al comenzar y al cerrar cada servicio. En el tramo central se explica el mecanismo de la disciplina. Bodegas conserva tanques, fraccionamiento y sala técnica; Constructoras conserva la montante y los pisos. La home usa el texto general de cada disciplina, evitando describir una montante de varios pisos sobre el dibujo de una oficina.
- **Ritmo:** el índice dedica 19,5 segundos a contexto, mecanismo y resultado por servicio; las ocho disciplinas recorren el conjunto en 2 minutos y 36 segundos. Cada página de servicio conserva sus seis capas y su vuelta al sistema en un ciclo de 60 segundos. Las seis descripciones permanecen disponibles en ambos casos.
- **Móvil:** el encuadre se calcula sobre la geometría real de la pieza activa. Software acompaña la posición final de la superficie que se despliega. La leyenda exterior conserva la explicación y sustituye anotaciones que no son legibles a esa escala.
- **Integración:** el alto del escenario y la distribución editorial se conservan al alternar contexto y detalle. Las disciplinas nuevas no montan ni ofrecen un regreso al catálogo visual anterior. Las formas están en el HTML inicial y no esperan descargas de imágenes para iniciar la explicación.

Las pausas explícitas, la salida del viewport, la pestaña oculta, movimiento reducido y la navegación de Astro interrumpen el trabajo de animación correspondiente. Los scripts públicos nuevos son `precision-systems-v5.js` y `service-atlas-v20.js`; se conservan los anteriores porque el despliegue scoped trata los assets públicos existentes como inmutables.

## Verificación

- `npm test -- --runInBand`: 68 suites y 579 pruebas aprobadas. Incluye continuidad de cables, pausa y reanudación en la misma posición, reducción de movimiento, disposición al navegar, recorrido completo, ritmo del índice y separación entre proyecto sectorial y pieza.
- Build, tipos, lint y contrato CSS locales. Lint conserva diez advertencias anteriores.
- [Control visual 37705402194](https://github.com/martinsantos/um25/actions/runs/37705402194), commit `03fd9a41`: correcto en Chrome escritorio y móvil; recorridos completos a velocidad real de Redes y Software, las otras seis disciplinas, home, Bodegas y Constructoras; WebKit en los cinco anchos del contrato y movimiento de las piezas. La revisión humana de estas capturas detectó anotaciones móviles demasiado grandes, Software pequeño y diferencias de acabado en el contexto; se corrigieron en `fcb8c0e9`.
- [Control visual del candidato fcb8c0e9](https://github.com/martinsantos/um25/actions/runs/37706692696): correcto en ambos navegadores y perfiles; evidencia descargada y revisada. Se ajustaron luego la franja de leyenda móvil y cinco pantallas de supervisión, relevamiento y energía que conservaban líneas genéricas.

Los controles remotos ejecutan una copia del candidato en un runner descartable. WebKit en Linux no representa un iPhone físico. Las capturas previas siguen siendo evidencia del commit al que pertenecen.

## Película de Software v3: entrega e integración

La v3 reemplaza a v2 en el registro de Software. Ofrece una interfaz más fina, acercamientos compuestos por separado, apertura hacia reglas y datos y una confirmación que vuelve a la aplicación. Es una secuencia de 24 segundos y 1.440 cuadros nativos a 60 fps.

- Prueba Cycles 4K: permitió detectar recorte del plano general y superficies grises. Rechazada como entrega; se corrigieron cámara y tratamiento del material.
- Prueba Eevee 4K: un fotograma medido tomó 345,92 segundos en el runner. No se multiplicó ese costo por la película completa.
- [Prueba nativa 37705747887](https://github.com/martinsantos/um25/actions/runs/37705747887): doce cuadros consecutivos 300–311, 1920 × 1080; 342,91 segundos de render, 28,58 segundos por cuadro de media. La tipografía y los controles se leen mejor, pero la iluminación de estudio todavía vuelve gris la interfaz. Rechazada como entrega. El ensayo anterior de 120 cuadros `37703339008` se canceló al obtener esta evidencia.
- El render conserva una operación de animación nativa en lugar de reiniciar un render de imagen por cuadro; evita reconstruir textos que no cambiaron y guarda tiempos y cuadros de prueba recuperables.
- [Cinco planos 4K con color de superficie](https://github.com/martinsantos/um25/actions/runs/37706695771) y [muestra consecutiva 4K](https://github.com/martinsantos/um25/actions/runs/37706698727): completos tras recuperar dos instalaciones de dependencias que agotaron su tiempo. Se conservan los planos blancos, los contornos finos y la lectura de la aplicación. Se eliminó el conector exterior que atravesaba el contenido de los planos y se coordinó el cambio de estado con la versión del registro.

La [secuencia v3 completa](https://github.com/martinsantos/um25/actions/runs/37708333902) produjo once fragmentos; la instalación de dependencias falló en uno, recuperado en [37708941726](https://github.com/martinsantos/um25/actions/runs/37708941726). El [ensamblado 37709328708](https://github.com/martinsantos/um25/actions/runs/37709328708) confirmó 1.440 cuadros decodificables y distintos, 24 segundos, 60 fps, 3840 × 2160 y edición móvil 1920 × 1920. Se importaron seis assets nuevos, 58.415.629 bytes en total, con verificación SHA-256. La muestra 4K consecutiva confirmó doce cuadros distintos a 60 fps y entre 3,86 y 6,63 segundos de render por cuadro. Las siete películas de las demás disciplinas siguen siendo las entregadas antes de esta reconstrucción. El cierre anterior de reproducción y encuadre no certifica que hayan alcanzado el acabado de las referencias.

## Criterio de cierre

Comparar el resultado a tamaño de uso con [Ryan](https://x.com/wheresryan22/status/2106439475551154186), [Solvaix](https://x.com/Solvaix/status/2106830508797706560) y [David Hill](https://x.com/iamdavidhill/status/2107616166713655476): el acercamiento debe revelar construcción útil; los recorridos deben conservar conexiones; cada cambio de plano debe aportar información; los textos y estados deben contar la misma acción. Verificar inicio, tramo medio, frenado y unión del ciclo. La igualdad de tecnología o de resolución no demuestra igualdad visual.

Producción, la campaña protegida y los binarios de UM Sans permanecen fuera de esta iteración. El PR conserva estado draft.


## Revisión posterior de la composición

El candidato `d2b70934` reserva una franja real de 36 px para la leyenda inferior: el dibujo ya no pasa por detrás del texto en móvil. Las pantallas de Seguridad, Soporte, Consultoría y Energía muestran eventos, casos, dependencias, recuperación y cargas; no líneas que simulan contenido. La composición de Software v3 conserva todas las aristas de la interfaz y separa la columna editorial del área de película. Su derivado móvil conserva el fotograma completo.

La evidencia de Chrome/WebKit de `fcb8c0e9` y los planos y cuadros consecutivos 4K se guardaron y verificaron por SHA-256 en `/Volumes/SDTERA/Codex UM25 audits/20261007/precision-d2b70934/`. El [control del candidato d2b70934](https://github.com/martinsantos/um25/actions/runs/37708336704) completó la revisión de la franja y los nuevos monitores en la página real; ambas capturas fueron descargadas y revisadas. No aparecieron errores ni desbordamientos.

El guard del release scoped rechazaba 32 rutas ya presentes en la rama. Se añadieron de forma explícita; se verificaron las 371 rutas del candidato y el rechazo de configuración y versiones de runtime no revisadas. La guarda de inmutabilidad de `public/cine` se conserva y la comparación contra `origin/master` no contiene modificaciones de assets de cine previamente publicados. Esto prepara el release; no lo ejecuta.

## Profundidad y contexto posterior a la integración

`fa74c436` conserva opacidad de las carcasas y dibuja el techo después de los equipos interiores. El énfasis deja de volver transparentes las superficies: se apoya en la apertura física, el recorrido y la anotación. Software declara su presentación como arquitectura de aplicación y evita la instalación genérica también en los servicios complementarios.

El control `37710000335` del candidato `eff9ff29` confirmó reproducción completa de Software en Chrome: escritorio 1.843 cuadros en `totalVideoFrames` del navegador, 41 descartados; móvil 1.815, seis descartados. Duración recorrida 23,98 y 23,48 s de 24 s, respectivamente. Es una medición del runner, no de dispositivos de usuarios. CLS observado 0 en ambas rutas. El control global falló porque todavía leía los botones retirados y buscaba el selector anterior de señales; se corrigió para comprobar el estado real, el contexto visible y ambas familias de señales. No se presenta ese run como aprobado. Sus capturas están verificadas en `/Volumes/SDTERA/Codex UM25 audits/20261007/software-v3-integrated-eff9ff29/`.

El [control de precisión 37710968497](https://github.com/martinsantos/um25/actions/runs/37710968497) terminó correctamente: ocho disciplinas en Chrome escritorio/móvil, ciclos nativos completos de Redes y Software, home y contextos sectoriales, pausa y movimiento reducido; WebKit en los cinco anchos del contrato. Se inspeccionaron el gabinete abierto y el recorte móvil, confirmando que el techo oculta los equipos que quedan detrás.

El [encuadre 37710003097](https://github.com/martinsantos/um25/actions/runs/37710003097) terminó correctamente: 20 composiciones Chrome/WebKit y repetición nativa de Software v3. El control integrado `37710967875` completó Chrome escritorio y móvil; el perfil móvil cerró sin hallazgos. La preparación de WebKit consumió casi 27 minutos. Al cancelar el perfil de escritorio, el navegador alcanzó a verificar las dos rutas a 1440 px sin hallazgos; no completó los otros cuatro anchos. Los controles completos de precisión y Software v4 aportan cobertura posterior, pero no convierten esta revisión parcial en una completa. No presentar este run cancelado como aprobado. `npm run check` de `74242c92`: 68 suites / 579 pruebas, tipos, CSS, lint y build correctos.

## Prueba de instalación de Incendio

`399f24b6` añade un modelo independiente del entregado: recinto de 8 × 5,4 m, equipamiento a escala, detectores de 140 mm, circuitos montados, central con placa y borneras, baterías dentro del gabinete, puestos y mobiliario. Una cámara continua compone contexto, detector, circuito, central y regreso.

El run `37711352258` produce tres planos 4K/Cycles (cuadros 0, 460 y 960) para inspección. No hay película nueva importada ni se habilita el render completo de esta versión antes de revisar los planos. El script es `scripts/cine/render-fire-project-v2.py`; Blender corre sólo en el runner remoto.


## Color de Software v4 y comprobación en el navegador

`74242c92` conserva exactamente los 1.440 cuadros de la entrega v3 y corrige la señalización de color. El archivo anterior no declaraba su matriz: el navegador interpretaba como BT.709 una conversión RGB/YUV BT.601 y el rojo aparecía anaranjado. `repack-software-color-v4.py` declara matriz SMPTE 170M, primarias BT.709, transferencia sRGB y rango limitado en H.264 y en el contenedor. La operación usa copia de stream: los 1.440 hashes de cuadros decodificados se mantienen, sin recomprimir ni alterar el movimiento.

Seis assets nuevos `software-system-v4`, 58.415.732 bytes. Los seis v3 reemplazados se retiraron de la rama después de verificar que nunca existieron en `origin/master`; el original se conserva con SHA-256 en SDTERA. Las dos rutas de Software usan la v4 en la preview reconstruida.

El [control 37712634510](https://github.com/martinsantos/um25/actions/runs/37712634510), sobre `74242c92`, terminó sin hallazgos: 20 composiciones, las dos rutas, cinco anchos, Chrome y WebKit, controles y repetición completa en WebKit móvil. El rojo dominante medido en reproducción es RGB 219/38/38 en Chrome y 218/34/37 en WebKit, dentro de seis niveles por canal respecto de 220/38/38. Se inspeccionaron las capturas reales integradas de escritorio y móvil. Esto confirma color, composición y reproducción; no una equivalencia artística con David Hill.

Evidencia verificada por SHA-256:
- `/Volumes/SDTERA/Codex UM25 audits/20261007/precision-fa74c436/` (111 archivos).
- `/Volumes/SDTERA/Codex UM25 audits/20261007/software-v4-framing-37712634510/` (30 archivos).
- `/Volumes/SDTERA/Codex UM25 audits/20261007/software-v4-delivery-color/` (original de entrega).

## Rechazos y correcciones de Incendio

La prueba Cycles `37711352258` obtuvo los planos general y central; el tercer trabajo falló instalando dependencias. Fueron rechazados por conductos sobredimensionados, electrónica genérica, soporte del detector arbitrario y composición todavía pobre. Los tiempos fueron 340,25 y 549,3 s por cuadro. No se produjo la película completa con esos parámetros.

`f623f29b` reconstruye la central con chapa plegada, juntas, placas independientes sobre separadores, terminales, circuitos integrados y pines, relés, disipador, baterías de menor escala, controles y electrónica trasera de la puerta. El cableado conserva radios de curvatura y el mobiliario tiene superficies curvas. La referencia documental de construcción del gabinete fue el [manual oficial de FireNET L@titude](https://www.hochikiamerica.com/img/category/description/LatitudeInstallation_Hochiki.pdf); la ilustración es propia y representativa, no un plano de instalación ni un modelo de ese fabricante.

La prueba `37713001828` completó tres planos Workbench 4K. Mejoró las proporciones y el detalle, pero sus sombras duras y oscuridad se rechazaron. `23c7c78c` elimina esas sombras, aclara el acabado y añade un mazo flexible que mantiene unida la electrónica de la puerta. Los tres planos de `37713406882` están completos e inspeccionados (12,10–20,38 s por cuadro). Se conservan en `/Volumes/SDTERA/Codex UM25 audits/20261007/fire-project-v2-proofs-37713406882/`.

El ángulo superior ocultaba el mecanismo del detector. `089f1e81` dirige ese acercamiento desde debajo de su soporte; la prueba dirigida es `37713799416`. La muestra nativa de doce cuadros `37713409706` terminó correctamente: doce PNG nativos distintos, 225,36 s totales, 18,3 s por cuadro de mediana. Esa muestra prueba el tramo de la central; no la apertura nueva del detector ni el ciclo completo. Ningún plano de prueba reemplazó todavía la película de Incendio del sitio. Las otras siete películas conservan su versión anterior; ese es trabajo pendiente de acabado, no un GO a producción.


## Continuidad · central articulada y película de Incendio

`af2c9e6e` incorpora una isometría construida con las piezas medidas de la central Blender, con geometrías SVG reutilizadas (14.412 bytes gzip). La bisagra, los extremos del mazo, la cara posterior de la puerta y la tapa del detector responden al mismo reloj del relato. Mobile recibe acercamientos por capa; movimiento reducido conserva una vista completa estable. Las baterías se explican dentro del gabinete. `npm run check`: 69 suites / 582 pruebas y compilación correctas. Auditoría visual de la página: `37716790081`, pendiente de resultado al escribir esta entrada.

La prueba del detector `37713799416` falló instalando dependencias; `37714330070` recuperó el encuadre. La prueba de luz precalculada `37714555071` reveló curvas blancas; `37715078018` recuperó sus materiales y produjo cinco encuadres. `37715412939` mejoró superficies y luz del detector pero mostró las caras del soporte invertidas. Se corrigieron y se añadieron invariantes geométricas; `37715859677` se inspeccionó con la cara inferior visible, iluminación suave y carcasa sin facetado grueso. El render completo `37716425530`, a 4K/60 nativo, está en curso sobre `83cae61f`; aún no se ha importado.

Evidencias verificadas por SHA-256 en SDTERA: `fire-five-shots-37715078018/` y `fire-detector-37715859677/`. Las pruebas que mostraron defectos no sustituyen las películas del sitio.


## Revisión del 8 de octubre: entrega de Incendio y nuevas cámaras

Incendio v2 ya está importado: `37716425530`, fuente `83cae61f`, 1.440 cuadros únicos, 4K/60 y 24 segundos. Los seis assets nuevos suman 51.136.539 bytes. Su revisión final integrada `37719560859` confirma diez composiciones, reproducción completa y repetición en Chrome/WebKit, además de catorce estados autónomos de la isometría, sin hallazgos.

La primera auditoría de la central detectó una regresión real: elementos serializados con prefijo `ns0` no se dibujaban al insertar el SVG en HTML. Otra cámara genérica también modificaba el encuadre. Se corrigieron ambos problemas y se revisó la ubicación de detector, electrónica y respaldo en móvil. La máscara heredada de hardware oscurecía parte de la película aunque el DOM declaraba la composición nueva; se restringió su selector y se volvió a comprobar en ambos motores.

Cinco cámaras de isometrías ahora calculan el encuadre sobre la pieza cerrada y completamente abierta. La primera prueba encontró incompatibilidad entre SVGMatrix y DOMMatrix: se sustituyó por composición afín explícita. `37719182601` inspeccionó 140 estados y 20 vistas de movimiento reducido, en cuatro perfiles Chrome/WebKit × escritorio/móvil, sin hallazgos ni errores. Se revisaron las capturas y se observó ruido de piezas vecinas: `351ebb2d`/`021ecbbf` atenúan el contexto durante el enfoque; falta su confirmación visual posterior.

Redes v2 está en pruebas dirigidas. Se rehízo la radio tras rechazar un PCB vacío y se corrigió la tapa del switch para evitar intersección con el patch panel. Los planos de `37720542508` muestran el detalle, pero aún motivan correcciones de carcasa, ranuras y protagonismo del cable. Todavía no hay película nueva de Redes publicada en la preview.

Estado completo y siguientes pasos en `work-status-20261007.md`. El candidato sigue en draft: las cinco películas restantes y la calidad global no se certifican por pasar pruebas de reproducción.


## Revisión posterior: Redes nativa y rechazo de las primeras pruebas restantes

Redes v2 ya está integrada desde `d615181c`: 1.440 cuadros únicos, 24 s y seis assets verificados, provenientes de `37721892202`. Se inspeccionaron sus planos completos. `37724634688` comprobó diez composiciones y dos ciclos nativos; en Chrome aparecieron 51 cuadros descartados al inicio y tres adicionales durante la pasada. El player v10 prepara sólo el video visible antes de reproducirlo; el control posterior `37726404454` terminó correctamente, pendiente de lectura detallada de sus métricas al escribir esta entrada. No se presenta el arranque como resuelto por el estado verde del workflow.

Las cinco isometrías restantes completaron `37721308823`: 140 estados y 20 vistas con movimiento reducido en Chrome/WebKit, escritorio/móvil. Sus capturas se inspeccionaron y se archivaron con SHA-256. La jerarquía atenúa el contexto sin transparentar la pieza activa. Incendio completó otra revisión de escritorio `37722704881` después de mejorar sus encuadres.

La prueba de Energía `37725156994` fue rechazada por un cable que terminaba sobre una rejilla y por ocultar la electrónica de la UPS. La corrección añade inlets y conectores de alimentación identificables, conductores unidos a terminales DIN y una tapa que revela la electrónica con un ángulo superior. Se revisará de nuevo antes del render completo.

Soporte `37725441653` confirma la secuencia autónoma señal/diagnóstico/verificación y una interfaz legible. El instrumento todavía mostraba facetado y letras con relieve desproporcionado. Se alisa la carcasa y se imprimen las etiquetas sin extrusión. La escena mantiene un único caso ilustrativo asociado al puerto 12; no inventa registros de clientes ni métricas de operación.


## Contornos y reproducción: causa comprobada, no reducción de calidad

Las pruebas `37727185973` y `37727188484` confirman conexiones de Energía, electrónica visible en la UPS, instrumento sin facetado y conexión al puerto identificado. Consultoría `37727415482` corrigió el encuadre, pero conservaba huecos en las letras. Eliminar extrusión y aumentar la separación del papel no lo resolvió. La normalización de contornos de una copia temporal de UM Sans en `37728326918` sí elimina los huecos; se inspeccionó el documento completo. Se conservan intactos los binarios publicados y los anchos de avance. Se utiliza la unión de contornos de [FontTools](https://fonttools.readthedocs.io/en/latest/ttLib/index.html), exclusivamente en la copia descartable del runner. La primera guarda rechazó el ajuste de un bearing lateral de un glifo superíndice; se mantiene la comprobación de cmap y de todos los avances.

`37727417874` aisló el rendimiento sin capturas durante la reproducción: página 88 cuadros descartados, reproducción nativa del mismo archivo 0, página sin cámaras isométricas 54. Sólo hubo una tarea principal de 74 ms y ocurrió antes de reproducir. La pérdida inicial coincide con el fundido de dos capas 4K durante 1,2 s. Se elimina ese fundido en composiciones nuevas cuyo póster ya es el primer cuadro nativo; resolución y cuadros permanecen intactos. Nueva medición `37728329551`, pendiente.

Seguridad completa `37727617083`: diez composiciones y cinco frases de relato por cada uno de los ciclos Chrome/WebKit. Sin errores ni solapes; capturas revisadas. El Chrome de esta prueba aún llevaba el fundido anterior. Las pruebas funcionales y geométricas habilitan los renders completos restantes para inspección posterior, no una afirmación de perfección artística.


## Revisión integrada final de servicios · 8 de octubre

Producto `9c2f3dee`: las ocho disciplinas sustituyen sus películas anteriores. Son 24 segundos y 1.440 cuadros nativos por servicio, con escenas propias; Software usa `software-system-v5`, Energía `power-project-v3` y las restantes `*-project-v2`. El inventario, hashes y runs de origen están en `site-movies-v1.json` y el estado resumido en `work-status-20261007.md`.

La comparación volvió a realizarse con cuadros nativos de [Ryan](https://x.com/wheresryan22/status/2106439475551154186), [Solvaix](https://x.com/Solvaix/status/2106830508797706560) y [David Hill](https://x.com/iamdavidhill/status/2107616166713655476). El criterio no es que los objetos simplemente se muevan: se revisan contornos, juntas, terminaciones, legibilidad del estado, relación entre las piezas, encuadre abierto y continuidad de la cámara. No se asignó una supuesta puntuación de paridad ni se confundió resolución con riqueza visual.

Cambios visibles:

- Software muestra una solicitud que atraviesa interfaz, validaciones, integración, datos y despliegue, con UI legible en sus acercamientos, radios pequeños, líneas finas, responsables, registros y estados. Se eliminó la deformación de glifos de las primeras pruebas sin cambiar los binarios de la familia tipográfica.
- Redes, Seguridad e Incendio tienen equipos reconocibles que abren sus carcasas y mantienen conectadas las piezas: puertos, borneras, electrónica, óptica, alimentación y cableado. Telecomunicaciones distingue radio y fibra en el mismo contexto de dos sitios.
- Energía v3 resuelve mejor el contacto entre baterías, bandejas y carcasa. La prueba con ruido de iluminación se rechazó antes de generar la película completa. El nuevo render conserva todos los cuadros nativos y fue inspeccionado en planos general, tablero, UPS, distribución y un segmento continuo.
- Soporte acompaña un caso entre recepción, diagnóstico y verificación; Consultoría vincula el relevamiento del sitio con evidencia, impacto, alternativas y etapas. No se repite un monitor genérico para presentar todos los servicios: el primer objeto isométrico es respectivamente portátil, folio de campo y analizador eléctrico en 105, 106 y 108.
- En los sectores, el titular presenta el beneficio y la narración explica la etapa concreta. La home conserva la película grande. Las piezas aparecen y avanzan por exposición al viewport; la persona puede pausar, pero no necesita elegir cada capa.

Verificación a `9c2f3dee`: `npm run check` completo, 71 suites y 592 pruebas, lint/tipos/CSS/build aprobados; diez advertencias anteriores. Chrome recorrió las 20 rutas en escritorio y móvil. El primer control WebKit falló por un selector de botón retirado en Constructoras: se corrigió para comprobar el proyecto real y el control posterior `37739121530` aprobó 55 composiciones en cinco anchos. Sus capturas de Constructoras y Soporte con movimiento reducido fueron inspeccionadas; esa preferencia mantiene la vista general y el botón Reproducir, no implica que el recorrido normal espere un clic. El piloto `37738849768` confirma home, Bodegas e Incendio, con cinco escenas nativas de home y cero hallazgos.

Los informes de navegador prueban las propiedades que miden. No garantizan el mismo rendimiento en todos los equipos ni certifican por sí solos la calidad artística del sitio. Las capturas y películas aceptadas están archivadas con SHA256 en `/Volumes/SDTERA/Codex UM25 audits/20261007/`; los runs rechazados se conservan identificados y no sustituyen los assets integrados. La candidata permanece en el PR #266, draft, sin publicación en producción.

Cierre de los últimos controles: Energía v3 `37739962114` aprueba diez composiciones y dos ciclos completos con cinco frases sincronizadas; Chrome descarta 7/1.379 cuadros y WebKit móvil 0/1.372. Las capturas de tablero y UPS fueron inspeccionadas. Las isometrías nuevas `37738500419` completan 140 estados y 20 vistas reducidas en Chrome/WebKit, escritorio/móvil. WebKit móvil necesitó repetir una captura que agotó el tiempo esperando fuentes; sin cambiar producto, la segunda ejecución completó todos los estados sin hallazgos. Ambos intentos se archivaron identificados. No quedan renders aceptados pendientes de importar ni auditorías visuales en curso.
