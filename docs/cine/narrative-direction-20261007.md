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

Las ocho arquitecturas usan el mismo componente de la home, servicios y sectores. Seis etapas, ocho segundos de lectura por etapa y una visión completa al inicio y al cierre. Los diagramas están en el HTML inicial y no requieren cargar un reproductor 3D. El catálogo comparte 517.601 bytes de SVG sin comprimir. Cada página de servicio recibe solamente su dibujo y las definiciones que éste referencia; todos quedan por debajo de 30 KB con gzip. También se retira la maqueta física oculta de las ocho páginas de servicio. Esto reduce geometría y carga inicial sin bajar la resolución: los dibujos siguen siendo vectoriales. La inspección detallada de equipos existente queda disponible y el recorrido automático vuelve después de una exploración con puntero.

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

Usar arquitectura abstracta legible, con superficies finas, módulos, conectores y datos; **ningún edificio como sustituto del software**. Los tres encuadres se renderizaron en Blender 4.5.3 / Cycles y se inspeccionaron antes del render completo. La cámara recorre la arquitectura en 24 segundos, con un solo trayecto de solicitud y respuesta. Las conexiones de despliegue e infraestructura se distinguen del flujo de la aplicación. La primera prueba reveló un recorte en el acercamiento: se corrigió el encuadre y se añadió `--python-exit-code 1` para que una excepción Blender no produzca un falso éxito de CI. La segunda prueba produjo los tres encuadres completos: run 37618785156. El render completo está en el run 37619441111; no se declara integrado hasta verificar e importar la entrega.

## Estado y criterios de aceptación

Integrado: ocho mapas de disciplina, seis capas por mapa, explicación automática, conexiones persistentes, equipos detallados y piezas específicas para cada disciplina. Home y páginas de servicio explican el sistema completo. La biblioteca anterior permanece disponible para inspección.

En curso: entrega e integración de la película específica de software. Pendiente: recorridos cinematográficos específicos para las demás disciplinas; conservan por ahora los filmes sectoriales existentes. Evaluar ritmo y detalle con evidencia visual de la versión integrada; pasar pruebas de código no equivale a alcanzar el nivel artístico deseado.

No es un GO a producción. Campaña activa, tipografía del hilo paralelo y servidor no se modifican.

## Verificación de esta integración

- `npm run check`: 66 suites, 530 pruebas, lint, tipos, contrato CSS y build correctos.
- [37613243408, commit 5a335dfa](https://github.com/martinsantos/um25/actions/runs/37613243408): home, Bodegas y servicios 103/104/107 en Chrome de escritorio y móvil; 30 combinaciones de página y ancho en WebKit. Cero hallazgos. Capturas de los tres sistemas inspeccionadas.
- [37615155050, commit 4cc151eb](https://github.com/martinsantos/um25/actions/runs/37615155050): software sin la maqueta física, en Chrome escritorio/móvil y cinco anchos WebKit. Cero hallazgos. Incluye reproducción nativa de la home como regresión.
- Después del pase visual se corrigió el indicador de flujo de software para que avance aun sin maqueta física. Se verificó con 37 pruebas específicas de autonomía/sectores y un nuevo build. No cambia geometría ni composición.
- Evidencia conservada en la carpeta de la tarea `narrative-architecture-20261007`; preview integrada en el mismo puerto 4326.

Los pases funcionales no certifican el nivel artístico del conjunto. Los pendientes cinematográficos siguen expresados arriba.

## Ampliación a ocho disciplinas

- `npm run check`: lint, tipos, contrato CSS, 66 suites / 535 pruebas y build aprobados antes de los últimos ajustes de carga. El control posterior incorpora las ocho verificaciones de SVG y conserva los mismos controles.
- Pruebas de cada diagrama: seis capas, referencias internas completas, geometría propia y peso comprimido menor a 30 KB.
- Run 37619280503: auditoría de todas las rutas en curso. Se revisará su evidencia antes de declararla aprobada.
- Las variantes móviles de la película conservarán toda la arquitectura; no recortan lateralmente la interfaz para formar un cuadrado.
