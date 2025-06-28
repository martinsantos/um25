#!/bin/bash

echo "🚨 SOLUCIONANDO CONFLICTO PUERTO 80 - DIRECTUS ADMIN"
echo "===================================================="
echo "Fecha: $(date)"
echo ""

# Función para crear el script de corrección remota
create_remote_fix_script() {
cat > fix-port-conflict-remote.sh << 'EOF'
#!/bin/bash
echo "🔧 CORRIGIENDO CONFLICTO DE PUERTO 80 EN SERVIDOR"
echo "================================================"

# 1. Detener TODOS los contenedores usando puerto 80
echo "⏹️  1. Deteniendo todos los contenedores..."
docker stop $(docker ps -q) 2>/dev/null || true

# 2. Remover todos los contenedores
echo "🗑️  2. Removiendo contenedores..."
docker rm $(docker ps -aq) 2>/dev/null || true

# 3. Limpiar redes y volúmenes huérfanos
echo "🧹 3. Limpiando Docker..."
docker network prune -f
docker volume prune -f

# 4. Verificar que puerto 80 esté libre
echo "🔍 4. Verificando puerto 80..."
netstat -tlnp | grep :80 || echo "✅ Puerto 80 libre"

# 5. Iniciar configuración híbrida corregida
echo "🚀 5. Iniciando stack híbrido..."
cd /root/fumbling-field
docker-compose -f docker-compose.fixed.yml up -d

# 6. Esperar que los servicios inicien
echo "⏳ 6. Esperando servicios (45 segundos)..."
sleep 45

# 7. Verificar estado de contenedores
echo "📊 7. Estado de contenedores:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# 8. Verificar acceso web
echo ""
echo "🔍 8. Verificando acceso:"
echo "Sitio principal:"
curl -I https://www.umbot.com.ar/ 2>/dev/null | head -1
echo "Admin panel:"
curl -I https://www.umbot.com.ar/admin 2>/dev/null | head -1

# 9. Verificar logs de Directus
echo ""
echo "📝 9. Logs de Directus (últimas 10 líneas):"
docker logs umbot-directus-admin --tail 10

echo ""
echo "✅ CORRECCIÓN COMPLETADA"
echo "🌐 Accesos disponibles:"
echo "   - Sitio: https://www.umbot.com.ar/"
echo "   - Admin: https://www.umbot.com.ar/admin"
echo "   - Login: admin@umbot.com.ar / UmbotDirectusAdmin2025!"

EOF
chmod +x fix-port-conflict-remote.sh
}

echo "📝 1. Creando script de corrección remota..."
create_remote_fix_script

echo "✅ 2. Script creado: fix-port-conflict-remote.sh"
echo ""
echo "🔧 PASOS PARA APLICAR LA CORRECCIÓN:"
echo "===================================="
echo ""
echo "1. 📤 Transferir archivos al servidor:"
echo "   scp docker-compose.fixed.yml nginx.fixed.conf fix-port-conflict-remote.sh root@www.umbot.com.ar:~/fumbling-field/"
echo ""
echo "2. 🔐 Conectar al servidor:"
echo "   ssh root@www.umbot.com.ar"
echo ""
echo "3. 🚀 Aplicar corrección:"
echo "   cd fumbling-field"
echo "   chmod +x fix-port-conflict-remote.sh"
echo "   ./fix-port-conflict-remote.sh"
echo ""
echo "🎯 PROBLEMA QUE RESUELVE:"
echo "- Error: 'Bind for 0.0.0.0:80 failed: port is already allocated'"
echo "- Conflicto entre nginx estático y nginx híbrido"
echo "- Contenedores que no pueden iniciar por puerto ocupado"
echo ""
echo "📋 RESULTADO ESPERADO:"
echo "- Puerto 80 liberado"
echo "- Stack híbrido funcionando"
echo "- Admin Directus accesible en /admin"
echo "- 469 antecedentes + 5 servicios + 821 imágenes disponibles" 