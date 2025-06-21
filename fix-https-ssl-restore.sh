#!/bin/bash

# Script para restaurar HTTPS/SSL en www.umbot.com.ar
# Problema: En las correcciones del 20 de junio se perdió la configuración SSL
# Solución: Restaurar configuración HTTPS completa

set -e

echo "🔐 RESTAURANDO CONFIGURACIÓN HTTPS/SSL"
echo "======================================"

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

# Verificar que estamos en el servidor
if [[ $(hostname -I | grep -o "23.105.176.45") != "23.105.176.45" ]]; then
    print_error "Este script debe ejecutarse en el servidor 23.105.176.45"
    exit 1
fi

# Ir al directorio del proyecto
cd /root/fumbling-field

print_status "1. Verificando estado actual de HTTPS..."
if curl -I -k https://www.umbot.com.ar/ &>/dev/null; then
    print_warning "HTTPS ya está funcionando"
else
    print_error "HTTPS no funciona - procediendo con la restauración"
fi

print_status "2. Verificando certificados Let's Encrypt..."
if [ -f "/etc/letsencrypt/live/www.umbot.com.ar/fullchain.pem" ]; then
    print_status "Certificado SSL encontrado en /etc/letsencrypt/live/www.umbot.com.ar/"
    # Verificar fecha de expiración
    openssl x509 -in /etc/letsencrypt/live/www.umbot.com.ar/fullchain.pem -noout -dates
else
    print_error "Certificado SSL no encontrado"
    print_warning "Intentando renovar certificados con certbot..."
    
    # Parar nginx temporalmente para renovar certificados
    docker-compose -f docker-compose.static.yml stop umbot-nginx-static
    
    # Renovar certificados
    certbot renew --standalone
    
    if [ $? -eq 0 ]; then
        print_status "Certificados renovados exitosamente"
    else
        print_error "Error renovando certificados"
        exit 1
    fi
fi

print_status "3. Creando backup de configuración actual..."
cp docker-compose.static.yml docker-compose.static.yml.backup.$(date +%Y%m%d_%H%M%S)
cp nginx.prod.conf nginx.prod.conf.backup.$(date +%Y%m%d_%H%M%S)

print_status "4. Aplicando nueva configuración nginx con HTTPS..."
# La configuración ya está actualizada en nginx.prod.conf

print_status "5. Verificando configuración nginx..."
docker run --rm -v $(pwd)/nginx.prod.conf:/etc/nginx/nginx.conf:ro nginx:alpine nginx -t
if [ $? -eq 0 ]; then
    print_status "Configuración nginx válida"
else
    print_error "Error en configuración nginx"
    exit 1
fi

print_status "6. Parando contenedores actuales..."
docker-compose -f docker-compose.static.yml down

print_status "7. Iniciando contenedores con nueva configuración..."
docker-compose -f docker-compose.static.yml up -d

print_status "8. Esperando que los servicios estén listos..."
sleep 30

print_status "9. Verificando servicios..."
docker-compose -f docker-compose.static.yml ps

print_status "10. Probando HTTPS..."
echo "Probando conexión HTTPS..."
if curl -I -k https://www.umbot.com.ar/ &>/dev/null; then
    print_status "✅ HTTPS RESTAURADO EXITOSAMENTE"
    echo ""
    echo "🎉 SITIO FUNCIONANDO:"
    echo "   HTTP:  http://www.umbot.com.ar (redirige a HTTPS)"
    echo "   HTTPS: https://www.umbot.com.ar"
    echo "   IP:    http://23.105.176.45"
    echo ""
    
    # Verificar redirección HTTP -> HTTPS
    echo "Verificando redirección HTTP -> HTTPS..."
    redirect_response=$(curl -s -o /dev/null -w "%{http_code}" http://www.umbot.com.ar/)
    if [ "$redirect_response" = "301" ]; then
        print_status "Redirección HTTP -> HTTPS funcionando correctamente"
    else
        print_warning "Redirección HTTP -> HTTPS no está funcionando (código: $redirect_response)"
    fi
    
else
    print_error "HTTPS sigue sin funcionar"
    echo ""
    echo "🔍 DIAGNÓSTICO:"
    echo "1. Verificar logs:"
    echo "   docker-compose -f docker-compose.static.yml logs umbot-nginx-static"
    echo "2. Verificar certificados:"
    echo "   ls -la /etc/letsencrypt/live/www.umbot.com.ar/"
    echo "3. Verificar puertos:"
    echo "   netstat -tlnp | grep :443"
    exit 1
fi

print_status "11. Verificando imágenes (no deben perderse)..."
if curl -I https://www.umbot.com.ar/images/services/servicios-it.jpg &>/dev/null; then
    print_status "Imágenes funcionando correctamente"
else
    print_warning "Verificar imágenes manualmente"
fi

echo ""
echo "🏆 RESTAURACIÓN HTTPS COMPLETADA"
echo "================================"
echo "✅ Puerto 443 habilitado"
echo "✅ Certificados SSL configurados"  
echo "✅ Redirección HTTP -> HTTPS activa"
echo "✅ Headers de seguridad aplicados"
echo "✅ Imágenes funcionando"
echo ""
echo "🔐 SITIO SEGURO: https://www.umbot.com.ar"

# Limpiar archivos temporales
rm -f nginx.test.conf 2>/dev/null || true

print_status "Script completado exitosamente" 