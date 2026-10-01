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

Por defecto la imagen se referencia como `cid:community-photo@ultimamilla`: el sistema de envío debe adjuntar exactamente el JPEG asignado con ese Content ID. El modo `--image-mode hosted` requiere que las imágenes `email-a-wide.jpg`, `email-b-wide.jpg` y `email-c-wide.jpg` estén efectivamente publicadas en el dominio; **aún no lo están**. La firma `{{firma}}` también queda por resolver antes de enviar. Ni listmonk ni un SMTP se configuran por este código.

La cola de contactos, sus correos y notas editoriales se mantienen fuera del repositorio. Antes de componer un mensaje: verificar la fuente, el comprador, el contacto vigente, la supresión y si ya recibió otro correo. Ningún HTML de este directorio autoriza un envío.
