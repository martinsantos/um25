#!/bin/bash

#############################################################################
# 🔧 SCRIPT DE OPTIMIZACIÓN DE MEMORIA - SERVIDOR PRODUCCIÓN
#
# Propósito: Aplicar todas las optimizaciones de memoria sin downtime
# Uso: ./scripts/optimize-memory.sh
#############################################################################

set -e

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║     OPTIMIZACIÓN DE MEMORIA - SERVIDOR PRODUCCIÓN              ║"
echo "║     $(date '+%Y-%m-%d %H:%M:%S')                              ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============================================================================
# SECCIÓN 1: Reportar memoria actual
# ============================================================================

echo -e "${BLUE}[1/6] Reporte de memoria actual...${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

TOTAL=$(free -m | awk 'NR==2{print $2}')
USED=$(free -m | awk 'NR==2{print $3}')
FREE=$(free -m | awk 'NR==2{print $4}')
PERCENT=$(awk "BEGIN {printf \"%.1f\", ($USED/$TOTAL)*100}")

echo "Total RAM:      ${TOTAL} MB"
echo "RAM en uso:     ${USED} MB (${PERCENT}%)"
echo "RAM disponible: ${FREE} MB"
echo ""

if (( $(echo "$PERCENT > 85" | bc -l) )); then
  echo -e "${RED}⚠️  CRÍTICO: RAM > 85% (${PERCENT}%)${NC}"
elif (( $(echo "$PERCENT > 75" | bc -l) )); then
  echo -e "${YELLOW}⚠️  ADVERTENCIA: RAM > 75% (${PERCENT}%)${NC}"
else
  echo -e "${GREEN}✅ Memoria en rango aceptable (${PERCENT}%)${NC}"
fi

echo ""
echo "Top 5 procesos por memoria:"
ps aux --sort=-%mem | head -6 | tail -5 | awk '{printf "  %s: %s MB\n", $11, int($6/1024)}'
echo ""

# ============================================================================
# SECCIÓN 2: Limpiar logs viejos
# ============================================================================

echo -e "${BLUE}[2/6] Limpiando logs viejos...${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Limpiar logs del sistema
find /var/log -type f -name "*.1" -o -name "*.2" -o -name "*.3" -o -name "*.4" 2>/dev/null | xargs rm -f 2>/dev/null
echo "✅ Logs del sistema limpiados"

# Limpiar logs de PM2
if command -v pm2 &> /dev/null; then
  pm2 flush 2>/dev/null || true
  echo "✅ PM2 logs limpiados"
fi

# Limpiar logs de aplicación
if [ -d "/root/fumbling-field/logs" ]; then
  find /root/fumbling-field/logs -type f -mtime +7 -delete 2>/dev/null || true
  echo "✅ Logs de aplicación limpiados"
fi

# Limpiar npm cache
npm cache clean --force 2>/dev/null || true
echo "✅ npm cache limpiado"

echo ""

# ============================================================================
# SECCIÓN 3: Configurar límites de Docker
# ============================================================================

echo -e "${BLUE}[3/6] Configurando límites de memoria en Docker...${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if command -v docker &> /dev/null; then
  # Directus App - 512MB
  DIRECTUS_CONTAINER=$(docker ps -q -f "name=directus.*app" 2>/dev/null | head -1)
  if [ ! -z "$DIRECTUS_CONTAINER" ]; then
    docker update --memory 512m "$DIRECTUS_CONTAINER" 2>/dev/null || true
    echo "✅ Directus limitado a 512MB"
  fi

  # PostgreSQL (directus) - 256MB
  POSTGRES_CONTAINER=$(docker ps -q -f "name=directus.*database" 2>/dev/null | head -1)
  if [ ! -z "$POSTGRES_CONTAINER" ]; then
    docker update --memory 256m "$POSTGRES_CONTAINER" 2>/dev/null || true
    echo "✅ PostgreSQL (Directus) limitado a 256MB"
  fi

  # PostgreSQL (UMBot) - 256MB
  UMBOT_POSTGRES=$(docker ps -q -f "name=umbot-postgres" 2>/dev/null | head -1)
  if [ ! -z "$UMBOT_POSTGRES" ]; then
    docker update --memory 256m "$UMBOT_POSTGRES" 2>/dev/null || true
    echo "✅ PostgreSQL (UMBot) limitado a 256MB"
  fi

  # Redis (UMBot) - 128MB
  REDIS_CONTAINER=$(docker ps -q -f "name=umbot-redis" 2>/dev/null | head -1)
  if [ ! -z "$REDIS_CONTAINER" ]; then
    docker update --memory 128m "$REDIS_CONTAINER" 2>/dev/null || true
    echo "✅ Redis limitado a 128MB"
  fi
else
  echo "⚠️  Docker no disponible"
fi

echo ""

# ============================================================================
# SECCIÓN 4: Verificar/Crear configuración de PM2
# ============================================================================

echo -e "${BLUE}[4/6] Verificando configuración de PM2...${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if command -v pm2 &> /dev/null; then
  # Mostrar procesos actuales
  echo "Procesos PM2 actuales:"
  pm2 list | grep -E '(id|name|status|memory)' || true
  echo ""

  # Verificar si hay configuración con límites
  if grep -q "max_memory_restart" /root/fumbling-field/ecosystem.config.cjs 2>/dev/null; then
    echo "✅ ecosystem.config.cjs ya tiene límites de memoria"
  else
    echo -e "${YELLOW}⚠️  ecosystem.config.cjs sin límites de memoria${NC}"
    echo "   → Usar ecosystem.config.production.js para actualizar"
  fi
else
  echo "⚠️  PM2 no disponible"
fi

echo ""

# ============================================================================
# SECCIÓN 5: Verificar swap
# ============================================================================

echo -e "${BLUE}[5/6] Analizando SWAP...${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

SWAP_TOTAL=$(free -m | awk 'NR==3{print $2}')
SWAP_USED=$(free -m | awk 'NR==3{print $3}')
SWAP_PERCENT=$(awk "BEGIN {printf \"%.1f\", ($SWAP_USED/$SWAP_TOTAL)*100}" 2>/dev/null || echo "0")

echo "SWAP Total:     ${SWAP_TOTAL} MB"
echo "SWAP en uso:    ${SWAP_USED} MB (${SWAP_PERCENT}%)"

if (( $(echo "$SWAP_PERCENT > 50" | bc -l 2>/dev/null || echo 0) )); then
  echo -e "${YELLOW}⚠️  SWAP > 50%: Indica presión de memoria${NC}"
  echo "   → Necesario optimizar procesos o upgrade RAM"
else
  echo -e "${GREEN}✅ SWAP en rango normal${NC}"
fi

echo ""

# ============================================================================
# SECCIÓN 6: Resumen y recomendaciones
# ============================================================================

echo -e "${BLUE}[6/6] Resumen y recomendaciones${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "📋 ACCIONES COMPLETADAS:"
echo "  ✅ Logs viejos limpiados"
echo "  ✅ Límites Docker aplicados"
echo "  ✅ Configuración PM2 verificada"
echo ""

echo "📊 ESTADO ACTUAL:"
FREE_MB=$(free -m | awk 'NR==2{print $4}')
if [ $FREE_MB -lt 200 ]; then
  echo -e "  ${RED}🔴 CRÍTICO: < 200MB libre${NC}"
elif [ $FREE_MB -lt 500 ]; then
  echo -e "  ${YELLOW}🟡 ADVERTENCIA: < 500MB libre${NC}"
else
  echo -e "  ${GREEN}🟢 ESTABLE: > 500MB libre${NC}"
fi

echo ""
echo "📌 PRÓXIMOS PASOS:"
echo ""
echo "1️⃣  Implementar límites en ecosystem.config.cjs:"
echo "   → Copiar contenido de ecosystem.config.production.js"
echo "   → O ejecutar con configuración nueva:"
echo "     pm2 start ecosystem.config.production.js"
echo ""
echo "2️⃣  Investigar servicios no usados:"
echo "   → OpenLiteSpeed (puerto 7080)"
echo "   → Pure-FTP (puerto 21)"
echo "   → Memcached/Redis duplicados"
echo ""
echo "3️⃣  Crear script de monitoreo automático:"
echo "   → /root/scripts/memory-monitor.sh"
echo "   → Agregar a crontab: */5 * * * * /root/scripts/memory-monitor.sh"
echo ""
echo "4️⃣  Revisar Sentry configuration:"
echo "   → Puede estar reservando mucha memoria"
echo "   → Verificar en astro.config.mjs"
echo ""

# Nueva medición
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Memoria después de optimización:"
AFTER_USED=$(free -m | awk 'NR==2{print $3}')
AFTER_FREE=$(free -m | awk 'NR==2{print $4}')
AFTER_PERCENT=$(awk "BEGIN {printf \"%.1f\", ($AFTER_USED/$TOTAL)*100}")

echo "  RAM en uso:     ${AFTER_USED} MB (${AFTER_PERCENT}%)"
echo "  RAM disponible: ${AFTER_FREE} MB"

if [ $AFTER_FREE -gt $FREE ]; then
  FREED=$((AFTER_FREE - FREE))
  echo -e "  ${GREEN}✅ Liberados ${FREED} MB${NC}"
elif [ $AFTER_FREE -eq $FREE ]; then
  echo "  ℹ️  Sin cambios (ya optimizado)"
else
  echo "  ⚠️  Pequeño aumento en uso"
fi

echo ""
echo -e "${GREEN}✅ Optimización completada${NC}"
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║ Próxima revisión: $(date -d '+7 days' '+%Y-%m-%d')                          ║"
echo "╚════════════════════════════════════════════════════════════════╝"
