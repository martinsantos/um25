# Continuidad activa · revisión de precisión

Actualizado después del cierre histórico de v2. Candidato de interfaz `fcb8c0e9`, PR #266 (draft), checkout `/Users/santosma/Documents/Codex/um25-cine-integracion` y preview `http://127.0.0.1:4326/`.

La comparación con las referencias rechazó el acabado anterior. Se reconstruyeron Redes y Software, se refinaron las otras seis disciplinas y sus interfaces, se corrigieron contexto, ritmo y acercamiento móvil y se retiró el catálogo antiguo del recorrido nuevo. Ver [revisión de precisión](precision-review-20261007.md) para cambios, evidencia y resultados pendientes. La película v3 de Software está en prueba remota; v2 sigue integrada. No tratar el cierre funcional anterior como aprobación visual o GO a producción.

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
