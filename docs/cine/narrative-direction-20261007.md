# Dirección narrativa · Última Milla · 7 de octubre de 2026

## La historia

**Dominamos cada capa para que toda la operación funcione.** La web debe demostrarlo con decisiones, conexiones, ejecución y experiencia. «La mejor del mundo» es la ambición de calidad, no una afirmación comercial sin prueba.

Tres escalas de un mismo relato:

1. **Película del servicio:** una operación completa en movimiento. Cámara lenta e intencional, materiales a color, luz y profundidad. Cada desplazamiento descubre una relación; no una colección de glitches o fachadas.
2. **Isometría del servicio:** qué capas resolvemos y cómo dependen entre sí. El sistema queda visible mientras se ilumina, se abre y se explica cada capa. Comienza sola al entrar en pantalla, conserva la lectura, admite pausa y respeta movimiento reducido.
3. **Sector y experiencia:** una necesidad concreta reúne varias disciplinas. El esquema explica una capacidad; los antecedentes reales aportan evidencia de trabajo, alcance y lugar. No presentar el dibujo genérico como una instalación ejecutada.

## Recorridos integrados ahora

- **Telecomunicaciones:** extremos y demanda → transporte → terminación → red lógica → servicios → operación. Fibra y radio son alternativas; el gráfico no los presenta como componentes obligatorios en serie. Los servicios corren sobre el transporte; mediciones e identificación hacen posible mantenerlo.
- **Detección de incendio:** cobertura → dispositivos → circuitos supervisados → central → aviso → respaldo y pruebas. La señalización y la alimentación son ramales distintos del circuito de detección. La central, sus baterías y los dispositivos tienen formas propias. El esquema es explicativo, no un plano de seguridad para instalación.
- **Software:** producto y UX/UI → reglas de negocio → integraciones → datos → despliegue → infraestructura. Una interfaz es la parte visible de una arquitectura. MVP define el primer alcance útil; contenedores son una opción de despliegue, no un requerimiento universal.

Las ocho arquitecturas usan el mismo componente de la home, servicios y sectores. Seis etapas, ocho segundos de lectura por etapa y una visión completa al inicio y al cierre. Los diagramas están en el HTML inicial y no requieren cargar un reproductor 3D. El catálogo comparte 518.276 bytes de SVG sin comprimir. Cada página de servicio recibe solamente su dibujo y las definiciones que éste referencia; todos quedan por debajo de 30 KB con gzip. También se retira la maqueta física oculta de las ocho páginas de servicio. Esto reduce geometría y carga inicial sin bajar la resolución: los dibujos siguen siendo vectoriales. La inspección detallada de equipos existente queda disponible y el recorrido automático vuelve después de una exploración con puntero.

La selección editorial de servicios por sector ya existe en `sectorNarrative.ts`. El recorrido de un sector debe usar esa selección y no quedar recortado por las relaciones parciales del CMS. Estas relaciones continúan sirviendo como evidencia de cada antecedente; no se atribuyen capacidades no verificadas a un cliente.

## Las cinco disciplinas incorporadas

La misma gramática visual debe contar sistemas diferentes:

| Servicio | Pregunta que explica el recorrido | Capas integradas |
| --- | --- | --- |
| Redes locales | ¿Cómo llega cada puesto a sus sistemas? | Puestos y cobertura → cableado → distribución → red activa → acceso Wi-Fi → identificación y pruebas. |
| Seguridad electrónica | ¿Cómo llega información útil a quien debe actuar? | Cobertura → captura y accesos → transporte → grabación y control → supervisión → respuesta y mantenimiento. |
| Energía IT | ¿Qué sostiene la operación cuando cambia la alimentación? | Cargas críticas → alimentación → respaldo → distribución → equipos atendidos → autonomía y verificación. |
| Soporte | ¿Qué pasa desde que aparece un incidente hasta que queda resuelto? | Señal → registro → prioridad → diagnóstico → intervención → seguimiento y aprendizaje. |
| Consultoría | ¿Cómo se transforma una necesidad en decisiones ejecutables? | Relevamiento → dependencias → riesgos → alternativas → prioridades → alcance y documentación. |

Las cinco arquitecturas de esta tabla ya forman parte del recorrido automático, junto con telecomunicaciones, incendio y software. Redes incorpora un gabinete articulado, cableado y Wi-Fi; seguridad relaciona cámaras, acceso, transporte y supervisión; energía separa entrada, respaldo, distribución y cargas. Soporte y consultoría muestran evidencia, equipos y decisiones. La película presenta la operación, la isometría explica el sistema y el caso aporta evidencia. La consistencia viene de esa función compartida, no de repetir una plantilla de objetos.

## Tratamiento de las películas pendientes

### Telecomunicaciones · «La distancia se convierte en un enlace»

- **0–6 s:** dos extremos reconocibles y su operación; un movimiento continuo establece la distancia.
- **6–14 s:** acercamiento al transporte elegido. Una versión óptica sigue tendido y terminación; una versión inalámbrica revela los extremos orientados. No encadenar alternativas como si fueran un solo enlace.
- **14–22 s:** entrar al cuarto técnico, revelar interfaces y encaminamiento; tránsito de información con dirección clara.
- **22–28 s:** recuperar la escala de operación y cerrar el recorrido. El empalme conserva dirección y velocidad.

### Incendio · «Una señal encuentra su respuesta»

- **0–7 s:** recorrer espacios y dispositivos, con materiales a color y escala reconocible.
- **7–15 s:** acompañar el circuito hasta la central, sin un corte por cada equipo.
- **15–23 s:** mostrar la identificación del evento y su señalización. El respaldo se revela como parte del sistema.
- **23–28 s:** volver a una visión completa. No simular un incendio espectacular ni afirmar tiempos o prestaciones no documentados.

### Software · «Lo que hay detrás de una acción»

Una persona inicia una solicitud. La cámara atraviesa una interfaz construida como superficie, sigue las reglas y permisos, cruza una integración, encuentra un registro y revela los entornos y recursos que sostienen la aplicación. Finalmente vuelve a la interfaz con el nuevo estado de la solicitud.

Usar arquitectura abstracta legible, con superficies finas, módulos, conectores y datos; **ningún edificio como sustituto del software**. Los tres encuadres se renderizaron en Blender 4.5.3 / Cycles y se inspeccionaron antes del render completo. La cámara recorre la arquitectura en 24 segundos, con un solo trayecto de solicitud y respuesta. Las conexiones de despliegue e infraestructura se distinguen del flujo de la aplicación. La primera prueba reveló un recorte en el acercamiento: se corrigió el encuadre y se añadió `--python-exit-code 1` para que una excepción Blender no produzca un falso éxito de CI. La segunda prueba produjo los tres encuadres completos: run 37618785156. La entrega del run 37619441111 ya está importada: 576 cuadros, 24 fps, Full HD, Cycles a 24 muestras, formatos ancho y cuadrado y pósters AVIF/JPEG. El conjunto ocupa 9.219.497 bytes. Se verificaron SHA-256, duración, decodificación y cinco momentos del recorrido. Servicio 104 y sección Software usan esta arquitectura.

## Estado y criterios de aceptación

Integrado: ocho mapas de disciplina, seis capas por mapa, explicación automática, conexiones persistentes, equipos detallados y piezas específicas para cada disciplina. Home y páginas de servicio explican el sistema completo. La biblioteca anterior permanece disponible para inspección.

Integrada: película específica de software en las dos rutas. Pendiente: recorridos cinematográficos específicos para las demás disciplinas; conservan por ahora los filmes sectoriales existentes. Evaluar ritmo y detalle con evidencia visual de la versión integrada; pasar pruebas de código no equivale a alcanzar el nivel artístico deseado.

No es un GO a producción. Campaña activa, tipografía del hilo paralelo y servidor no se modifican.

## Verificación de la versión integrada

Las pruebas de código y el control visual tienen alcances distintos. Las primeras verifican comportamiento y regresiones; las capturas y la reproducción nativa permiten evaluar composición y movimiento. Ninguna certifica por sí sola el objetivo artístico.

| Evidencia | Versión y alcance | Resultado |
| --- | --- | --- |
| Integridad del código | `29747ec1`, `npm run check`: lint, tipos, contrato CSS, 67 suites / 551 pruebas y build. | Aprobados. |
| Integración amplia | `58f160c5`, [37619280503](https://github.com/martinsantos/um25/actions/runs/37619280503): veinte rutas Chrome escritorio/móvil y cincuenta combinaciones WebKit. | Cero hallazgos funcionales. |
| Ocho arquitecturas y película de software | `fe7c92dd`, [37628383315](https://github.com/martinsantos/um25/actions/runs/37628383315): home, Bodegas, Software y ocho servicios. | Chrome: once rutas por perfil, cero hallazgos. WebKit: 55 combinaciones, una inspección de Energía aún cargando al capturar después de 600 ms. La captura expuso además un texto transitorio de otra disciplina. Se corrigió el contexto y la revisión siguiente espera la señal real de montaje, con límite de cinco segundos. |
| Bisagra y recorrido nativo | `1eb3eaa9`, [37629904762](https://github.com/martinsantos/um25/actions/runs/37629904762): Chrome escritorio/móvil y cinco anchos WebKit. | Cero hallazgos. El giro conserva los coeficientes verticales c=0 y d=1 durante su apertura y cierre. La home avanza de servicio en tiempo real sin entrada del usuario. |
| Encuadre móvil de software | `7f4ef07f`, [37632035932](https://github.com/martinsantos/um25/actions/runs/37632035932): ambas rutas de software y cinco anchos WebKit. | Chrome y las diez combinaciones WebKit, sin hallazgos. Botones visibles en móvil y reproducción nativa de los 24 segundos. |

La [revisión de los refinamientos 37634255500](https://github.com/martinsantos/um25/actions/runs/37634255500), sobre `29747ec1`, cubre las dos rutas de software, Redes y Energía en Chrome escritorio/móvil y veinte combinaciones WebKit. Conserva capturas del banner y del inspector, comprueba el texto desde el momento de la selección y registra el tiempo real de montaje del SVG. Sus reportes son la evidencia del cierre; el estado de la validación se resume en el PR #266.

La corrección móvil elimina del encuadre sólo las bandas de relleno del video cuadrado y suaviza su unión con el fondo. Conserva todas las piezas. El póster y la película usan el mismo encuadre. En escritorio, el plano ancho reserva la columna izquierda para la lectura. La composición móvil acerca el contenido y el CTA al recorrido.

### Carga inicial y consumo

El HTML de los servicios físicos incluía el catálogo SVG completo de 597.400 bytes dentro de un template oculto. `network-rack-v13.js` lo descarga ahora con nombre hash sólo al inspeccionar un equipo. Una respuesta atrasada no monta contenido después de navegar y conserva la última selección realizada durante la descarga. `software-layers-v9.js` tampoco carga Hairline ni anima una vista oculta detrás de la arquitectura de software. Películas y recorridos se suspenden cuando dejan de verse o se oculta la pestaña.

Medición HTTP local: Redes pasa de 925.459 a 328.142 bytes de HTML —de 113.291 a 54.111 con gzip—; incendio, de 799.088 a 201.771 —de 99.676 a 40.811 con gzip—. Son pesos del documento, no una medición de aceleración en la conexión del visitante. Los ocho dibujos siguen siendo vectoriales; cada servicio transporta menos de 30 KB de SVG con gzip. No se redujo su resolución.

### Composición y geometría

Las superficies de interfaz y documentación usan material claro y tinta oscura. Los equipos conservan su metal y sus detalles. Los elementos fuera del foco mantienen opacidad 0,86 para que las dependencias sigan legibles. La puerta gira desde una bisagra fija y permanece abierta al explicar la red activa. Las páginas de producto tienen un fondo continuo, sin márgenes blancos alrededor del sistema ni doble margen interior.

Las evidencias se conservan fuera del disco interno, en `/Volumes/SDTERA/Codex UM25 audits/20261007/`. La preview integrada continúa en el puerto 4326.
