# Email Alert System Setup

Sistema automático de alertas por correo agrupadas para monitoreo de producción.

## Características

✅ **Alertas Inteligentes**
- Monitorea cada 10 minutos
- Agrupa alertas en un correo (no spam)
- Envía correo consolidado cada 6 horas
- O inmediatamente si hay CRÍTICO

✅ **Alertas por Severidad**
- 🔴 **CRITICAL**: Memoria > 85%, Servicios offline
- ⚠️ **WARNING**: Sistema degradado
- ✅ **OK**: Sin problemas

✅ **HTML Email**
- Diseño profesional con CSS
- Métricas claras
- Timestamp y detalles

## Instalación en Producción

### 1. Copiar script al servidor

```bash
# Desde local
rsync -avz scripts/alert-monitor-email.sh ultimamilla:/root/scripts/

# O SSH + editar
ssh ultimamilla
nano /root/scripts/alert-monitor-email.sh
```

### 2. Hacer script ejecutable

```bash
ssh ultimamilla
chmod +x /root/scripts/alert-monitor-email.sh
```

### 3. Configurar correo

El script usa el comando `mail` del sistema. Debe estar configurado:

```bash
ssh ultimamilla

# Verificar mail está instalado
which mail

# Si no existe, instalarlo (en Debian/Ubuntu):
apt-get install mailutils

# Configurar postfix/sendmail para enviar emails
# (postfix debe estar configurado para tu dominio)
```

### 4. Probar script manualmente

```bash
ssh ultimamilla

# Test rápido
/root/scripts/alert-monitor-email.sh

# Ver logs
tail -f /var/log/alert-monitor.log
```

### 5. Instalar cron job

```bash
ssh ultimamilla

# Abrir crontab
crontab -e

# Agregar línea (ejecutar cada 10 minutos):
*/10 * * * * /root/scripts/alert-monitor-email.sh >> /var/log/alert-monitor-cron.log 2>&1

# Verificar cron está activo
systemctl status cron
# o
systemctl status crond
```

## Configuración

### Cambiar email de alertas

Opción 1: Variable de ambiente

```bash
# En crontab
*/10 * * * * ALERT_EMAIL="admin@empresa.com" /root/scripts/alert-monitor-email.sh

# O en .bashrc
export ALERT_EMAIL="admin@empresa.com"
```

Opción 2: Editar script

```bash
# Línea 23 en alert-monitor-email.sh
ALERT_EMAIL="${ALERT_EMAIL:-admin@empresa.com}"
```

### Cambiar umbral de memoria

Editar línea 29:

```bash
ALERT_THRESHOLD_MEMORY="85"  # Cambiar a 80, 75, etc.
```

### Cambiar período de consolidación

Editar línea 30:

```bash
ALERT_CONSOLIDATE_HOURS="6"  # Cambiar a 2, 4, 8, 12, etc.
```

## Comportamiento

### Escenario 1: Todo OK
```
[10:00] Sistema healthy - sin alertas
[10:10] Sistema healthy - sin alertas
[10:20] Sistema healthy - sin alertas
→ Sin correos
```

### Escenario 2: Warning recurrente
```
[10:00] Sistema degraded - buffered
[10:10] Sistema degraded - buffered
[10:20] Sistema degraded - buffered
[16:00] 6 horas después → ENVÍA CORREO CON RESUMEN
```

### Escenario 3: Crítico
```
[10:00] Memoria 90% > 85% → ENVÍA CORREO INMEDIATO
[10:05] Segundo check → buffered
[10:15] Más de 10 min sin crítico → buffered para próxima consolidación
```

### Escenario 4: Service offline
```
[15:30] pm2 sgi process offline → ENVÍA CORREO INMEDIATO
[15:40] Service vuelve online → Registra en logs
[16:00] Consolidación → Resumen si hay más warnings
```

## Archivos Generados

```
/var/log/alert-monitor.log          # Log principal de alertas
/var/log/alert-monitor-cron.log     # Log de ejecución cron
/tmp/alert-state.json               # Estado persistente (último email, etc)
```

## Ejemplo de Email Recibido

```
Asunto: Alert: ULTIMA MILLA System Status 2025-12-15

═══════════════════════════════════════════════════════════
  ULTIMA MILLA System Alert
  Alert Report - 2025-12-15 16:00:00 UTC
═══════════════════════════════════════════════════════════

Health Status:    CRITICAL
Memory Usage:     88%

────────────────────────────────────────────────────────────
🔴 CRITICAL: Memory Usage 88%
Memory is above 85% threshold. System performance may be degraded.

────────────────────────────────────────────────────────────
⚠️ WARNING: System Degraded
System health is degraded. Review recent logs.

────────────────────────────────────────────────────────────

Automated alert from https://ultimamilla.com.ar/status
Report generated at 2025-12-15 16:00:00 UTC
```

## Solución de Problemas

### No llegan correos

1. **Verificar mail instalado**
   ```bash
   which mail
   apt-get install mailutils  # Si no existe
   ```

2. **Verificar postfix/sendmail**
   ```bash
   systemctl status postfix
   tail -f /var/log/mail.log
   ```

3. **Test manual de mail**
   ```bash
   echo "Test" | mail -s "Test Alert" devops@ultimamilla.com.ar
   ```

4. **Ver logs de alert-monitor**
   ```bash
   tail -f /var/log/alert-monitor.log
   tail -f /var/log/alert-monitor-cron.log
   ```

### API timeout

Si `/api/status.json` no responde:

```bash
# Test API
curl http://localhost:4321/api/status.json

# Ver logs Astro
pm2 logs astro-ultimamilla

# Reiniciar
pm2 restart astro-ultimamilla
```

### Cron no ejecuta

```bash
# Verificar crontab
crontab -l

# Verificar cron servicio
systemctl status cron
systemctl enable cron

# Ver logs de cron
grep CRON /var/log/syslog | tail -20
```

## Integración con Slack (Opcional)

Para enviar a Slack en lugar de email, modificar función `send_email_alert()`:

```bash
# Cambiar en alert-monitor-email.sh
send_email_alert() {
  local subject="$1"
  local body="$2"

  # Enviar a Slack webhook
  curl -X POST -H 'Content-type: application/json' \
    --data "$(build_slack_payload "$subject" "$body")" \
    "$SLACK_WEBHOOK_URL"
}
```

## Monitoreo del Monitoreo

Verificar que el sistema de alertas está activo:

```bash
# Debe haber ejecuciones recientes
tail -f /var/log/alert-monitor.log

# Debe mostrar últimas 10 minutos
ls -lt /tmp/alert-state.json

# Cron debe estar ejecutando
systemctl status cron
```

## Logs de Referencia

Ver historial de alertas:

```bash
# Últimas 20 alertas
tail -20 /var/log/alert-monitor.log

# Solo críticas
grep "CRITICAL" /var/log/alert-monitor.log

# Estadísticas por día
grep "Starting alert monitor" /var/log/alert-monitor.log | wc -l
```

---

**Nota**: Este sistema es de bajo overhead (~100ms por ejecución, sin impacto en rendimiento).
