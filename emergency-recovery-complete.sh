gsiB%s@0yD
#!/bin/bash

echo "🚨 PLAN DE EMERGENCIA - RECUPERACIÓN COMPLETA DESDE CERO"
echo "========================================================"
echo "Iniciado: $(date)"
echo ""

# Variables de configuración
SERVER_IP="23.105.176.45"
DOMAIN="www.ultimamilla.com.ar"
DB_USER="directus"
DB_PASS="directus123"
DB_NAME="directus"

echo "🔍 PASO 1: DIAGNÓSTICO COMPLETO DEL ESTADO ACTUAL"
echo "=================================================="

# Test de conectividad básica
echo "1.1 Probando conectividad servidor..."
if ping -c 3 $SERVER_IP > /dev/null 2>&1; then
    echo "✅ Servidor responde a ping"
else
    echo "❌ Servidor NO responde a ping"
fi

# Test del sitio web
echo "1.2 Probando sitio web principal..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN/ 2>/dev/null || echo "000")
if [ "$HTTP_STATUS" = "200" ]; then
    echo "✅ Sitio web responde: HTTP $HTTP_STATUS"
else
    echo "❌ Sitio web NO responde: HTTP $HTTP_STATUS"
fi

# Test de antecedentes
echo "1.3 Probando página de antecedentes..."
HTTP_ANTE=$(curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN/antecedentes/ 2>/dev/null || echo "000")
echo "📊 Antecedentes: HTTP $HTTP_ANTE"

# Test de servicios
echo "1.4 Probando página de servicios..."
HTTP_SERV=$(curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN/servicios/ 2>/dev/null || echo "000")
echo "📊 Servicios: HTTP $HTTP_SERV"

# Test de admin
echo "1.5 Probando panel admin..."
HTTP_ADMIN=$(curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN/admin 2>/dev/null || echo "000")
echo "📊 Admin: HTTP $HTTP_ADMIN"

echo ""
echo "🔧 PASO 2: CREANDO ARCHIVOS DE RECUPERACIÓN DE EMERGENCIA"
echo "=========================================================="

# Crear docker-compose de emergencia
echo "2.1 Creando docker-compose.emergency.yml..."
cat > docker-compose.emergency.yml << 'COMPOSE_EOF'
version: '3.8'

networks:
  umbot-emergency:
    driver: bridge

volumes:
  postgres_emergency:
  directus_emergency:

services:
  # PostgreSQL para emergencia
  postgres-emergency:
    image: postgres:15-alpine
    container_name: umbot-postgres-emergency
    environment:
      POSTGRES_DB: directus
      POSTGRES_USER: directus
      POSTGRES_PASSWORD: directus123
      POSTGRES_ROOT_PASSWORD: directus123
    volumes:
      - postgres_emergency:/var/lib/postgresql/data
    networks:
      - umbot-emergency
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U directus -d directus"]
      interval: 30s
      timeout: 10s
      retries: 5

  # Directus CMS de emergencia
  directus-emergency:
    image: directus/directus:10.8.3
    container_name: umbot-directus-emergency
    environment:
      KEY: 255d861b-5ea1-5996-9aa3-922530ec40b1
      SECRET: 6116487b-cda1-52c2-b5b5-c8022c45e263
      DB_CLIENT: pg
      DB_HOST: postgres-emergency
      DB_PORT: 5432
      DB_DATABASE: directus
      DB_USER: directus
      DB_PASSWORD: directus123
      ADMIN_EMAIL: admin@ultimamilla.com.ar
      ADMIN_PASSWORD: EmergencyAdmin2025!
      PUBLIC_URL: https://www.ultimamilla.com.ar
      CORS_ENABLED: true
      CORS_ORIGIN: true
    volumes:
      - directus_emergency:/directus/uploads
    networks:
      - umbot-emergency
    depends_on:
      postgres-emergency:
        condition: service_healthy
    restart: unless-stopped
    healthcheck:
      test:
        - CMD-SHELL
        - >
          node -e "require('http')
          .get('http://localhost:8055/server/health',
          r=>process.exit(r.statusCode===200?0:1));"
      start_period: 60s
      interval: 30s
      timeout: 10s
      retries: 5

  # Astro con build de emergencia
  astro-emergency:
    build:
      context: .
      dockerfile: Dockerfile.emergency
    container_name: umbot-astro-emergency
    environment:
      NODE_ENV: production
      DIRECTUS_URL: http://directus-emergency:8055
      USE_STATIC_DATA: false
    volumes:
      - ./public:/app/public:ro
    networks:
      - umbot-emergency
    depends_on:
      directus-emergency:
        condition: service_healthy
    restart: unless-stopped

  # Nginx de emergencia
  nginx-emergency:
    image: nginx:alpine
    container_name: umbot-nginx-emergency
    ports:
      - "80:80"
      - "443:443"
      - "8055:8055"
    volumes:
      - ./nginx.emergency.conf:/etc/nginx/conf.d/default.conf:ro
      - /etc/letsencrypt:/etc/letsencrypt:ro
      - /var/lib/letsencrypt:/var/lib/letsencrypt:ro
    networks:
      - umbot-emergency
    depends_on:
      - astro-emergency
      - directus-emergency
    restart: unless-stopped
COMPOSE_EOF

echo "✅ docker-compose.emergency.yml creado"

# Crear Dockerfile de emergencia
echo "2.2 Creando Dockerfile.emergency..."
cat > Dockerfile.emergency << 'DOCKER_EOF'
# Dockerfile de emergencia para recuperación rápida
FROM node:18-alpine AS builder

WORKDIR /app

# Copiar archivos de configuración
COPY package*.json ./
COPY astro.config.mjs ./
COPY tailwind.config.mjs ./
COPY tsconfig.json ./

# Instalar dependencias
RUN npm ci --only=production

# Copiar código fuente
COPY src/ ./src/
COPY public/ ./public/

# Build de emergencia con datos estáticos
ENV NODE_ENV=production
ENV USE_STATIC_DATA=true
RUN npm run build

# Imagen final optimizada
FROM nginx:alpine

# Copiar archivos construidos
COPY --from=builder /app/dist /usr/share/nginx/html

# Configuración nginx básica
RUN echo 'server { \
    listen 80; \
    server_name _; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ { \
        expires 1y; \
        add_header Cache-Control "public, immutable"; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
DOCKER_EOF

echo "✅ Dockerfile.emergency creado"

# Crear configuración nginx de emergencia
echo "2.3 Creando nginx.emergency.conf..."
cat > nginx.emergency.conf << 'NGINX_EOF'
upstream astro_emergency {
    server astro-emergency:80;
}

upstream directus_emergency {
    server directus-emergency:8055;
}

# Redirección HTTP a HTTPS
server {
    listen 80;
    server_name www.ultimamilla.com.ar;
    return 301 https://$server_name$request_uri;
}

# Servidor principal HTTPS
server {
    listen 443 ssl http2;
    server_name www.ultimamilla.com.ar;

    # Certificados SSL
    ssl_certificate /etc/letsencrypt/live/www.ultimamilla.com.ar/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/www.ultimamilla.com.ar/privkey.pem;

    # Headers de seguridad
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Panel de administración Directus
    location /admin {
        proxy_pass http://directus_emergency;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
        
        # WebSocket support para admin
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # API Directus
    location /api/ {
        proxy_pass http://directus_emergency;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Assets de Directus
    location /assets/ {
        proxy_pass http://directus_emergency;
        proxy_set_header Host $host;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Sitio web principal
    location / {
        proxy_pass http://astro_emergency;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Assets estáticos con cache
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://astro_emergency;
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header Vary Accept-Encoding;
    }
}

# Acceso directo a Directus (puerto 8055)
server {
    listen 8055;
    server_name www.ultimamilla.com.ar;

    location / {
        proxy_pass http://directus_emergency;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
NGINX_EOF

echo "✅ nginx.emergency.conf creado"

# Crear variables de entorno de emergencia
echo "2.4 Creando .env.emergency..."
cat > .env.emergency << 'ENV_EOF'
# Variables de entorno de emergencia
NODE_ENV=production
ASTRO_ENV=production

# Directus Configuration
DIRECTUS_URL=http://directus-emergency:8055
PUBLIC_DIRECTUS_URL=https://www.ultimamilla.com.ar

# Database
DB_CLIENT=pg
DB_HOST=postgres-emergency
DB_PORT=5432
DB_DATABASE=directus
DB_USER=directus
DB_PASSWORD=directus123

# Admin User
ADMIN_EMAIL=admin@ultimamilla.com.ar
ADMIN_PASSWORD=EmergencyAdmin2025!

# Security
KEY=255d861b-5ea1-5996-9aa3-922530ec40b1
SECRET=6116487b-cda1-52c2-b5b5-c8022c45e263

# Site Configuration
PUBLIC_SITE_URL=https://www.ultimamilla.com.ar
PUBLIC_DOMAIN=www.ultimamilla.com.ar

# Fallback mode
USE_STATIC_DATA=false
STATIC_MODE=false
ENV_EOF

echo "✅ .env.emergency creado"

echo ""
echo "🚀 PASO 3: COMANDOS DE RECUPERACIÓN LISTOS"
echo "=========================================="

echo ""
echo "📋 COMANDOS PARA EJECUTAR EN EL SERVIDOR:"
echo "=========================================="
echo ""
echo "# 1. Conectar al servidor"
echo "ssh root@$SERVER_IP"
echo ""
echo "# 2. Ir al directorio del proyecto"
echo "cd /root/fumbling-field"
echo ""
echo "# 3. Parar todos los servicios actuales"
echo "docker-compose down -v --remove-orphans 2>/dev/null || true"
echo "docker stop \$(docker ps -q) 2>/dev/null || true"
echo "docker rm \$(docker ps -aq) 2>/dev/null || true"
echo ""
echo "# 4. Limpiar sistema Docker"
echo "docker system prune -af --volumes"
echo ""
echo "# 5. Transferir archivos de emergencia"
echo "# (ejecutar desde local):"
echo "scp docker-compose.emergency.yml root@$SERVER_IP:/root/fumbling-field/"
echo "scp Dockerfile.emergency root@$SERVER_IP:/root/fumbling-field/"
echo "scp nginx.emergency.conf root@$SERVER_IP:/root/fumbling-field/"
echo "scp .env.emergency root@$SERVER_IP:/root/fumbling-field/.env"
echo ""
echo "# 6. Iniciar sistema de emergencia"
echo "docker-compose -f docker-compose.emergency.yml up -d --build"
echo ""
echo "# 7. Verificar servicios"
echo "docker-compose -f docker-compose.emergency.yml ps"
echo "docker-compose -f docker-compose.emergency.yml logs -f"
echo ""
echo "# 8. Probar conectividad"
echo "curl -I https://www.ultimamilla.com.ar/"
echo "curl -I https://www.ultimamilla.com.ar/antecedentes/"
echo "curl -I https://www.ultimamilla.com.ar/admin"
echo ""

echo "🔥 PLAN DE EMERGENCIA CREADO EXITOSAMENTE"
echo "========================================"
echo ""
echo "📊 RESUMEN DE ARCHIVOS CREADOS:"
echo "- docker-compose.emergency.yml (Stack completo de emergencia)"
echo "- Dockerfile.emergency (Build optimizado)"
echo "- nginx.emergency.conf (Configuración proxy completa)"
echo "- .env.emergency (Variables de entorno)"
echo ""
echo "🎯 PRÓXIMOS PASOS:"
echo "1. Transferir archivos al servidor"
echo "2. Ejecutar comandos de recuperación"
echo "3. Verificar funcionamiento"
echo "4. Importar datos si es necesario"
echo ""
echo "⚡ CREDENCIALES DE EMERGENCIA:"
echo "Admin: admin@ultimamilla.com.ar"
echo "Pass: EmergencyAdmin2025!"
echo ""
echo "Finalizado: $(date)" 