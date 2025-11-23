# Instrucciones para Solucionar Problemas de Autenticación en Astro + Directus

Este documento proporciona instrucciones detalladas para solucionar los problemas de autenticación en el sitio de producción (http://23.105.176.45:8080).

## Problema Identificado

El sitio en producción muestra errores de autenticación en las páginas que dependen de Directus:
- Error en http://23.105.176.45:8080/antecedentes: "**Error: **Autenticación fallida: Token inválido o expirado (401)"
- Error en http://23.105.176.45:8080/servicios: "**Error: **Autenticación fallida: Token inválido o expirado (401)"

La causa principal es la discrepancia entre el token estático configurado en los archivos de entorno y el token almacenado en la base de datos de Directus.

## Solución Paso a Paso

### 1. Actualizar Archivos de Configuración

#### 1.1. Actualizar `.env.prod`

El archivo `.env.prod` ha sido actualizado con las siguientes correcciones:
- Se ha establecido `PUBLIC_DIRECTUS_TOKEN` y `DIRECTUS_STATIC_TOKEN` al valor correcto: `k6P8LAY8_x_y1miB_KTlWnysCnx2Abky`
- Se ha actualizado la URL del sitio a `http://23.105.176.45:8080`
- Se ha añadido `ASSETS_TRANSFORM_TOKEN_OPTIONAL=true`
- Se ha especificado el ID del rol público: `PUBLIC_ROLE=74e3b05e-0f14-422e-9ad3-759d426db60a`
- Se han ajustado las configuraciones de caché para evitar problemas de rendimiento

#### 1.2. Actualizar `docker-compose.production.yml`

El archivo `docker-compose.production.yml` ha sido actualizado con las siguientes correcciones:
- Se ha cambiado el mapeo de puertos para Astro de `80:4321` a `8080:4321`
- Se ha añadido `PUBLIC_DIRECTUS_TOKEN` como variable de entorno en el servicio `astro-app`
- Se ha añadido la referencia a `.env.prod` en el servicio `directus-app`
- Se han actualizado las variables `KEY` y `SECRET` para usar los valores correctos
- Se ha añadido `PUBLIC_ROLE` en la configuración de Directus

### 2. Actualizar Token en la Base de Datos

Se ha creado un script `fix_directus_token.sh` para actualizar el token en la base de datos:

```bash
# Hacer ejecutable el script
chmod +x fix_directus_token.sh

# Ejecutar el script en el servidor
./fix_directus_token.sh
```

Este script:
1. Verifica que los contenedores estén en ejecución
2. Actualiza el token en la tabla `directus_users` de la base de datos
3. Verifica que el token funcione correctamente

### 3. Verificar y Configurar Permisos en Directus

Se ha creado un script `verify_directus_permissions.sh` para verificar y configurar los permisos:

```bash
# Hacer ejecutable el script
chmod +x verify_directus_permissions.sh

# Ejecutar el script en el servidor
./verify_directus_permissions.sh
```

Este script:
1. Verifica la autenticación con el token estático
2. Comprueba los permisos para las colecciones críticas (`directus_files`, `Antecedentes`, `Antecedentes_files`, `Servicios`, `Servicios_files`)
3. Verifica el acceso a las páginas principales (`/antecedentes`, `/servicios`)

### 4. Configuración Manual de Permisos en Directus (si es necesario)

Si el script de verificación detecta problemas de permisos, siga estos pasos:

1. Acceda a la interfaz de administración de Directus: http://23.105.176.45:8055/admin
2. Vaya a Configuración > Roles y permisos
3. Seleccione el rol público (ID: `74e3b05e-0f14-422e-9ad3-759d426db60a`)
4. Configure los siguientes permisos:
   - `directus_files`: Lectura
   - `Antecedentes`: Lectura
   - `Antecedentes_files`: Lectura
   - `Servicios`: Lectura
   - `Servicios_files`: Lectura

### 5. Reiniciar Servicios

Después de aplicar todos los cambios, reinicie los servicios:

```bash
# Detener los contenedores
docker-compose -f docker-compose.production.yml down

# Iniciar los contenedores con la nueva configuración
docker-compose -f docker-compose.production.yml up -d
```

### 6. Verificar la Solución

Verifique que las páginas ahora funcionan correctamente:
- http://23.105.176.45:8080/antecedentes
- http://23.105.176.45:8080/servicios

## Verificación de Token

Para verificar manualmente que el token estático funciona correctamente:

```bash
curl -X GET http://23.105.176.45:8055/users/me -H "Authorization: Bearer k6P8LAY8_x_y1miB_KTlWnysCnx2Abky"
```

Debería recibir una respuesta JSON con información del usuario, no un error 401.

## Prevención de Problemas Futuros

1. **Mantener Sincronizados los Tokens**: Cualquier cambio en el token estático debe actualizarse en:
   - Archivo `.env.prod`
   - Base de datos de Directus (tabla `directus_users`)
   - Configuración de Docker Compose

2. **Verificar Permisos**: Asegúrese de que el rol público tenga los permisos necesarios para acceder a los recursos requeridos.

3. **Validar Configuración**: Compruebe periódicamente que las variables de entorno relacionadas con la autenticación y el acceso público estén correctamente configuradas.

## Notas Adicionales

- El token estático utilizado es: `k6P8LAY8_x_y1miB_KTlWnysCnx2Abky`
- El ID del rol público es: `74e3b05e-0f14-422e-9ad3-759d426db60a`
- Si necesita cambiar el token en el futuro, asegúrese de actualizarlo en todos los lugares mencionados.
