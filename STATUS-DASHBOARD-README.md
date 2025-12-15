# 📊 Status Dashboard Integration

**URL**: https://ultimamilla.com.ar/status

Monitoring dashboard integrado que muestra en tiempo real:
- ✅ Memory usage
- ✅ Service status (Astro, SGI, Directus)
- ✅ Nginx port validation
- ✅ Recent logs de monitoreo
- ✅ Auto-refresh cada 30 segundos

---

## 🏗️ Architecture

### Componentes

```
https://ultimamilla.com.ar/status
         ↓
    /src/pages/status.astro
         ↓
    /src/pages/api/status.json
         ↓
    [Shell Scripts]
    - /var/log/memory-alert.log
    - /var/log/ecosystem-backup.log
    - pm2 list
    - free -h
    - lsof/ss commands
```

### API Endpoint: `/api/status.json`

**Response Format**:
```json
{
  "timestamp": "2025-12-15T20:00:00.000Z",
  "health": "healthy|degraded|critical",
  "server": {
    "memory": {
      "total": "3.6GB",
      "used": "3.1GB",
      "available": "121MB",
      "usagePercent": 86,
      "status": "critical|warning|ok"
    },
    "services": [
      {
        "name": "astro-ultimamilla",
        "status": "online|offline|error",
        "memory": "102.5MB",
        "uptime": "5 min"
      }
    ],
    "nginxPorts": [
      {
        "service": "Astro (ultimamilla.com.ar)",
        "expected": 4321,
        "listening": true,
        "status": "ok|error"
      }
    ]
  },
  "recentLogs": [
    {
      "timestamp": "2025-12-15T20:00:00.000Z",
      "level": "CRITICAL|WARNING|INFO",
      "message": "...",
      "source": "memory-monitor|backup|..."
    }
  ],
  "issues": ["⚠️ Memory CRITICAL: 90% in use", "..."]
}
```

---

## 📝 Files

### New Files Created

1. **src/pages/api/status.json.ts**
   - API endpoint que lee logs y estado del servidor
   - Executa shell commands para obtener data real-time
   - Response cacheable (5 segundos)

2. **src/pages/status.astro**
   - Dashboard visual
   - Muestra memory, services, logs
   - Auto-refresh cada 30 segundos
   - Diseño responsivo con Tailwind

3. **STATUS-DASHBOARD-README.md**
   - Este archivo
   - Documentación de integración

---

## 🚀 Deployment

### Step 1: Build Astro

```bash
cd /root/fumbling-field
npm run build
```

### Step 2: Restart Astro

```bash
pm2 restart astro-ultimamilla
pm2 save
```

### Step 3: Test

```bash
# Test API
curl https://ultimamilla.com.ar/api/status.json

# Visit dashboard
open https://ultimamilla.com.ar/status
```

---

## 🔍 Features Explained

### Memory Monitoring

**Green** (< 70%): Sistema OK
**Yellow** (70-85%): Alerta, monitor
**Red** (> 85%): Critical, action requerida

```
Physical RAM: 3.1GB / 3.6GB (86%)
├─ Astro: 102MB
├─ SGI: 40MB
├─ Directus: 17MB
└─ Other: rest
```

### Service Status

- **✅ ONLINE**: Servicio corriendo
- **🔴 OFFLINE**: Servicio down
- **❓ ERROR**: No se puede determinar

### Nginx Port Validation

Verifica que los servicios están escuchando en los puertos correctos:

```
Astro:        Port 4321 ✅
SGI:          Port 3000 ✅ (NOT 3456)
Directus:     Port 8055 ✅
```

Esta validación **previene** el problema de 2025-12-15.

### Recent Logs

Muestra últimos logs de:
- **memory-monitor**: Alertas de RAM cada 5 minutos
- **backup**: Estado de backups diarios
- **PM2**: Cambios de servicio

---

## 📈 Real-World Usage

### Monitoreo Diario

1. Abrir https://ultimamilla.com.ar/status
2. Revisar health status
3. Si hay issues, ver logs para contexto
4. Actuar según dashboard indicators

### Debugging

Si alguien reporta que www.ultimamilla.com.ar está lento:

```
1. Ir a /status
2. Ver Memory: ¿está > 80%?
   - Sí → Astro puede estar en estrés
   - No → Problema es otro
3. Ver Services: ¿todos online?
   - No → Reiniciar via PM2
4. Ver Nginx Ports: ¿todos listening?
   - No → Config error, corregir
5. Ver Recent Logs: ¿hay CRITICAL?
   - Sí → Leer message para causa
```

---

## 🔧 Technical Details

### How API Works

```python
def /api/status.json():
    memory = exec("free -h")
    services = exec("pm2 list --format json")
    ports = exec("lsof -i :PORT")  # Or ss command
    logs = read("/var/log/memory-alert.log")  # Last 10 lines

    return {
        health: calculate_from(memory, services),
        issues: detect_issues(memory, services, ports),
        ...
    }
```

### Performance

- **Cache**: 5 segundos (prevent API spam)
- **Shell timeouts**: 2-5 segundos por command
- **Total response**: < 2 seconds
- **Auto-refresh**: 30 segundos (adjustable)

### Security

- ✅ Read-only (no admin functions)
- ✅ Data is from `free` and `pm2` (safe tools)
- ✅ No credentials exposed
- ✅ JSON only (no HTML injection risk)

---

## 🎯 Integration with Optimization Tools

El dashboard muestra data que viene de:

1. **memory-alert-monitor.sh**
   - Escribe a `/var/log/memory-alert.log` cada 5 minutos
   - Dashboard muestra estos logs

2. **backup-ecosystem-config.sh**
   - Escribe a `/var/log/ecosystem-backup.log`
   - Dashboard muestra status de backups

3. **validate-nginx-ports.sh**
   - Script manual, pero dashboard valida en tiempo real

4. **PM2 Status**
   - `pm2 list` muestra estado actual de servicios
   - Dashboard lo consume

---

## 📊 Future Enhancements

Posibles mejoras (no implementadas aún):

1. **Graficos históricos** de memoria
   - Guardar data en archivo/DB
   - Mostrar gráfico de últimas 24h

2. **Webhook alerts**
   - Slack/Discord cuando health = critical
   - Email diario con resumen

3. **Log filtering**
   - Filter por source, level, date range
   - Download logs as CSV

4. **Baseline comparison**
   - "Comparar vs yesterday same time"
   - Detectar anomalías

5. **Performance metrics**
   - CPU usage
   - Disk I/O
   - Network traffic

---

## ❓ Troubleshooting

### Dashboard muestra "Error: Failed to fetch status"

```
Cause: API endpoint error

Fix:
1. Check Astro is running: pm2 list
2. Check logs: pm2 logs astro-ultimamilla
3. Test API: curl https://ultimamilla.com.ar/api/status.json
4. Check if /var/log files exist and readable
```

### Dashboard stuck on old data

```
Cause: Cache or browser cache

Fix:
1. Hard refresh: Ctrl+Shift+R
2. Clear browser cache
3. Or wait 30 seconds for auto-refresh
```

### Memory shows "Unknown"

```
Cause: free -h command failed

Fix:
1. SSH to server: ssh ultimamilla
2. Try free -h manually
3. Check permissions: whoami
4. Astro process needs access to /proc
```

---

## 📞 Support

Para bugs o mejoras en el dashboard:

1. Check `src/pages/api/status.json.ts` para entender cómo se data
2. Check `src/pages/status.astro` para UI changes
3. Test locally con `npm run dev`
4. Deploy via git push → GitHub Actions

---

## ✅ Checklist

- [x] API endpoint `/api/status.json` creado
- [x] Dashboard page `/status` creado
- [x] Integración con logs de monitoreo
- [x] Real-time memory status
- [x] Service status display
- [x] Nginx port validation
- [x] Auto-refresh cada 30s
- [x] Responsive design
- [ ] Históricos de memoria (future)
- [ ] Webhook alerts (future)

---

**Created**: 2025-12-15
**Status**: Ready to deploy
**URL**: https://ultimamilla.com.ar/status

