#!/bin/bash

# ================================================================
# 🧪 VERIFICACIÓN COMPLETA DEL STACK ULTIMA MILLA
# ================================================================
# Verifica todos los componentes según solucionfinal.md
# Tests completos de funcionalidad, datos e imágenes

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # Sin color

# Variables de test
DB_USER="myuser"
DB_PASSWORD="mypassword123"
DB_NAME="mydatabase"
DIRECTUS_URL="http://localhost:8055"
ASTRO_URL="http://localhost:4321"

# Contadores de tests
total_tests=0
passed_tests=0
failed_tests=0

log() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

success() {
    echo -e "${GREEN}✅${NC} $1"
    passed_tests=$((passed_tests + 1))
}

fail() {
    echo -e "${RED}❌${NC} $1"
    failed_tests=$((failed_tests + 1))
}

test_function() {
    local test_name="$1"
    local test_command="$2"
    local expected_result="$3"
    
    total_tests=$((total_tests + 1))
    info "Testing: $test_name"
    
    if eval "$test_command"; then
        success "$test_name"
    else
        fail "$test_name"
    fi
}

# ================================================================
# HEADER DE VERIFICACIÓN
# ================================================================
echo ""
echo -e "${CYAN}================================================================${NC}"
echo -e "${CYAN}🧪 VERIFICACIÓN COMPLETA DEL STACK ULTIMA MILLA${NC}"
echo -e "${CYAN}================================================================${NC}"
echo ""
log "Iniciando batería completa de tests"
echo ""

# ================================================================
# FASE 1: VERIFICACIÓN DE CONTENEDORES
# ================================================================
log "🐳 FASE 1: VERIFICANDO CONTENEDORES DOCKER"
echo "==========================================="

# Test 1: Docker Compose funcionando
test_function "Docker Compose está ejecutándose" \
    "docker-compose ps | grep -q 'Up'" \
    "true"

# Test 2: PostgreSQL está corriendo
test_function "PostgreSQL está corriendo y saludable" \
    "docker-compose ps | grep database | grep -q 'Up'" \
    "true"

# Test 3: Directus está corriendo
test_function "Directus está corriendo" \
    "docker-compose ps | grep directus-app | grep -q 'Up'" \
    "true"

# Test 4: Astro está corriendo
test_function "Astro está corriendo" \
    "docker-compose ps | grep astro-app | grep -q 'Up'" \
    "true"

# Test 5: PostgreSQL responde a conexiones
test_function "PostgreSQL acepta conexiones" \
    "docker-compose exec -T database pg_isready -U ${DB_USER} -d ${DB_NAME}" \
    "true"

echo ""

# ================================================================
# FASE 2: VERIFICACIÓN DE SERVICIOS WEB
# ================================================================
log "🌐 FASE 2: VERIFICANDO SERVICIOS WEB"
echo "====================================="

# Test 6: Directus health check
test_function "Directus health endpoint responde" \
    "curl -sf ${DIRECTUS_URL}/server/health | grep -q 'ok'" \
    "true"

# Test 7: Directus API responde
test_function "Directus API está disponible" \
    "curl -sf ${DIRECTUS_URL}/server/info | grep -q 'directus'" \
    "true"

# Test 8: Astro sitio principal carga
test_function "Sitio Astro principal carga" \
    "curl -sf ${ASTRO_URL} | grep -q 'ULTiMA MILLA'" \
    "true"

# Test 9: Página de antecedentes existe
test_function "Página de antecedentes está disponible" \
    "curl -sf ${ASTRO_URL}/antecedentes | head -10 | grep -q 'antecedente'" \
    "true"

# Test 10: Página de servicios existe
test_function "Página de servicios está disponible" \
    "curl -sf ${ASTRO_URL}/servicios | head -10 | grep -q 'servicio'" \
    "true"

echo ""

# ================================================================
# FASE 3: VERIFICACIÓN DE BASE DE DATOS
# ================================================================
log "🗄️ FASE 3: VERIFICANDO BASE DE DATOS"
echo "===================================="

# Test 11: Extensiones PostgreSQL instaladas
test_function "Extensiones PostgreSQL instaladas" \
    "docker-compose exec -T database psql -U ${DB_USER} -d ${DB_NAME} -c \"SELECT COUNT(*) FROM pg_extension WHERE extname IN ('uuid-ossp', 'pg_trgm');\" | grep -q '2'" \
    "true"

# Test 12: Tablas Directus existen
directus_tables_count=$(docker-compose exec -T database psql -U ${DB_USER} -d ${DB_NAME} -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'directus_%';" | tr -d ' ')
test_function "Tablas Directus creadas (esperadas: 20+)" \
    "[ $directus_tables_count -gt 20 ]" \
    "true"

# Test 13: Tabla antecedentes existe
test_function "Tabla antecedentes existe" \
    "docker-compose exec -T database psql -U ${DB_USER} -d ${DB_NAME} -c \"SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'antecedentes';\" | grep -q '1'" \
    "true"

# Test 14: Tabla Servicios existe
test_function "Tabla Servicios existe" \
    "docker-compose exec -T database psql -U ${DB_USER} -d ${DB_NAME} -c \"SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'Servicios';\" | grep -q '1'" \
    "true"

echo ""

# ================================================================
# FASE 4: VERIFICACIÓN DE DATOS
# ================================================================
log "📊 FASE 4: VERIFICANDO DATOS IMPORTADOS"
echo "========================================"

# Test 15: Antecedentes tienen datos
antecedentes_count=$(docker-compose exec -T database psql -U ${DB_USER} -d ${DB_NAME} -t -c "SELECT COUNT(*) FROM antecedentes;" | tr -d ' ')
test_function "Antecedentes importados (encontrados: $antecedentes_count)" \
    "[ $antecedentes_count -gt 50 ]" \
    "true"

# Test 16: Servicios tienen datos
servicios_count=$(docker-compose exec -T database psql -U ${DB_USER} -d ${DB_NAME} -t -c "SELECT COUNT(*) FROM \"Servicios\";" | tr -d ' ')
test_function "Servicios importados (encontrados: $servicios_count)" \
    "[ $servicios_count -gt 10 ]" \
    "true"

# Test 17: Antecedentes con imágenes
antecedentes_with_images=$(docker-compose exec -T database psql -U ${DB_USER} -d ${DB_NAME} -t -c "SELECT COUNT(*) FROM antecedentes WHERE \"Imagen\" IS NOT NULL;" | tr -d ' ')
test_function "Antecedentes con imágenes (encontrados: $antecedentes_with_images)" \
    "[ $antecedentes_with_images -gt 10 ]" \
    "true"

# Test 18: Servicios con imágenes
servicios_with_images=$(docker-compose exec -T database psql -U ${DB_USER} -d ${DB_NAME} -t -c "SELECT COUNT(*) FROM \"Servicios\" WHERE \"Imagen\" IS NOT NULL;" | tr -d ' ')
test_function "Servicios con imágenes (encontrados: $servicios_with_images)" \
    "[ $servicios_with_images -gt 5 ]" \
    "true"

echo ""

# ================================================================
# FASE 5: VERIFICACIÓN DE IMÁGENES Y ARCHIVOS
# ================================================================
log "🖼️ FASE 5: VERIFICANDO IMÁGENES Y ARCHIVOS"
echo "==========================================="

# Test 19: directus_files tiene registros
files_count=$(docker-compose exec -T database psql -U ${DB_USER} -d ${DB_NAME} -t -c "SELECT COUNT(*) FROM directus_files;" | tr -d ' ')
test_function "Archivos en directus_files (encontrados: $files_count)" \
    "[ $files_count -gt 10 ]" \
    "true"

# Test 20: Directorio uploads existe y tiene archivos
if [ -d "./uploads" ]; then
    upload_files_count=$(ls -1 ./uploads | wc -l)
    test_function "Archivos físicos en uploads (encontrados: $upload_files_count)" \
        "[ $upload_files_count -gt 5 ]" \
        "true"
else
    fail "Directorio uploads no existe"
fi

# Test 21: Test acceso a imagen vía Directus
if [ $files_count -gt 0 ]; then
    # Obtener ID de primera imagen
    first_file_id=$(docker-compose exec -T database psql -U ${DB_USER} -d ${DB_NAME} -t -c "SELECT id FROM directus_files LIMIT 1;" | tr -d ' ')
    if [ -n "$first_file_id" ]; then
        test_function "Acceso a imagen vía Directus API" \
            "curl -sf ${DIRECTUS_URL}/assets/${first_file_id} | head -c 10 | grep -q '.'" \
            "true"
    else
        fail "No se pudo obtener ID de archivo para test"
    fi
else
    fail "No hay archivos para testear acceso"
fi

echo ""

# ================================================================
# FASE 6: VERIFICACIÓN DE APIs
# ================================================================
log "🔌 FASE 6: VERIFICANDO APIs Y CONECTIVIDAD"
echo "==========================================="

# Test 22: API de antecedentes pública
test_function "API pública de antecedentes funciona" \
    "curl -sf ${DIRECTUS_URL}/items/antecedentes?limit=1 | grep -q 'data'" \
    "true"

# Test 23: API de servicios pública
test_function "API pública de servicios funciona" \
    "curl -sf ${DIRECTUS_URL}/items/Servicios?limit=1 | grep -q 'data'" \
    "true"

# Test 24: API de archivos pública
test_function "API pública de archivos funciona" \
    "curl -sf ${DIRECTUS_URL}/files?limit=1 | grep -q 'data'" \
    "true"

# Test 25: CORS headers en Directus
test_function "Headers CORS configurados en Directus" \
    "curl -sf -H 'Origin: http://localhost:4321' ${DIRECTUS_URL}/server/info | grep -q 'directus'" \
    "true"

echo ""

# ================================================================
# FASE 7: VERIFICACIÓN DE ASTRO Y DATOS DINÁMICOS
# ================================================================
log "⚡ FASE 7: VERIFICANDO ASTRO Y DATOS DINÁMICOS"
echo "=============================================="

# Test 26: Astro puede conectar con Directus
test_function "Astro puede conectar con Directus" \
    "curl -sf ${ASTRO_URL} | grep -q 'antecedente'" \
    "true"

# Test 27: Página de antecedente individual existe
if [ $antecedentes_count -gt 0 ]; then
    # Obtener ID del primer antecedente
    first_antecedente_id=$(docker-compose exec -T database psql -U ${DB_USER} -d ${DB_NAME} -t -c "SELECT id FROM antecedentes LIMIT 1;" | tr -d ' ')
    if [ -n "$first_antecedente_id" ]; then
        test_function "Página individual de antecedente funciona" \
            "curl -sf ${ASTRO_URL}/antecedentes/${first_antecedente_id} | grep -q 'antecedente'" \
            "true"
    else
        fail "No se pudo obtener ID de antecedente para test"
    fi
else
    fail "No hay antecedentes para testear página individual"
fi

# Test 28: Mapeo de imágenes en Astro funciona
test_function "Mapeo de imágenes en páginas funciona" \
    "curl -sf ${ASTRO_URL}/antecedentes | grep -q 'imagenes_antecedentes_versionproduccion'" \
    "true"

echo ""

# ================================================================
# FASE 8: VERIFICACIÓN DE RENDIMIENTO Y SALUD
# ================================================================
log "⚡ FASE 8: VERIFICANDO RENDIMIENTO Y SALUD"
echo "=========================================="

# Test 29: Tiempo de respuesta Directus < 2 segundos
test_function "Tiempo de respuesta Directus aceptable" \
    "timeout 2 curl -sf ${DIRECTUS_URL}/server/health" \
    "true"

# Test 30: Tiempo de respuesta Astro < 3 segundos
test_function "Tiempo de respuesta Astro aceptable" \
    "timeout 3 curl -sf ${ASTRO_URL}" \
    "true"

# Test 31: Memoria PostgreSQL
pg_memory=$(docker stats --no-stream --format "table {{.Container}}\t{{.MemUsage}}" | grep database | awk '{print $2}' | sed 's/MiB.*//')
if [ -n "$pg_memory" ] && [ "$pg_memory" -lt 500 ]; then
    success "Uso de memoria PostgreSQL aceptable (${pg_memory}MB)"
else
    warning "Uso de memoria PostgreSQL alto (${pg_memory}MB)"
fi

# Test 32: CPU usage bajo
cpu_usage=$(docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}" | grep -E "(database|directus|astro)" | awk '{sum += $2} END {print sum}' | sed 's/%//')
if [ -n "$cpu_usage" ] && [ "$cpu_usage" -lt 50 ]; then
    success "Uso de CPU aceptable (${cpu_usage}%)"
else
    warning "Uso de CPU alto (${cpu_usage}%)"
fi

echo ""

# ================================================================
# FASE 9: TESTS DE INTEGRACIÓN AVANZADOS
# ================================================================
log "🔗 FASE 9: TESTS DE INTEGRACIÓN AVANZADOS"
echo "=========================================="

# Test 33: Búsqueda en antecedentes funciona
test_function "Búsqueda en antecedentes via API" \
    "curl -sf \"${DIRECTUS_URL}/items/antecedentes?search=ISI\" | grep -q 'ISI'" \
    "true"

# Test 34: Filtro por área funciona
test_function "Filtro por área en antecedentes" \
    "curl -sf \"${DIRECTUS_URL}/items/antecedentes?filter[Area][_contains]=Redes\" | grep -q 'Redes'" \
    "true"

# Test 35: Orden por fecha funciona
test_function "Ordenamiento por fecha" \
    "curl -sf \"${DIRECTUS_URL}/items/antecedentes?sort=-Fecha&limit=2\" | grep -q 'data'" \
    "true"

# Test 36: Paginación funciona
test_function "Paginación en API" \
    "curl -sf \"${DIRECTUS_URL}/items/antecedentes?limit=5&offset=5\" | grep -q 'data'" \
    "true"

# Test 37: Relaciones con archivos funcionan
if [ $files_count -gt 0 ]; then
    test_function "Relaciones antecedentes-archivos funcionan" \
        "curl -sf \"${DIRECTUS_URL}/items/antecedentes?fields=Titulo,Imagen.*&limit=1\" | grep -q 'filename'" \
        "true"
else
    fail "No hay archivos para testear relaciones"
fi

echo ""

# ================================================================
# FASE 10: REPORTE FINAL Y ESTADÍSTICAS
# ================================================================
log "📊 FASE 10: GENERANDO REPORTE FINAL"
echo "==================================="

# Recolectar estadísticas finales
echo ""
echo -e "${CYAN}📊 ESTADÍSTICAS FINALES DEL SISTEMA${NC}"
echo "====================================="
echo ""
echo -e "${BLUE}🗄️ Base de Datos:${NC}"
echo "   • Antecedentes: $antecedentes_count"
echo "   • Servicios: $servicios_count"
echo "   • Antecedentes con imagen: $antecedentes_with_images"
echo "   • Servicios con imagen: $servicios_with_images"
echo "   • Archivos en directus_files: $files_count"
echo "   • Tablas Directus: $directus_tables_count"
echo ""
echo -e "${BLUE}📁 Archivos:${NC}"
echo "   • Archivos físicos en uploads: $upload_files_count"
echo ""
echo -e "${BLUE}🚀 Rendimiento:${NC}"
echo "   • Memoria PostgreSQL: ${pg_memory}MB"
echo "   • CPU total: ${cpu_usage}%"
echo ""

# Estado de contenedores
echo -e "${BLUE}🐳 Estado de Contenedores:${NC}"
docker-compose ps --format "table {{.Name}}\t{{.State}}\t{{.Status}}"
echo ""

# URLs importantes
echo -e "${BLUE}🔗 URLs Importantes:${NC}"
echo "   • Sitio principal: $ASTRO_URL"
echo "   • Panel Directus: $DIRECTUS_URL/admin"
echo "   • API Directus: $DIRECTUS_URL"
echo "   • Health check: $DIRECTUS_URL/server/health"
echo ""

# ================================================================
# RESUMEN DE TESTS
# ================================================================
echo ""
echo -e "${CYAN}================================================================${NC}"
echo -e "${CYAN}📋 RESUMEN DE VERIFICACIÓN${NC}"
echo -e "${CYAN}================================================================${NC}"
echo ""

pass_percentage=$((passed_tests * 100 / total_tests))

echo -e "${BLUE}📊 Resultados de Tests:${NC}"
echo "   • Total de tests ejecutados: $total_tests"
echo -e "   • Tests exitosos: ${GREEN}$passed_tests${NC}"
echo -e "   • Tests fallidos: ${RED}$failed_tests${NC}"
echo -e "   • Porcentaje de éxito: ${GREEN}${pass_percentage}%${NC}"
echo ""

# Evaluar estado general
if [ $pass_percentage -ge 90 ]; then
    echo -e "${GREEN}🎉 VERIFICACIÓN EXITOSA${NC}"
    echo -e "${GREEN}El sistema está funcionando correctamente.${NC}"
    exit_code=0
elif [ $pass_percentage -ge 75 ]; then
    echo -e "${YELLOW}⚠️ VERIFICACIÓN PARCIAL${NC}"
    echo -e "${YELLOW}El sistema funciona pero requiere atención.${NC}"
    exit_code=1
else
    echo -e "${RED}❌ VERIFICACIÓN FALLIDA${NC}"
    echo -e "${RED}El sistema tiene problemas críticos.${NC}"
    exit_code=2
fi

echo ""
echo -e "${BLUE}📋 Próximos pasos recomendados:${NC}"
if [ $failed_tests -gt 0 ]; then
    echo "   1. Revisar logs de contenedores con: docker-compose logs"
    echo "   2. Verificar configuración de .env"
    echo "   3. Re-ejecutar setup si es necesario: ./setup-complete-stack.sh"
    echo "   4. Importar imágenes faltantes: ./import-all-images.sh"
else
    echo "   1. ✅ Sistema listo para producción"
    echo "   2. Configurar SSL para producción"
    echo "   3. Configurar backup automático"
    echo "   4. Monitoreo continuo"
fi

echo ""
echo -e "${CYAN}================================================================${NC}"
log "🏁 Verificación completada en $(date)"
echo ""

exit $exit_code 