#!/bin/bash

# Script para desplegar la nueva plantilla de servicios a producción
# Fecha: $(date '+%Y-%m-%d %H:%M:%S')

set -e  # Salir en caso de error

# Configuración
SERVER="23.105.176.45"
USER="root"
PASS="gsiB%s@0yD"
LOCAL_DIR="/Users/Shared/Files From d.localized/D/ultima milla/2024/MKT 2024/umw141024/umw46-main/fumbling-field"
REMOTE_DIR="/root/fumbling-field"
TIMESTAMP=$(date '+%Y%m%d-%H%M%S')

echo "=== DESPLIEGUE DE PLANTILLA DE SERVICIOS ===" 
echo "Timestamp: $TIMESTAMP"
echo "Servidor: $SERVER"

# Verificar archivos locales
echo "1. Verificando archivos locales..."
if [ ! -f "$LOCAL_DIR/src/pages/servicios/[id]/[slug].astro" ]; then
    echo "ERROR: No se encuentra el archivo de plantilla local"
    exit 1
fi

if [ ! -f "$LOCAL_DIR/src/utils/slugUtils.js" ]; then
    echo "ERROR: No se encuentra el archivo de utilidades slug"
    exit 1
fi

if [ ! -f "$LOCAL_DIR/src/data/servicios_reales_db.js" ]; then
    echo "ERROR: No se encuentra el archivo de datos de servicios"
    exit 1
fi

echo "✓ Archivos locales verificados"

# Crear paquete de archivos
echo "2. Creando paquete de despliegue..."
PACKAGE_DIR="/tmp/deploy-servicios-$TIMESTAMP"
mkdir -p "$PACKAGE_DIR/src/pages/servicios/[id]/"
mkdir -p "$PACKAGE_DIR/src/utils/"
mkdir -p "$PACKAGE_DIR/src/data/"

# Copiar archivos
cp "$LOCAL_DIR/src/pages/servicios/[id]/[slug].astro" "$PACKAGE_DIR/src/pages/servicios/[id]/"
cp "$LOCAL_DIR/src/utils/slugUtils.js" "$PACKAGE_DIR/src/utils/"
cp "$LOCAL_DIR/src/data/servicios_reales_db.js" "$PACKAGE_DIR/src/data/"

# Crear archivo de información
cat > "$PACKAGE_DIR/deploy-info.txt" << EOF
Despliegue de plantilla de servicios mejorada
Fecha: $TIMESTAMP
Archivos incluidos:
- src/pages/servicios/[id]/[slug].astro (plantilla mejorada del backup)
- src/utils/slugUtils.js (utilidades de slug)
- src/data/servicios_reales_db.js (datos de servicios)

Origen: Plantilla del backup /root/backup-refactorizacion-20250704-130656/
Características:
- Diseño profesional con hero section y layout moderno
- Secciones organizadas (información, servicios incluidos, características)
- Servicios relacionados
- Sidebar con información del servicio y etiquetas
- Uso de datos estáticos (no SSR problemático)
EOF

# Crear archivo tar
cd "/tmp"
tar -czf "deploy-servicios-$TIMESTAMP.tar.gz" "deploy-servicios-$TIMESTAMP/"
echo "✓ Paquete creado: /tmp/deploy-servicios-$TIMESTAMP.tar.gz"

# Transferir a servidor
echo "3. Transfiriendo archivos al servidor..."
sshpass -p "$PASS" scp -o StrictHostKeyChecking=no "/tmp/deploy-servicios-$TIMESTAMP.tar.gz" "$USER@$SERVER:/tmp/"
echo "✓ Archivos transferidos"

# Ejecutar despliegue en servidor
echo "4. Ejecutando despliegue en servidor..."
sshpass -p "$PASS" ssh -o StrictHostKeyChecking=no "$USER@$SERVER" << EOF
set -e
cd /tmp

# Backup actual
echo "Haciendo backup del archivo actual..."
cp "$REMOTE_DIR/src/pages/servicios/[id]/[slug].astro" "$REMOTE_DIR/src/pages/servicios/[id]/[slug].astro.backup-$TIMESTAMP" || echo "Archivo actual no encontrado"

# Extraer archivos
echo "Extrayendo archivos..."
tar -xzf "deploy-servicios-$TIMESTAMP.tar.gz"
cd "deploy-servicios-$TIMESTAMP"

# Copiar archivos
echo "Copiando archivos..."
cp "src/pages/servicios/[id]/[slug].astro" "$REMOTE_DIR/src/pages/servicios/[id]/"
cp "src/utils/slugUtils.js" "$REMOTE_DIR/src/utils/"
cp "src/data/servicios_reales_db.js" "$REMOTE_DIR/src/data/"

echo "✓ Archivos copiados al servidor"

# Verificar contenedores Docker
echo "Verificando contenedores..."
docker ps --format "table {{.Names}}\t{{.Status}}" | grep -E "(astro|directus)"

# Reconstruir y reiniciar contenedor Astro
echo "Reconstruyendo aplicación Astro..."
cd "$REMOTE_DIR"

# Detener contenedor
docker stop astro-app || echo "Contenedor no estaba corriendo"

# Reconstruir imagen
docker build -t astro-app .

# Iniciar contenedor
docker run -d --name astro-app-new --network fumbling-field_app_network -p 4321:4321 astro-app

# Cambiar nombres
docker rm astro-app || echo "Contenedor anterior ya eliminado"
docker rename astro-app-new astro-app

echo "✓ Aplicación reiniciada"

# Limpiar archivos temporales
rm -rf "/tmp/deploy-servicios-$TIMESTAMP"
rm -f "/tmp/deploy-servicios-$TIMESTAMP.tar.gz"
EOF

echo "5. Verificando despliegue..."
echo "Probando URL de servicios..."

# Probar URLs
sshpass -p "$PASS" ssh -o StrictHostKeyChecking=no "$USER@$SERVER" << 'EOF'
# Esperar que la aplicación esté lista
echo "Esperando que la aplicación esté lista..."
sleep 10

# Probar URLs
echo "Probando URL de servicios..."
curl -s -o /dev/null -w "%{http_code}" "http://localhost:4321/servicios/2/redes-de-datos" || echo "ERROR en prueba local"

echo "Probando conectividad externa..."
curl -s -o /dev/null -w "%{http_code}" "https://ultimamilla.com.ar/servicios/2/redes-de-datos" || echo "ERROR en prueba externa"

echo "Estado final de contenedores:"
docker ps --format "table {{.Names}}\t{{.Status}}" | grep -E "(astro|directus|database)"
EOF

# Limpiar archivos locales temporales
rm -rf "$PACKAGE_DIR"
rm -f "/tmp/deploy-servicios-$TIMESTAMP.tar.gz"

echo ""
echo "=== DESPLIEGUE COMPLETADO ==="
echo "Timestamp: $TIMESTAMP"
echo "Archivos desplegados:"
echo "- Plantilla de servicios mejorada"
echo "- Utilidades de slug actualizadas"  
echo "- Datos de servicios actualizados"
echo ""
echo "Próximos pasos:"
echo "1. Verificar https://ultimamilla.com.ar/servicios/2/redes-de-datos"
echo "2. Revisar otros servicios: /servicios/1/, /servicios/3/, etc."
echo "3. Verificar logs si hay problemas: docker logs astro-app"
echo ""
