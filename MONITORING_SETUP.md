# 📊 SISTEMA DE MONITOREO - ULTIMA MILLA

**Fecha**: 2025-11-28
**Versión**: 1.0
**Baseline**: v0.0.1-production-baseline

---

## 🎯 **OBJETIVO**

Establecer un sistema de monitoreo integral para detectar, alertar y responder a incidentes en el sitio web de producción **www.ultimamilla.com.ar** y servicios relacionados.

---

## 🔍 **SERVICIOS A MONITOREAR**

### **URLs Principales**

| Servicio | URL | Criticidad | SLA Target |
|----------|-----|------------|------------|
| **Sitio Principal** | https://www.ultimamilla.com.ar | 🔴 Crítico | 99.9% |
| **Panel Admin Directus** | https://admin.ultimamilla.com.ar | 🟡 Alta | 99.5% |
| **SGI System** | https://sgi.ultimamilla.com.ar | 🟡 Alta | 99.5% |
| **UMBot** | https://www.umbot.com.ar | 🟢 Media | 99.0% |
| **Vivero Los Cocos** | https://viveroloscocos.com.ar | 🟢 Media | 99.0% |

### **Servicios Internos**

| Servicio | Host | Puerto | Proceso |
|----------|------|--------|---------|
| **Astro App** | localhost | 4321 | PM2: astro-ultimamilla |
| **Directus CMS** | Docker | 8055 | directus-app |
| **PostgreSQL** | Docker | 5432 | postgres |
| **Redis** | Docker | 6379 | redis |
| **Nginx** | Server | 80/443 | nginx |

---

## 📈 **MÉTRICAS A MONITOREAR**

### **1. Disponibilidad (Uptime)**

**Herramientas Recomendadas**:
- **UptimeRobot** (gratis hasta 50 monitores)
- **Pingdom** (pago)
- **StatusCake** (gratis con limitaciones)

**Configuración**:
```yaml
Monitors:
  - URL: https://www.ultimamilla.com.ar
    Intervalo: 5 minutos
    Timeout: 30 segundos
    Locations: Multi-region
    Alertas:
      - Email: admin@ultimamilla.com.ar
      - SMS: (opcional)

  - URL: https://admin.ultimamilla.com.ar/server/health
    Intervalo: 5 minutos
    Expected: HTTP 200

  - URL: https://sgi.ultimamilla.com.ar
    Intervalo: 10 minutos
    Expected: HTTP 200 o 302
```

**Script de Health Check Local**:
```bash
#!/bin/bash
# /root/fumbling-field/scripts/health-check.sh

SERVICES=(
  "https://www.ultimamilla.com.ar"
  "https://admin.ultimamilla.com.ar/server/health"
  "https://sgi.ultimamilla.com.ar"
)

for service in "${SERVICES[@]}"; do
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$service")
  if [ "$HTTP_CODE" -ge 200 ] && [ "$HTTP_CODE" -lt 400 ]; then
    echo "✅ $service: OK ($HTTP_CODE)"
  else
    echo "❌ $service: FAIL ($HTTP_CODE)"
    # Enviar alerta aquí
  fi
done
```

### **2. Performance (Tiempo de Respuesta)**

**Métricas Clave**:
- **TTFB** (Time To First Byte): < 500ms
- **FCP** (First Contentful Paint): < 1.5s
- **LCP** (Largest Contentful Paint): < 2.5s
- **TTI** (Time To Interactive): < 3.5s
- **CLS** (Cumulative Layout Shift): < 0.1

**Herramientas**:
- **Google PageSpeed Insights** (manual/API)
- **Lighthouse CI** (automático en GitHub Actions)
- **WebPageTest** (manual)

**Lighthouse CI en GitHub Actions**:
```yaml
# .github/workflows/performance-check.yml
name: Performance Check

on:
  pull_request:
  push:
    branches: [master]

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: treosh/lighthouse-ci-action@v10
        with:
          urls: |
            https://www.ultimamilla.com.ar
            https://www.ultimamilla.com.ar/servicios
            https://www.ultimamilla.com.ar/antecedentes
          uploadArtifacts: true
          temporaryPublicStorage: true
```

### **3. Uso de Recursos del Servidor**

**Script de Monitoreo**:
```bash
#!/bin/bash
# /root/scripts/server-metrics.sh

echo "=== Server Metrics ==="
echo "Uptime: $(uptime)"
echo ""
echo "CPU:"
top -bn1 | grep "Cpu(s)"
echo ""
echo "Memory:"
free -h
echo ""
echo "Disk:"
df -h | grep -E '^/dev/'
echo ""
echo "PM2 Processes:"
pm2 list
echo ""
echo "Docker Containers:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.CPUPerc}}\t{{.MemUsage}}"
```

**Cron Job** (ejecutar cada 5 minutos y guardar en log):
```bash
*/5 * * * * /root/scripts/server-metrics.sh >> /var/log/server-metrics.log 2>&1
```

### **4. Logs y Errores**

**Ubicaciones de Logs**:
```bash
# PM2 logs
/root/.pm2/logs/astro-ultimamilla-out.log
/root/.pm2/logs/astro-ultimamilla-error.log

# Nginx logs
/var/log/nginx/access.log
/var/log/nginx/error.log

# Docker logs
docker logs directus-app
docker logs postgres
```

**Herramientas de Análisis**:
- **GoAccess** (análisis de logs Nginx en tiempo real)
- **Sentry** (error tracking en producción)
- **Papertrail** (agregación de logs cloud)

**Instalación GoAccess**:
```bash
apt-get install goaccess

# Análisis en vivo
goaccess /var/log/nginx/access.log -o /var/www/html/stats.html --log-format=COMBINED --real-time-html

# Acceder vía navegador
# http://23.105.176.45/stats.html
```

---

## 🚨 **SISTEMA DE ALERTAS**

### **Niveles de Severidad**

| Nivel | Descripción | Acción | Tiempo Respuesta |
|-------|-------------|--------|-------------------|
| **🔴 Crítico** | Sitio caído o inaccesible | Alerta inmediata + SMS | < 5 min |
| **🟠 Alto** | Servicio degradado | Email + Slack | < 15 min |
| **🟡 Medio** | Advertencia performance | Email | < 1 hora |
| **🟢 Bajo** | Información | Log only | N/A |

### **Canales de Notificación**

**1. Email**:
```bash
# Configurar en UptimeRobot/Pingdom
admin@ultimamilla.com.ar
martin@ultimamilla.com.ar
```

**2. Slack** (webhook):
```bash
# Crear webhook en: https://api.slack.com/messaging/webhooks
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/XXX/YYY/ZZZ

# Enviar alerta
curl -X POST $SLACK_WEBHOOK_URL \
  -H 'Content-Type: application/json' \
  -d '{
    "text": "🚨 ALERTA: www.ultimamilla.com.ar está caído!",
    "blocks": [
      {
        "type": "header",
        "text": {
          "type": "plain_text",
          "text": "🚨 Servicio Caído"
        }
      },
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": "*URL:* www.ultimamilla.com.ar\n*Status:* HTTP 500\n*Hora:* '$(date)'"
        }
      }
    ]
  }'
```

**3. Telegram Bot**:
```bash
# Crear bot: @BotFather
BOT_TOKEN="YOUR_BOT_TOKEN"
CHAT_ID="YOUR_CHAT_ID"

# Enviar mensaje
curl -s -X POST "https://api.telegram.org/bot$BOT_TOKEN/sendMessage" \
  -d chat_id="$CHAT_ID" \
  -d text="🚨 ALERTA: Sitio caído"
```

---

## 📊 **DASHBOARD DE MONITOREO**

### **Opciones Recomendadas**

**1. Grafana + Prometheus** (self-hosted):

```yaml
# docker-compose.monitoring.yml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin123
    volumes:
      - grafana_data:/var/lib/grafana

  node_exporter:
    image: prom/node-exporter:latest
    ports:
      - "9100:9100"

volumes:
  prometheus_data:
  grafana_data:
```

**2. StatusPage.io** (público, pago):
- URL pública de status
- Suscripciones vía email
- Historial de incidentes

**3. Custom Status Page** (HTML simple):
```html
<!-- /root/fumbling-field/public/status.html -->
<!DOCTYPE html>
<html>
<head>
  <title>Status - ULTIMA MILLA</title>
  <meta http-equiv="refresh" content="60">
</head>
<body>
  <h1>Estado de Servicios</h1>
  <div id="status"></div>

  <script>
    async function checkStatus() {
      const services = [
        { name: 'Sitio Web', url: 'https://www.ultimamilla.com.ar' },
        { name: 'Admin Panel', url: 'https://admin.ultimamilla.com.ar/server/health' },
        { name: 'SGI', url: 'https://sgi.ultimamilla.com.ar' }
      ];

      const statusDiv = document.getElementById('status');
      statusDiv.innerHTML = '<ul>';

      for (const service of services) {
        try {
          const response = await fetch(service.url);
          const status = response.ok ? '✅ Online' : '❌ Offline';
          statusDiv.innerHTML += `<li><strong>${service.name}:</strong> ${status}</li>`;
        } catch (e) {
          statusDiv.innerHTML += `<li><strong>${service.name}:</strong> ❌ Offline</li>`;
        }
      }

      statusDiv.innerHTML += '</ul>';
    }

    checkStatus();
  </script>
</body>
</html>
```

---

## 🔧 **IMPLEMENTACIÓN RÁPIDA**

### **Paso 1: Configurar UptimeRobot (5 min)**

1. Ir a https://uptimerobot.com/
2. Crear cuenta gratis
3. Añadir monitores:
   - www.ultimamilla.com.ar (HTTP)
   - admin.ultimamilla.com.ar (HTTP)
   - sgi.ultimamilla.com.ar (HTTP)
4. Configurar alertas por email

### **Paso 2: Instalar GoAccess en Servidor (5 min)**

```bash
ssh ultimamilla
apt-get update && apt-get install -y goaccess

# Ejecutar análisis
goaccess /var/log/nginx/access.log --log-format=COMBINED
```

### **Paso 3: Cron para Health Checks (5 min)**

```bash
# Crear script
cat > /root/scripts/health-check.sh << 'EOF'
#!/bin/bash
curl -sf https://www.ultimamilla.com.ar > /dev/null || echo "ALERT: Site down!" | mail -s "Site Down" admin@ultimamilla.com.ar
EOF

chmod +x /root/scripts/health-check.sh

# Añadir a crontab
crontab -e
# Añadir línea:
*/5 * * * * /root/scripts/health-check.sh
```

### **Paso 4: Configurar Google Analytics (ya configurado)**

Verificar tag: `G-S2376K1GED`

### **Paso 5: GitHub Actions Health Checks**

Ya configurado en `.github/workflows/production-deploy.yml`

---

## 📋 **CHECKLIST DE MONITOREO**

### **Diario**
- [ ] Verificar uptime en UptimeRobot
- [ ] Revisar logs de errores en PM2
- [ ] Verificar espacio en disco

### **Semanal**
- [ ] Análisis de tráfico con GoAccess
- [ ] Revisión de performance (PageSpeed)
- [ ] Backup verification
- [ ] Revisar uso de recursos (CPU/RAM)

### **Mensual**
- [ ] Reporte de disponibilidad (SLA)
- [ ] Análisis de tendencias
- [ ] Actualización de dependencias
- [ ] Security scan

---

## 🚀 **PRÓXIMOS PASOS**

1. **Implementar Sentry** para error tracking:
   ```bash
   npm install @sentry/astro
   ```

2. **Configurar Cloudflare Analytics** (gratis)

3. **Implementar APM** (Application Performance Monitoring):
   - New Relic (gratis hasta 100GB/mes)
   - Datadog (trial)

4. **Automatizar reportes semanales** vía email

---

**Responsables**: Equipo DevOps ULTIMA MILLA
**Contacto**: admin@ultimamilla.com.ar
**Última Actualización**: 2025-11-28
