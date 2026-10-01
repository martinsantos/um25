# Plantilla de correo, sin envío

`comunidades-email.html` conserva el texto institucional y el diseño blanco. `compose-email.mjs` asigna una foto A/B/C al generar cada HTML y registra la variante en un archivo `.assignment.json`. No hay JavaScript en el correo ni imagen que cambie al abrirlo.

Ejemplo de revisión local, con una observación tomada de una fuente oficial y revisada por una persona:

```sh
node docs/campaign-preview/compose-email.mjs \
  --variant a --segment cuotas \
  --context-line 'Vimos que en su sitio indican que el pago de la cuota puede requerir pedir un enlace y enviar un comprobante. ¿Les serviría revisar ese circuito en una demo?' \
  --output /tmp/email-piloto.html
```

Los segmentos admitidos son `general`, `cuotas`, `credencial`, `autonomia` y `descubrimiento`. Su destino es una sección de la misma landing. `utm_content` combina segmento y foto, sin nombre, email ni identificador de destinatario. El archivo de asignación es local y sirve para análisis posterior, si se autoriza el envío.

Por defecto las dos imágenes usan `cid:community-photo@ultimamilla` y `cid:credential-demo@ultimamilla`; el sistema de envío tendría que adjuntar el JPEG asignado y el GIF con esos Content ID. Para listmonk, usar `--image-mode hosted`: reutiliza `comunidad-reunion.jpg`, `oficio-panaderia.jpg` y `oficio-taller.jpg` de la landing, comprobados públicamente con HTTP 200 e `image/jpeg` el 1 de octubre de 2026, y apunta a `credencial-demo-email.gif`. **Ese GIF nuevo sólo está en esta rama; la URL pública dará 404 hasta que se revise y publique el asset por el flujo del sitio.** Su primer fotograma ya comunica credencial y validación cuando un lector no anima GIF. `compose-email.mjs` crea además una alternativa `.txt` con los mismos cuatro puntos. La firma `{{firma}}` queda por resolver antes de enviar. Ni listmonk ni un SMTP se configuran por este código.

`prepare-campaign-draft.mjs` prepara la variante listmonk con dos enlaces de clic, baja y un solo `TrackView` en HTML. La apertura es orientativa y no acredita lectura humana. El HTML de correo mantiene `UM Sans` como primera familia y Arial/Helvetica como alternativas; no se verificó su aspecto en bandejas Gmail/Outlook.

La cola de contactos, sus correos y notas editoriales se mantienen fuera del repositorio. Antes de componer un mensaje: verificar la fuente, el comprador, el contacto vigente, la supresión y si ya recibió otro correo. Ningún HTML de este directorio autoriza un envío.
