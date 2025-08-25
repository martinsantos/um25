#!/bin/bash

# ==============================================
# Script de Migración: umbot.com.ar → ultimamilla.com.ar
# ==============================================

set -e

echo "🌐 INICIANDO MIGRACIÓN DE DOMINIO: umbot.com.ar → ultimamilla.com.ar"
echo "=============================================================="

# Variables de configuración
NEW_DOMAIN="ultimamilla.com.ar"
OLD_DOMAIN="umbot.com.ar"
SERVER_IP="23.105.176.45"
SERVER_USER="root"

echo "📋 PASO 1: Verificando configuración local..."

# Backup de configuración actual
echo "💾 Creando backup de configuración actual..."
cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
cp astro.config.mjs astro.config.mjs.backup.$(date +%Y%m%d_%H%M%S)

echo "⚙️ PASO 2: Actualizando configuración Astro..."

# Actualizar astro.config.mjs para el nuevo dominio
sed -i.bak "s|http://localhost:3000|https://www.${NEW_DOMAIN}|g" astro.config.mjs

echo "🔧 PASO 3: Creando configuración Nginx para ultimamilla.com.ar..."

# Crear configuración nginx para el nuevo dominio
cat > nginx-ultimamilla.conf << EOF
# Configuración Nginx para ultimamilla.com.ar
server {
    listen 80;
    listen [::]:80;
    server_name ${NEW_DOMAIN} www.${NEW_DOMAIN};
    
    # Redirect HTTP to HTTPS
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name ${NEW_DOMAIN} www.${NEW_DOMAIN};

    # SSL Configuration (será configurado por CyberPanel)
    ssl_certificate /etc/letsencrypt/live/${NEW_DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${NEW_DOMAIN}/privkey.pem;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Proxy to Astro app
    location / {
        proxy_pass http://localhost:4321;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Static assets caching
    location /_astro/ {
        proxy_pass http://localhost:4321;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Images caching
    location ~* \.(jpg|jpeg|png|gif|ico|svg|webp|avif)$ {
        proxy_pass http://localhost:4321;
        expires 1y;
        add_header Cache-Control "public";
    }
}
EOF

echo "📊 PASO 4: Creando archivo de zonas DNS..."

# Crear archivo con todas las zonas DNS necesarias
cat > dns-zones-ultimamilla.txt << EOF
# ZONAS DNS CRÍTICAS PARA ULTIMAMILLA.COM.AR
# ==========================================

# REGISTROS A PRINCIPALES (IP: ${SERVER_IP})
${NEW_DOMAIN}                   A    ${SERVER_IP}
www.${NEW_DOMAIN}              A    ${SERVER_IP}
umw.${NEW_DOMAIN}              A    ${SERVER_IP}
sello.${NEW_DOMAIN}            A    ${SERVER_IP}

# REGISTROS MX (GMAIL)
${NEW_DOMAIN}    MX    1     aspmx.l.google.com
${NEW_DOMAIN}    MX    5     alt1.aspmx.l.google.com
${NEW_DOMAIN}    MX    5     alt2.aspmx.l.google.com
${NEW_DOMAIN}    MX    10    aspmx2.googlemail.com
${NEW_DOMAIN}    MX    30    aspmx3.googlemail.com

# REGISTROS CNAME PRINCIPALES
drive.${NEW_DOMAIN}           CNAME    ghs.googlehosted.com
correo.${NEW_DOMAIN}          CNAME    ghs.googlehosted.com

# SUBDOMINIO ESPECIAL
t57rgr35hbdm.${NEW_DOMAIN}    CNAME    gv-z4cxzzhe5v5ix6.dv.googlehosted.com
EOF

echo "🚀 PASO 5: Preparando deploy para el nuevo dominio..."

# Crear script de deploy específico para ultimamilla.com.ar
cat > deploy-ultimamilla.sh << 'EOF'
#!/bin/bash

echo "🚀 DEPLOYING TO ULTIMAMILLA.COM.AR"
echo "=================================="

# Build optimizado para producción
echo "📦 Building optimized version..."
npm run build

# Rebuild Docker containers
echo "🐳 Rebuilding Docker containers..."
docker-compose -f docker-compose.production.yml down
docker-compose -f docker-compose.production.yml up -d --build

# Verificar servicios
echo "✅ Verificando servicios..."
sleep 10
curl -f http://localhost:4321 || echo "⚠️ Astro app no responde"
curl -f http://localhost:8055 || echo "⚠️ Directus no responde"

echo "✅ Deploy completado para ultimamilla.com.ar"
EOF

chmod +x deploy-ultimamilla.sh

echo "📋 PASO 6: Generando instrucciones de CyberPanel..."

cat > INSTRUCCIONES-CYBERPANEL.md << EOF
# 🌐 INSTRUCCIONES PARA CYBERPANEL - MIGRACIÓN ULTIMAMILLA.COM.AR

## 1. CREAR WEBSITE
1. **Websites** → **Create Website**
2. **Domain**: ultimamilla.com.ar
3. **Admin Email**: tu-email@gmail.com
4. **Package**: Default o el mismo que umbot.com.ar
5. **Create Website**

## 2. AGREGAR SUBDOMINIOS
1. **Websites** → **List Websites** → ultimamilla.com.ar → **Manage**
2. **Create Child Domain**:
   - www.ultimamilla.com.ar
   - umw.ultimamilla.com.ar  
   - sello.ultimamilla.com.ar

## 3. CONFIGURAR DNS
1. **DNS** → **Create DNS Zone** → ultimamilla.com.ar
2. **Agregar registros desde dns-zones-ultimamilla.txt**

### Registros críticos:
\`\`\`
ultimamilla.com.ar        A      ${SERVER_IP}
www.ultimamilla.com.ar    A      ${SERVER_IP}
ultimamilla.com.ar        MX 1   aspmx.l.google.com
ultimamilla.com.ar        MX 5   alt1.aspmx.l.google.com
\`\`\`

## 4. CONFIGURAR SSL
1. **SSL** → **Manage SSL** → ultimamilla.com.ar
2. **Issue SSL** (Let's Encrypt)
3. **Force HTTPS**: Enable

## 5. PROXY CONFIGURATION
1. **Websites** → ultimamilla.com.ar → **Manage**
2. **Configuration** → **Edit Configuration**
3. **Copiar contenido de nginx-ultimamilla.conf**

## 6. VERIFICAR
- https://www.ultimamilla.com.ar (debe cargar el sitio)
- https://ultimamilla.com.ar (redirect a www)
- Correo: test@ultimamilla.com.ar (debe funcionar)
EOF

echo ""
echo "✅ MIGRACIÓN PREPARADA EXITOSAMENTE"
echo "=================================="
echo ""
echo "📁 Archivos creados:"
echo "  • nginx-ultimamilla.conf - Configuración Nginx"
echo "  • dns-zones-ultimamilla.txt - Zonas DNS"
echo "  • deploy-ultimamilla.sh - Script de deploy"
echo "  • INSTRUCCIONES-CYBERPANEL.md - Guía paso a paso"
echo ""
echo "🎯 PRÓXIMOS PASOS:"
echo "1. Seguir INSTRUCCIONES-CYBERPANEL.md en tu CyberPanel"
echo "2. Configurar DNS con dns-zones-ultimamilla.txt"
echo "3. Ejecutar ./deploy-ultimamilla.sh cuando esté listo"
echo ""
echo "🌐 Nuevo dominio: https://www.ultimamilla.com.ar"
echo ""
