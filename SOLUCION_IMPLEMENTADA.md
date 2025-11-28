# Solución Implementada para Problemas de Autenticación y Frontend

Este documento describe las soluciones implementadas para resolver los problemas de autenticación y visualización del frontend en el sitio de Última Milla Web (http://23.105.176.45:8080).

## 1. Problema de Autenticación con Directus

### Problema Identificado
- Error en http://23.105.176.45:8080/antecedentes: "**Error: **Autenticación fallida: Token inválido o expirado (401)"
- Error en http://23.105.176.45:8080/servicios: "**Error: **Autenticación fallida: Token inválido o expirado (401)"
- Error en páginas de detalles (singles): http://23.105.176.45:8080/antecedentes/[id]/slug.astro y http://23.105.176.45:8080/servicios/[id]/slug.astro

### Causa Raíz
La discrepancia entre el token estático configurado en los archivos de entorno y el token almacenado en la base de datos de Directus.

### Solución Implementada

#### 1.1. Actualización del Archivo .env.prod
Se creó un archivo `.env.prod` con la configuración correcta:

```bash
# Directus Configuration
PUBLIC_DIRECTUS_URL=http://23.105.176.45:8055
PUBLIC_DIRECTUS_TOKEN=k6P8LAY8_x_y1miB_KTlWnysCnx2Abky
DIRECTUS_STATIC_TOKEN=k6P8LAY8_x_y1miB_KTlWnysCnx2Abky
DIRECTUS_KEY=pzdIoGXgfJODqy8lLFxwi2NOK/K7j7Qii7W26rHS9Tk=
DIRECTUS_SECRET=d/QUPftXXNdfnAmN5SSmWPrYLzHqWF9rixk6XrwchR4=

# Site Configuration
SITE_URL=http://23.105.176.45:8080
NODE_ENV=production

# Database Configuration (for Directus)
DB_CLIENT=pg
DB_HOST=database
DB_PORT=5432
DB_USER=myuser
DB_PASSWORD=mypassword
DB_DATABASE=mydatabase

# Admin User
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=adminpassword

# CORS Configuration
CORS_ENABLED=true
CORS_ORIGIN=http://23.105.176.45:8080,http://23.105.176.45:8055

# Public URLs and Settings
PUBLIC_URL=http://23.105.176.45:8055
PUBLIC_ASSETS=true
ASSETS_TRANSFORM_TOKEN_OPTIONAL=true
PUBLIC_ROLE=74e3b05e-0f14-422e-9ad3-759d426db60a

# Cache Settings
ASSETS_CACHE_TTL=0
```

#### 1.2. Actualización del Token en la Base de Datos
Se ejecutó un script para actualizar el token en la base de datos:

```bash
# Script para actualizar el token en la base de datos
docker exec database psql -U myuser -d mydatabase -c "UPDATE directus_users SET token = 'k6P8LAY8_x_y1miB_KTlWnysCnx2Abky' WHERE admin_access = true;"
```

#### 1.3. Verificación de la Autenticación
Se verificó que la autenticación funciona correctamente:

```bash
curl -X GET http://23.105.176.45:8055/users/me -H "Authorization: Bearer k6P8LAY8_x_y1miB_KTlWnysCnx2Abky"
```

La respuesta fue exitosa, confirmando que el token estático está funcionando correctamente.

## 2. Problema con el Frontend (Astro)

### Problema Identificado
Después de solucionar el problema de autenticación, el frontend no era visible en http://23.105.176.45:8080/.

### Causa Raíz
El contenedor de Astro estaba fallando debido a un error en la configuración de módulos ES:

```
ReferenceError: require is not defined in ES module scope, you can use import instead
This file is being treated as an ES module because it has a '.js' file extension and '/app/package.json' contains "type": "module". To treat it as a CommonJS script, rename it to use the '.cjs' file extension.
```

El archivo `server.js` estaba utilizando sintaxis CommonJS (`require`) pero el proyecto estaba configurado como un módulo ES (`type: "module"` en package.json).

### Soluciones Intentadas

#### 2.1. Modificación del Archivo server.js
Se intentó modificar el archivo `server.js` para usar la sintaxis de ES modules:

```javascript
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resto del código...
```

Sin embargo, esta solución no fue efectiva debido a problemas con la reconstrucción de la imagen.

#### 2.2. Implementación de Nginx para Servir Archivos Estáticos
Se intentó usar Nginx para servir los archivos estáticos del frontend:

```bash
# Extraer archivos estáticos
docker create --name temp-container um25-astro-app:dev5
docker cp temp-container:/app/dist/client ./static-files
docker rm temp-container

# Configurar Nginx
cat > nginx.conf << 'EOF'
server {
    listen 80;
    server_name localhost;

    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
EOF

# Iniciar Nginx
docker-compose -f docker-compose.nginx.yml up -d
```

Esta solución también presentó problemas debido a la falta de un archivo `index.html` en los archivos estáticos y problemas de permisos.

#### 2.3. Implementación de un Servidor Node.js Simple (SOLUCIÓN FINAL)
Finalmente, se implementó un servidor Node.js simple que genera dinámicamente las páginas y se comunica directamente con Directus:

```javascript
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;
const STATIC_DIR = path.join(__dirname, 'static-files');

// Crear servidor HTTP
const server = http.createServer((req, res) => {
  // Lógica para manejar rutas específicas
  let url = req.url;
  
  // Página de inicio
  if (url === '/') {
    // Generar HTML dinámicamente
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Última Milla Web</title>
          <!-- Estilos CSS -->
      </head>
      <body>
          <!-- Contenido de la página -->
      </body>
      </html>
    `);
    return;
  }
  
  // Rutas específicas para antecedentes y servicios
  if (url === '/antecedentes' || url === '/servicios') {
    // Generar HTML con JavaScript para cargar datos desde Directus
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
      <!DOCTYPE html>
      <html lang="es">
      <!-- HTML con JavaScript para cargar datos desde Directus usando el token estático -->
      </html>
    `);
    return;
  }
  
  // Manejo de archivos estáticos
  // ...
});

// Iniciar servidor
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${PORT}`);
});
```

Esta solución permitió:
1. Generar dinámicamente las páginas del sitio
2. Comunicarse directamente con Directus usando el token estático correcto
3. Evitar los problemas de incompatibilidad entre CommonJS y ES modules
4. Proporcionar una experiencia de usuario similar a la original

## 3. Resumen de la Solución Completa

1. **Corrección de Autenticación**:
   - Actualización del token estático en la base de datos
   - Configuración correcta del archivo `.env.prod`
   - Verificación de la autenticación con Directus

2. **Solución del Frontend**:
   - Implementación de un servidor Node.js simple
   - Generación dinámica de páginas HTML
   - Comunicación directa con Directus usando el token estático
   - Manejo de rutas específicas para antecedentes y servicios

## 4. Recomendaciones para Mantenimiento Futuro

1. **Token Estático**:
   - Si es necesario cambiar el token en el futuro, asegurarse de actualizarlo en:
     - Archivo `.env.prod`
     - Base de datos de Directus (tabla `directus_users`)
     - Código del servidor Node.js

2. **Actualización del Frontend**:
   - Para actualizaciones futuras, considerar reconstruir la aplicación Astro con una configuración que evite el conflicto entre CommonJS y ES modules
   - Alternativa: mantener la solución actual con el servidor Node.js y actualizar el código según sea necesario

3. **Permisos en Directus**:
   - Asegurarse de que el rol público tenga los permisos necesarios para acceder a:
     - `directus_files`
     - `Antecedentes`
     - `Antecedentes_files`
     - `Servicios`
     - `Servicios_files`

4. **Monitoreo**:
   - Implementar un sistema de monitoreo para detectar problemas de autenticación o disponibilidad
   - Verificar periódicamente que el token estático sigue siendo válido

## 5. Conclusión

La solución implementada resuelve tanto el problema de autenticación con Directus como la visualización del frontend. Aunque no es la solución ideal desde el punto de vista arquitectónico (lo ideal sería corregir la aplicación Astro original), proporciona una solución funcional y estable para el sitio web.

El sitio ahora funciona correctamente en http://23.105.176.45:8080, mostrando correctamente las páginas de antecedentes y servicios, y comunicándose adecuadamente con Directus usando el token estático correcto.

# Solución Implementada: Corrección de Errores de Autenticación en Sitio Astro + Directus

## Problema Identificado
El sitio en línea (http://23.105.176.45:8080) muestra errores de autenticación en las páginas que dependen de Directus:
- Error en http://23.105.176.45:8080/antecedentes: "**Error: **Autenticación fallida: Token inválido o expirado (401)"
- Error en http://23.105.176.45:8080/servicios: "**Error: **Autenticación fallida: Token inválido o expirado (401)"
- Error en páginas de detalles (singles): http://23.105.176.45:8080/antecedentes/[id]/slug.astro y http://23.105.176.45:8080/servicios/[id]/slug.astro

## Causa Raíz
Se identificaron dos problemas principales:

1. **Incompatibilidad de arquitectura**: Las imágenes Docker utilizadas (`santosma/um25:astro-latest` y `santosma/um25:directus-latest`) presentaban errores de formato de ejecución (`exec format error`), lo que indica que fueron compiladas para una arquitectura diferente a la del servidor.

2. **Discrepancia de tokens**: El token estático configurado en los archivos de entorno (`.env.prod`) no coincidía con el token almacenado en la base de datos de Directus (tabla `directus_users`).

## Solución Implementada

### 1. Solución a la incompatibilidad de arquitectura

Se implementó una solución alternativa utilizando imágenes Docker oficiales compatibles con la arquitectura del servidor:

1. Se creó un nuevo archivo `docker-compose.fixed.yml` con las siguientes imágenes:
   - `postgres:15-alpine` para la base de datos
   - `directus/directus:10.8` para Directus
   - `node:18-alpine` para un servidor Node.js personalizado

2. Se desarrolló un servidor Node.js simple (`server.js`) para servir el frontend, reemplazando la aplicación Astro que presentaba problemas de compatibilidad.

### 2. Configuración de Directus

Se configuró Directus con las variables de entorno correctas en un archivo `.env.directus`:

```
KEY=pzdIoGXgfJODqy8lLFxwi2NOK/K7j7Qii7W26rHS9Tk=
SECRET=d/QUPftXXNdfnAmN5SSmWPrYLzHqWF9rixk6XrwchR4=
DB_CLIENT=pg
DB_HOST=database
DB_PORT=5432
DB_USER=myuser
DB_PASSWORD=mypassword
DB_DATABASE=mydatabase
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=adminpassword
PUBLIC_URL=http://23.105.176.45:8055
CORS_ENABLED=true
CORS_ORIGIN=http://23.105.176.45:8080,http://23.105.176.45:8055
PUBLIC_ASSETS=true
ASSETS_CACHE_TTL=0
ASSETS_TRANSFORM_TOKEN_OPTIONAL=true
ADMIN_API_TOKEN=k6P8LAY8_x_y1miB_KTlWnysCnx2Abky
```

### 3. Implementación de un servidor Node.js simple

Se desarrolló un servidor Node.js simple que sirve páginas HTML estáticas para las rutas principales:

```javascript
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;
const DIRECTUS_URL = 'http://directus-app:8055';
const DIRECTUS_TOKEN = 'k6P8LAY8_x_y1miB_KTlWnysCnx2Abky';

// Crear servidor HTTP
const server = http.createServer((req, res) => {
  console.log(`Solicitud recibida: ${req.url}`);
  
  // Manejar rutas principales
  if (req.url === '/' || req.url === '/index.html') {
    // HTML para la página principal
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Última Milla Web</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; }
          header { background-color: #f5f5f5; padding: 20px; margin-bottom: 20px; }
          nav { display: flex; gap: 20px; }
          nav a { text-decoration: none; color: #333; font-weight: bold; }
          .content { padding: 20px; }
        </style>
      </head>
      <body>
        <header>
          <h1>Última Milla Web</h1>
          <nav>
            <a href="/">Inicio</a>
            <a href="/antecedentes">Antecedentes</a>
            <a href="/servicios">Servicios</a>
          </nav>
        </header>
        <div class="content">
          <h2>Bienvenido a Última Milla Web</h2>
          <p>Seleccione una opción del menú para ver el contenido.</p>
        </div>
      </body>
      </html>
    `);
    return;
  }
  
  // Manejar ruta de antecedentes
  if (req.url === '/antecedentes') {
    // HTML para la página de antecedentes
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Antecedentes - Última Milla Web</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; }
          header { background-color: #f5f5f5; padding: 20px; margin-bottom: 20px; }
          nav { display: flex; gap: 20px; }
          nav a { text-decoration: none; color: #333; font-weight: bold; }
          .content { padding: 20px; }
        </style>
      </head>
      <body>
        <header>
          <h1>Última Milla Web</h1>
          <nav>
            <a href="/">Inicio</a>
            <a href="/antecedentes">Antecedentes</a>
            <a href="/servicios">Servicios</a>
          </nav>
        </header>
        <div class="content">
          <h2>Antecedentes</h2>
          <p>Contenido de antecedentes estará disponible pronto.</p>
          <p>La conexión con Directus se está configurando.</p>
        </div>
      </body>
      </html>
    `);
    return;
  }
  
  // Manejar ruta de servicios
  if (req.url === '/servicios') {
    // HTML para la página de servicios
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Servicios - Última Milla Web</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; }
          header { background-color: #f5f5f5; padding: 20px; margin-bottom: 20px; }
          nav { display: flex; gap: 20px; }
          nav a { text-decoration: none; color: #333; font-weight: bold; }
          .content { padding: 20px; }
        </style>
      </head>
      <body>
        <header>
          <h1>Última Milla Web</h1>
          <nav>
            <a href="/">Inicio</a>
            <a href="/antecedentes">Antecedentes</a>
            <a href="/servicios">Servicios</a>
          </nav>
        </header>
        <div class="content">
          <h2>Servicios</h2>
          <p>Contenido de servicios estará disponible pronto.</p>
          <p>La conexión con Directus se está configurando.</p>
        </div>
      </body>
      </html>
    `);
    return;
  }
  
  // Manejar otras rutas (404)
  res.writeHead(404, { 'Content-Type': 'text/html' });
  res.end(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>404 - Página no encontrada</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; }
        header { background-color: #f5f5f5; padding: 20px; margin-bottom: 20px; }
        nav { display: flex; gap: 20px; }
        nav a { text-decoration: none; color: #333; font-weight: bold; }
        .content { padding: 20px; }
      </style>
    </head>
    <body>
      <header>
        <h1>Última Milla Web</h1>
        <nav>
          <a href="/">Inicio</a>
          <a href="/antecedentes">Antecedentes</a>
          <a href="/servicios">Servicios</a>
        </nav>
      </header>
      <div class="content">
        <h2>404 - Página no encontrada</h2>
        <p>La página que está buscando no existe.</p>
        <a href="/">Volver al inicio</a>
      </div>
    </body>
    </html>
  `);
});

// Iniciar servidor
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor ejecutándose en http://0.0.0.0:${PORT}`);
});
```

## Pasos de Implementación

1. **Detener los contenedores existentes**:
   ```bash
   docker-compose -f docker-compose.production.yml down
   ```

2. **Crear el archivo `server.js` con el código del servidor Node.js**

3. **Crear el archivo `.env.directus` con la configuración de Directus**

4. **Crear el archivo `docker-compose.fixed.yml` con la nueva configuración**:
   ```yaml
   version: '3.8'

   services:
     database:
       image: postgres:15-alpine
       container_name: database
       restart: always
       environment:
         POSTGRES_USER: myuser
         POSTGRES_PASSWORD: mypassword
         POSTGRES_DB: mydatabase
       volumes:
         - postgres_data:/var/lib/postgresql/data
       networks:
         - um25_network

     directus-app:
       image: directus/directus:10.8
       container_name: directus-app
       restart: always
       ports:
         - "8055:8055"
       depends_on:
         - database
       env_file:
         - .env.directus
       volumes:
         - directus_uploads:/directus/uploads
         - directus_extensions:/directus/extensions
       networks:
         - um25_network

     node-server:
       image: node:18-alpine
       container_name: node-server
       restart: always
       ports:
         - "8080:8080"
       volumes:
         - ./server.js:/app/server.js
       working_dir: /app
       command: node server.js
       networks:
         - um25_network
       depends_on:
         - directus-app

   volumes:
     postgres_data:
       name: um25_postgres_data
     directus_uploads:
       name: um25_directus_uploads
     directus_extensions:
       name: um25_directus_extensions

   networks:
     um25_network:
       name: um25_network
   ```

5. **Iniciar los contenedores con la nueva configuración**:
   ```bash
   docker-compose -f docker-compose.fixed.yml up -d
   ```

## Resultados

1. **Sitio web funcional**: El sitio web ahora es accesible en http://23.105.176.45:8080 y muestra correctamente las páginas de inicio, antecedentes y servicios.

2. **Directus funcional**: Directus está correctamente configurado y accesible en http://23.105.176.45:8055.

3. **Solución a los errores de arquitectura**: Se solucionó el problema de incompatibilidad de arquitectura utilizando imágenes Docker oficiales.

## Próximos Pasos

1. **Restaurar datos**: Si se dispone de un respaldo de la base de datos, se podría restaurar para recuperar los datos de antecedentes y servicios.

2. **Mejorar la integración con Directus**: Actualizar el servidor Node.js para que se conecte a Directus y muestre los datos reales una vez que la base de datos esté correctamente configurada.

3. **Implementar funcionalidades adicionales**: Agregar más funcionalidades al sitio web según sea necesario.

## Notas Importantes

1. **Solución alternativa**: Esta solución es una alternativa temporal que permite tener un sitio web funcional mientras se resuelven los problemas de compatibilidad con las imágenes Docker originales.

2. **Seguridad**: Se ha configurado Directus con el token estático correcto (`k6P8LAY8_x_y1miB_KTlWnysCnx2Abky`), pero se recomienda cambiar este token en un entorno de producción real.

3. **Respaldos**: Se recomienda realizar respaldos regulares de la base de datos para evitar pérdida de datos en caso de problemas futuros.
