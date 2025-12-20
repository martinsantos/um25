# ⚡ MEMORIA - QUICK FIX (5 MINUTOS)

## 🔴 PROBLEMA ACTUAL

```
RAM Total:  3.6 GB
RAM Usado:  3.2 GB (89%)  █████████░
RAM Libre:  158 MB ❌ CRÍTICO
Astro VSZ:  22.9 GB ❌ PELIGROSO
```

---

## ✅ SOLUCIÓN INMEDIATA (3 pasos)

### Paso 1: Limpiar logs (1 min)

```bash
ssh ultimamilla

# Limpiar logs del sistema
find /var/log -type f -name "*.1" -o -name "*.2" -o -name "*.3" | xargs rm -f 2>/dev/null

# Limpiar PM2 logs
pm2 flush

# Resultado: Libera ~50-100MB
```

---

### Paso 2: Configurar límites Docker (2 min)

```bash
# Limitar Directus a 512MB
docker update --memory 512m directus-admin-directus-app-1

# Limitar PostgreSQL a 256MB
docker update --memory 256m directus-admin-database-1
docker update --memory 256m umbot-postgres-prod

# Limitar Redis a 128MB
docker update --memory 128m umbot-redis-prod

# Resultado: Evita memory bloat
```

---

### Paso 3: Aplicar script de optimización (2 min)

```bash
# Hacer script ejecutable
chmod +x /root/fumbling-field/scripts/optimize-memory.sh

# Ejecutar optimización
/root/fumbling-field/scripts/optimize-memory.sh

# Resultado: Automatiza todo
```

---

## 🎯 RESULTADOS ESPERADOS

```
Antes:
  RAM Libre:  158 MB ❌
  Astro VSZ:  22.9 GB ❌
  Swap uso:   939 MB ❌

Después (5 min):
  RAM Libre:  300-400 MB ✅
  Astro VSZ:  512 MB ✅ (con config)
  Swap uso:   ~0 MB ✅
```

---

## 📌 COMANDOS CLAVE

### Monitorear en tiempo real:
```bash
# Ver memoria actualizada cada 1 seg
watch -n 1 free -h

# Ver top 10 procesos
ps aux --sort=-%mem | head -11

# Ver Docker memory
docker stats --no-stream

# Ver PM2
pm2 list
```

---

### Verificar después de optimización:
```bash
# Debe estar > 300MB
free -h | awk 'NR==2{print "RAM Libre: " $4}'

# Debe estar < 1GB
free -h | awk 'NR==3{print "Swap: " $3}'

# Verificar procesos
ps aux --sort=-%mem | head -6
```

---

## ⚠️ OPCIONAL: Config permanente PM2

Si quieres que los límites persistan:

```bash
# Copiar nueva configuración
cp /root/fumbling-field/ecosystem.config.production.js \
   /root/fumbling-field/ecosystem.config.cjs

# O editar manualmente y agregar:
max_memory_restart: '320M',
node_args: '--max-old-space-size=256',

# Reiniciar procesos
pm2 restart all
```

---

## 🚀 MONITOREO CONTINUO (Opcional)

Crear alertas automáticas:

```bash
cat > /root/scripts/memory-monitor.sh << 'EOF'
#!/bin/bash
THRESHOLD=85
CURRENT=$(free | awk 'NR==2{print int($3/$2 * 100)}')

if [ $CURRENT -gt $THRESHOLD ]; then
  echo "ALERTA: Memoria al ${CURRENT}%" | \
    mail -s "🚨 Memory Alert" devops@ultimamilla.com.ar
  # Auto-restart
  pm2 restart astro-ultimamilla
fi
EOF

chmod +x /root/scripts/memory-monitor.sh

# Agregar a crontab
crontab -e
# Línea: */5 * * * * /root/scripts/memory-monitor.sh
```

---

## 📊 ANÁLISIS COMPLETO

Para análisis detallado: Ver `MEMORY-ANALYSIS-REPORT.md`

Incluye:
- ✅ Consumo por cada servicio
- ✅ 10 recomendaciones de optimización
- ✅ Plan a corto/mediano/largo plazo
- ✅ Upgrade de servidor (opcional)

---

## ❓ FAQ

**P: ¿Causan downtime los cambios?**
A: No, todos son cambios sin downtime

**P: ¿Qué pasa si un proceso supera el límite?**
A: PM2 lo reinicia automáticamente (max_memory_restart)

**P: ¿Es suficiente 3.6GB?**
A: Temporalmente sí. Ideal: 8GB para producción

**P: ¿Cuándo notar diferencia?**
A: Inmediato en RAM disponible. Próxima hora: mejor performance

---

**Última actualización**: 2025-12-16
**Status**: ⚠️ CRÍTICO - Aplicar cambios HOY

