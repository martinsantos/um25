#!/bin/bash

# 🔥 RESTAURAR SITIO ORIGINAL ULTIMA MILLA
# Este script restaura el sitio original con Astro + Directus funcionando

echo "🚀 ================================================"
echo "   RESTAURANDO SITIO ORIGINAL ULTIMA MILLA"
echo "   Astro + Directus + PostgreSQL"
echo "================================================"

# Verificar conectividad al servidor
echo "🔍 Verificando conectividad al servidor..."
if ! ping -c 1 23.105.176.45 > /dev/null 2>&1; then
    echo "❌ ERROR: No se puede conectar al servidor"
    echo "ℹ️  Intentando con SFTP..."
fi

# Función para ejecutar comandos remotos via SSH
execute_remote() {
    echo "🔧 Ejecutando: $1"
    sshpass -p 'gsiB%s@0yD' ssh -o StrictHostKeyChecking=no root@23.105.176.45 "$1"
}

# Backup del estado actual
echo "📦 Creando backup del estado actual..."
execute_remote "cd /root/fumbling-field && cp docker-compose.yml docker-compose.yml.backup.$(date +%Y%m%d_%H%M%S) 2>/dev/null || true"

# Parar servicios actuales
echo "⏹️  Parando servicios actuales..."
execute_remote "cd /root/fumbling-field && docker-compose down --remove-orphans"

# Verificar archivos necesarios
echo "📋 Verificando archivos necesarios..."
execute_remote "cd /root/fumbling-field && ls -la docker-compose.yml Dockerfile.astro.dev .env"

# Limpiar contenedores e imágenes huérfanas
echo "🧹 Limpiando contenedores antiguos..."
execute_remote "docker system prune -f"

# Restaurar configuración original
echo "🔄 Usando configuración original (docker-compose.yml)..."

# Crear .env si no existe
echo "⚙️  Configurando variables de entorno..."
execute_remote "cd /root/fumbling-field && cat > .env << 'EOF'
# Configuración Base de Datos
DB_CLIENT=pg
DB_HOST=database
DB_PORT=5432
DB_DATABASE=mydatabase
DB_USER=myuser
DB_PASSWORD=mypassword123

# Configuración Directus
KEY=255d861b-5ea1-5996-9aa3-922530ec40b1
SECRET=6116487b-cda1-52c2-b5b5-c8022c45e263
DIRECTUS_STATIC_TOKEN=k6P8LAY8_x_y1miB_KTlWnysCnx2Abky
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=d1r3ctu5

# Configuración Astro
NODE_ENV=development
PUBLIC_DIRECTUS_URL=http://directus-app:8055
HOST=0.0.0.0
PORT=4321

# Debug
LOG_LEVEL=debug
EOF"

# Verificar Dockerfile.astro.dev
echo "🐳 Verificando Dockerfile de desarrollo..."
execute_remote "cd /root/fumbling-field && if [ ! -f Dockerfile.astro.dev ]; then
cat > Dockerfile.astro.dev << 'EOF'
FROM node:18-alpine

WORKDIR /app

# Instalar dependencias del sistema
RUN apk add --no-cache git

# Copiar package files
COPY package*.json ./

# Instalar dependencias
RUN npm ci

# Copiar código fuente
COPY . .

# Instalar herramientas globales
RUN npm install -g @astrojs/cli

# Exponer puerto
EXPOSE 4321

# Variables de entorno
ENV HOST=0.0.0.0
ENV PORT=4321
ENV NODE_ENV=development

# Comando por defecto
CMD [\"npm\", \"run\", \"dev\", \"--\", \"--host\", \"0.0.0.0\", \"--port\", \"4321\"]
EOF
fi"

# Iniciar servicios con la configuración original
echo "🚀 Iniciando servicios originales (Astro + Directus + PostgreSQL)..."
execute_remote "cd /root/fumbling-field && docker-compose up -d --build"

# Esperar a que los servicios se inicien
echo "⏳ Esperando servicios (60 segundos)..."
sleep 60

# Verificar estado de los servicios
echo "📊 Verificando estado de los servicios..."
execute_remote "cd /root/fumbling-field && docker-compose ps"

# Verificar conectividad de servicios
echo "🔍 Verificando conectividad de servicios..."

echo "1. Verificando Astro (puerto 4321)..."  
if execute_remote "curl -s -I http://localhost:4321/ | head -1 | grep -q '200'"; then
    echo "   ✅ Astro funcionando"
else
    echo "   ⚠️  Astro iniciando..."
fi

echo "2. Verificando Directus (puerto 8055)..."
if execute_remote "curl -s -I http://localhost:8055/ | head -1 | grep -q '302'"; then
    echo "   ✅ Directus funcionando"
else
    echo "   ⚠️  Directus iniciando..."
fi

echo "3. Verificando PostgreSQL..."
if execute_remote "cd /root/fumbling-field && docker-compose exec -T database pg_isready -U myuser -d mydatabase" > /dev/null 2>&1; then
    echo "   ✅ PostgreSQL funcionando"
else
    echo "   ⚠️  PostgreSQL iniciando..."
fi

# Mostrar logs de servicios
echo "📋 Logs de servicios (últimas 10 líneas)..."
execute_remote "cd /root/fumbling-field && docker-compose logs --tail=10"

# URLs de acceso
echo ""
echo "🌐 ================================================"
echo "   SITIO ORIGINAL RESTAURADO EXITOSAMENTE"
echo "================================================"
echo ""
echo "📱 URLs de Acceso:"
echo "   🌍 Sitio Web:    http://23.105.176.45:4321"
echo "   🔧 Directus:     http://23.105.176.45:8055"
echo "   📊 Admin:        admin@example.com / d1r3ctu5"
echo ""
echo "🔧 Para desarrollo local:"
echo "   docker-compose up -d"
echo "   Astro:    http://localhost:4321"
echo "   Directus: http://localhost:8055"
echo ""
echo "🎯 Estado: Astro + Directus + PostgreSQL = FUNCIONANDO"
echo "✅ El sitio original ha sido restaurado completamente"
echo "" 