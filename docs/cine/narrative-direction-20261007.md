# Dirección narrativa · Última Milla · 7 de octubre de 2026

## La historia

**Dominamos cada capa para que toda la operación funcione.** La web lo demuestra con relaciones, decisiones, ejecución y experiencia. «La mejor del mundo» es la ambición de calidad; el sitio debe aportar pruebas concretas.

Tres escalas de un mismo relato:

1. **Cine en el banner:** una operación completa, con materiales, luz y un movimiento continuo de 24 segundos. Las ocho disciplinas tienen su propia película Blender; la home conserva la película general y los sectores sus proyectos.
2. **Isometría explicativa:** muestra qué capas resolvemos y cómo se relacionan. Comienza al entrar en pantalla, ilumina y explica cada capa por su cuenta. La inspección es opcional; pausa manual y movimiento reducido se respetan.
3. **Sector y experiencia:** reúne disciplinas según una necesidad concreta y las vincula con antecedentes reales. Los esquemas explican capacidades; no se presentan como fotografías o planos de una obra ejecutada.

## Ocho disciplinas integradas

| Servicio | Relato |
| --- | --- |
| Redes | Puestos y cobertura, cableado, distribución, red activa, Wi-Fi e identificación y pruebas. Gabinete articulado desde su bisagra. |
| Seguridad electrónica | Cobertura, captura y acceso, transporte, grabación y control, supervisión y respuesta. |
| Telecomunicaciones | Extremos, transporte, terminación, red lógica, servicios y operación. Fibra y radio son alternativas. |
| Software | Una solicitud atraviesa producto y UX/UI, reglas, integraciones, datos, despliegue e infraestructura, y devuelve un resultado a la aplicación. |
| Soporte | Señal, registro, prioridad, diagnóstico, intervención y verificación. La solución se muestra después de resolver la causa. |
| Consultoría | Relevamiento, dependencias, riesgos, alternativas, prioridades y documentación ejecutable. |
| Incendio | Cobertura, dispositivos, circuito supervisado, central, aviso y respaldo. Señalización y alimentación se representan como ramales distintos. |
| Energía IT | Cargas, alimentación, respaldo, distribución, equipos atendidos y autonomía y verificación. |

La gramática visual es común: grafito, metal, superficies claras y rojo para la señal activa. Cada sistema conserva equipos y relaciones propios. Software muestra una aplicación que revela su arquitectura. Los textos del banner presentan la disciplina y el enlace «Ver proyectos» lleva a su evidencia.

## Autonomía y carga

Las arquitecturas comparten seis etapas con ocho segundos de lectura por etapa, además de una visión completa al inicio y al cierre. Home y sectores seleccionan sus servicios sin exigir clics. La selección editorial de cada sector no queda limitada por relaciones incompletas del CMS; las relaciones de los antecedentes sí conservan su función probatoria.

Los diagramas vectoriales están en el HTML inicial. Cada servicio recibe su dibujo y las definiciones necesarias, menos de 30 KB con gzip. El catálogo detallado del inspector se carga cuando se explora un equipo. Una respuesta tardía no restaura contenido después de navegar. Películas y animaciones dejan de consumir cuadros al salir de pantalla o esconderse la pestaña.

La medición HTTP local de la optimización anterior redujo Redes de 925.459 a 328.142 bytes de HTML (113.291 a 54.111 con gzip), e Incendio de 799.088 a 201.771 (99.676 a 40.811 con gzip). Son pesos del documento, no una promesa de velocidad en la conexión del visitante. No se redujo la resolución de las isometrías.

## Entrega y evidencia

Las ocho películas suman 48 archivos y 75.506.540 bytes en la biblioteca: edición 1920 × 1080, edición 1080 × 1080 y cuatro pósters por disciplina. Cada página selecciona la edición correspondiente; no descarga toda la biblioteca. Se verificaron formato, SHA-256, duración y encuadre de los 576 cuadros de cada película.

- Siete servicios: [ensamblado 37675998479](https://github.com/martinsantos/um25/actions/runs/37675998479), commit `fd44e194`.
- Software v2: [ensamblado 37690371762](https://github.com/martinsantos/um25/actions/runs/37690371762), commit `165a1b2b`.
- Código final: `npm run check`, 67 suites / 573 pruebas, lint, tipos, contrato CSS y build aprobados.
- Integración de siete películas: [37678895936](https://github.com/martinsantos/um25/actions/runs/37678895936), once rutas Chrome por perfil y 55 composiciones WebKit, sin hallazgos.
- Encuadre final: [37690846436](https://github.com/martinsantos/um25/actions/runs/37690846436), 90 combinaciones y reproducción completa de las ocho películas en WebKit móvil. **Aprobado, sin hallazgos.**
- Experiencia Software final: [37690850289](https://github.com/martinsantos/um25/actions/runs/37690850289), ambas rutas, escritorio/móvil y cinco anchos WebKit. **Aprobado, sin hallazgos.**

Una comparación nativa detectó reinicios anticipados con el atributo `loop` en el WebKit del runner. El reproductor v9 espera `ended` para reiniciar la misma película y conserva la pausa del usuario. La prueba de comportamiento comprueba que no salta antes del final; el control final de navegador verificó duración y repetición reales de las ocho películas sin hallazgos. Este hallazgo no se extrapola a todos los dispositivos Safari.

Las capturas se evalúan además por legibilidad, jerarquía, detalle y coherencia. Pasar pruebas funcionales no certifica perfección artística. Este cierre actualiza la preview y el PR #266 a develop; no despliega a producción.

Preview: `http://127.0.0.1:4326/`. Checkout estable: `/Users/santosma/Documents/Codex/um25-cine-integracion`. Evidencias: `/Volumes/SDTERA/Codex UM25 audits/20261007/`. El render pesado se ejecutó en GitHub Actions. La campaña protegida y los binarios del hilo UM SANS CLOUD no se modifican en este cierre.


## Control móvil refinado tras leer las capturas

La inspección visual del control de encuadre detectó que la pausa podía quedar junto a la barra fija inferior. El commit `62f5952e` la ubica en el área superior de la película, con un blanco táctil de 44 × 44 px. La [revisión 37693270159](https://github.com/martinsantos/um25/actions/runs/37693270159) verifica 54 composiciones Chrome/WebKit a 820, 390 y 360 px, incluyendo hit testing real: sin hallazgos. Las películas y su lógica de reproducción no cambiaron desde la revisión completa; no se repitió el render. `npm run check` aprobó otra vez 67 suites / 573 pruebas, lint, tipos, contrato CSS y build.
