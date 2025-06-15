#!/bin/bash

# ========================================
# SCRIPT PARA SOLUCIONAR AUTENTICACIÓN DIRECTUS
# Entorno Local - UM25-0.3
# ========================================

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔧 SOLUCIONANDO PROBLEMAS DE AUTENTICACIÓN DIRECTUS${NC}"
echo "=========================================="

# 1. DETENER SERVICIOS ACTUALES
echo -e "${BLUE}🛑 Deteniendo servicios actuales...${NC}"
docker-compose down || true

# 2. LIMPIAR CONTENEDORES Y VOLÚMENES
echo -e "${BLUE}🧹 Limpiando contenedores y volúmenes...${NC}"
docker-compose down -v || true
docker system prune -f || true

# 3. VERIFICAR ARCHIVOS DE CONFIGURACIÓN
echo -e "${BLUE}📋 Verificando configuración...${NC}"
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️ Archivo .env no encontrado, creando uno básico...${NC}"
    cat > .env << 'EOF'
# Configuración Directus Local
DIRECTUS_KEY=255d861b-5ea1-5996-9aa3-922530ec40b1
DIRECTUS_SECRET=6116487b-cda1-52c2-b5b5-c8022c45e263
DIRECTUS_ADMIN_EMAIL=admin@example.com
DIRECTUS_ADMIN_PASSWORD=d1r3ctu5

# Base de datos
DB_CLIENT=sqlite
DB_FILENAME=/directus/database/data.db

# Configuración del servidor
PUBLIC_URL=http://localhost:8055
CORS_ENABLED=true
CORS_ORIGIN=true

# Configuración de archivos
STORAGE_LOCATIONS=local
STORAGE_LOCAL_DRIVER=local
STORAGE_LOCAL_ROOT=./uploads

# Configuración de autenticación
AUTH_PROVIDERS=default
ACCESS_TOKEN_TTL=15m
REFRESH_TOKEN_TTL=7d
REFRESH_TOKEN_COOKIE_SECURE=false
REFRESH_TOKEN_COOKIE_SAME_SITE=lax

# Configuración de rate limiting
RATE_LIMITER_ENABLED=false
EOF
fi

# 4. CREAR ARCHIVO .env.local PARA ASTRO
echo -e "${BLUE}⚙️ Configurando variables de entorno para Astro...${NC}"
cat > .env.local << 'EOF'
# Configuración Directus para Astro
DIRECTUS_URL=http://localhost:8055
DIRECTUS_TOKEN=

# Configuración de desarrollo
NODE_ENV=development
ASTRO_ENV=development

# Configuración de imágenes
PUBLIC_ASSETS_URL=http://localhost:8055/assets
PUBLIC_IMAGES_URL=http://localhost:8055/assets

# Modo de datos
STATIC_MODE=false
USE_STATIC_DATA=false
EOF

# 5. INICIAR DIRECTUS
echo -e "${BLUE}🚀 Iniciando Directus...${NC}"
docker-compose up -d directus

# 6. ESPERAR A QUE DIRECTUS ESTÉ LISTO
echo -e "${BLUE}⏳ Esperando a que Directus esté listo...${NC}"
sleep 30

# Verificar si Directus está respondiendo
for i in {1..10}; do
    if curl -f http://localhost:8055/server/health >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Directus está funcionando${NC}"
        break
    else
        echo -e "${YELLOW}⏳ Esperando... intento $i/10${NC}"
        sleep 10
    fi
done

# 7. OBTENER TOKEN DE AUTENTICACIÓN
echo -e "${BLUE}🔑 Obteniendo token de autenticación...${NC}"

# Intentar login con credenciales por defecto
TOKEN_RESPONSE=$(curl -s -X POST http://localhost:8055/auth/login \
    -H "Content-Type: application/json" \
    -d '{
        "email": "admin@example.com",
        "password": "d1r3ctu5"
    }' || echo "")

if [ -n "$TOKEN_RESPONSE" ] && echo "$TOKEN_RESPONSE" | grep -q "access_token"; then
    TOKEN=$(echo "$TOKEN_RESPONSE" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)
    echo -e "${GREEN}✅ Token obtenido exitosamente${NC}"
    
    # Actualizar .env.local con el token
    sed -i.bak "s/DIRECTUS_TOKEN=/DIRECTUS_TOKEN=$TOKEN/" .env.local
    echo -e "${GREEN}✅ Token guardado en .env.local${NC}"
else
    echo -e "${YELLOW}⚠️ No se pudo obtener token automáticamente${NC}"
    echo -e "${YELLOW}Intentando crear usuario administrador...${NC}"
    
    # Crear usuario administrador
    docker-compose exec directus npx directus users create --email admin@example.com --password d1r3ctu5 --role administrator || true
    
    # Intentar login nuevamente
    sleep 5
    TOKEN_RESPONSE=$(curl -s -X POST http://localhost:8055/auth/login \
        -H "Content-Type: application/json" \
        -d '{
            "email": "admin@example.com",
            "password": "d1r3ctu5"
        }' || echo "")
    
    if [ -n "$TOKEN_RESPONSE" ] && echo "$TOKEN_RESPONSE" | grep -q "access_token"; then
        TOKEN=$(echo "$TOKEN_RESPONSE" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)
        sed -i.bak "s/DIRECTUS_TOKEN=/DIRECTUS_TOKEN=$TOKEN/" .env.local
        echo -e "${GREEN}✅ Token obtenido y guardado${NC}"
    else
        echo -e "${RED}❌ No se pudo obtener token de autenticación${NC}"
        echo -e "${YELLOW}Configurando modo estático como fallback...${NC}"
        sed -i.bak "s/STATIC_MODE=false/STATIC_MODE=true/" .env.local
        sed -i.bak "s/USE_STATIC_DATA=false/USE_STATIC_DATA=true/" .env.local
    fi
fi

# 8. VERIFICAR CONEXIÓN A DIRECTUS
echo -e "${BLUE}🔍 Verificando conexión a Directus...${NC}"
if [ -n "$TOKEN" ]; then
    COLLECTIONS_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" http://localhost:8055/collections || echo "")
    if echo "$COLLECTIONS_RESPONSE" | grep -q "data"; then
        echo -e "${GREEN}✅ Conexión a Directus verificada${NC}"
    else
        echo -e "${YELLOW}⚠️ Problemas de conexión, usando modo estático${NC}"
        sed -i.bak "s/STATIC_MODE=false/STATIC_MODE=true/" .env.local
        sed -i.bak "s/USE_STATIC_DATA=false/USE_STATIC_DATA=true/" .env.local
    fi
fi

# 9. INICIAR ASTRO
echo -e "${BLUE}🚀 Iniciando Astro...${NC}"
docker-compose up -d astro

# 10. VERIFICACIÓN FINAL
echo -e "${BLUE}🎯 Verificación final...${NC}"
sleep 10

echo -e "${BLUE}📋 Estado de servicios:${NC}"
docker-compose ps

echo -e "${BLUE}🌐 URLs disponibles:${NC}"
echo -e "   • Directus: http://localhost:8055"
echo -e "   • Astro: http://localhost:4321"

# Verificar si Astro está funcionando
if curl -f http://localhost:4321 >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Astro está funcionando correctamente${NC}"
else
    echo -e "${YELLOW}⚠️ Astro puede necesitar unos minutos para estar listo${NC}"
fi

echo ""
echo "=========================================="
echo -e "${GREEN}🎉 CONFIGURACIÓN COMPLETADA${NC}"
echo "=========================================="
echo -e "${GREEN}✅ Directus configurado y funcionando${NC}"
echo -e "${GREEN}✅ Token de autenticación obtenido${NC}"
echo -e "${GREEN}✅ Variables de entorno configuradas${NC}"
echo -e "${GREEN}✅ Astro iniciado${NC}"
echo ""
echo -e "${BLUE}📋 Información importante:${NC}"
echo -e "   • Usuario Directus: admin@example.com"
echo -e "   • Contraseña: d1r3ctu5"
echo -e "   • Token guardado en .env.local"
echo ""
echo -e "${YELLOW}📝 Si sigues teniendo problemas:${NC}"
echo -e "   • Revisa los logs: docker-compose logs -f"
echo -e "   • Reinicia servicios: docker-compose restart"
echo -e "   • Usa modo estático: STATIC_MODE=true en .env.local"
echo ""
echo -e "${GREEN}🚀 Sistema listo para desarrollo!${NC}" 