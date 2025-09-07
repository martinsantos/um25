#!/bin/bash

# Script para verificar el estado actual del sistema
# Útil antes y después de implementar cambios

set -e

echo "🔍 VERIFICACIÓN DE ESTADO ACTUAL DEL SISTEMA"
echo "============================================"

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
echo "🌐 VERIFICACIÓN DE SITIO WEB"
echo "============================"

print_info "Verificando sitio principal..."
if curl -I https://www.ultimamilla.com.ar >/dev/null 2>&1; then
    print_status "Sitio principal accesible (HTTPS)"
    HTTP_STATUS=$(curl -I https://www.ultimamilla.com.ar 2>/dev/null | head -1)
    echo "   Status: $HTTP_STATUS"
else
    print_error "Sitio principal NO accesible"
fi

print_info "Verificando redirección HTTP -> HTTPS..."
if curl -I http://www.ultimamilla.com.ar 2>/dev/null | grep -q "301"; then
    print_status "Redirección HTTP -> HTTPS funcionando"
else
    print_error "Redirección HTTP -> HTTPS NO funcionando"
fi

print_info "Verificando imágenes de servicios..."
for img in ciberseguridad redes-comunicaciones servicios-it; do
    if curl -I "https://www.ultimamilla.com.ar/images/services/${img}.jpg" >/dev/null 2>&1; then
        print_status "Imagen ${img}.jpg accesible"
    else
        print_error "Imagen ${img}.jpg NO accesible"
    fi
done

echo ""
echo "🔐 VERIFICACIÓN DE PANEL DE ADMINISTRACIÓN"
echo "=========================================="

print_info "Verificando acceso a panel admin..."
if curl -I https://www.ultimamilla.com.ar/admin >/dev/null 2>&1; then
    print_status "Panel de administración accesible"
    ADMIN_STATUS=$(curl -I https://www.ultimamilla.com.ar/admin 2>/dev/null | head -1)
    echo "   Status: $ADMIN_STATUS"
else
    print_error "Panel de administración NO accesible"
fi

print_info "Verificando API Directus..."
if curl -I https://www.ultimamilla.com.ar/api >/dev/null 2>&1; then
    print_status "API Directus accesible"
else
    print_error "API Directus NO accesible"
fi

print_info "Verificando Directus por puerto directo..."
if curl -I http://23.105.176.45:8055 >/dev/null 2>&1; then
    print_status "Directus accesible en puerto 8055"
else
    print_error "Directus NO accesible en puerto 8055"
fi

echo ""
echo "🔒 VERIFICACIÓN DE SEGURIDAD"
echo "============================"

print_info "Verificando certificado SSL..."
if openssl s_client -connect www.ultimamilla.com.ar:443 -servername www.ultimamilla.com.ar </dev/null 2>/dev/null | grep -q "Verify return code: 0"; then
    print_status "Certificado SSL válido"
else
    print_warning "Certificado SSL con problemas o no verificable"
fi

print_info "Verificando headers de seguridad..."
HEADERS=$(curl -I https://www.ultimamilla.com.ar 2>/dev/null)
if echo "$HEADERS" | grep -q "Strict-Transport-Security"; then
    print_status "HSTS habilitado"
else
    print_error "HSTS NO habilitado"
fi

if echo "$HEADERS" | grep -q "X-Frame-Options"; then
    print_status "X-Frame-Options configurado"
else
    print_error "X-Frame-Options NO configurado"
fi

echo ""
echo "📊 INFORMACIÓN DEL SISTEMA"
echo "=========================="

print_info "Verificando configuraciones Docker disponibles:"
for file in docker-compose*.yml; do
    if [[ -f "$file" ]]; then
        has_directus=$(grep -q "directus\|Directus" "$file" && echo "✅" || echo "❌")
        has_astro=$(grep -q "astro\|Astro" "$file" && echo "✅" || echo "❌")
        echo "   • $file: Directus $has_directus | Astro $has_astro"
    fi
done

print_info "Verificando archivos de configuración nginx:"
for file in nginx*.conf; do
    if [[ -f "$file" ]]; then
        has_ssl=$(grep -q "ssl_certificate\|443" "$file" && echo "✅ SSL" || echo "❌ No SSL")
        has_admin=$(grep -q "location /admin\|directus" "$file" && echo "✅ Admin" || echo "❌ No Admin")
        echo "   • $file: $has_ssl | $has_admin"
    fi
done

echo ""
echo "🎯 RECOMENDACIONES BASADAS EN EL ESTADO ACTUAL"
echo "=============================================="

# Determinar recomendaciones basadas en los resultados
SITE_OK=$(curl -I https://www.ultimamilla.com.ar >/dev/null 2>&1 && echo "true" || echo "false")
ADMIN_OK=$(curl -I https://www.ultimamilla.com.ar/admin >/dev/null 2>&1 && echo "true" || echo "false")

if [[ "$SITE_OK" == "true" && "$ADMIN_OK" == "true" ]]; then
    print_status "✅ ESTADO ÓPTIMO: Sitio web y panel de administración funcionando"
    echo "   🎯 No se requieren acciones inmediatas"
elif [[ "$SITE_OK" == "true" && "$ADMIN_OK" == "false" ]]; then
    print_warning "⚠️ ESTADO PARCIAL: Sitio web OK, panel admin NO disponible"
    echo "   🎯 RECOMENDACIÓN: Implementar stack híbrido con ./implement-hybrid-admin.sh"
elif [[ "$SITE_OK" == "false" ]]; then
    print_error "❌ ESTADO CRÍTICO: Sitio web NO accesible"
    echo "   🎯 RECOMENDACIÓN: Verificar configuración de servidor inmediatamente"
else
    print_info "ℹ️ ESTADO INDETERMINADO: Verificar configuración manualmente"
fi

echo ""
echo "📞 COMANDOS ÚTILES PARA DIAGNÓSTICO AVANZADO"
echo "==========================================="
echo "   # Verificar contenedores en servidor:"
echo "   ssh root@23.105.176.45 'docker ps'"
echo ""
echo "   # Ver logs de nginx:"
echo "   ssh root@23.105.176.45 'docker logs umbot-nginx-static'"
echo ""
echo "   # Ver logs de Astro:"
echo "   ssh root@23.105.176.45 'docker logs umbot-astro-static'"
echo ""
echo "   # Verificar configuración nginx:"
echo "   ssh root@23.105.176.45 'docker exec umbot-nginx-static nginx -t'"

print_status "✅ VERIFICACIÓN DE ESTADO COMPLETADA" 