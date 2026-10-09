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
- Secuencia completa: run 37923814181; verificar su conclusión y su entrega antes de integrar.
- 33 pruebas de recorrido, pausa, reanudación, selección aislada de preview y estados de software pasaron.
- ESLint, typecheck y build pasaron para el código de integración y la nueva isometría.
- Selección de candidato: `UM_SOFTWARE_REVIEW=v10`. Registro de producción sin promoción.

La revisión final de los 720 cuadros de cada composición y de la reproducción integrada se registra al concluir el render. No se hizo despliegue a producción.
