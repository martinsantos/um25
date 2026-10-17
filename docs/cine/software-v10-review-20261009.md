# Software v10 · revisión del 9 de octubre de 2026

## Cambio concreto

Una orden del producto reúne proyecto, responsable y alcance. El control de aprobación se separa conservando su registro espacial; una superficie translúcida permite ver la comunicación Identidad → Permisos → Datos → Auditoría. Las reglas aparecen debajo y se validan en secuencia. La aprobación se registra y vuelve a la misma orden.

La cámara móvil se renderiza por separado, en formato cuadrado. La entrega de escritorio conserva 4K nativo a 60 fps; se usaron cuadros 5K para inspeccionar tipografía, bordes y superposiciones. Ninguno de estos datos acredita por sí solo calidad artística.

La isometría inferior sigue la misma orden 0248. Sus membranas incorporan datos de identidad, permiso y alcance, con márgenes translúcidos y soportes opacos para las letras. El controlador existente conserva avance automático, pausa, reanudación, reducción de movimiento y suspensión fuera de pantalla. Los assets anteriores se conservan.

## Descartes y correcciones internas

- Primer render transparente: el bus se confundía con líneas de interfaz; se incorporaron nombres de servicios y un soporte detrás del vidrio.
- Nombres bajo los soportes de texto: se recolocaron en la franja visible, conservando el plano inferior.
- Reglas verdes antes de terminar la comprobación: color y resultado ahora siguen el estado real de cada condición.
- Transparencia completa en las hojas isométricas: mezclaba letras de distintas hojas. Se conserva en márgenes y canales; los campos de texto son opacos.
- Render directo EEVEE 5K: el cuadro de inspección requirió 214,20 segundos. Se descartó para la secuencia; tres pasadas Blender y composición en luz lineal conservaron el efecto en unos 29 segundos por cuadro 5K. No se ejecutó Blender en el Mac.

## Comparación de resultados

Referencias: [Hill](https://x.com/iamdavidhill/status/2107616166713655476), [Ryan](https://x.com/wheresryan22/status/2106439475551154186), [Solvaix](https://x.com/Solvaix/status/2106830508797706560). Se inspeccionaron los originales locales conservados y los cuadros nativos del candidato.

V10 añade profundidad registrada, transparencia y una relación causal que v9 apenas mostraba. Las letras mantienen sus proporciones y los planos tienen poco espesor. No corresponde declarar equivalencia con las tres referencias: el detalle del conjunto isométrico sigue siendo más esquemático que Ryan y esta escena de software no valida las películas de sectores contra Solvaix. El criterio de rechazo permanece vigente; no se convierte una mejora respecto de v9 en una afirmación de paridad.

## Evidencia y entrega

- Cuadros nativos iniciales: run 37922361840.
- Comparación de pasadas y movimiento consecutivo: run 37923020997.
- Secuencia: run 37923814181 produjo 46 fragmentos; dos fallaron instalando dependencias. Recuperación 37925201295 exitosa para wide:5 y wide:6.
- Ensamblado 37949889021 exitoso: verificó las 48 partes, hashes de escena/compositor/geometría/fuentes, cobertura exacta y decodificación completa.
- 33 pruebas de recorrido, pausa, reanudación, selección aislada de preview y estados de software pasaron.
- ESLint, typecheck y build pasaron para el código de integración y la nueva isometría.
- Selección de candidato: `UM_SOFTWARE_REVIEW=v10`. Registro de producción sin promoción.

## Revisión integrada final

- Entrega importada mediante `import-software-v10-candidate.mjs`, con manifiesto SHA256 verificado. 720 cuadros / 12 segundos en cada composición; escritorio 3840 × 2160 y móvil 2160 × 2160.
- Build final y 33 pruebas pasaron. Preview reiniciada con `UM_SOFTWARE_REVIEW=v10` en `http://127.0.0.1:4326/software`.
- Navegador nativo: fuentes v10 confirmadas, ciclo completo de 0 a 12 segundos reproducido sin clics en ambos tamaños y reproducción del siguiente ciclo. Sin errores de consola observados. Móvil sin desborde horizontal.
- Cuadros revisados visualmente: inicio, separación a 4 segundos, composición móvil a 5,5 segundos, retorno y cierre. La validación de todos los cuadros es técnica; no equivale a inspección visual individual de 1.440 imágenes.
- Isometría inferior: soporte opaco continuo bajo los campos de reglas, para evitar interferencia de letras entre hojas; márgenes y canales conservan transparencia. Avance autónomo observado dentro de la página.
- Evidencia local: `/Volumes/SDTERA/Codex UM25 audits/20261009/software-v10/delivery`; capturas integradas en el directorio `screenshots` hermano.

### Diferencias que todavía impiden declarar paridad

La película conserva menos variedad de planos y detalle contextual que Hill. La comunicación ahora es visible pero sigue concentrada en una franja; no constituye todavía una arquitectura completa de servicios. El reinicio del bucle vuelve de una orden aprobada a una pendiente: la cámara cierra en el mismo encuadre, pero el estado de la interfaz cambia. Las isometrías siguen usando volúmenes simplificados frente a Ryan y el texto dentro del render es pequeño en móvil; la explicación exterior sostiene su lectura. Esta entrega mejora el candidato visible, pero no satisface todavía la exigencia de calidad indistinguible.

No se hizo despliegue a producción.
