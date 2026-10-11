# Software v25 · composición y película completa

## Objetivo

Conservar una operación reconocible —orden 0248, proyecto P-104— mientras se ven la interfaz, identidad y permisos, contrato de integración, persistencia y retorno al equipo. Comparar con el original de David Hill: variedad de controles, profundidad por planos, líneas jerarquizadas, transparencia selectiva y continuidad temporal.

## Cambios

- Directorio de equipo en un plano independiente bajo los permisos, con roles, avatares y estado.
- Seis conectores con símbolos propios: ERP, CRM, API, datos, eventos y cloud. Cada uno tiene forma, color, descripción y estado de conexión.
- Respuesta tipada 202 con la misma identidad 0248-A, separada del contrato.
- Índice de órdenes y comprobante con versión y procedencia, físicamente separados del registro.
- Encuadre ampliado sólo en los planos que incorporan contexto; trayectoria de cámara continua y eje cruzado conservados.
- Entradas y salidas escalonadas, coordinando tipografía, contornos y superficies.
- La ruta entre mecanismos se muestra durante el tránsito; se retira durante la lectura para no atravesar títulos.

El ejemplo es ilustrativo. Los símbolos de conectores son originales; no se afirman integraciones de clientes, topologías reales ni métricas de rendimiento.

## Estado de esta iteración

Fuente activa: `24cd19f2e1f906bce3e6cc1dc8c390bf71059eed`. Prueba nativa corregida: [38154880234](https://github.com/martinsantos/um25/actions/runs/38154880234). Render completo corregido en curso: [38155111568](https://github.com/martinsantos/um25/actions/runs/38155111568), 80 segmentos de 30 fotogramas, fuente idéntica a la prueba corregida. La primera secuencia completa se canceló al observar que el motor reaplicaba la visibilidad de la ruta. No se publicaron sus resultados.

Las pruebas geométricas recorrieron las 1.200 posiciones por composición: 252 combinaciones de texto/composición dentro del cuadro y ningún par de límites de texto superpuesto. 80 pruebas de integración y reproducción pasaron; typecheck correcto; lint sin errores, con 10 advertencias previas.

Pendiente: película completa corregida, decodificación, comparación temporal con Hill e inspección integrada de escritorio y móvil. Estos controles geométricos no certifican equivalencia visual.

## Protección

La selección depende de `UM_SOFTWARE_REVIEW=v25`. No cambia el registro de medios de producción. Blender se ejecuta sólo en GitHub Actions; los intermedios se guardan en `/Volumes/SDTERA/Codex UM25 audits/20261011/software-v25/`.
