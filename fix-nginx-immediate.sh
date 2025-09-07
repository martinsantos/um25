#!/bin/bash

echo "=== FIX NGINX INMEDIATO ==="
echo "Fecha: $(date)"

# 1. Verificar estado actual
echo "1. Estado actual de nginx:"
systemctl status nginx --no-pager

# 2. Iniciar nginx si no está activo
echo "2. Iniciando nginx..."
systemctl start nginx
systemctl enable nginx

# 3. Verificar que inició correctamente
echo "3. Verificando estado después del inicio:"
systemctl status nginx --no-pager

# 4. Verificar configuración
echo "4. Verificando configuración:"
nginx -t

# 5. Recargar configuración
echo "5. Recargando configuración:"
systemctl reload nginx

# 6. Verificar puertos
echo "6. Verificando puertos activos:"
netstat -tlnp | grep nginx

# 7. Verificar acceso HTTPS estándar
echo "7. Verificando HTTPS puerto 443:"
curl -k -I https://www.ultimamilla.com.ar/

# 8. Verificar que el sitio principal carga
echo "8. Verificando contenido del sitio:"
curl -k -s https://www.ultimamilla.com.ar/ | head -20

echo "=== FIN DEL FIX ===" 