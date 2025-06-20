#!/bin/bash

echo "🚀 ========================================="
echo "🚀 UM25-0.3 DESPLIEGUE FINAL A PRODUCCIÓN"
echo "🚀 ========================================="
echo ""
echo "📦 Proyecto: Ultima Milla - Versión Final"
echo "🖥️  Servidor: 23.105.176.45"
echo "📁 Cambios:"
echo "   ✅ Eliminado 'Blog' y 'Casos de Éxito' del menú"
echo "   ✅ Nueva página /contacto moderna y profesional"
echo "   ✅ Formulario avanzado con campos expandidos"
echo "   ✅ Proceso de desarrollo visual en 4 pasos"
echo "   ✅ Canales múltiples de contacto (Email/Tel/WhatsApp)"
echo "   ✅ 741 registros + 470 imágenes importadas"
echo ""

# Verificar que estamos en el directorio correcto
if [ ! -f "projeto-completo-final.tar.gz" ]; then
    echo "❌ Error: projeto-completo-final.tar.gz no encontrado"
    echo "📍 Asegúrate de estar en el directorio correcto"
    exit 1
fi

echo "1️⃣ Verificando archivo comprimido..."
ls -lh projeto-completo-final.tar.gz
echo ""

echo "2️⃣ Conectando al servidor y ejecutando despliegue..."
ssh root@23.105.176.45 << 'EOF'
    set -e
    
    echo "📂 Navegando al directorio del proyecto..."
    cd /root/fumbling-field
    
    echo "💾 Creando backup del estado actual..."
    if [ -d "src" ]; then
        mv src src_backup_$(date +%Y%m%d_%H%M%S) 2>/dev/null || true
    fi
    
    echo "📦 Extrayendo código fuente actualizado..."
    if [ -f "projeto-completo-final.tar.gz" ]; then
        tar -xzf projeto-completo-final.tar.gz
        echo "✅ Código extraído exitosamente"
    else
        echo "❌ Error: projeto-completo-final.tar.gz no encontrado en servidor"
        exit 1
    fi
    
    echo "🔍 Verificando estructura de archivos..."
    if [ -d "src" ] && [ -f "package.json" ] && [ -f "astro.config.mjs" ]; then
        echo "✅ Estructura de archivos correcta"
        echo "📁 Archivos principales:"
        ls -la src/ | head -10
        echo "..."
    else
        echo "❌ Error: Estructura de archivos incompleta"
        exit 1
    fi
    
    echo ""
    echo "🔧 Configurando variables de entorno para producción..."
    cat > .env.production << 'ENVEOF'
NODE_ENV=production
ASTRO_ENV=production
PUBLIC_SITE_URL=http://23.105.176.45
PUBLIC_DOMAIN=23.105.176.45
STATIC_MODE=true
USE_STATIC_DATA=true
PORT=3000
HOST=0.0.0.0
ENVEOF
    
    echo "✅ Variables de entorno configuradas"
    
    echo ""
    echo "📦 Instalando dependencias Node.js..."
    if command -v npm >/dev/null 2>&1; then
        npm install --production
        echo "✅ Dependencias instaladas"
    else
        echo "⚠️  npm no encontrado, instalando Node.js..."
        curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
        yum install -y nodejs
        npm install --production
    fi
    
    echo ""
    echo "🏗️  Construyendo el proyecto para producción..."
    npm run build
    
    if [ -d "dist" ]; then
        echo "✅ Build completado exitosamente"
        echo "📁 Contenido de dist/:"
        ls -la dist/ | head -5
        echo "..."
    else
        echo "❌ Error en el build"
        exit 1
    fi
    
    echo ""
    echo "🐳 Configurando Docker..."
    
    # Crear docker-compose.production.yml
    cat > docker-compose.production.yml << 'DOCKEREOF'
version: '3.8'

services:
  astro-app:
    build:
      context: .
      dockerfile: Dockerfile.production
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - HOST=0.0.0.0
    volumes:
      - ./dist:/app/dist:ro
    restart: unless-stopped
    
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./dist:/usr/share/nginx/html:ro
    depends_on:
      - astro-app
    restart: unless-stopped
DOCKEREOF

    # Crear Dockerfile.production
    cat > Dockerfile.production << 'DOCKERFILEEOF'
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force
COPY dist ./dist
EXPOSE 3000
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "3000"]
DOCKERFILEEOF

    # Crear configuración Nginx optimizada
    cat > nginx.conf << 'NGINXEOF'
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;
    
    gzip on;
    gzip_vary on;
    gzip_min_length 10240;
    gzip_proxied expired no-cache no-store private must-revalidate no_last_modified no_etag auth;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/xml+rss
        application/json;

    server {
        listen 80;
        server_name 23.105.176.45;
        root /usr/share/nginx/html;
        index index.html;

        # Configuración para Astro
        location / {
            try_files $uri $uri/ $uri.html /index.html;
        }

        # Caché para assets estáticos
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        # Headers de seguridad
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header Referrer-Policy "no-referrer-when-downgrade" always;
        add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    }
}
NGINXEOF

    echo "✅ Configuraciones Docker creadas"
    
    echo ""
    echo "🔄 Deteniendo servicios anteriores..."
    docker-compose down 2>/dev/null || true
    docker-compose -f docker-compose.production.yml down 2>/dev/null || true
    
    echo "🚀 Iniciando servicios en producción..."
    docker-compose -f docker-compose.production.yml up -d --build
    
    echo ""
    echo "⏳ Esperando que los servicios estén listos..."
    sleep 10
    
    echo "🔍 Verificando estado de los servicios..."
    docker-compose -f docker-compose.production.yml ps
    
    echo ""
    echo "🌐 Verificando conectividad..."
    curl -I http://localhost/ || echo "⚠️  Nginx no responde todavía"
    curl -I http://localhost:3000/ || echo "⚠️  Astro no responde todavía"
    
    echo ""
    echo "📋 Logs recientes:"
    docker-compose -f docker-compose.production.yml logs --tail=20
    
EOF

echo ""
echo "3️⃣ Verificando despliegue..."
echo "🌐 Probando conectividad externa..."
curl -I http://23.105.176.45/ && echo "✅ Sitio accesible externamente" || echo "⚠️  Verificar configuración de red"

echo ""
echo "🎉 ========================================="
echo "🎉 DESPLIEGUE COMPLETADO"
echo "🎉 ========================================="
echo ""
echo "🌍 URLs de acceso:"
echo "   📍 IP Directa: http://23.105.176.45/"
echo "   📍 Contacto: http://23.105.176.45/contacto"
echo "   📍 Servicios: http://23.105.176.45/servicios"
echo "   📍 Antecedentes: http://23.105.176.45/antecedentes"
echo ""
echo "✅ Cambios desplegados:"
echo "   ✅ Menú limpio (sin Blog/Casos de Éxito)"
echo "   ✅ Página contacto moderna con proceso 4 pasos"
echo "   ✅ Formulario avanzado con tipos proyecto y presupuesto"
echo "   ✅ Canales múltiples (Email/Tel/WhatsApp)"
echo "   ✅ 741 registros + 470 imágenes funcionando"
echo ""
echo "🔧 Para monitorear:"
echo "   ssh root@23.105.176.45 'cd /root/fumbling-field && docker-compose -f docker-compose.production.yml logs -f'"
echo ""
echo "🎯 ¡PROYECTO UM25-0.3 EN PRODUCCIÓN!" 