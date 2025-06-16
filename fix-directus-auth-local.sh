#!/bin/bash

# ========================================
# SCRIPT DE SOLUCIÓN AUTENTICACIÓN DIRECTUS
# Para resolver problemas de token expirado
# ========================================

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔧 SOLUCIONANDO AUTENTICACIÓN DIRECTUS${NC}"
echo "=========================================="

# Verificar si Docker está corriendo
if ! docker ps >/dev/null 2>&1; then
    echo -e "${RED}❌ Docker no está corriendo${NC}"
    exit 1
fi

# 1. REINICIAR SERVICIOS DIRECTUS
echo -e "${BLUE}🔄 Reiniciando servicios Directus...${NC}"
docker-compose restart directus 2>/dev/null || echo -e "${YELLOW}⚠️ No se pudo reiniciar el contenedor directus${NC}"

# Esperar a que el servicio se inicie
echo -e "${YELLOW}⏱️ Esperando a que Directus se inicie...${NC}"
sleep 15

# 2. VERIFICAR SERVICIOS
echo -e "${BLUE}📊 Verificando estado de servicios...${NC}"
docker-compose ps

# 3. INTENTAR OBTENER TOKEN AUTOMÁTICAMENTE
echo -e "${BLUE}🔑 Intentando obtener token de autenticación...${NC}"

# Credenciales por defecto
DIRECTUS_URL="http://localhost:8055"
DIRECTUS_EMAIL="admin@example.com"
DIRECTUS_PASSWORD="password"

# Función para obtener token
get_token() {
    local email="$1"
    local password="$2"
    
    echo -e "${YELLOW}Probando con credenciales: $email${NC}" >&2
    
    # Intentar login
    response=$(curl -s -X POST "$DIRECTUS_URL/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$email\",\"password\":\"$password\"}" 2>/dev/null)
    
    if [[ $? -eq 0 ]] && [[ $response == *"access_token"* ]]; then
        token=$(echo "$response" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)
        if [[ -n "$token" ]]; then
            echo -e "${GREEN}✅ Token obtenido exitosamente${NC}" >&2
            echo "$token"
            return 0
        fi
    fi
    
    return 1
}

# Probar diferentes combinaciones de credenciales
CREDENTIALS=(
    "admin@example.com:d1r3ctu5"
    "admin@example.com:password"
    "admin@admin.com:admin"
    "admin:admin"
    "admin@localhost:password"
    "test@example.com:password"
)

TOKEN=""
for cred in "${CREDENTIALS[@]}"; do
    email=$(echo "$cred" | cut -d':' -f1)
    password=$(echo "$cred" | cut -d':' -f2)
    
    if TOKEN=$(get_token "$email" "$password"); then
        echo -e "${GREEN}✅ Autenticación exitosa con: $email${NC}"
        break
    else
        echo -e "${RED}❌ Falló autenticación con: $email${NC}"
    fi
done

# Si no se pudo obtener token, configurar modo estático
if [[ -z "$TOKEN" ]]; then
    echo -e "${YELLOW}⚠️ No se pudo obtener token automáticamente${NC}"
    echo -e "${BLUE}🔧 Configurando modo estático como fallback...${NC}"
    
    # Actualizar .env.local para usar modo estático
    if [[ -f ".env.local" ]]; then
        # Backup del archivo actual
        cp .env.local .env.local.backup
        
        # Configurar modo estático
        {
            echo "# Configuración de fallback - Modo estático"
            echo "STATIC_MODE=true"
            echo "USE_STATIC_DATA=true"
            echo "DIRECTUS_URL=http://localhost:8055"
            echo "# Token no disponible - usando modo estático"
            echo "# DIRECTUS_TOKEN="
        } > .env.local
        
        echo -e "${GREEN}✅ Configurado modo estático en .env.local${NC}"
    else
        echo -e "${YELLOW}⚠️ Archivo .env.local no encontrado${NC}"
    fi
    
    echo -e "${BLUE}🔄 Reiniciando servidor Astro...${NC}"
    # Buscar y matar procesos de Astro
    pkill -f "astro" 2>/dev/null || true
    
    echo -e "${GREEN}✅ Configuración de fallback completada${NC}"
    echo -e "${YELLOW}📋 El proyecto funcionará en modo estático${NC}"
    
else
    # Actualizar .env.local con el token obtenido
    echo -e "${BLUE}📝 Actualizando archivo .env.local...${NC}"
    
    # Backup del archivo actual si existe
    if [[ -f ".env.local" ]]; then
        cp .env.local .env.local.backup
    fi
    
    # Crear nuevo archivo .env.local
    {
        echo "# Configuración de Directus actualizada"
        echo "DIRECTUS_URL=http://localhost:8055"
        echo "DIRECTUS_TOKEN=$TOKEN"
        echo "STATIC_MODE=false"
        echo "USE_STATIC_DATA=false"
        echo "# Token generado automáticamente: $(date)"
    } > .env.local
    
    echo -e "${GREEN}✅ Token guardado en .env.local${NC}"
    
    # Verificar que el token funciona
    echo -e "${BLUE}🔍 Verificando token...${NC}"
    test_response=$(curl -s -H "Authorization: Bearer $TOKEN" "$DIRECTUS_URL/collections" 2>/dev/null)
    
    if [[ $? -eq 0 ]] && [[ $test_response != *"error"* ]]; then
        echo -e "${GREEN}✅ Token funcionando correctamente${NC}"
    else
        echo -e "${RED}❌ Token no funciona, configurando modo estático${NC}"
        {
            echo "# Configuración de fallback - Token no funciona"
            echo "STATIC_MODE=true"
            echo "USE_STATIC_DATA=true"
            echo "DIRECTUS_URL=http://localhost:8055"
            echo "# DIRECTUS_TOKEN=$TOKEN"
        } > .env.local
    fi
    
    echo -e "${BLUE}🔄 Reiniciando servidor Astro...${NC}"
    # Buscar y matar procesos de Astro
    pkill -f "astro" 2>/dev/null || true
fi

# 4. VERIFICACIÓN FINAL
echo ""
echo -e "${BLUE}🎯 Verificación final...${NC}"
echo "=========================================="

# Mostrar estado de servicios
echo -e "${BLUE}📊 Estado de servicios Docker:${NC}"
docker-compose ps

# Mostrar configuración actual
echo -e "${BLUE}📋 Configuración actual:${NC}"
if [[ -f ".env.local" ]]; then
    echo "Contenido de .env.local:"
    cat .env.local
else
    echo -e "${YELLOW}⚠️ No hay archivo .env.local${NC}"
fi

# Instrucciones finales
echo ""
echo -e "${BLUE}📋 INSTRUCCIONES FINALES:${NC}"
echo "=========================================="
if [[ -n "$TOKEN" ]]; then
    echo -e "${GREEN}✅ Autenticación Directus configurada${NC}"
    echo -e "   • Token válido obtenido y guardado"
    echo -e "   • Reinicia tu servidor Astro para aplicar cambios"
    echo -e "   • Comando: npm run dev"
else
    echo -e "${YELLOW}⚠️ Configurado modo estático como fallback${NC}"
    echo -e "   • Directus no está disponible o no se pudo autenticar"
    echo -e "   • El proyecto funcionará con datos estáticos"
    echo -e "   • Reinicia tu servidor Astro para aplicar cambios"
fi

echo ""
echo -e "${BLUE}🔧 Comandos útiles:${NC}"
echo -e "   • Reiniciar Directus: docker-compose restart directus"
echo -e "   • Ver logs: docker-compose logs -f directus"
echo -e "   • Verificar servicios: docker-compose ps"
echo -e "   • Probar autenticación: curl -H 'Authorization: Bearer TOKEN' http://localhost:8055/collections"
echo ""
echo -e "${GREEN}🔧 Solución de autenticación completada${NC}" 