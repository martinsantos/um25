#!/bin/bash
# Script para corregir la configuración de nginx para servir imágenes de antecedentes
# Versión 2 - Corrige la inserción del bloque location

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

# 3. Insertar nuevo bloque de configuración ANTES del location /
echo "Actualizando configuración de nginx..."

# Crear archivo temporal
TEMP_CONF=$(mktemp)

# Procesar el archivo línea por línea
while IFS= read -r line; do
    # Imprimir la línea actual
    echo "$line" >> "$TEMP_CONF"
    
    # Si encontramos "location /" (sin ^~), insertar nuestro bloque ANTES
    if [[ "$line" =~ ^[[:space:]]*location[[:space:]]+/[[:space:]]*\{ ]]; then
        echo "    # Configuración específica para imágenes de antecedentes" >> "$TEMP_CONF"
        echo "    location ^~ /imagenes_antecedentes_versionproduccion/ {" >> "$TEMP_CONF"
        echo "        alias /var/www/umbot/umbot-astro/static/imagenes_antecedentes_versionproduccion/;" >> "$TEMP_CONF"
        echo "        access_log off;" >> "$TEMP_CONF"
        echo "        log_not_found on;" >> "$TEMP_CONF"
        echo "        expires 30d;" >> "$TEMP_CONF"
        echo "        add_header Cache-Control \"public, no-transform\";" >> "$TEMP_CONF"
        echo "        try_files \$uri =404;" >> "$TEMP_CONF"
        echo "    }" >> "$TEMP_CONF"
        echo "" >> "$TEMP_CONF"
    fi
done < "$NGINX_CONF"

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
