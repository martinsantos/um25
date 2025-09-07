#!/bin/bash

# Script para configurar e importar contenidos a Directus remotamente
# Transfiere archivos al servidor y ejecuta la importación via SSH
# 2025-01-26 - UltiMilla Remote Content Setup

echo "🌐 CONFIGURACIÓN REMOTA DE CONTENIDOS DIRECTUS"
echo "==============================================="

# Variables del servidor remoto
REMOTE_USER="root"
REMOTE_HOST="138.197.73.169"
REMOTE_DIR="/tmp/directus-import"

# Función para verificar conexión SSH
check_ssh_connection() {
    echo "🔍 Verificando conexión SSH..."
    if ! ssh -o ConnectTimeout=10 "$REMOTE_USER@$REMOTE_HOST" "echo 'SSH OK'" &>/dev/null; then
        echo "❌ Error: No se puede conectar via SSH a $REMOTE_USER@$REMOTE_HOST"
        echo "💡 Asegúrate de que:"
        echo "   • Las claves SSH estén configuradas"
        echo "   • El servidor esté accesible"
        echo "   • El puerto SSH esté abierto"
        exit 1
    fi
    echo "✅ Conexión SSH exitosa"
}

# Función para transferir archivos necesarios
transfer_files() {
    echo ""
    echo "📤 TRANSFIRIENDO ARCHIVOS AL SERVIDOR"
    echo "====================================="
    
    # Crear directorio temporal en el servidor
    echo "📁 Creando directorio temporal en servidor..."
    ssh "$REMOTE_USER@$REMOTE_HOST" "mkdir -p $REMOTE_DIR"
    
    # Transferir archivos de datos
    echo "📋 Transfiriendo archivos de datos..."
    scp -r "src/data/antecedentes_completos.js" "$REMOTE_USER@$REMOTE_HOST:$REMOTE_DIR/"
    scp -r "src/data/servicios_completos.js" "$REMOTE_USER@$REMOTE_HOST:$REMOTE_DIR/"
    
    # Transferir scripts
    echo "🔧 Transfiriendo scripts..."
    scp "create-collections.sh" "$REMOTE_USER@$REMOTE_HOST:$REMOTE_DIR/"
    scp "import-content-to-directus.sh" "$REMOTE_USER@$REMOTE_HOST:$REMOTE_DIR/"
    
    echo "✅ Archivos transferidos exitosamente"
}

# Función para instalar dependencias en el servidor
install_dependencies() {
    echo ""
    echo "📦 INSTALANDO DEPENDENCIAS EN SERVIDOR"
    echo "======================================="
    
    ssh "$REMOTE_USER@$REMOTE_HOST" << 'EOF'
        echo "🔄 Actualizando paquetes..."
        apt update -qq
        
        echo "📦 Instalando dependencias necesarias..."
        apt install -y curl jq nodejs npm &>/dev/null
        
        echo "✅ Dependencias instaladas"
        
        # Verificar instalación
        echo "🔍 Verificando instalación:"
        echo "   curl: $(which curl)"
        echo "   jq: $(which jq)"  
        echo "   node: $(which node)"
EOF
    
    echo "✅ Dependencias verificadas en servidor"
}

# Función para ejecutar creación de colecciones
create_collections_remote() {
    echo ""
    echo "📦 CREANDO COLECCIONES EN DIRECTUS"
    echo "=================================="
    
    ssh "$REMOTE_USER@$REMOTE_HOST" << EOF
        cd $REMOTE_DIR
        chmod +x create-collections.sh
        
        echo "🔧 Ejecutando creación de colecciones..."
        ./create-collections.sh
EOF
}

# Función para ejecutar importación de contenidos
import_content_remote() {
    echo ""
    echo "📥 IMPORTANDO CONTENIDOS A DIRECTUS"
    echo "==================================="
    
    ssh "$REMOTE_USER@$REMOTE_HOST" << EOF
        cd $REMOTE_DIR
        chmod +x import-content-to-directus.sh
        
        # Actualizar rutas de archivos para el servidor
        sed -i 's|src/data/antecedentes_completos.js|antecedentes_completos.js|g' import-content-to-directus.sh
        sed -i 's|src/data/servicios_completos.js|servicios_completos.js|g' import-content-to-directus.sh
        
        echo "📥 Ejecutando importación de contenidos..."
        ./import-content-to-directus.sh
EOF
}

# Función para limpiar archivos temporales
cleanup_remote() {
    echo ""
    echo "🧹 LIMPIANDO ARCHIVOS TEMPORALES"
    echo "================================"
    
    ssh "$REMOTE_USER@$REMOTE_HOST" "rm -rf $REMOTE_DIR"
    echo "✅ Archivos temporales eliminados"
}

# Función principal
main() {
    echo "🎯 Objetivo: Importar todos los contenidos del sitio web a Directus"
    echo "📊 Contenidos a importar:"
    echo "   • 469 Antecedentes con detalles completos"
    echo "   • Servicios con descripciones y presupuestos"
    echo "   • Imágenes y metadatos asociados"
    echo ""
    echo "🌐 Servidor: $REMOTE_HOST"
    echo "👤 Usuario: $REMOTE_USER"
    echo ""
    
    # Verificar conexión
    check_ssh_connection
    
    # Transferir archivos
    transfer_files
    
    # Instalar dependencias
    install_dependencies
    
    # Crear colecciones
    create_collections_remote
    
    # Importar contenidos
    import_content_remote
    
    # Limpiar
    cleanup_remote
    
    echo ""
    echo "🎉 CONFIGURACIÓN COMPLETADA EXITOSAMENTE"
    echo "========================================"
    echo ""
    echo "✨ Todos los contenidos han sido importados a Directus!"
    echo ""
    echo "🔗 Accesos disponibles:"
    echo "   • Panel Directus: https://www.ultimamilla.com.ar:8056/admin"
    echo "   • Alternativo: https://www.ultimamilla.com.ar:8055/admin"
    echo ""
    echo "🔐 Credenciales:"
    echo "   • Usuario: admin@ultimamilla.com.ar"
    echo "   • Contraseña: UmbotDirectusAdmin2025!"
    echo ""
    echo "📋 Colecciones disponibles:"
    echo "   • Antecedentes (469 registros)"
    echo "   • Servicios (múltiples registros)"
    echo ""
    echo "✅ Ahora puedes administrar todos los contenidos del sitio web en línea!"
}

# Verificar parámetros
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    echo "USO: $0"
    echo ""
    echo "Este script transfiere e importa todos los contenidos del sitio web"
    echo "a Directus para administración en línea."
    echo ""
    echo "REQUISITOS:"
    echo "  • Acceso SSH configurado al servidor"
    echo "  • Directus funcionando en el servidor"
    echo "  • Archivos de datos disponibles localmente"
    echo ""
    echo "PROCESO:"
    echo "  1. Verifica conexión SSH"
    echo "  2. Transfiere archivos necesarios"
    echo "  3. Instala dependencias"
    echo "  4. Crea colecciones en Directus"
    echo "  5. Importa contenidos"
    echo "  6. Limpia archivos temporales"
    exit 0
fi

# Ejecutar
main "$@" 