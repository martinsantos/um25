# 📊 ANÁLISIS DETALLADO DE CONSUMO DE MEMORIA - SERVIDOR PRODUCCIÓN

**Fecha**: 2025-12-16
**Servidor**: 23.105.176.45
**RAM Total**: 3.6 GB
**RAM Disponible**: 400 MB (11%)
**Status**: ⚠️ CRÍTICO - En saturación constante

---

## 🔴 ESTADO ACTUAL - CRÍTICO

```
┌─────────────────────────────────────────┐
│  MEMORIA TOTAL: 3.6 GB                  │
├─────────────────────────────────────────┤
│  Usado:        3.2 GB (89%)  █████████░ │
│  Disponible:   400 MB (11%)  ░         │
│  Buffer/Cache: 474 MB                   │
│  Swap Usado:   939 MB / 1.9 GB          │
└─────────────────────────────────────────┘
```

### ⚠️ Problemas:
- **Solo 158 MB libres** (alarma roja)
- **939 MB en SWAP** (ralentización permanente)
- **Próximas horas**: Riesgo de OOM Killer
- **Causa principal**: VSZ anormalmente alto en Astro (22.9GB)

---

## 🎯 CONSUMO POR SERVICIO

### Top 3 Consumidores de Memoria (RSS - Uso Real):

| Ranking | Proceso | RSS | % | VSZ | Problema |
|---------|---------|-----|---|-----|----------|
| 1 🔴 | **Directus (node)** | 106 MB | 2.8% | 13.4 GB | Alto VSZ |
| 2 🔴 | **Astro (node)** | 82 MB | 2.1% | 22.9 GB | **VSZ CRÍTICO** |
| 3 🟡 | **RW-Core (node)** | 58 MB | 1.5% | 1.1 GB | Moderado |
| 4 🟡 | **SGI (node)** | 33 MB | 0.8% | 1.3 GB | OK |
| 5 🟡 | **MariaDB** | 28 MB | 0.7% | 1.5 GB | OK |

### Docker Containers:

| Container | Uso Real | % | Límite |
|-----------|----------|---|--------|
| Directus App | 120.8 MB | 3.30% | Sin límite |
| PostgreSQL | 54.84 MB | 1.50% | Sin límite |
| Redis | 7.6 MB | 0.21% | Sin límite |
| **Total Docker** | **~195 MB** | **5.3%** | **Sin límites configurados** |

### PHP-FPM (WordPress):

| Process | RSS | Cantidad |
|---------|-----|----------|
| php-fpm pool www | 14-26 MB | 8 procesos |
| **Total PHP-FPM** | **~150 MB** | **Activos** |

### Otros Servicios:

| Servicio | RSS | Notas |
|----------|-----|-------|
| PM2 Daemon | 23 MB | Necesario |
| CyberCP/Python | 14 MB | Panel control |
| Docker Daemon | 28 MB | Necesario |
| Nginx | ~27 MB | Proxy reverso |
| Redis (host) | ? | Running on 127.0.0.1:6379 |
| Memcached | ? | Running on 127.0.0.1:11211 |

---

## 🚨 PROBLEMAS IDENTIFICADOS

### Problema #1: VSZ ANORMALMENTE ALTO EN ASTRO
```
Astro Node Process:
  RSS: 82 MB     ✅ (Razonable)
  VSZ: 22.9 GB   🔴 (ANORMAL - 279x más grande)

Comparación:
  Directus: 106 MB RSS vs 13.4 GB VSZ (127x)
  Normal:   ~2-5x
  Astro:    279x (GRAVE)
```

**Causa Probable**:
- Heap size no configurado → Node toma todo lo disponible
- Sentry integration puede reservar mucha memoria
- Build bundle con muchas dependencias
- V8 snapshot reserves memory upfront

**Impacto**: Si el proceso trata de usar ese VSZ, el sistema colapsará

---

### Problema #2: NO HAY LÍMITES DE MEMORIA EN NINGÚN SERVICIO

```bash
# Astro - PM2
❌ Sin configuración de límites
❌ Sin flags NODE_OPTIONS
❌ VSZ ilimitado

# Docker Containers
❌ Sin --memory limits
❌ Sin --memory-swap limits
❌ Sin --oom-kill-disable

# PHP-FPM
❌ Sin max_children configurado
❌ Pool sin límites de workers
```

**Impacto**: Un proceso puede consumir toda la RAM disponible

---

### Problema #3: CONSUMO FRAGMENTADO ENTRE MÚLTIPLES RUNTIMES

```
Servicios Node.js en el servidor:
  ├── Astro (82 MB)
  ├── Directus (106 MB)
  ├── RW-Core (58 MB)
  ├── SGI (33 MB)
  ├── PM2 Daemon (23 MB)
  ├── PM2 Runtime (14 MB)
  └── Total: ~316 MB solo Node.js

Servicios Python:
  ├── CyberCP FastAPI (14 MB)
  └── RW-Core Python (?)

Sistema: OpenLiteSpeed, PHP-FPM, Redis, Memcached, etc.
```

**Impacto**: Mucha fragmentación, muchos runtimes

---

### Problema #4: SWAP EN USO PERMANENTE

```
Swap Usado: 939 MB / 1.9 GB (49%)

Problema:
  - Acceso a SWAP es 100x más lento que RAM
  - Indica que RAM está saturada
  - Afecta performance de TODOS los servicios
```

---

## 💡 RECOMENDACIONES DE OPTIMIZACIÓN

### CORTO PLAZO (Inmediato - Sin costo)

#### 1. ✅ Configurar Límites de Memoria en PM2 (CRÍTICO)

**Archivo**: `/root/fumbling-field/ecosystem.config.cjs`

```javascript
module.exports = {
  apps: [
    {
      name: 'astro-ultimamilla',
      script: './dist/server/entry.mjs',
      env: {
        NODE_OPTIONS: '--max-old-space-size=256',  // Limitar a 256MB heap
        NODE_ENV: 'production',
        PORT: 4321
      },
      max_memory_restart: '320M',  // Reiniciar si supera 320MB
      instances: 1,
      exec_mode: 'fork'
    }
  ]
};
```

**Impacto**:
- ✅ Previene que Astro use 22.9GB de VSZ
- ✅ Auto-restart si memory leak
- ✅ 0% costo

---

#### 2. ✅ Configurar Límites en Docker Containers

```bash
# Directus - Limitar a 512MB
docker update --memory 512m directus-admin-directus-app-1

# PostgreSQL - Limitar a 256MB
docker update --memory 256m directus-admin-database-1

# Redis - Limitar a 128MB
docker update --memory 128m umbot-redis-prod

# PostgreSQL umbot - Limitar a 256MB
docker update --memory 256m umbot-postgres-prod
```

**Impacto**:
- ✅ Previene que contenedores usen RAM sin límites
- ✅ Fuerza OOM kill antes que afecte todo el sistema
- ✅ 0% costo, sin downtime

---

#### 3. ✅ Verificar y Limpiar Logs

```bash
# Ver tamaño de logs
du -sh /var/log/*
du -sh /root/fumbling-field/logs/

# Limpiar logs viejos
find /var/log -name "*.1" -o -name "*.2" | xargs rm -f
pm2 flush
```

**Impacto**:
- ✅ Puede liberar 50-200MB
- ✅ 0% costo, operación segura

---

#### 4. ✅ Deshabilitar Servicios No Usados

```bash
# Verificar qué está corriendo
ps aux | grep -E 'openlitespeed|pure-ftpd|pdns|dkim|memcached'

# Detener servicios no necesarios (si aplica)
# systemctl stop servicioname
# systemctl disable servicioname
```

**Investigar**:
- OpenLiteSpeed (puerto 7080) - ¿Se usa?
- Pure-FTP (puerto 21) - ¿Se usa?
- PDNS (puerto 53) - ¿Se usa?
- Memcached - ¿Realmente se usa?

---

#### 5. ✅ Optimizar Node.js

```bash
# Agregar a ecosystem.config.cjs todos los apps:
env: {
  NODE_OPTIONS: '--max-old-space-size=256 --enable-source-maps',
  NODE_ENV: 'production'
}

# O configurar a nivel de sistema en /root/.bashrc:
export NODE_OPTIONS="--max-old-space-size=256"
```

**Impacto**:
- ✅ Reduce VSZ dramáticamente
- ✅ Previene memory leaks
- ✅ 0% costo

---

### MEDIANO PLAZO (1-2 semanas)

#### 6. 🔄 Optimizar Astro Bundle

**Problemas potenciales**:
- ❓ Sentry integration reservando mucha memoria
- ❓ Muchas dependencias no usadas
- ❓ Build bundle muy grande

**Acciones**:
```bash
# Analizar tamaño del build
cd /root/fumbling-field
npm ls --depth=0

# Auditar dependencias no usadas
npm audit
npx depcheck

# Medir tamaño final
du -sh dist/
ls -lh dist/server/entry.mjs
```

**Potencial**: 20-50MB de ahorro

---

#### 7. 🔄 Configurar Alertas

```bash
# Script para monitorear y alertar
cat > /root/scripts/memory-alert.sh << 'EOF'
#!/bin/bash
THRESHOLD=85
CURRENT=$(free | awk 'NR==2{print int($3/$2 * 100)}')

if [ $CURRENT -gt $THRESHOLD ]; then
  echo "ALERTA: Memoria al ${CURRENT}%" | mail -s "Memory Alert" devops@ultimamilla.com.ar
  # Auto-restart risky processes
  pm2 restart astro-ultimamilla
fi
EOF

# Agregar a crontab
crontab -e
# */5 * * * * /root/scripts/memory-alert.sh
```

---

#### 8. 🔄 Implementar Caching Mejorado

```bash
# Verificar Redis está optimizado
redis-cli INFO memory

# Configurar eviction policy si es necesario
redis-cli CONFIG SET maxmemory-policy allkeys-lru
```

---

### LARGO PLAZO (1-3 meses)

#### 9. 🚀 Considerar Upgrade de Servidor

**Situación actual**:
- 3.6 GB RAM en 2025 es muy poco
- Servicios requieren: Astro (100MB), Directus (150MB), Docker (200MB), PHP (150MB)
- Solo quedan ~1GB para OS y buffer

**Opciones**:
1. **Upgrade a 8GB RAM** (~$15/mes extra)
   - Resuelve problema de raíz
   - Cada servicio tendría espacio
   - Mejor performance

2. **Separar servicios**:
   - Directus en servidor separado
   - O usar CDN para static files

---

#### 10. 🔍 Refactorizar Arquitectura

```
ACTUAL (Monolítica):
  3.6GB servidor único
  └─ Astro, Directus, SGI, PHP, Docker

PROPUESTO (Escalado):
  8GB Principal: Astro + Nginx
  8GB Docker: Directus + PostgreSQL
  4GB SGI: Sistema Gestión
```

---

## 📋 PLAN DE ACCIÓN INMEDIATO

### Hoy (2025-12-16):

1. **✅ Configurar límites PM2** (5 min)
   ```bash
   # Editar /root/fumbling-field/ecosystem.config.cjs
   # Agregar: max_memory_restart: '320M'
   # Agregar: NODE_OPTIONS con max-old-space-size=256
   ```

2. **✅ Configurar límites Docker** (5 min)
   ```bash
   docker update --memory 512m directus-admin-directus-app-1
   docker update --memory 256m directus-admin-database-1
   ```

3. **✅ Crear script de monitoreo** (10 min)
   ```bash
   /root/scripts/memory-monitor.sh
   crontab para ejecutar cada 5 min
   ```

4. **⏰ Investigar servicios innecesarios** (15 min)
   ```bash
   # ¿Se usa OpenLiteSpeed?
   # ¿Se usa Pure-FTP?
   # ¿Se usa Memcached?
   ```

### Resultado esperado:
- 🎯 VSZ de Astro: 22.9GB → 512MB (98% reducción)
- 🎯 RAM disponible: 400MB → 600-800MB
- 🎯 Swap usage: 939MB → ~0MB
- 🎯 Health: CRÍTICO → ESTABLE

---

## 📊 ANTES vs DESPUÉS (Estimado)

### ANTES (Ahora):
```
Memoria Disponible: 158 MB ❌ CRÍTICO
VSZ Astro:        22.9 GB ❌ PELIGROSO
Procesos:         No limitados
Swap en uso:      939 MB ❌ RALENTIZACIÓN
Health:           Riesgo OOM Killer
```

### DESPUÉS (Con cambios):
```
Memoria Disponible: 600-800 MB ✅ ESTABLE
VSZ Astro:        512 MB ✅ CONTROLADO
Procesos:         Limitados y monitoreados
Swap en uso:      0-100 MB ✅ NORMAL
Health:           ESTABLE - Sin riesgos
```

---

## 🔧 CHECKLIST DE IMPLEMENTACIÓN

- [ ] Configurar PM2 memory limits
- [ ] Configurar Docker memory limits
- [ ] Crear monitoring script
- [ ] Limpiar logs viejos
- [ ] Investigar servicios no usados
- [ ] Verificar Sentry configuration
- [ ] Auditar dependencias Node.js
- [ ] Documentar en .agent/rules/

---

**Próxima revisión**: 2025-12-17 (Post-implementación)

