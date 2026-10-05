# DGE · integración Astro, sin publicación

Refinamiento posterior, 2026-10-05: paquete revisado con lenguaje institucional, formularios definidos y consulta documental mediante miniaturas, páginas y ampliación. Cuatro PDFs completamente sintéticos, seis páginas; la consulta no cambia evaluación ni bono. No hay carga de archivos reales. Originales y capturas permanecen bajo el handler autenticado, no-store, sin visor externo ni iframe. El control de paquete privado compara también hashes PDF/PNG para detectar filtración al bundle público.

Revalidación local: build React y 24/24 tests de origen; adaptador 3/3; fixture Astro reconstruido y smoke HTTP correcto para HTML/JS/PDF/páginas/miniaturas, bloqueo anónimo y bypass público inexistente. Evidencias en Licitómetro: qa/astro-preview-documents-smoke.json, qa/astro-preview-documents-tests.log, qa/tests-formal-preview-final.log, qa/preview-responsive.json y capturas 21–25. IAB verificó consulta/zoom/Escape/versiones y corrección→validación→bono v2, sin errores de consola. No es build ni regresión integral de UM25. Se preservaron assets previos como referencia; index.html usa únicamente los hashes del build actual. El PR sigue borrador, sin merge ni despliegue.

2026-10-05. Rama feature/dge-demo-protegida-20261005 desde develop e3f654c1. No se copió el worktree ni el PR #266 de UMSA. No se modificaron home, landing, GIF, Nginx, CMS ni datos productivos.

Se separó el handler de autenticación del ejecutable local y se adaptó a Request/Response. Se construyó un fixture aislado con Astro 5.16.15 y el adaptador Node instalado en el proyecto corporativo, sin instalaciones ni escrituras en sus dependencias. Caches del fixture están en carpetas propias. El bundle revisado se empaquetó en dist/server/dge-private; dist/client quedó sin payload de DGE.

Prueba HTTP del build en http://127.0.0.1:8874/ofertas/dge/: anónimo redirigido a login para HTML/JS; ruta pública alternativa inexistente; clave incorrecta 401; Origin no autorizado 403; login correcto 303 con cookie protegida; documento y módulo autenticados 200; cookie falsificada y revocada bloqueadas. No se afirmó esperar ocho horas: la caducidad real se valida con reloj controlado en tests del handler.

Prueba IAB: login incorrecto/correcto, pantalla inicial completa, acciones de la demo y logout. El diseño no se cambió. El servidor standalone local y la demo que estaba probando el dueño se preservaron.

Tests de adaptador Request/Response pasan. Suite de origen en Licitómetro conserva los tests de modelo, auth HTTP y Sites, más los del adaptador. El fixture no equivale al build integral de UM25 ni a sus pruebas de regresión: el PR queda draft hasta que eso y la configuración de CI/staging/origen estén completos.

Workflow preparado: paquete privado y tests; paths DGE explícitos en whitelist; gate de disco >90% y configuración privada antes de la poda existente. No se ejecutó el workflow ni la poda. Pendiente conectar el smoke completo antes/durante swap y en edge, provisionar credenciales por CI fuera de Git y comprobar build/lint/regresión del sitio completo. No aprobar ni mergear a master con esos pendientes o con el host al 95%.
