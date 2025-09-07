#!/bin/bash
# Script para corregir la configuración de nginx para servir imágenes de antecedentes
# Basado en la documentación de solucionfinal.md

set -e  # Detener en caso de error

# Variables
NGINX_CONF="/etc/nginx/conf.d/umbot-ssl.conf"
BACKUP_DIR="/root/nginx-backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Crear directorio de backups si no existe
mkdir -p "$BACKUP_DIR"

echo "=== INICIANDO ACTUALIZACIÓN DE CONFIGURACIÓN NGINX ==="

# 1. Crear backup de la configuración actual
cp "$NGINX_CONF" "${BACKUP_DIR}/umbot-ssl.conf.backup_${TIMESTAMP}"
echo "✅ Backup creado en: ${BACKUP_DIR}/umbot-ssl.conf.backup_${TIMESTAMP}"

# 2. Verificar si el bloque de imágenes ya existe
echo "Verificando configuración actual..."
if grep -q "location \^~ /imagenes_antecedentes_versionproduccion/" "$NGINX_CONF"; then
    echo "⚠️  Ya existe un bloque de configuración para imágenes de antecedentes"
    echo "Revisando configuración actual..."
    grep -A 10 "location \^~ /imagenes_antecedentes_versionproduccion/" "$NGINX_CONF"
    echo "¿Desea sobrescribirlo? (s/n) "
    read -r response
    if [[ ! "$response" =~ ^[Ss]$ ]]; then
        echo "❌ Operación cancelada por el usuario"
        exit 1
    fi
    # Eliminar bloque existente
    sed -i '/location \^~ \/imagenes_antecedentes_versionproduccion\//,/^[[:space:]]*}/d' "$NGINX_CONF"
fi

# 3. Insertar nuevo bloque de configuración
echo "Actualizando configuración de nginx..."

# Buscar la línea después de la cual insertar (antes del bloque location /)
INSERT_POINT=$(grep -n "location /" "$NGINX_CONF" | head -1 | cut -d: -f1)
if [ -z "$INSERT_POINT" ]; then
    echo "❌ No se pudo encontrar el punto de inserción en la configuración"
    exit 1
fi

# Crear archivo temporal con la nueva configuración
TEMP_CONF=$(mktemp)
{
    head -n $((INSERT_POINT - 1)) "$NGINX_CONF"
    echo "    # Configuración específica para imágenes de antecedentes"
    echo "    location ^~ /imagenes_antecedentes_versionproduccion/ {"
    echo "        alias /var/www/umbot/umbot-astro/static/imagenes_antecedentes_versionproduccion/;
        access_log off;
        log_not_found on;
        expires 30d;
        add_header Cache-Control \"public, no-transform\";
        try_files \$uri =404;"
    echo "    }"
    echo ""
    tail -n +$INSERT_POINT "$NGINX_CONF"
} > "$TEMP_CONF"

# 4. Verificar sintaxis de nginx
echo "Verificando sintaxis de nginx..."
if ! nginx -t -c "$TEMP_CONF" 2>/dev/null; then
    echo "❌ Error en la sintaxis de nginx. Revise los logs:"
    nginx -t -c "$TEMP_CONF"
    rm -f "$TEMP_CONF"
    exit 1
fi

# 5. Aplicar cambios
mv "$TEMP_CONF" "$NGINX_CONF"
chmod 644 "$NGINX_CONF"

# 6. Recargar nginx
echo "Recargando configuración de nginx..."
systemctl reload nginx

# 7. Verificar estado
echo -e "\n=== VERIFICACIÓN FINAL ==="
if systemctl is-active --quiet nginx; then
    echo "✅ nginx está en ejecución"
    echo "✅ Configuración aplicada correctamente"
    
    # Probar acceso a imágenes
    echo -e "\n=== PRUEBA DE ACCESO A IMÁGENES ==="
    TEST_IMAGES=(
        "ultimamilla_isi_solutions_-_redes_y_comunicaciones_20250415_194242_s1045715784.png"
        "ultimamilla_ministerio_de_salud_-_soporte_tecnico_20250415_201122_s1234567890.png"
    )
    
    for img in "${TEST_IMAGES[@]}"; do
        URL="https://www.ultimamilla.com.ar/imagenes_antecedentes_versionproduccion/$img"
        echo -n "Verificando $img... "
        if curl -s -I "$URL" | head -1 | grep -q 200; then
            echo "✅ OK"
        else
            echo "❌ ERROR: No se pudo acceder a $URL"
        fi
    done
    
    echo -e "\n✅ Configuración completada exitosamente"
else
    echo "❌ Error al recargar nginx"
    systemctl status nginx --no-pager
    exit 1
fi
