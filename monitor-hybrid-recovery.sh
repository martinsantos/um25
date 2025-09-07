#!/bin/bash

# 🔍 MONITOR RECUPERACIÓN HÍBRIDA - VERIFICACIÓN CONTINUA
# Monitorea el estado del servidor después de la implementación híbrida

set -e

SERVER="23.105.176.45"
SITE="https://www.ultimamilla.com.ar"
ADMIN="https://www.ultimamilla.com.ar/admin"

echo "🔍 MONITOR RECUPERACIÓN STACK HÍBRIDO"
echo "═══════════════════════════════════════"
echo "📅 Inicio: $(date)"
echo "🎯 Servidor: $SERVER"
echo "🌐 Sitio: $SITE"
echo "🎛️ Admin: $ADMIN"
echo ""

# Función para verificar conectividad básica
check_connectivity() {
    echo "1️⃣ VERIFICACIÓN DE CONECTIVIDAD"
    echo "   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    # Ping al servidor
    if ping -c 1 $SERVER >/dev/null 2>&1; then
        echo "   ✅ Ping: Servidor responde"
        return 0
    else
        echo "   ⚠️ Ping: Sin respuesta (firewall activo)"
        return 1
    fi
}

# Función para verificar SSH
check_ssh() {
    echo "2️⃣ VERIFICACIÓN SSH"
    echo "   ━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    if timeout 10 ssh -o ConnectTimeout=5 -o BatchMode=yes root@$SERVER exit 2>/dev/null; then
        echo "   ✅ SSH: Conectado sin password"
        return 0
    elif timeout 10 ssh -o ConnectTimeout=5 root@$SERVER exit 2>/dev/null; then
        echo "   ✅ SSH: Disponible (requiere password)"
        return 0
    else
        echo "   ⚠️ SSH: No disponible (servidor reiniciando)"
        return 1
    fi
}

# Función para verificar sitio web
check_website() {
    echo "3️⃣ VERIFICACIÓN SITIO WEB"
    echo "   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    if curl -I --connect-timeout 10 $SITE 2>/dev/null | grep -q "200 OK"; then
        echo "   ✅ Sitio: Funcionando correctamente"
        return 0
    else
        echo "   ⚠️ Sitio: No disponible (servicios iniciando)"
        return 1
    fi
}

# Función para verificar panel admin
check_admin() {
    echo "4️⃣ VERIFICACIÓN PANEL ADMIN"
    echo "   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    if curl -I --connect-timeout 10 $ADMIN 2>/dev/null | grep -q -E "(200|302|401)"; then
        echo "   ✅ Admin: Panel disponible"
        return 0
    else
        echo "   ⚠️ Admin: Directus iniciando"
        return 1
    fi
}

# Función principal de verificación
run_checks() {
    local iteration=$1
    echo ""
    echo "🔄 VERIFICACIÓN #$iteration - $(date +%H:%M:%S)"
    echo "════════════════════════════════════════════════"
    
    local scores=0
    
    check_connectivity && ((scores++))
    check_ssh && ((scores++))
    check_website && ((scores++))
    check_admin && ((scores++))
    
    echo ""
    echo "📊 PUNTUACIÓN: $scores/4"
    
    if [ $scores -eq 4 ]; then
        echo "🎉 ¡SISTEMA COMPLETAMENTE FUNCIONAL!"
        return 0
    elif [ $scores -ge 2 ]; then
        echo "🔄 Sistema recuperándose ($scores/4)"
        return 1
    else
        echo "⚠️ Sistema en proceso de inicialización ($scores/4)"
        return 2
    fi
}

# Función para verificar servicios remotos (cuando SSH esté disponible)
check_remote_services() {
    echo "5️⃣ VERIFICACIÓN SERVICIOS REMOTOS"
    echo "   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    if ssh -o ConnectTimeout=5 root@$SERVER "docker ps --format 'table {{.Names}}\t{{.Status}}'" 2>/dev/null; then
        echo "   ✅ Contenedores Docker funcionando"
        return 0
    else
        echo "   ⚠️ No se pudo verificar servicios remotos"
        return 1
    fi
}

# Monitor principal
main() {
    local max_iterations=20
    local iteration=1
    local recovery_complete=false
    
    echo "⏰ Comenzando monitoreo (máximo $max_iterations verificaciones)"
    echo "🔄 Intervalo: 60 segundos entre verificaciones"
    echo ""
    
    while [ $iteration -le $max_iterations ] && [ "$recovery_complete" = false ]; do
        if run_checks $iteration; then
            echo ""
            echo "🎯 VERIFICACIÓN ADICIONAL..."
            if ssh -o ConnectTimeout=5 root@$SERVER exit 2>/dev/null; then
                check_remote_services
            fi
            echo ""
            echo "🏆 ¡RECUPERACIÓN COMPLETADA!"
            echo "🌐 Sitio: $SITE"
            echo "🎛️ Admin: $ADMIN"
            echo "👤 Usuario: admin@ultimamilla.com.ar"
            echo "🔑 Password: UmbotHybridAdmin2025!"
            recovery_complete=true
            break
        fi
        
        if [ $iteration -lt $max_iterations ]; then
            echo "⏳ Esperando 60 segundos antes de la próxima verificación..."
            sleep 60
        fi
        
        ((iteration++))
    done
    
    if [ "$recovery_complete" = false ]; then
        echo ""
        echo "⚠️ RECUPERACIÓN TOMA MÁS TIEMPO DEL ESPERADO"
        echo "📋 Recomendaciones:"
        echo "   - Verificar manualmente: ssh root@$SERVER"
        echo "   - Revisar logs: docker logs fumbling-field-umbot-nginx-hybrid-1"
        echo "   - Contactar soporte si persiste más de 30 minutos"
    fi
}

# Ejecutar monitor
main

echo ""
echo "📊 Monitor finalizado: $(date)"
echo "═══════════════════════════════════════" 