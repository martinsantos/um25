# Siete películas de servicio · 7 de octubre de 2026

## Alcance

Las siete disciplinas que usaban películas de sector ya tienen su película propia en la preview. Software conserva su película específica mientras se termina su nueva edición de interfaz y arquitectura. La gran película de la home y los proyectos de sector conservan su función. Cada servicio combina cine arriba y explicación isométrica autónoma abajo.

| Servicio | Acción y elementos propios |
| --- | --- |
| 101 · Redes | Puestos, tomas, bandeja, patch panel, switch, Wi-Fi y certificación. El gabinete abre desde su bisagra. |
| 102 · Seguridad | Cámaras con óptica, acceso y lector, transporte, grabación, pantallas de supervisión y operación. |
| 103 · Telecomunicaciones | Dos sitios con torres arriostradas y radios enfrentadas; terminación y encaminamiento. Fibra visible como alternativa, sin encadenarla con radio. |
| 105 · Soporte | Equipo atendido, consola de incidentes, diagnóstico y herramientas de intervención; señal de ida y verificación de regreso. |
| 106 · Consultoría | Relevamiento espacial, dependencias, riesgos, alternativas y plan de implementación. Los tres documentos tienen diagramas distintos. |
| 107 · Incendio | Espacios con detectores, lazo supervisado, central, pulsador, aviso y alimentación de respaldo separada. |
| 108 · Energía IT | Protección, UPS, módulos de baterías, distribución y cargas. Los puentes unen módulos contiguos, no los dos bornes de una misma batería. |

Son representaciones explicativas de capacidades, no planos constructivos ni fotografías de obras ejecutadas. La experiencia se acredita con los antecedentes reales del sitio.

## Dirección y producción

Materiales de grafito, metal y superficies claras; rojo para el recorrido activo. Iluminación cálida/fría amplia, sin flashes. Cámara continua de 24 segundos con coincidencia entre inicio y fin. Una edición 1920 × 1080 y otra cuadrada conservan todos los equipos. La versión móvil recorta sólo el espacio de composición previsto.

La fuente reproducible está en `scripts/cine/render-service-cinema-v1.py`. `check-service-composition.py` verifica los 576 encuadres de cada disciplina con proyección ortográfica, incluyendo el giro de la puerta. El render vuelve a comprobarlos con la cámara nativa de Blender. No se ejecuta Blender en el Mac.

La comparación inicial mostró alrededor de 190 segundos por cuadro en EEVEE sobre CPU y 45–62 segundos con Cycles a 24 muestras. Se elige Cycles. Las pruebas detectaron margen insuficiente en Soporte, proximidad al borde inferior entre cuadros de muestra, superficies coplanares en gabinetes y muros, y conexiones de batería que requerían corrección. Estos cambios se incorporan antes de la tanda completa.

El workflow `Blender service cinema` produce fragmentos recuperables de 48 cuadros, verifica la descarga oficial de Blender con SHA-256 y entrega H.264 sin audio, pósters AVIF/JPEG y metadatos de todos los cuadros. El importador comprueba identidad, integridad, duración, dimensiones, encuadre y presupuesto de 40 MB por disciplina antes de escribir la biblioteca. Los nombres públicos nuevos son inmutables.

## Revisión integrada

La integración usa el mismo encuadre para el póster y la película. Los equipos verticales conservan un área opaca mayor que la arquitectura de software para que los degradados no borren extremos. El reproductor selecciona la edición móvil por el contrato de composición, no por una medición del contenedor durante la carga.

Antes de incorporar los archivos: 67 suites, 572 pruebas, lint, tipos, contrato CSS y build aprobados. La revisión final debe comprobar los ocho recorridos completos en Chrome nativo, la explicación automática y la composición en Chrome/WebKit a 1440, 1280, 834, 390 y 360 px.

Estado de producción: **sin despliegue**. Las pruebas artísticas y funcionales no equivalen por sí solas a una declaración de perfección o GO general.

## Entrega integrada

El [ensamblado 37675998479](https://github.com/martinsantos/um25/actions/runs/37675998479) reúne los 84 fragmentos originales y recuperados. Se importaron las siete películas, cada una con 576 cuadros únicos de 24 segundos, ancho Full HD, edición cuadrada y cuatro pósters. Los 42 archivos suman 64.408.960 bytes; cada página descarga sólo su edición. El importador verificó SHA-256, duración, formato y los 576 encuadres antes de escribir el registro.

Después de importarlas, `npm run check` aprobó lint, tipos, contrato CSS, 67 suites / 572 pruebas y build. La preview del puerto 4326 se reinició sobre ese build y Redes sirve `network-system-v1`. La revisión nativa de navegador de esta nueva entrega sigue pendiente; no debe confundirse con las revisiones de versiones anteriores.
