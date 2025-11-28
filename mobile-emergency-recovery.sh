#!/data/data/com.termux/files/usr/bin/bash

# 📱 MOBILE EMERGENCY RECOVERY SCRIPT FOR ANDROID
# UMBot - Fumbling Field Emergency Response
# Optimized for Termux on Android

set -e

# Colors for mobile terminal
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Server configuration
SERVER_HOST="23.105.176.45"
SERVER_USER="root"
SERVER_PASS="gsiB%s@0yD"
PROJECT_PATH="/root/fumbling-field"

# Functions
print_header() {
    echo -e "${BLUE}📱 MOBILE EMERGENCY RECOVERY${NC}"
    echo -e "${BLUE}=============================${NC}"
    echo -e "🕐 Iniciado: $(date)"
    echo -e "📱 Dispositivo: Android (Termux)"
    echo -e "🎯 Servidor: $SERVER_HOST"
    echo ""
}

check_dependencies() {
    echo -e "${YELLOW}🔍 Verificando dependencias...${NC}"
    
    # Check if openssh is installed
    if ! command -v ssh &> /dev/null; then
        echo -e "${RED}❌ SSH no encontrado. Instalando...${NC}"
        pkg update && pkg install -y openssh
    fi
    
    # Check if curl is installed
    if ! command -v curl &> /dev/null; then
        echo -e "${RED}❌ curl no encontrado. Instalando...${NC}"
        pkg install -y curl
    fi
    
    echo -e "${GREEN}✅ Dependencias verificadas${NC}"
}

test_connectivity() {
    echo -e "${YELLOW}🌐 Probando conectividad...${NC}"
    
    # Test internet
    if ping -c 1 8.8.8.8 &> /dev/null; then
        echo -e "${GREEN}✅ Internet: OK${NC}"
    else
        echo -e "${RED}❌ Sin conexión a internet${NC}"
        exit 1
    fi
    
    # Test server
    if ping -c 1 $SERVER_HOST &> /dev/null; then
        echo -e "${GREEN}✅ Servidor: Accesible${NC}"
    else
        echo -e "${RED}❌ Servidor no accesible${NC}"
        exit 1
    fi
}

test_website() {
    echo -e "${YELLOW}🔍 Verificando sitio web...${NC}"
    
    local status_code=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 https://umbot.com.ar/ || echo "000")
    
    if [ "$status_code" = "200" ]; then
        echo -e "${GREEN}✅ Sitio web: HTTP $status_code - OK${NC}"
        return 0
    else
        echo -e "${RED}❌ Sitio web: HTTP $status_code - ERROR${NC}"
        return 1
    fi
}

emergency_recovery() {
    echo -e "${RED}🚨 INICIANDO RECUPERACIÓN DE EMERGENCIA...${NC}"
    
    # SSH into server and run recovery commands
    sshpass -p "$SERVER_PASS" ssh -o StrictHostKeyChecking=no -o ConnectTimeout=30 "$SERVER_USER@$SERVER_HOST" << EOF
        echo "🔄 Navegando al directorio del proyecto..."
        cd $PROJECT_PATH
        
        echo "📊 Estado actual de contenedores:"
        docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
        
        echo "🛑 Deteniendo servicios..."
        docker-compose down
        
        echo "⏳ Esperando 5 segundos..."
        sleep 5
        
        echo "🚀 Iniciando servicios..."
        docker-compose up -d
        
        echo "⏳ Esperando 30 segundos para que los servicios se estabilicen..."
        sleep 30
        
        echo "✅ Estado final de contenedores:"
        docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
        
        echo "🔍 Verificando servicios web..."
        curl -I http://localhost/ || echo "❌ HTTP local no responde"
        
        echo "🎉 Recuperación completada desde dispositivo móvil"
EOF
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Recuperación SSH exitosa${NC}"
    else
        echo -e "${RED}❌ Error en recuperación SSH${NC}"
        exit 1
    fi
}

final_verification() {
    echo -e "${YELLOW}🔍 Verificación final...${NC}"
    
    # Wait a bit more for services to be fully ready
    echo -e "${BLUE}⏳ Esperando 15 segundos adicionales...${NC}"
    sleep 15
    
    if test_website; then
        echo -e "${GREEN}🎉 RECUPERACIÓN EXITOSA COMPLETADA${NC}"
        echo -e "${GREEN}✅ Sitio web funcionando correctamente${NC}"
        
        # Send success notification (if notification tools are available)
        if command -v termux-notification &> /dev/null; then
            termux-notification --title "UMBot Recovery" --content "✅ Recuperación exitosa completada"
        fi
        
        return 0
    else
        echo -e "${RED}❌ RECUPERACIÓN FALLÓ${NC}"
        echo -e "${RED}El sitio web aún no responde correctamente${NC}"
        return 1
    fi
}

show_manual_steps() {
    echo -e "${YELLOW}📋 PASOS MANUALES ALTERNATIVOS:${NC}"
    echo -e "${BLUE}1. Conectar vía SSH:${NC}"
    echo -e "   ssh $SERVER_USER@$SERVER_HOST"
    echo -e "${BLUE}2. Navegar al proyecto:${NC}"
    echo -e "   cd $PROJECT_PATH"
    echo -e "${BLUE}3. Reiniciar servicios:${NC}"
    echo -e "   docker-compose down && docker-compose up -d"
    echo -e "${BLUE}4. Verificar estado:${NC}"
    echo -e "   docker ps"
    echo ""
}

# Main execution
main() {
    print_header
    
    # Check if sshpass is available, install if not
    if ! command -v sshpass &> /dev/null; then
        echo -e "${YELLOW}🔧 Instalando sshpass...${NC}"
        pkg install -y sshpass
    fi
    
    check_dependencies
    test_connectivity
    
    # Test if website is already working
    if test_website; then
        echo -e "${GREEN}✅ El sitio web ya está funcionando correctamente${NC}"
        echo -e "${GREEN}No se requiere recuperación${NC}"
        exit 0
    fi
    
    # Website is down, proceed with recovery
    echo -e "${RED}❌ Sitio web no responde, iniciando recuperación...${NC}"
    
    emergency_recovery
    final_verification
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}🎉 MISIÓN CUMPLIDA - RECUPERACIÓN EXITOSA DESDE MÓVIL${NC}"
    else
        echo -e "${RED}❌ Recuperación automática falló${NC}"
        show_manual_steps
        exit 1
    fi
}

# Execute main function
main "$@" 