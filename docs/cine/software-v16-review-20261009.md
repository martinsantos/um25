# Software v16 · descartada por defecto de transparencia

## Alcance

Refinamiento del render de Software, compartido por `/software` y el servicio 104. La selección requiere `UM_SOFTWARE_REVIEW=v16`; el registro de producción no cambia. La isometría existente se conserva.

## Cambios visuales

- Identidad, rol y alcance se separan en tres superficies a distinta profundidad. Las conexiones enlazan físicamente las condiciones y salen hacia la misma solicitud.
- Los campos de origen se elevan sobre el contrato; los de destino quedan detrás. Cada pulso cruza el canal entre ambas profundidades antes de aparecer la comprobación.
- El registro tiene hojas posteriores distinguibles, con la encuadernación abierta para que sus bordes no atraviesen la columna de lectura.
- La cámara se acerca a permisos y contrato. Las líneas secundarias y los puntos de esquina son más finos; se conserva una jerarquía entre contorno, estructura y señal.
- La secuencia conserva 20 segundos y 60 fotogramas nativos por segundo, con composiciones separadas de escritorio y móvil.

## Revisión y correcciones

1. Pruebas 37992622235: detectado contacto entre el título de acceso y el primer borde; marcas posteriores atravesaban texto y dos apoyos del contrato parecían conectores sueltos.
2. Pruebas 37993057952: el título se lleva al plano de las superficies elevadas y los apoyos sueltos se eliminan. Se detectan bordes verticales traseros que todavía atravesaban la columna izquierda del registro.
3. Pruebas 37993327356: la encuadernación abierta despeja esa columna. Se conserva el espesor mediante los bordes superior, inferior y lateral derecho.
4. Fragmento 37992625762: falló la codificación por ausencia de `ffmpeg`, no la generación de geometría. Se restauró la dependencia y se incorporó una comprobación antes de Blender. La repetición 37993176868 produjo 24 fotogramas nativos a 60 fps.
5. Secuencia completa 37993585731: autor congelado en `ff8d6d8c`. Los fragmentos se ensamblan sólo si coinciden los hashes del autor y sus dos dependencias geométricas.

## Criterio comparativo

Se usa el original de David Hill para composición, contornos, transparencia y POV; la referencia conserva mayor densidad funcional y variedad de detalle. V16 corrige interferencias y agrega profundidad en los mecanismos. Estos cambios no bastan para declarar equivalencia estética ni aprobación de producción.

El fragmento corto permite revisar el relevo, pero no acredita por sí solo la fluidez del bucle completo. La aceptación local exige revisar la secuencia ensamblada, sus transiciones y la página en escritorio y móvil.

## Comprobaciones realizadas

- Validador del autor: correcto; 1200 posiciones de cámara, continuidad del bucle y separación temporal de tipografías.
- Auditoría geométrica del encuadre: avances reales de UM Sans, proyección perspectiva y 1200 posiciones por composición. Las 96 combinaciones de texto/composición plenamente visibles permanecen dentro del cuadro; no evalúa por sí sola oclusiones ni calidad estética.
- 72 pruebas relevantes: correctas.
- Typecheck: correcto.
- Build con `UM_SOFTWARE_REVIEW=v16`: correcto.
- Descartada para integración: al reproducir el tramo continuo, el fotograma 492 mostró pérdida de textos del contrato por orden de transparencia. Se canceló la secuencia 37993585731 y se conservaron los fragmentos como evidencia. La preview continuó con v15.
- V17 verifica la corrección del origen de cada superficie transparente antes de generar una secuencia nueva.
