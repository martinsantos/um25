# UM EMERGENCY APP - Análisis y Plan de Integración

**Fecha**: 2025-11-29
**Objetivo**: Recuperar e integrar UM Emergency App para monitoreo de ULTIMA MILLA

---

## 1. HALLAZGOS

### App Descubierta: UMBot Emergency Dashboard v3.1

**Ubicación**: `umbot-emergency-app/` (54 archivos)

**Características Principales**:
- PWA (Progressive Web App) instalable
- Monitoreo en tiempo real de servicios
- Sistema de logs completo con filtros
- Gestión Docker integrada
- Acciones de recuperación de emergencia
- Funciona offline (modo demo)
- Interfaz responsive (móvil y desktop)

### Archivos Clave Identificados

| Archivo | Tamaño | Descripción |
|---------|--------|-------------|
| `index.html` | 34KB | Dashboard principal v3.1 con sistema de logs |
| `index-aesthetic-logs-fixed.html` | 36KB | Versión mejorada con logs estéticos (RECOMENDADA) |
| `emergency-dashboard-v3.1.js` | 34KB | Lógica JavaScript modular |
| `service-worker.js` | - | Soporte offline |
| `manifest.json` | - | Configuración PWA |
| `README.md` | - | Documentación v2.0.1 |
| `DEPLOYMENT-GUIDE.md` | - | Guía de despliegue |

---

## 2. ARQUITECTURA ACTUAL (UMBOT)

### Servicios Monitoreados

```javascript
UMBOT_SERVICES = [
  { name: 'Directus CMS', port: 8055 },
  { name: 'Nginx Proxy', port: 80 },
  { name: 'PostgreSQL', port: 5432 },
  { name: 'Grafana', port: 3000 },
  { name: 'Prometheus', port: 9090 },
  { name: 'Node Exporter', port: 9100 }
]
```

### Configuración Actual
- **URL Producción**: https://www.umbot.com.ar:8092
- **Servidor**: 23.105.176.45
- **Puerto App**: 8092
- **Backend**: server.js (Node.js) o api_logs.php (PHP)

---

## 3. ARQUITECTURA OBJETIVO (ULTIMA MILLA)

### Servicios a Monitorear

```javascript
ULTIMA_MILLA_SERVICES = [
  {
    name: 'Astro Frontend',
    type: 'pm2',
    process: 'astro-ultimamilla',
    port: 4321,
    critical: true,
    healthEndpoint: '/',
    restartCmd: 'pm2 restart astro-ultimamilla'
  },
  {
    name: 'Directus CMS',
    type: 'docker',
    container: 'directus-ultimamilla',
    port: 8055,
    critical: true,
    healthEndpoint: '/server/health',
    restartCmd: 'docker restart directus-ultimamilla'
  },
  {
    name: 'PostgreSQL',
    type: 'docker',
    container: 'postgres-ultimamilla',
    port: 5432,
    critical: true,
    healthEndpoint: false,
    restartCmd: 'docker restart postgres-ultimamilla'
  },
  {
    name: 'Redis Cache',
    type: 'docker',
    container: 'redis-ultimamilla',
    port: 6379,
    critical: false,
    healthEndpoint: false,
    restartCmd: 'docker restart redis-ultimamilla'
  },
  {
    name: 'Nginx Reverse Proxy',
    type: 'systemd',
    port: 80,
    critical: true,
    healthEndpoint: '/',
    restartCmd: 'systemctl reload nginx'
  },
  {
    name: 'CyberPanel',
    type: 'service',
    port: 8090,
    critical: false,
    healthEndpoint: '/',
    restartCmd: 'systemctl restart lscpd'
  }
]
```

### URLs Producción
- **Sitio Principal**: https://www.ultimamilla.com.ar
- **Directus**: http://23.105.176.45:8055
- **CyberPanel**: https://23.105.176.45:8090
- **Emergency App**: https://www.ultimamilla.com.ar/status (PROPUESTO)

---

## 4. DIFERENCIAS CLAVE

### Servicios a AGREGAR
- ✅ **Astro Frontend** (PM2 process, puerto 4321) - CRÍTICO
- ✅ **Redis Cache** (Docker container, puerto 6379)
- ✅ **CyberPanel** (puerto 8090)

### Servicios a REMOVER
- ❌ **Grafana** (no usado en ULTIMA MILLA)
- ❌ **Prometheus** (no usado en ULTIMA MILLA)
- ❌ **Node Exporter** (no usado en ULTIMA MILLA)

### Servicios COMUNES (mantener)
- ✅ Directus CMS
- ✅ PostgreSQL
- ✅ Nginx

---

## 5. PLAN DE INTEGRACIÓN

### Fase 1: Adaptación del Dashboard (30 min)

**Archivo Base**: `index-aesthetic-logs-fixed.html` (versión más completa)

**Cambios Necesarios**:

1. **Actualizar configuración de servicios**:
```javascript
const CONFIG = {
  SERVICES: [
    // Servicios ULTIMA MILLA (ver sección 3)
  ],
  SERVER_IP: '23.105.176.45',
  WEBSITE_URL: 'https://www.ultimamilla.com.ar',
  DIRECTUS_URL: 'http://23.105.176.45:8055',
  CHECK_INTERVAL: 5000, // 5 segundos
  LOG_REFRESH_INTERVAL: 3000 // 3 segundos
}
```

2. **Adaptar health checks**:
- PM2 status: `pm2 jlist` para Astro
- Docker status: `docker ps --filter name=<container>`
- Nginx: HTTP request a localhost

3. **Actualizar branding**:
- Título: "ULTIMA MILLA Emergency Dashboard"
- Logo/colores
- Metadata PWA en manifest.json

### Fase 2: Integración con Astro (20 min)

**Opción A: Página Estática en `/public`**
```bash
# Copiar dashboard adaptado
cp umbot-emergency-app/index-adapted.html public/status/index.html
cp umbot-emergency-app/service-worker.js public/status/
cp umbot-emergency-app/manifest.json public/status/
```

**Ventajas**:
- Deployment automático con Astro
- No requiere configuración adicional
- Accesible en: https://www.ultimamilla.com.ar/status

**Opción B: Ruta Astro Dedicada**
```typescript
// src/pages/status.astro
---
// Renderizar dashboard con datos del servidor
---
```

**Ventajas**:
- Integración con sistema de autenticación
- Puede usar variables de entorno de Astro
- SSR para datos en tiempo real

### Fase 3: Backend API (30 min)

**Crear API endpoints** en Astro:

```typescript
// src/pages/api/monitoring/services.ts
import type { APIRoute } from 'astro';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export const GET: APIRoute = async () => {
  try {
    // Check PM2 status
    const pm2Status = await execAsync('pm2 jlist');

    // Check Docker containers
    const dockerStatus = await execAsync('docker ps --format json');

    // Check Nginx
    const nginxStatus = await execAsync('systemctl is-active nginx');

    // Compilar estado de servicios
    const services = {
      astro: parsepm2Status(pm2Status.stdout),
      directus: parseDockerStatus(dockerStatus.stdout, 'directus'),
      postgres: parseDockerStatus(dockerStatus.stdout, 'postgres'),
      redis: parseDockerStatus(dockerStatus.stdout, 'redis'),
      nginx: nginxStatus.stdout.trim() === 'active'
    };

    return new Response(JSON.stringify({ success: true, services }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
```

**Endpoints a crear**:
- `GET /api/monitoring/services` - Estado de todos los servicios
- `GET /api/monitoring/logs` - Logs recientes
- `POST /api/monitoring/restart/:service` - Reiniciar servicio (autenticado)
- `GET /api/monitoring/health` - Health check general

### Fase 4: Seguridad y Permisos (20 min)

**Restricciones de acceso**:

```typescript
// middleware/auth.ts
export function checkMonitoringAuth(request: Request) {
  const authHeader = request.headers.get('Authorization');

  if (!authHeader || authHeader !== `Bearer ${process.env.MONITORING_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }
}
```

**Variables de entorno** (.env):
```bash
# Monitoring API
MONITORING_SECRET=<secret_key_here>
MONITORING_ENABLED=true

# Comandos permitidos (whitelist)
ALLOWED_RESTART_COMMANDS=astro-ultimamilla,directus,postgres,redis,nginx
```

### Fase 5: Deployment (10 min)

**1. Agregar archivos al repositorio**:
```bash
git checkout -b feature/emergency-monitoring
git add public/status/
git add src/pages/api/monitoring/
git commit -m "feat(monitoring): Add Emergency Dashboard with real-time service monitoring"
```

**2. Crear PR y merge a develop**

**3. Deploy automático** vía GitHub Actions

**4. Verificar en producción**:
```bash
curl https://www.ultimamilla.com.ar/status
curl https://www.ultimamilla.com.ar/api/monitoring/services
```

---

## 6. ESTRUCTURA DE ARCHIVOS PROPUESTA

```
fumbling-field/
├── public/
│   └── status/
│       ├── index.html              # Dashboard principal (adaptado)
│       ├── service-worker.js       # PWA offline support
│       ├── manifest.json           # PWA config
│       └── icons/
│           ├── icon-192.png
│           └── icon-512.png
├── src/
│   ├── pages/
│   │   └── api/
│   │       └── monitoring/
│   │           ├── services.ts     # GET servicios
│   │           ├── logs.ts         # GET logs
│   │           ├── health.ts       # GET health check
│   │           └── restart.ts      # POST restart service
│   └── middleware/
│       └── monitoring-auth.ts      # Auth para API
└── docs/
    └── UM_EMERGENCY_APP_ANALYSIS.md  # Este documento
```

---

## 7. FEATURES INCLUIDAS

### Dashboard Frontend
- ✅ Monitoreo en tiempo real (actualización cada 5s)
- ✅ Estado visual de servicios (verde/amarillo/rojo)
- ✅ Sistema de logs con filtros por tipo
- ✅ Búsqueda en logs
- ✅ PWA instalable (offline support)
- ✅ Responsive (móvil y desktop)
- ✅ Modo demo (cuando no hay conexión)

### Backend API
- ✅ Health checks automáticos
- ✅ Integración PM2
- ✅ Integración Docker
- ✅ Logs centralizados
- ✅ Comandos de recuperación
- ✅ Autenticación con tokens

### Seguridad
- ✅ Whitelist de comandos permitidos
- ✅ Token de autenticación
- ✅ Validación de entradas
- ✅ CORS configurado
- ✅ Rate limiting (si se implementa)

---

## 8. INTEGRACIÓN CON MONITOREO EXISTENTE

### Scripts de Health Check Actuales

Según `REGLAS_ARQUITECTURA_SERVIDOR.md`, ya existen:

```bash
# Cron jobs configurados:
*/5 * * * * /root/scripts/health-check.sh
0 * * * * /root/scripts/server-metrics.sh >> /var/log/server-metrics.log
```

**Integración**:
- Emergency App puede **consumir** los logs generados por estos scripts
- API puede **ejecutar** health-check.sh y devolver resultados
- Logs de metrics pueden **mostrarse** en el dashboard

---

## 9. ROADMAP DE IMPLEMENTACIÓN

### Semana 1: MVP (4 horas)
- [x] Análisis completo (este documento)
- [ ] Adaptar dashboard HTML para ULTIMA MILLA
- [ ] Crear estructura `/public/status`
- [ ] Deploy básico (solo frontend, sin API)
- [ ] Testing manual

### Semana 2: Backend (3 horas)
- [ ] Implementar API `/api/monitoring/services`
- [ ] Implementar API `/api/monitoring/health`
- [ ] Conectar dashboard con API
- [ ] Testing integración

### Semana 3: Features Avanzadas (3 horas)
- [ ] Sistema de logs completo
- [ ] Comandos de restart (autenticados)
- [ ] Notificaciones (opcional)
- [ ] PWA optimizada

### Semana 4: Production (2 horas)
- [ ] Security audit
- [ ] Performance optimization
- [ ] Documentación completa
- [ ] Deploy a producción

---

## 10. MÉTRICAS DE ÉXITO

### Performance
- [ ] Carga inicial < 2 segundos
- [ ] Tamaño total < 150KB
- [ ] PWA Lighthouse score > 90

### Funcionalidad
- [ ] Detecta caída de servicios en < 10 segundos
- [ ] Logs actualizados cada 3 segundos
- [ ] Funciona offline correctamente

### Usabilidad
- [ ] Instalable en móviles Android/iOS
- [ ] Responsive en todas las resoluciones
- [ ] Accesible sin autenticación (solo lectura)

---

## 11. RIESGOS Y MITIGACIONES

### Riesgo 1: Permisos de ejecución en servidor
**Problema**: API necesita permisos para ejecutar `pm2`, `docker`, `systemctl`
**Mitigación**:
- Ejecutar Astro con usuario que tenga permisos
- Usar sudo para comandos específicos (whitelist)
- Documentar setup de permisos en SETUP_GUIDE.md

### Riesgo 2: Exposición de información sensible
**Problema**: Dashboard puede revelar arquitectura del servidor
**Mitigación**:
- Autenticación obligatoria para acciones de restart
- Solo mostrar información pública (estado on/off)
- No exponer IPs internas o credenciales

### Riesgo 3: Comandos maliciosos
**Problema**: Endpoint de restart vulnerable a inyección
**Mitigación**:
- Whitelist estricta de comandos
- Validación de parámetros
- Logs de todas las acciones
- Rate limiting

---

## 12. COSTO DE IMPLEMENTACIÓN

**Tiempo Total Estimado**: 12 horas

**Breakdown**:
- Adaptación frontend: 2h
- Backend API: 4h
- Integración y testing: 3h
- Documentación: 2h
- Deployment y ajustes: 1h

**Costo Monetario**: $0.00 (self-hosted, no servicios externos)

---

## 13. PRÓXIMOS PASOS INMEDIATOS

### 1. Crear versión adaptada del dashboard
```bash
# Copiar y adaptar archivo base
cp umbot-emergency-app/index-aesthetic-logs-fixed.html \
   public/status/index.html

# Modificar configuración para ULTIMA MILLA
# (actualizar servicios, URLs, branding)
```

### 2. Testear localmente
```bash
npm run dev
# Abrir: http://localhost:4321/status
```

### 3. Crear branch y PR
```bash
git checkout -b feature/emergency-monitoring
git add public/status/
git commit -m "feat(monitoring): Add Emergency Dashboard (frontend only)"
git push origin feature/emergency-monitoring
```

### 4. Iterar con backend API
(Según roadmap de Semana 2)

---

## 14. PREGUNTAS PARA EL USUARIO

Antes de proceder con la implementación, confirmar:

1. **Ubicación preferida**:
   - ¿`/status` o `/monitor` o `/emergency`?

2. **Autenticación**:
   - ¿Dashboard público (solo lectura) o privado?
   - ¿Acciones de restart requieren login?

3. **Prioridad**:
   - ¿Desplegar frontend básico primero (sin API)?
   - ¿O esperar a tener backend completo?

4. **Branding**:
   - ¿Mantener nombre "Emergency Dashboard"?
   - ¿O cambiar a "Sistema de Monitoreo"?

---

## CONCLUSIÓN

**Estado Actual**: ✅ Análisis completo, app descubierta, estrategia definida

**Recomendación**:
1. Proceder con MVP (frontend en `/public/status`)
2. Deploy rápido para validar interfaz
3. Iterar agregando backend API

**Versión Recomendada para Adaptar**:
`index-aesthetic-logs-fixed.html` (36KB) - versión más completa y estable

---

**Documento creado**: 2025-11-29
**Autor**: Claude Code
**Estado**: ✅ LISTO PARA IMPLEMENTACIÓN
