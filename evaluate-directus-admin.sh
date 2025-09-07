#!/bin/bash

# Script para evaluar opciones de administración de Directus en producción
# Análisis de configuraciones disponibles y recomendaciones

set -e

echo "🔍 EVALUACIÓN DE ADMINISTRACIÓN DIRECTUS EN PRODUCCIÓN"
echo "====================================================="

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️ $1${NC}"
}

echo ""
echo "📊 ANÁLISIS DEL ESTADO ACTUAL"
echo "=============================="

# 1. Verificar stack actual en producción
print_info "1. Stack actual en producción:"
echo "   • Configuración: docker-compose.static.yml"
echo "   • Servicios: umbot-astro-static + umbot-nginx-static"
echo "   • Directus: ❌ NO INCLUIDO"
echo "   • Modo: Estático (USE_STATIC_DATA=true)"

# 2. Verificar conectividad Directus
print_info "2. Verificando acceso a Directus..."
if curl -I http://23.105.176.45:8055 >/dev/null 2>&1; then
    print_status "Directus accesible en puerto 8055"
else
    print_error "Directus NO accesible en puerto 8055"
fi

if curl -I https://www.ultimamilla.com.ar:8055 >/dev/null 2>&1; then
    print_status "Directus accesible via HTTPS"
else
    print_error "Directus NO accesible via HTTPS"
fi

# 3. Verificar configuraciones disponibles
print_info "3. Configuraciones Docker disponibles:"
for file in docker-compose*.yml; do
    if [[ -f "$file" ]]; then
        has_directus=$(grep -q "directus\|Directus" "$file" && echo "✅ SÍ" || echo "❌ NO")
        echo "   • $file: Directus $has_directus"
    fi
done

echo ""
echo "🎯 OPCIONES DE IMPLEMENTACIÓN"
echo "============================="

print_info "OPCIÓN 1: Stack Híbrido (RECOMENDADO)"
echo "   📋 Descripción: Mantener Astro estático + Agregar Directus independiente"
echo "   ✅ Ventajas:"
echo "      - Sitio web sigue funcionando sin interrupciones"
echo "      - Directus disponible para edición de contenido"
echo "      - Mínimo impacto en performance del sitio"
echo "      - Fácil rollback si hay problemas"
echo "   ⚠️ Consideraciones:"
echo "      - Requiere configurar proxy en nginx para /admin"
echo "      - Necesita regeneración manual del sitio tras ediciones"
echo "   🔧 Implementación:"
echo "      - Agregar servicio Directus a docker-compose.static.yml"
echo "      - Configurar nginx para servir /admin -> Directus"
echo "      - Mantener modo estático para el sitio principal"

print_info "OPCIÓN 2: Stack Completo Dinámico"
echo "   📋 Descripción: Cambiar a docker-compose.prod.yml completo"
echo "   ✅ Ventajas:"
echo "      - Administración completamente en línea"
echo "      - Cambios reflejados inmediatamente"
echo "      - API Directus disponible para futuras integraciones"
echo "   ⚠️ Riesgos:"
echo "      - Mayor complejidad de infraestructura"
echo "      - Dependencia de Directus para funcionamiento del sitio"
echo "      - Posibles problemas de performance"
echo "   🔧 Implementación:"
echo "      - Migrar de docker-compose.static.yml a docker-compose.prod.yml"
echo "      - Configurar variables de entorno para producción"
echo "      - Ajustar nginx para proxy hacia Astro dinámico"

print_info "OPCIÓN 3: Admin Panel Externo"
echo "   📋 Descripción: Directus en subdomain/puerto separado"
echo "   ✅ Ventajas:"
echo "      - Separación completa de responsabilidades"
echo "      - Sitio principal no afectado"
echo "      - Fácil mantenimiento independiente"
echo "   ⚠️ Consideraciones:"
echo "      - Requiere configuración DNS adicional (admin.ultimamilla.com.ar)"
echo "      - Certificados SSL adicionales"
echo "      - Proceso de sincronización manual"

echo ""
echo "🚀 RECOMENDACIÓN TÉCNICA"
echo "========================"

print_status "OPCIÓN 1: Stack Híbrido es la mejor opción porque:"
echo "   1. ✅ Mantiene estabilidad actual del sitio"
echo "   2. ✅ Proporciona administración en línea"
echo "   3. ✅ Mínimo riesgo de interrupciones"
echo "   4. ✅ Fácil implementación y rollback"
echo "   5. ✅ Performance óptima del sitio público"

echo ""
echo "📋 PLAN DE IMPLEMENTACIÓN RECOMENDADO"
echo "===================================="

print_info "FASE 1: Preparación (15 minutos)"
echo "   1. Backup completo del estado actual"
echo "   2. Crear docker-compose.hybrid.yml"
echo "   3. Configurar nginx.hybrid.conf"
echo "   4. Preparar variables de entorno"

print_info "FASE 2: Despliegue (30 minutos)"
echo "   1. Agregar servicio Directus al stack actual"
echo "   2. Actualizar configuración nginx"
echo "   3. Iniciar servicios adicionales"
echo "   4. Verificar acceso a admin panel"

print_info "FASE 3: Configuración (20 minutos)"
echo "   1. Configurar usuario administrador"
echo "   2. Verificar datos existentes (469 antecedentes + 5 servicios)"
echo "   3. Configurar permisos y roles"
echo "   4. Probar edición de contenido"

print_info "FASE 4: Testing (15 minutos)"
echo "   1. Verificar funcionamiento del sitio público"
echo "   2. Probar admin panel completo"
echo "   3. Verificar que cambios se reflejen"
echo "   4. Documentar proceso de actualización"

echo ""
echo "🔧 ARCHIVOS NECESARIOS PARA IMPLEMENTACIÓN"
echo "=========================================="

print_info "Archivos a crear/modificar:"
echo "   1. docker-compose.hybrid.yml (nuevo)"
echo "   2. nginx.hybrid.conf (nuevo)"
echo "   3. .env.hybrid (nuevo)"
echo "   4. deploy-hybrid.sh (script de despliegue)"
echo "   5. admin-sync.sh (script de sincronización)"

echo ""
echo "📊 ESTIMACIÓN DE RECURSOS"
echo "========================"

print_info "Recursos adicionales requeridos:"
echo "   • RAM: +512MB (Directus + PostgreSQL)"
echo "   • Disco: +2GB (base de datos + uploads)"
echo "   • CPU: +10% (mínimo impacto)"
echo "   • Puertos: 8055 (admin), 5432 (DB interna)"

echo ""
echo "🔐 CONFIGURACIÓN DE SEGURIDAD"
echo "============================="

print_info "Medidas de seguridad recomendadas:"
echo "   1. ✅ Admin panel solo accesible via HTTPS"
echo "   2. ✅ Firewall configurado para puerto 8055"
echo "   3. ✅ Autenticación fuerte (usuario/contraseña)"
echo "   4. ✅ Rate limiting en nginx"
echo "   5. ✅ Backup automático de base de datos"

echo ""
print_status "🎯 CONCLUSIÓN: Stack Híbrido es la solución óptima"
print_status "   Proporciona administración en línea manteniendo estabilidad"
print_warning "⚠️ SIGUIENTE PASO: Ejecutar implementación si se aprueba"

echo ""
echo "📞 COMANDOS PARA PROCEDER:"
echo "========================="
echo "   # Para implementar stack híbrido:"
echo "   ./implement-hybrid-admin.sh"
echo ""
echo "   # Para verificar estado actual:"
echo "   ./check-current-status.sh"
echo ""
echo "   # Para rollback en caso de problemas:"
echo "   ./rollback-to-static.sh"

print_status "✅ EVALUACIÓN COMPLETADA"
echo "📋 Revisar recomendaciones y confirmar implementación" 