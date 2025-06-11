# Solución al Problema de Autenticación en Directus

## Problema
El sitio en producción (http://23.105.176.45:8080/antecedentes) mostraba un error de autenticación:
```
Error: Autenticación fallida: Token inválido o expirado (401)
```

## Causa
La causa del problema era que el token estático configurado en el entorno de producción no coincidía con el token almacenado en la base de datos de Directus.

## Solución
1. Se utilizó el mismo token estático que funciona en el entorno local (`k6P8LAY8_x_y1miB_KTlWnysCnx2Abky`).
2. Se actualizó la configuración en todos los lugares necesarios:
   - Archivo `.env` en el servidor
   - Archivo `.env.js` en el directorio `dist`
   - Base de datos de Directus (tabla `directus_users`)
   - Configuración de Docker Compose

3. Se configuró Directus para permitir acceso público a los recursos necesarios:
   - Se habilitó `PUBLIC_ASSETS=true`
   - Se configuró `ASSETS_TRANSFORM_TOKEN_OPTIONAL=true`
   - Se añadieron permisos para el rol público en la base de datos

4. Se reiniciaron los contenedores para aplicar los cambios.

## Verificación
Después de aplicar estos cambios, la página de antecedentes carga correctamente sin errores de autenticación.

## Notas Importantes
- El token estático debe ser el mismo en todos los lugares donde se configura.
- Es importante que el rol público tenga permisos de lectura para las colecciones `directus_files`, `Antecedentes` y `Antecedentes_files`.
- Si se cambia el token en el futuro, debe actualizarse en todos los lugares mencionados.

## Solución al Error de Sintaxis en Astro
Después de corregir el problema de autenticación, se encontró un error de sintaxis en el archivo `entry.mjs` del servidor Astro:
```
SyntaxError: Unexpected strict mode reserved word
  client: astro/client/static
                     ^^^^^^
```

### Solución
1. Se corrigió la línea problemática cambiando `astro/client/static` por `astro/client/index.js`.
2. Se reinició el contenedor de Astro para aplicar los cambios.

Esta corrección permitió que el servidor Astro iniciara correctamente y sirviera las páginas sin errores.

## Solución Alternativa al Error de Sintaxis en Astro
Después de detectar problemas con el archivo `entry.mjs` del servidor Astro, se implementó una solución alternativa:

1. Se creó un nuevo archivo `server.js` con una configuración básica de servidor Node.js.
2. Se modificó el comando de inicio en el docker-compose para usar este nuevo archivo.
3. Se reiniciaron los contenedores para aplicar los cambios.

Esta solución alternativa permite que el servidor Astro funcione correctamente sin depender del archivo `entry.mjs` problemático.
