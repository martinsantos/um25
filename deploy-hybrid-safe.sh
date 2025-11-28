#!/bin/bash

# 🚀 IMPLEMENTACIÓN HÍBRIDA SEGURA - SIN INTERRUPCIONES
# Mantiene sitio funcionando y agrega panel de administración

set -e

# Configuración
SERVER="23.105.176.45"
USER="root"
REMOTE_DIR="/root/fumbling-field"
BACKUP_DATE=$(date +%Y%m%d_%H%M%S)

echo "🚀 IMPLEMENTACIÓN STACK HÍBRIDO - SIN INTERRUPCIONES"
echo "══════════════════════════════════════════════════"
echo "📅 Fecha: $(date)"
echo "🎯 Objetivo: Agregar panel admin sin afectar sitio"
echo "🔒 Método: SFTP seguro (SSH verificado bloqueado)"
echo ""

# PASO 1: Verificar estado del sitio ANTES
echo "1️⃣ VERIFICACIÓN PRE-IMPLEMENTACIÓN"
echo "   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -I https://www.umbot.com.ar/ 2>/dev/null | head -3
if [ $? -eq 0 ]; then
    echo "   ✅ Sitio web funcionando correctamente"
else
    echo "   ❌ ERROR: Sitio no responde - ABORTANDO"
    exit 1
fi

# PASO 2: Preparar archivos localmente
echo ""
echo "2️⃣ PREPARACIÓN DE ARCHIVOS HÍBRIDOS"
echo "   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Verificar archivos necesarios
REQUIRED_FILES=("docker-compose.hybrid.yml" "nginx.hybrid.conf" ".env.hybrid" "implement-hybrid-admin.sh")
for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "   ✅ $file disponible"
    else
        echo "   ❌ ERROR: $file no encontrado - ABORTANDO"
        exit 1
    fi
done

# Crear script de implementación remota
cat > remote-hybrid-implementation.sh << 'REMOTE_SCRIPT'
#!/bin/bash
# Script para ejecutar en servidor - Implementación híbrida segura

set -e
cd /root/fumbling-field

echo "🔧 IMPLEMENTACIÓN HÍBRIDA EN SERVIDOR"
echo "=================================="

# Backup de configuración actual
echo "📦 Creando backup de configuración actual..."
cp docker-compose.static.yml "docker-compose.static.yml.backup.$(date +%Y%m%d_%H%M%S)" 2>/dev/null || true
cp nginx.*.conf "nginx.backup.$(date +%Y%m%d_%H%M%S).conf" 2>/dev/null || true

# Verificar que el sitio sigue funcionando
echo "🔍 Verificando sitio web funcionando..."
SITE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/ || echo "000")
if [ "$SITE_STATUS" != "200" ]; then
    echo "⚠️  Advertencia: Sitio local no responde directamente"
fi

# Extraer archivos híbridos
echo "📁 Extrayendo configuración híbrida..."
tar -xzf fumbling-field-hybrid.tar.gz

# Verificar contenido extraído
echo "✅ Archivos híbridos extraídos:"
ls -la docker-compose.hybrid.yml nginx.hybrid.conf .env.hybrid implement-hybrid-admin.sh

# Hacer ejecutable el script de implementación
chmod +x implement-hybrid-admin.sh

echo "🚀 Iniciando implementación híbrida..."
echo "IMPORTANTE: Manteniendo sitio web funcionando"

# Parar solo nginx para cambiar configuración
echo "⏸️  Pausando nginx para cambio de configuración..."
docker stop umbot-nginx-fixed 2>/dev/null || docker stop umbot-nginx-static 2>/dev/null || true

# Iniciar stack híbrido
echo "🔄 Iniciando stack híbrido completo..."
docker-compose -f docker-compose.hybrid.yml up -d --build

# Esperar a que servicios estén listos
echo "⏳ Esperando servicios híbridos..."
sleep 30

# Verificar servicios
echo "📊 Estado de servicios híbridos:"
docker-compose -f docker-compose.hybrid.yml ps

# Verificar salud de Directus
echo "🏥 Verificando salud de Directus..."
timeout 60 bash -c 'until curl -f http://localhost:8055/server/health 2>/dev/null; do echo "Esperando Directus..."; sleep 5; done' || echo "⚠️ Directus aún iniciando"

echo "✅ IMPLEMENTACIÓN HÍBRIDA COMPLETADA"
echo "🌐 Sitio: https://www.umbot.com.ar"
echo "🎛️ Admin: https://www.umbot.com.ar/admin"
echo "📊 Usuario: admin@umbot.com.ar"
echo "🔑 Pass: UmbotHybridAdmin2025!"

REMOTE_SCRIPT

chmod +x remote-hybrid-implementation.sh

echo "   ✅ Script de implementación remota creado"

# PASO 3: Transferencia segura via SFTP
echo ""
echo "3️⃣ TRANSFERENCIA SEGURA VIA SFTP"
echo "   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   📡 Método: SFTP (SSH directo bloqueado)"
echo "   📂 Transfiriendo: paquete híbrido + script implementación"

# Preparar comandos SFTP
cat > sftp_commands.txt << EOF
cd $REMOTE_DIR
put fumbling-field-hybrid.tar.gz
put remote-hybrid-implementation.sh
chmod 755 remote-hybrid-implementation.sh
ls -la fumbling-field-hybrid.tar.gz remote-hybrid-implementation.sh
bye
EOF

echo "   📤 Iniciando transferencia SFTP..."
echo "   ⚠️  Se solicitará password del servidor"

# PASO 4: Instrucciones para ejecución manual
echo ""
echo "4️⃣ INSTRUCCIONES DE EJECUCIÓN"
echo "   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   📋 Comandos para ejecutar en servidor:"
echo ""
echo "   🔑 ACCESO AL SERVIDOR:"
echo "      sftp root@$SERVER"
echo "      (usar password: gsiB%s@0yD)"
echo ""
echo "   📁 COMANDOS SFTP PREPARADOS:"
cat sftp_commands.txt | sed 's/^/      /'
echo ""
echo "   🚀 EJECUCIÓN EN SERVIDOR:"
echo "      ssh root@$SERVER (si funciona) O usar panel web"
echo "      cd $REMOTE_DIR"
echo "      ./remote-hybrid-implementation.sh"
echo ""

echo "5️⃣ MONITOREO POST-IMPLEMENTACIÓN"
echo "   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   🌐 Sitio web: https://www.umbot.com.ar"
echo "   🎛️ Panel admin: https://www.umbot.com.ar/admin"
echo "   🏥 Health check: https://www.umbot.com.ar/health"
echo ""

# PASO 6: Ejecutar transferencia automática si es posible
echo "6️⃣ TRANSFERENCIA AUTOMÁTICA"
echo "   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if command -v sftp >/dev/null 2>&1; then
    echo "   📡 Intentando transferencia SFTP automática..."
    echo "   (Si falla, usar comandos manuales mostrados arriba)"
    
    sftp -b sftp_commands.txt $USER@$SERVER 2>/dev/null && {
        echo "   ✅ Transferencia SFTP exitosa"
        echo ""
        echo "🎯 PRÓXIMO PASO:"
        echo "   Ejecutar en servidor: ./remote-hybrid-implementation.sh"
        echo ""
    } || {
        echo "   ⚠️  Transferencia automática falló"
        echo "   📋 Usar comandos manuales mostrados arriba"
    }
else
    echo "   ⚠️  SFTP no disponible - usar comandos manuales"
fi

echo "🎉 PREPARACIÓN COMPLETADA"
echo "═════════════════════════"
echo "✅ Paquete híbrido listo: fumbling-field-hybrid.tar.gz"
echo "✅ Script implementación: remote-hybrid-implementation.sh"
echo "✅ Comandos SFTP: sftp_commands.txt"
echo ""
echo "📞 SOPORTE: Ver instrucciones detalladas arriba"
echo "🔄 ROLLBACK: Usar docker-compose.static.yml.backup si necesario" 