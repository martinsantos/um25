# 🏗️ Arquitectura de Producción Optimizada - ultimamilla.com.ar

## 📌 Resumen Ejecutivo

Se ha preparado una arquitectura de producción optimizada que corrige las desalineaciones identificadas y alinea la infraestructura con la especificación técnica requerida:

- **Astro App**: Puerto 3000 (corregido desde 4321)
- **Directus CMS**: Puerto 8055 
- **Proxy SSR**: Puerto 8093 (pendiente implementación)
- **SGI System**: Puerto 3456 (PM2, pendiente verificación)
- **Nginx**: Configuración unificada con upstreams correctos

## 🎯 Archivos Preparados

### 1️⃣ `Dockerfile.astro.production`
**Propósito**: Multi-stage build optimizado para producción

**Mejoras clave**:
- Build stage separado del runtime
- Usuario no-root para seguridad
- Healthcheck integrado
- Puerto 3000 (según arquitectura)
- NODE_ENV=production
- Optimizaciones de memoria

### 2️⃣ `docker-compose.production.optimized.yml`
**Propósito**: Orquestación de servicios alineada con arquitectura

**Correcciones importantes**:
- Astro App en puerto 3000 (no 4321)
- Variables de entorno desde `.env.production`
- Healthchecks para todos los servicios
- Límites de recursos y seguridad
- Red interna `ultimamilla_network`
- Volúmenes persistentes optimizados

### 3️⃣ `nginx.production.optimized.conf`
**Propósito**: Configuración Nginx unificada para todos los servicios

**Arquitectura implementada**:
```
ultimamilla.com.ar
├── / → Astro App (127.0.0.1:3000)
├── /admin → Directus (127.0.0.1:8055)
├── /api → Directus API (127.0.0.1:8055)
├── /assets → Directus Assets (127.0.0.1:8055)
└── /health → Health checks

sgi.ultimamilla.com.ar
└── / → SGI System (127.0.0.1:3456)
```

**Optimizaciones**:
- Headers de caché diferenciados (static, versioned, dynamic)
- Rate limiting por zona
- Real IP con rangos Cloudflare
- Headers de seguridad HTTPS
- Compresión GZIP optimizada

### 4️⃣ `.env.production.template`
**Propósito**: Template de variables de entorno seguras

**Seguridad**:
- Comandos para generar secretos fuertes
- Separación de credenciales de DB y Directus
- Configuración CORS específica
- Notas de rotación de secretos

### 5️⃣ `src/pages/health.ts`
**Propósito**: Endpoint de health check para monitoreo

**Funcionalidades**:
- Verificación de Astro App
- Test de conexión a Directus
- Métricas de memoria
- Tiempos de respuesta
- Status HTTP correcto (200/503)

### 6️⃣ `deploy-production-zero-downtime.sh`
**Propósito**: Script de despliegue automatizado sin downtime

**Proceso de despliegue**:
1. Verificación de requisitos
2. Backup automático de DB
3. Build de nueva imagen
4. Rolling update de servicios
5. Health checks continuos
6. Rollback automático en caso de error
7. Limpieza de recursos

## 🔄 Comparación: Estado Actual vs. Optimizado

| Componente | Estado Actual | Estado Optimizado |
|------------|---------------|-------------------|
| **Astro Port** | 4321 (dev mode) | 3000 (prod mode) |
| **Dockerfile** | Single-stage | Multi-stage optimizado |
| **Environment** | Hardcoded secrets | Variables desde .env |
| **Healthchecks** | Ninguno | Completos con timeouts |
| **Caché** | performanceOptimizer.v2.js | Headers Nginx diferenciados |
| **Seguridad** | Usuario root | Usuario no-root + límites |
| **Monitoring** | Ninguno | Health endpoints |
| **Deployment** | Manual | Zero-downtime automatizado |

## 🚀 Plan de Implementación (Requiere Aprobación)

### Fase 1: Preparación
```bash
# 1. Crear variables de entorno
cp .env.production.template .env.production
# Editar .env.production con valores reales

# 2. Generar secretos seguros
openssl rand -hex 32  # Para DIRECTUS_KEY
openssl rand -hex 32  # Para DIRECTUS_SECRET  
openssl rand -base64 32  # Para DIRECTUS_STATIC_TOKEN
openssl rand -base64 32  # Para DB_PASSWORD
```

### Fase 2: Testing Local
```bash
# Probar build de producción
docker build -f Dockerfile.astro.production -t astro-prod-test .

# Probar compose optimizado
docker-compose -f docker-compose.production.optimized.yml --env-file .env.production up -d

# Verificar health checks
curl http://localhost:3000/health
curl http://localhost:8055/server/health
```

### Fase 3: Despliegue en Servidor
```bash
# En el servidor 23.105.176.45
./deploy-production-zero-downtime.sh
```

### Fase 4: Configuración Nginx
```bash
# Backup configuración actual
sudo cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup

# Aplicar nueva configuración
sudo cp nginx.production.optimized.conf /etc/nginx/nginx.conf

# Verificar y recargar
sudo nginx -t && sudo systemctl reload nginx
```

## ⚠️ Consideraciones Críticas

### Servicios Pendientes de Verificación
1. **Proxy SSR (Puerto 8093)**: Verificar que esté implementado y funcionando
2. **SGI System (Puerto 3456)**: Confirmar que PM2 esté gestionando el servicio
3. **Certificados SSL**: Verificar paths en Let's Encrypt

### Requisitos de Infraestructura
- Mínimo 4GB RAM disponible para contenedores
- 10GB espacio libre para builds y backups
- Firewall configurado: puertos 22, 80, 443 abiertos
- Fail2ban configurado para protección SSH

### Impacto en Rendimiento Esperado
- ✅ Eliminación del error `performanceOptimizer.js`
- ✅ Caché diferenciado reduce carga del servidor
- ✅ Healthchecks permiten monitoreo proactivo  
- ✅ Zero-downtime deployments
- ✅ Multi-stage builds reducen tamaño de imágenes
- ✅ Usuario no-root mejora seguridad

## 📊 Próximos Pasos

1. **Revisión y aprobación** de los archivos preparados
2. **Testing** en entorno de desarrollo local
3. **Implementación gradual** en servidor de producción
4. **Monitoreo** post-implementación
5. **Documentación** de procesos operativos

---

**Todos los archivos están preparados y listos para implementación, respetando el principio de consulta previa. ¿Deseas proceder con alguna fase específica?**
