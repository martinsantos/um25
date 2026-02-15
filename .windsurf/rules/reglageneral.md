---
trigger: always_on
---

1. Principio de Consulta Previa

NUNCA crear archivos nuevos ni realizar cambios irreversibles sin autorización explícita.

Siempre mostrar el plan de cambios y esperar confirmación antes de ejecutar.

En caso de duda, preguntar antes de actuar y buscar antes de crear.

2. Gestión de Documentación Técnica

Archivo principal: readme.md en la raíz del proyecto con:

- Resumen y descripción de la tarea/solución

- Arquitectura de desarrollo y servicios utilizados en dev y producción

Si existe otro documento técnico establecido, utilizarlo en su lugar.

Mantener la documentación actualizada con cada solución implementada.

3. Protocolo de Resolución de Bugs

Primero: Buscar en la documentación técnica existente.

Si no hay solución documentada: Desarrollar y probar la solución.

Una vez verificada, documentarla en el archivo técnico correspondiente.

Incluir en la documentación: descripción del problema, solución aplicada y pasos de verificación.

4. ECONOMIA DE TAREAS

Siempre, evalúa cómo economizar recursos de red, tokens, computacionales e AI.

No copies SIEMPRE todo el directorio completo frente a un cambio, evalúa los archivos modificados y copia sólo esos.

Reconstruye siempre paso a paso, no pruebes en la primera opción por lotes completos 

5. Verificación y Testing

Toda solución debe ser probada antes de considerarse válida. CADA TAREA DEBE SER TESTEADA Y DARLA POR SUPERADA CUANDO EFECTIVAMENTE SE COMPRUEBA CON UN TEST QUE EFECTIVAMENTE SEA ASÍ

CADA TAREA DEBE SER TESTEADA Y DARSE POR SUPERADA CUANDO EFECTIVAMENTE SE COMPRUEBA CON UN TEST QUE este superada de acuerdo a los objetivos de inicio.

Documentar los casos de prueba utilizados.

Reportar resultados de testing en la documentación.