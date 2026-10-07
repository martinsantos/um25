# Instalación continua · 6 de octubre de 2026

> Actualización: [Continuidad operativa](causal-operation-20261006.md) incorpora un incidente persistente y consecuencias propias de cada sistema. Este documento conserva la evidencia de la etapa anterior.

Esta iteración sustituye en la home el trámite de mantenimiento de 48 segundos por una puesta en marcha ilustrativa de 64 segundos. La explicación principal recorre los ocho servicios sin clics. El gabinete, los puestos, la cámara, el detector, la central, la UPS y la consola permanecen instalados en una planta isométrica común.

## Relación entre dibujo y explicación

| Etapa | Acción visible | Alcance explicado |
| --- | --- | --- |
| Proyecto | Vista del conjunto instalado | Relevamiento, dependencias y cargas críticas |
| Red | Conexión del puesto al gabinete; apertura de su puerta | Cableado, patch panel, switch y sistemas |
| Video | Campo de cobertura y señal hasta la consola | Cámara, transporte y supervisión |
| Detección | Señal del detector hasta su central | Circuito independiente y ensayo de puesta en marcha |
| Respaldo | Alimentación de entrada interrumpida; salida desde la UPS al gabinete | Continuidad de las cargas dimensionadas |
| Software | Registro de tarea en la consola | Integración configurada, estado y responsable |
| Soporte | Recorrido de diagnóstico hacia el gabinete | Intervención y documentación |
| Enlace | Comunicación al segundo extremo; conjunto de recorridos | Integración de sitios y sistemas |

Son ejemplos explicativos, no telemetría real ni una promesa de integración automática entre cualquier dispositivo. El texto no atribuye autonomía ilimitada a la UPS ni confunde la red de datos con el circuito de detección.

## Continuidad en servicios y sectores

El controlador compartido conserva el proyecto durante las tres etapas automáticas. La etapa central encuadra el recorrido mediante las coordenadas de sus extremos; las etiquetas se sitúan sobre la instalación. Se corrigió la dirección de la señal de redes para ir del puesto al gabinete. La exploración manual conserva piezas, interiores y detalles.

En la home, la segunda explicación completa queda dentro de «Explorar cada servicio y el interior de sus equipos». La historia principal ya cubre los ocho servicios y no requiere abrir ese panel. Esto evita repetir dos recorridos completos uno detrás de otro.

## Implementación y recursos

- `build-request-operation-v2.py` produce el SVG y sus coordenadas desde la misma proyección de 30 grados. Reutiliza el gabinete y el puesto propios.
- SVG: 392.972 bytes; 37.296 bytes al comprimirlo con gzip en la medición local. No es una medición de transferencia del servidor.
- El controlador pausa fuera de pantalla, con la pestaña oculta y por elección explícita. Movimiento reducido comienza detenido con explicación textual completa disponible.
- La cámara móvil interpola los encuadres sin saltos entre etapas. No se incorporaron dependencias de 3D ni imágenes rasterizadas para sustituir detalle.
- Los nuevos archivos públicos tienen nombres versionados compatibles con el overlay de despliegue.

## Validación

`npm run check`: lint, tipos, auditoría CSS, 66 suites / 517 pruebas y build correctos. Las pruebas cubren recorrido completo, continuidad de cámara, pausa, pestaña oculta, salida de viewport y movimiento reducido. Las regresiones del atlas compartido comprueban que persiste la misma geometría a través de todos los servicios.

Revisión visual terminada en builds aislados de GitHub Actions:
- [37552091949](https://github.com/martinsantos/um25/actions/runs/37552091949): primer pase de home, Chrome escritorio/móvil y 20 combinaciones de WebKit; commit `4386b412`. Cero hallazgos funcionales. La inspección de imágenes motivó las correcciones siguientes.
- [37552260021](https://github.com/martinsantos/um25/actions/runs/37552260021): 20 rutas en Chrome escritorio y móvil; commit `dcfe5b35`. Todas respondieron HTTP 200, sin errores de ejecución ni hallazgos de la auditoría. Reproducción nativa comprobada en las 20 rutas y secuencias autónomas completas.
- [37552981855](https://github.com/martinsantos/um25/actions/runs/37552981855): home final, Chrome escritorio/móvil, capturas a 1440/1280/834/390/360 y 20 combinaciones de WebKit (cuatro rutas por cinco anchos); commit `1ded54bc`. Cero hallazgos funcionales. Las ocho etapas se completan sin entrada del usuario. WebKit Linux no equivale a una prueba en un Safari físico.

Se revisaron imágenes de las 20 rutas, las ocho etapas de la home y fotogramas de la grabación móvil una vez estabilizado el paneo. Se corrigieron la superposición inicial de la anotación con la cámara, los rótulos pequeños en móvil y los recorridos que atravesaban el espacio en diagonal. La proyección verifica que cada segmento siga un único eje físico.

Después de las capturas de `1ded54bc`, se ocultaron los rótulos generales de planta durante el acercamiento para evitar fragmentos de texto en los bordes. Es un cambio CSS acotado; el `npm run check` final, incluido el build y las 517 pruebas, se ejecutó también con esa corrección. No se repitió la matriz completa de navegadores por esa regla aislada.

La evidencia local queda en `continuous-installation-20261006/` dentro del directorio de visualizaciones del hilo: informes, capturas de cada etapa y grabaciones nativas de escritorio y móvil.

## Límites de esta entrega

La película grande de Blender y las películas sectoriales existentes se conservan. No se renderizaron películas nuevas en esta iteración. No se modificaron producción, campaña protegida, datos del CMS ni tipografía global. La validación técnica y visual descrita no declara perfección artística ni autorización de despliegue.
