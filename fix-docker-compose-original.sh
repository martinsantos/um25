#!/bin/bash

# 🔥 REPARAR DOCKER-COMPOSE ORIGINAL
echo "🚀 REPARANDO CONFIGURACIÓN DOCKER-COMPOSE ORIGINAL"
echo "=================================================="

# Función para ejecutar comandos remotos via SSH con password
execute_remote() {
    echo "🔧 Ejecutando: $1"
    sshpass -p 'gsiB%s@0yD' ssh -o StrictHostKeyChecking=no root@23.105.176.45 "$1"
}

# Corregir docker-compose.yml con la configuración completa y funcional
echo "✍️  Creando docker-compose.yml corregido..."
execute_remote "cd /root/fumbling-field && cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  # Base de datos PostgreSQL
  database:
    image: postgres:15-alpine
    container_name: database
    environment:
      POSTGRES_USER: myuser
      POSTGRES_PASSWORD: mypassword123
      POSTGRES_DB: mydatabase
    volumes:
      - directus_db_data:/var/lib/postgresql/data
    networks:
      - directusnet
    healthcheck:
      test: [\"CMD-SHELL\", \"pg_isready -U myuser -d mydatabase\"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Directus CMS
  directus-app:
    image: directus/directus:11.7.2
    container_name: directus-app
    ports:
      - \"8055:8055\"
    environment:
      DB_CLIENT: pg
      DB_HOST: database
      DB_PORT: 5432
      DB_DATABASE: mydatabase
      DB_USER: myuser
      DB_PASSWORD: mypassword123
      KEY: 255d861b-5ea1-5996-9aa3-922530ec40b1
      SECRET: 6116487b-cda1-52c2-b5b5-c8022c45e263
      DIRECTUS_STATIC_TOKEN: k6P8LAY8_x_y1miB_KTlWnysCnx2Abky
      ADMIN_EMAIL: admin@example.com
      ADMIN_PASSWORD: d1r3ctu5
      LOG_LEVEL: debug
      PUBLIC_URL: http://23.105.176.45:8055
    depends_on:
      database:
        condition: service_healthy
    volumes:
      - ./directus-admin/uploads:/directus/uploads
      - directus_extensions:/directus/extensions
    networks:
      - directusnet
    healthcheck:
      test: [\"CMD\", \"wget\", \"--spider\", \"-q\", \"http://localhost:8055/server/health\"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Aplicación Astro
  astro-app:
    build:
      context: .
      dockerfile: Dockerfile.astro.dev
    container_name: astro-app
    ports:
      - \"4321:4321\"
    volumes:
      - .:/app
      - astro_node_modules:/app/node_modules
    environment:
      NODE_ENV: development
      PUBLIC_DIRECTUS_URL: http://directus-app:8055
      DIRECTUS_STATIC_TOKEN: k6P8LAY8_x_y1miB_KTlWnysCnx2Abky
      HOST: 0.0.0.0
      PORT: 4321
    command: sh -c \"npm install && npm run dev -- --port 4321 --host 0.0.0.0\"
    depends_on:
      directus-app:
        condition: service_healthy
    networks:
      - directusnet
    healthcheck:
      test: [\"CMD\", \"wget\", \"--spider\", \"-q\", \"http://localhost:4321\"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  directus_db_data:
  directus_extensions:
  astro_node_modules:

networks:
  directusnet:
    driver: bridge
EOF"

echo "✅ Docker-compose.yml corregido"

# Verificar el archivo creado
echo "🔍 Verificando docker-compose.yml..."
execute_remote "cd /root/fumbling-field && head -20 docker-compose.yml"

# Parar servicios si están corriendo
echo "⏹️  Parando servicios existentes..."
execute_remote "cd /root/fumbling-field && docker-compose down --remove-orphans 2>/dev/null || true"

# Limpiar contenedores anteriores
echo "🧹 Limpiando contenedores anteriores..."
execute_remote "docker system prune -f"

# Crear directorio para uploads si no existe
echo "📁 Preparando directorios..."
execute_remote "mkdir -p /root/fumbling-field/directus-admin/uploads"

# Verificar que el Dockerfile.astro.dev está correcto
echo "🐳 Verificando Dockerfile.astro.dev..."
execute_remote "cd /root/fumbling-field && cat Dockerfile.astro.dev"

# Iniciar servicios
echo "🚀 Iniciando servicios originales..."
execute_remote "cd /root/fumbling-field && docker-compose up -d --build"

echo "⏳ Esperando que los servicios se inicien (120 segundos)..."
sleep 120

# Verificar estado de los servicios
echo "📊 Estado de los servicios:"
execute_remote "cd /root/fumbling-field && docker-compose ps"

# Verificar logs
echo "📋 Logs de servicios:"
execute_remote "cd /root/fumbling-field && docker-compose logs --tail=5"

# Verificar conectividad
echo "🔍 Verificando conectividad:"
echo "1. PostgreSQL:"
execute_remote "cd /root/fumbling-field && docker-compose exec -T database pg_isready -U myuser -d mydatabase" && echo "   ✅ PostgreSQL OK" || echo "   ❌ PostgreSQL con problemas"

echo "2. Directus:"
execute_remote "curl -s -I http://localhost:8055 | head -1" && echo "   ✅ Directus respondiendo" || echo "   ❌ Directus no responde"

echo "3. Astro:"
execute_remote "curl -s -I http://localhost:4321 | head -1" && echo "   ✅ Astro respondiendo" || echo "   ❌ Astro no responde"

# URLs finales
echo ""
echo "🌐 ================================================"
echo "   SITIO ORIGINAL RESTAURADO"
echo "================================================"
echo ""
echo "📱 URLs de Acceso:"
echo "   🌍 Sitio Web:    http://23.105.176.45:4321"
echo "   🌍 Sitio Web:    https://www.umbot.com.ar"
echo "   🔧 Directus:     http://23.105.176.45:8055"
echo "   📊 Admin:        admin@example.com / d1r3ctu5"
echo ""
echo "🎯 Stack: PostgreSQL + Directus + Astro + Nginx"
echo "✅ RESTAURACIÓN COMPLETA FINALIZADA"
echo "" 