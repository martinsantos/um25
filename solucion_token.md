# Solución al Problema de Autenticación en Directus y Astro

## Problema Detectado
El error "Token inválido o expirado (401)" en la página de antecedentes del servidor de producción se debía a una discrepancia entre el token estático configurado en el archivo `.env` y el token almacenado en la base de datos de Directus.

## Solución Implementada

### 1. Sincronización de Tokens
Se sincronizó el token estático entre:
- El archivo `.env` del servidor
- El archivo `.env.js` en el directorio `dist` (usado por la aplicación compilada)
- La base de datos de Directus (tabla `directus_users`, columna `token`)

### 2. Configuración de Permisos
Se configuraron los permisos adecuados para el rol público en Directus, permitiendo acceso de lectura a:
- `directus_files`: Para acceder a las imágenes
- `Antecedentes`: Para acceder a los datos de antecedentes
- `Antecedentes_files`: Para la relación entre antecedentes e imágenes

### 3. Configuración de Variables de Entorno
Se actualizaron las siguientes variables de entorno críticas:
- `PUBLIC_ASSETS=true`: Para permitir acceso público a los activos
- `ASSETS_TRANSFORM_TOKEN_OPTIONAL=true`: Para permitir transformaciones de imágenes sin token
- `PUBLIC_ROLE=74e3b05e-0f14-422e-9ad3-759d426db60a`: Para especificar el ID del rol público

## Detalles Técnicos
- **Token Estático**: `k6P8LAY8_x_y1miB_KTlWnysCnx2Abky`
- **ID del Rol Público**: `74e3b05e-0f14-422e-9ad3-759d426db60a`
- **URLs Configuradas**:
  - `PUBLIC_DIRECTUS_URL=http://23.105.176.45:8055`
  - `DIRECTUS_URL=http://directus-app:8055`
  - `PUBLIC_URL=http://23.105.176.45:8055`

## Prevención de Problemas Futuros
1. **Mantener Sincronizados los Tokens**: Cualquier cambio en el token estático debe actualizarse en todos los lugares mencionados.
2. **Verificar Permisos**: Asegurarse de que el rol público tenga los permisos necesarios para acceder a los recursos requeridos.
3. **Validar Configuración**: Comprobar periódicamente que las variables de entorno relacionadas con la autenticación y el acceso público estén correctamente configuradas.

## Comandos de Verificación
Para verificar que el token estático funciona correctamente:
```bash
curl -X GET http://23.105.176.45:8055/users/me -H "Authorization: Bearer k6P8LAY8_x_y1miB_KTlWnysCnx2Abky"
```
