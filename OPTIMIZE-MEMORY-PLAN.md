# 🚀 OPTIMIZE MEMORY - PLAN SIN COSTO

> **Contexto**: Servidor con 3.6GB RAM al 83% de capacidad. Sin presupuesto para upgrade hardware.
> **Objetivo**: Implementar optimizaciones de software y monitoring para prevenir crashes.

---

## 📋 **QUICK START - 30 minutos**

### Step 1: Copy Scripts to Server (2 min)

```bash
# En tu laptop
scp scripts/validate-nginx-ports.sh ultimamilla:/root/scripts/
scp scripts/memory-alert-monitor.sh ultimamilla:/root/scripts/
scp scripts/analyze-memory-usage.sh ultimamilla:/root/scripts/
scp scripts/backup-ecosystem-config.sh ultimamilla:/root/scripts/
```

### Step 2: Install Cron Jobs (5 min)

```bash
# SSH a servidor
ssh ultimamilla

# Instalar memory monitoring (cada 5 minutos)
sudo /root/scripts/memory-alert-monitor.sh --install-cron

# Instalar daily backups (cada día a las 2 AM)
sudo /root/scripts/backup-ecosystem-config.sh --install-cron

# Verificar cron jobs instalados
crontab -l
```

### Step 3: Deploy PM2 Memory Limits (10 min)

```bash
# Copiar config con memory limits
cp ecosystem.config.production.cjs /root/fumbling-field/

# Aplicar nueva config (ESTO REINICIARÁ SERVICIOS)
cd /root/fumbling-field
pm2 start ecosystem.config.production.cjs --update-env
pm2 save

# Verificar
pm2 list
```

### Step 4: First Backup (5 min)

```bash
# Crear primer backup manual
/root/scripts/backup-ecosystem-config.sh --backup

# Listar backups
/root/scripts/backup-ecosystem-config.sh --list
```

### Step 5: Validate Nginx Ports (5 min)

```bash
# Ejecutar validación
sudo /root/scripts/validate-nginx-ports.sh

# Si hay errores, fix:
sudo sed -i 's/127.0.0.1:3456/127.0.0.1:3000/g' \
  /etc/nginx/sites-available/sgi.ultimamilla.com.ar
sudo nginx -t
sudo systemctl reload nginx
```

---

## 🔍 **DIAGNOSTICS - Memory Analysis**

### Run Once Now

```bash
# Análisis completo de memoria (genera reporte)
/root/scripts/analyze-memory-usage.sh --report

# Ver reporte
cat /tmp/astro-memory-report-*.txt
```

### Monitor in Real-Time

```bash
# Ver memoria en vivo (Ctrl+C para salir)
/root/scripts/analyze-memory-usage.sh --monitor
```

---

## 📊 **WHAT EACH SCRIPT DOES**

### 1. **validate-nginx-ports.sh**
- ✓ Verifica que Nginx apunta a puertos correctos
- ✓ Detecta el problema de 2025-12-15 (puerto 3456 vs 3000)
- ✓ Corre: Manual cuando cambias Nginx config

### 2. **memory-alert-monitor.sh**
- ✓ Monitorea memoria cada 5 minutos
- ✓ Alerta cuando RAM > 70% (warning) o > 85% (critical)
- ✓ Corre: Automático via cron (cada 5 minutos)
- ✓ Logs: `/var/log/memory-alert.log`

### 3. **analyze-memory-usage.sh**
- ✓ Analiza proceso Astro en detalle
- ✓ Mira build size, node_modules, dependencies
- ✓ Genera reporte con recomendaciones
- ✓ Corre: Manual cuando investigas memory leak

### 4. **backup-ecosystem-config.sh**
- ✓ Backup diario de ecosystem.config.cjs
- ✓ Guardacompleto histórico de cambios
- ✓ Previene pérdida de config (como 2025-12-15)
- ✓ Corre: Automático diario a las 2 AM

### 5. **ecosystem.config.production.cjs**
- ✓ PM2 config con memory limits (256MB Astro, 200MB SGI)
- ✓ Restart automático si memoria excedida
- ✓ Previene OOM killer del kernel
- ✓ Corre: Cuando ejecutas `pm2 start ecosystem.config.production.cjs`

---

## ⚙️ **INSTALLATION CHECKLIST**

- [ ] Scripts copiados al server en `/root/scripts/`
- [ ] Cron jobs instalados (memory alert + backup)
- [ ] PM2 memory limits aplicados
- [ ] Primer backup creado
- [ ] Nginx ports validados
- [ ] Memory analysis reporte generado
- [ ] Logs configurados y monitoreados

---

## 🚨 **EMERGENCY ACTIONS**

### Si memoria sube > 90%

```bash
# 1. Revisar qué está usando RAM
ps aux --sort=-%mem | head -10

# 2. Mirar logs
tail -50 /var/log/memory-alert.log

# 3. Reiniciar Astro (memory limits debería hacerlo automático)
pm2 restart astro-ultimamilla

# 4. Si eso no ayuda, reiniciar SGI también
pm2 restart sgi

# 5. Last resort: reboot
# sudo reboot
```

### Si Nginx no conecta a SGI (502 error)

```bash
# 1. Validar puertos
/root/scripts/validate-nginx-ports.sh

# 2. Check si SGI está corriendo
pm2 list

# 3. Fix puerto si necesario
sudo sed -i 's/:3456/:3000/g' /etc/nginx/sites-available/sgi.ultimamilla.com.ar
sudo nginx -t
sudo systemctl reload nginx
```

### Si ecosystem.config se pierde

```bash
# 1. Listar backups
/root/scripts/backup-ecosystem-config.sh --list

# 2. Restore
/root/scripts/backup-ecosystem-config.sh --restore ecosystem.config.cjs.20251215_120000

# 3. Restart PM2
pm2 start ecosystem.config.cjs
pm2 save
```

---

## 📈 **MONITORING - WHAT TO WATCH**

### Daily Check

```bash
# Cada mañana, revisar
tail -20 /var/log/memory-alert.log
tail -20 /var/log/ecosystem-backup.log
pm2 list
```

### Weekly Analysis

```bash
# Una vez por semana, hacer profiling
/root/scripts/analyze-memory-usage.sh --report
```

### Critical Alerts

```bash
# Si vez esto en logs:
# "CRITICAL: Memory at 90%"
# "pm2 restart astro-ultimamilla"

# Significa OOM está activándose
# Necesitas action URGENTE
```

---

## 💡 **NEXT STEPS (If Budget Allows)**

1. **Add 4GB RAM** → Server a 7.6GB total
   - Cost: ~$20-40/month
   - Impact: Massive, problema resuelto

2. **Optimize Astro**
   - Investigar Sentry memory leak (VSZ: 22.8GB)
   - Remove unused integrations
   - Tree-shake dependencies

3. **Enable Node.js Profiling**
   - `npm install --save-dev clinic`
   - `clinic doctor -- npm run preview`
   - Identify exact memory leak

---

## 📝 **REFERENCE DOCUMENTS**

- [INCIDENT-REPORT-2025-12-15.md](INCIDENT-REPORT-2025-12-15.md) - What happened
- [CLAUDE.md](CLAUDE.md) - Architecture & troubleshooting
- [arquitectura-servidor-reglas.md](.windsurf/rules/arquitectura-servidor-reglas.md) - Server rules

---

## ✅ **SUCCESS CRITERIA**

- [ ] Memory stays < 80% during normal operation
- [ ] Alert logs show no CRITICAL warnings
- [ ] Daily backups being created
- [ ] Nginx ports validated daily
- [ ] No 502 errors on both sites
- [ ] Cron jobs running automatically

---

## 🆘 **SUPPORT**

If something breaks:

1. Check `/var/log/memory-alert.log`
2. Run `/root/scripts/validate-nginx-ports.sh`
3. Run `/root/scripts/analyze-memory-usage.sh --report`
4. Check [INCIDENT-REPORT-2025-12-15.md](INCIDENT-REPORT-2025-12-15.md) for solutions

**Bottom line**: Con estos scripts, el servidor debería ser MUCHO más stable incluso sin más hardware.

---

**Created**: 2025-12-15
**Status**: Ready to deploy (No cost, No downtime)
**Estimated Setup Time**: 30 minutos
**ROI**: Prevents production outages = Invaluable

