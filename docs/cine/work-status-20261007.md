# Continuidad activa · 8 de octubre de 2026

Rama `feature/isometric-redes-review`, PR #266 (draft), checkout `/Users/santosma/Documents/Codex/um25-cine-integracion`. Preview `http://127.0.0.1:4326/`, compilada hasta `512e78a9`. No editar el checkout principal ni desplegar. PID propio en `/private/tmp/um-eight-preview.pid`: verificar proceso y cwd antes de reiniciar.

## Resultado integrado

- **Software v4:** 1.440 cuadros 4K/60, seis assets, 58.415.732 bytes. Auditoría `37712634510`: 20 composiciones, color y repetición en Chrome/WebKit, sin hallazgos.
- **Incendio v2:** render `37716425530`, fuente `83cae61f`, importado en `d17d8c4c`. 1.440 cuadros distintos, 24 s, seis assets, 51.136.539 bytes. Auditoría integrada final `37719560859` sobre `512e78a9`: 10 layouts y dos ciclos autónomos con siete estados isométricos cada uno; cero hallazgos. Evidencia local `/private/tmp/um-fire-final-audit-37719560859/`.
- **Isometría de Incendio:** central de 576 piezas, 33 geometrías compartidas y 14.391 bytes gzip. Puerta de 102°, electrónica posterior, conductores unidos, detector separable y baterías dentro del gabinete. Se corrigieron namespaces SVG al embeber, etiquetas superpuestas, encuadres móviles y dos cámaras que competían. El script `precision-systems-v6.js` reserva su cámara exterior sólo a Software.
- **Cinco cámaras restantes:** Telecomunicaciones, Seguridad, Soporte, Consultoría y Energía incluyen el volumen cerrado y abierto al encuadrar. `37719182601`, fuente `86327d20`: Chrome/WebKit × escritorio/móvil, 140 estados y 20 vistas con movimiento reducido; cero hallazgos y errores. Evidencia `/private/tmp/um-camera-final-37719182601/`.
- `351ebb2d`/`021ecbbf` atenúan las piezas no activas durante una explicación, manteniendo opaco el mecanismo actual. Esa mejora visual aún requiere capturas posteriores; no está en la preview compilada.

Último `npm run check` completo (`86327d20`): 70 suites / 586 pruebas, lint, tipos, CSS y build correctos. `512e78a9` recompiló y comprobó la corrección de máscara del banner de Incendio. Diez advertencias previas de lint.

## Trabajo activo: película de Redes v2

Modelo propio de rack de 19 pulgadas, 24 puertos RJ45 con contactos, 12 adaptadores ópticos, placa del switch, organizadores, latiguillos, bandejas y radio con PCB circular, blindajes, antenas y componentes. Recorrido continuo: instalación, gabinete, switch, radio y regreso. 24 s, 1.440 cuadros nativos.

Prueba `37719886220`: plano general y rack útiles, radio rechazada por su placa demasiado vacía. `37720542508` corrige la electrónica y el espacio de la tapa del switch; se revisaron sus dos PNG. La radio todavía mostraba un perfil duro, ranuras triangulares y un cable dominante. Se corrigen carcasa formada continua, ranuras estrechas en la zona cilíndrica y funda neutra con pulso rojo de señal. Nueva prueba pendiente. **No habilitar render completo antes de inspeccionarla.**

Pipeline genérico de ensamblado/importación preparado para `fire-project-v2` y `network-project-v2`: valida hashes, 1.440 cuadros, 60 fps, color explícito, continuidad y mismo código fuente en los doce fragmentos. La película antigua de Redes sigue registrada hasta aprobar e importar la nueva. Las otras cinco películas de servicio conservan el acabado v1.

## Límites de la revisión

Los runs `37716790081`, `37718185751` y `37718704585` detectaron defectos corregidos posteriormente; no son aprobaciones visuales. La revisión del navegador local está bloqueada por política; los controles reales se ejecutan en runners remotos descartables. WebKit Linux no equivale a un iPhone físico.

La home conserva su película. Arriba Blender, abajo explicación isométrica autónoma. Campaña y binarios UM Sans protegidos. Render pesado sólo remoto. Evidencias durables bajo `/Volumes/SDTERA/Codex UM25 audits/20261007/`. Los controles funcionales no demuestran paridad artística con Ryan, Solvaix o David Hill. **No hay GO de producción.**

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
