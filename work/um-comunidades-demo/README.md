# Última Milla · Comunidad profesional

Demo portable para integración en Última Milla. No procesa cobros reales, no envía solicitudes reales y no acredita identidad ni habilitación profesional. Los perfiles iniciales son ficticios; example.test es un dominio de prueba.

## Desarrollo e integración

Requiere Node 20 o posterior. `npm ci`, `UM_BASE_PATH=/software/gestion-de-comunidades-profesionales/demo/ npm run build`. El resultado portable es `dist/`, servido por cualquier servidor estático HTTPS. El código de negocio está en `src/domain.mjs`, la interfaz React en `src/app.jsx` y el importador aislado en `src/import-worker.mjs`. `npm test` ejecuta pruebas focalizadas. No incluye configuración de Sites ni credenciales. Ver INTEGRACION-UMSA.md para configurar la base.

No se modificó ultimamilla.com.ar, su código ni infraestructura. No usa APIs de IA ni servicios pagos añadidos. Esta demo no promete costos de plataforma nulos.

## Datos y privacidad

Procesamiento de Excel/CSV en un Web Worker local, sin subidas ni telemetría de app. La variante portable usa sessionStorage por pestaña con la clave `um-comunidades-demo:v1:<base>`. El modo localStorage es opcional en build y no está activado en el paquete entregado. El botón reiniciar elimina únicamente esa clave y repone datos de demostración. Si el almacenamiento falla, la app sigue en memoria y muestra un aviso. Matriculado y administración comparten registros dentro de la misma pestaña. Las pestañas abiertas independientemente tienen sesiones separadas. Recargar conserva registros; cerrar normalmente termina la sesión, pero el navegador puede restaurarla. En dispositivos compartidos usar Reiniciar demo. No hay autenticación de roles dentro de la demo. El paquete no aporta autenticación: para difusión, alojarlo como una demo estática independiente sin datos reales. El Site privado previo no se modifica.

Importación .xlsx: ExcelJS 4.4.0. CSV: Papa Parse. Límites: archivo 3 MB, 25 MB de ZIP expandido declarados, 2.000 filas, 30 columnas, 10 hojas, 500 caracteres por celda, worker cancelable con límite de 20 segundos. Se rechazan archivos cifrados, macros, vínculos externos y fórmulas; no se ejecutan fórmulas. Cabecera en primera fila, selector de hoja, mapeo y revisión explícita. Las filas inválidas se excluyen, las válidas sólo se incorporan tras aceptación. Duplicados de matrícula/correo detectados contra registros existentes y filas válidas previas. Fechas dd/mm/aaaa o ISO y serial Excel. Importe argentino, sin negativos ni más de 2 decimales. CSV UTF-8. Exportaciones CSV neutralizan prefijos de fórmula.

La credencial se descarga como texto local y no transmite datos mediante URL. El estado de cuota y el estado/vigencia de matrícula son independientes. Un pago no habilita la matrícula. La demo muestra el estado de matrícula declarado; no certifica ni consulta vigencia en fuentes institucionales.

## Modo app

Manifest con íconos PNG 192/512 y display standalone. El botón instalar aparece sólo si el navegador lo ofrece. Service worker desactivado por defecto; puede habilitarse explícitamente bajo la subruta, sin fetch handler ni caché. No publicada en tiendas. La instalación depende del navegador y de HTTPS; no se promete disponibilidad sin conexión.

## Identidad

UM Sans pública de Última Milla, obtenida para esta demo autorizada desde https://www.ultimamilla.com.ar/fonts/um-sans/UMSans-Variable.woff2?v=1.2.0-production. Fallback Arial/system-ui. Paleta del CSS público de la página de gestión de comunidades: #182120, #172523, #bd352d. No se afirma licencia general de redistribución de UM Sans fuera de este proyecto autorizado; verificar licencia antes de su redistribución externa. Inspiración conceptual solicitada en gestión de comunidades; no se utilizó código, datos ni marca del Colegio de Psicólogos.

## Antes de producción

Integrar autenticación y autorización real, backend auditado, validación del servidor, fuente institucional de matrícula, accesibilidad completa, políticas de conservación y consentimiento, backups y pruebas de seguridad. Si se agrega pasarela, requerirá contrato e integración independiente. El estado local de esta demo no es una base de datos institucional.

## Ampliación: QR, ficha, planes y beneficios

La cuenta usa un libro de cuotas en centavos enteros (`src/finance.mjs`). La versión financiera 2 migra automáticamente el estado local anterior conservando saldos, movimientos, matriculados importados, trámites y consultas. El namespace sigue versionado y añade la base de despliegue. No se migran datos del dominio privado ni de otra subruta. La ficha administrativa muestra identidad local, cuotas, todos los pagos, planes con progreso e historial, beneficios, trámites y consultas.

Planes de demostración: selección de cuotas originales pendientes, 2/3/6 cuotas mensuales, primer vencimiento entre hoy y 90 días, sin interés ni cargos. La simulación no cambia datos. Al aceptar, las cuotas originales quedan refinanciadas con vínculo al plan y saldo exigible cero; el saldo restante se reparte exactamente entre las nuevas cuotas. Diferencias de centavos van a las primeras cuotas. Los vencimientos respetan fin de mes. Los pagos pueden ser parciales para una cuota o completos para varias; no superan el saldo ni admiten importes no positivos. Identificadores de operación evitan duplicados por doble clic y reintentos. Las vistas previas se revalidan al confirmar.

Promociones ficticias: un beneficio por perfil, no acumulable. Sólo cuotas originales pendientes, sin pagos previos ni refinanciación. El mínimo, período, porcentaje y requisitos están visibles; hay ejemplos vigente, importado-only y vencido. Aplicar requiere revisar importe original, descuento y total final; registra el beneficio y su vínculo a cada cuota. Nunca altera cuotas pagadas. Estas condiciones no son ofertas comerciales ni financiación real.

El QR se genera con qrcode y fue decodificado en QA. Su contenido es texto genérico de demostración: no contiene nombre, matrícula, correo, IDs de perfiles ni URL. Muestra su contenido exacto antes de descargar y advierte que no valida identidad ni vigencia. Puede escanearse en otro dispositivo como texto sin depender del acceso privado al Site. La credencial sigue siendo una demo sin validez institucional.

Verificación de ampliación: 14 pruebas unitarias (incluidas regresiones) y recorridos automatizados de navegador para QR decodificado, ficha, plan cancelado/aceptado, doble clic, centavos, pago parcial/sobrepago/final, deuda no duplicada, promoción cancelada/vencida/inelegible/no acumulable, Excel, persistencia y móvil de 320/390 px. La matrícula nunca cambia como efecto de operaciones financieras.

## Ampliación: medios de pago, abono, documentación e informes

Los pagos admiten tarjeta ficticia, QR no pagable y abono mensual de demostración. La plataforma seleccionada se registra en el movimiento y comprobante local. Mercado Pago y Payway figuran sólo como adaptadores pendientes: no hay claves, conexión, checkout, tokenización ni cobros. No se piden datos de tarjeta ni CVV. El único vínculo externo de esa pantalla es la documentación oficial informativa de Mercado Pago; no se abre durante una simulación.

El QR de credencial se simplificó a `UM DEMO`, con módulos cuadrados sólidos, alto contraste, corrección H y quiet zone de cuatro módulos. Se genera a 232 px y muestra a 145 px (cinco píxeles por módulo), sin interpolación. Se verifica la decodificación del tamaño renderizado. El QR de pago contiene únicamente `UM DEMO SIN COBRO`.

El abono registra el primer pago simulado, importe mensual de referencia y próximo vencimiento. No crea cargos ni cobros automáticos. El centro de avisos interno permite cambiar una fecha de prueba, ver avisos siete días antes o después del vencimiento y marcarlos leídos. Preparar una renovación es una acción explícita; la cuota se genera una sola vez por período. Su pago completo avanza el próximo vencimiento; pagar parcialmente no lo avanza. El abono administrativo, saldo y vigencia legal de matrícula permanecen separados. No hay email, WhatsApp, push, permisos de notificaciones ni tareas programadas.

Documentación: PDF, PNG o JPG ficticios/anonimizados, hasta 5 MiB por archivo, 20 MiB temporales por sesión. Extensión, MIME, firma mágica, tamaño y decodificación se validan. SVG/HTML no admitidos. Imágenes limitadas a 24 MP y 8.000 px por lado; PDF hasta 25 páginas con preview sólo de la primera en canvas mediante PDF.js. Se deshabilita evaluación de código y XFA; no se montan enlaces, formularios ni scripts del PDF. La vista se rasteriza. Sólo metadatos e historial se guardan en el almacenamiento de sesión; archivo y previsualización quedan en memoria de la pestaña y se pierden al recargar. La interfaz avisa y bloquea revisión sin archivo. Volver a adjuntar genera nueva versión e invalida la decisión anterior. Admin puede aprobar/rechazar con observación y responsable ficticio; ninguna decisión certifica autenticidad o habilitación profesional.

Informes técnicos: contenido ficticio, identificador y versiones. Elena Méndez / RESP-DEMO-01 es una responsable inventada. “Aprobar y firmar demo” guarda responsable, fecha y versión concreta como constancia visual; no genera firma digital certificada ni sello. Editar el informe invalida la aprobación de la versión anterior, que permanece trazada. La descarga HTML local escapa todo el texto e indica “DEMOSTRACIÓN — sin validez legal”; incorpora marca repetida al imprimir. El archivo no incluye scripts, biometría ni firma real.
