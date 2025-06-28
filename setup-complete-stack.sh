#!/bin/bash

# ================================================================
# 🚀 SETUP COMPLETO DEL STACK ULTIMA MILLA
# ================================================================
# Implementa contenedores completos + datos + imágenes según solucionfinal.md
# Tiempo estimado: 30 minutos para stack completo

set -e  # Salir en caso de error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # Sin color

# Variables de configuración
DB_USER="myuser"
DB_PASSWORD="mypassword123"
DB_NAME="mydatabase"
DIRECTUS_ADMIN_EMAIL="admin@example.com"
DIRECTUS_ADMIN_PASSWORD="d1r3ctu5"

log() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# ================================================================
# FASE 1: VERIFICACIÓN DEL ENTORNO
# ================================================================
log "🔍 FASE 1: VERIFICANDO ENTORNO DE DESARROLLO"
echo "=============================================="

# Verificar Docker
if ! command -v docker &> /dev/null; then
    error "Docker no está instalado. Por favor, instala Docker primero."
fi

# Verificar Docker Compose
if ! command -v docker-compose &> /dev/null; then
    error "Docker Compose no está instalado. Por favor, instala Docker Compose primero."
fi

# Verificar que estamos en el directorio correcto
if [ ! -f "astro.config.mjs" ]; then
    error "Este script debe ejecutarse desde el directorio raíz del proyecto (donde está astro.config.mjs)"
fi

# Verificar archivos necesarios
required_files=("docker-compose.yml" "src/data/antecedentes_completos.js" "src/data/servicios_completos.js")
for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        error "Archivo requerido no encontrado: $file"
    fi
done

log "✅ Entorno verificado correctamente"

# ================================================================
# FASE 2: LIMPIEZA Y PREPARACIÓN
# ================================================================
log "🧹 FASE 2: LIMPIEZA Y PREPARACIÓN"
echo "=================================="

info "Deteniendo contenedores existentes..."
docker-compose down -v --remove-orphans 2>/dev/null || true

info "Limpiando volúmenes Docker..."
docker volume prune -f 2>/dev/null || true

info "Eliminando imágenes Docker sin usar..."
docker image prune -f 2>/dev/null || true

# Crear directorios necesarios
mkdir -p uploads public/imagenes_antecedentes_versionproduccion
chmod 755 uploads public/imagenes_antecedentes_versionproduccion

log "✅ Limpieza completada"

# ================================================================
# FASE 3: CONFIGURACIÓN DE VARIABLES DE ENTORNO
# ================================================================
log "⚙️ FASE 3: CONFIGURANDO VARIABLES DE ENTORNO"
echo "============================================="

# Crear archivo .env si no existe
cat > .env << EOF
# Base de datos
DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@localhost:5432/${DB_NAME}
DB_USER=${DB_USER}
DB_PASSWORD=${DB_PASSWORD}
DB_DATABASE=${DB_NAME}

# Directus
DIRECTUS_KEY=$(openssl rand -hex 32)
DIRECTUS_SECRET=$(openssl rand -hex 32)
DIRECTUS_STATIC_TOKEN=k6P8LAY8_x_y1miB_KTlWnysCnx2Abky
ADMIN_EMAIL=${DIRECTUS_ADMIN_EMAIL}
ADMIN_PASSWORD=${DIRECTUS_ADMIN_PASSWORD}

# URLs
PUBLIC_DIRECTUS_URL=http://localhost:8055
DIRECTUS_URL=http://localhost:8055
PUBLIC_URL=http://localhost:8055

# Configuración Astro
NODE_ENV=development
PUBLIC_SITE_URL=http://localhost:4321

# Storage
STORAGE_LOCATIONS=local
STORAGE_LOCAL_ROOT=./uploads
EOF

log "✅ Variables de entorno configuradas"

# ================================================================
# FASE 4: INICIANDO CONTENEDORES BASE
# ================================================================
log "🐳 FASE 4: INICIANDO CONTENEDORES BASE"
echo "======================================"

info "Iniciando PostgreSQL..."
docker-compose up -d database

# Esperar a que PostgreSQL esté listo
info "Esperando que PostgreSQL esté listo..."
timeout=60
counter=0
while ! docker-compose exec -T database pg_isready -U ${DB_USER} -d ${DB_NAME} 2>/dev/null; do
    if [ $counter -ge $timeout ]; then
        error "PostgreSQL no se inició en el tiempo esperado"
    fi
    sleep 2
    counter=$((counter + 2))
    echo -n "."
done
echo ""

log "✅ PostgreSQL iniciado correctamente"

info "Iniciando Directus..."
docker-compose up -d directus-app

# Esperar a que Directus esté listo
info "Esperando que Directus se inicialice..."
timeout=120
counter=0
while ! curl -s http://localhost:8055/server/health | grep -q "ok" 2>/dev/null; do
    if [ $counter -ge $timeout ]; then
        error "Directus no se inició en el tiempo esperado"
    fi
    sleep 5
    counter=$((counter + 5))
    echo -n "."
done
echo ""

log "✅ Directus iniciado correctamente"

# ================================================================
# FASE 5: CONFIGURACIÓN DE BASE DE DATOS
# ================================================================
log "🗄️ FASE 5: CONFIGURANDO BASE DE DATOS"
echo "====================================="

info "Creando extensiones necesarias..."
docker-compose exec -T database psql -U ${DB_USER} -d ${DB_NAME} << 'SQL'
-- Crear extensiones si no existen
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
SQL

# Verificar que las tablas de Directus existan
info "Verificando tablas de Directus..."
table_count=$(docker-compose exec -T database psql -U ${DB_USER} -d ${DB_NAME} -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'directus_%';" | tr -d ' ')

if [ "$table_count" -lt 10 ]; then
    warning "Directus no ha creado todas las tablas necesarias. Reiniciando..."
    docker-compose restart directus-app
    sleep 30
fi

log "✅ Base de datos configurada"

# ================================================================
# FASE 6: CREACIÓN DE COLECCIONES DIRECTUS
# ================================================================
log "📦 FASE 6: CREANDO COLECCIONES EN DIRECTUS"
echo "==========================================="

# Función para crear colección si no existe
create_collection() {
    local collection_name=$1
    local display_name=$2
    
    info "Creando colección: $collection_name"
    
    # Verificar si la colección ya existe
    existing=$(docker-compose exec -T database psql -U ${DB_USER} -d ${DB_NAME} -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_name = '${collection_name}';" | tr -d ' ')
    
    if [ "$existing" -eq 0 ]; then
        # Crear tabla de antecedentes
        if [ "$collection_name" = "antecedentes" ]; then
            docker-compose exec -T database psql -U ${DB_USER} -d ${DB_NAME} << 'SQL'
CREATE TABLE IF NOT EXISTS antecedentes (
    id SERIAL PRIMARY KEY,
    "Titulo" VARCHAR(500),
    "Descripcion" TEXT,
    "Imagen" UUID,
    "Fecha" DATE,
    "Cliente" VARCHAR(300),
    "Unidad_de_negocio" VARCHAR(100),
    "Area" VARCHAR(200),
    "Presupuesto" BIGINT,
    date_created TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    date_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejor performance
CREATE INDEX IF NOT EXISTS idx_antecedentes_titulo ON antecedentes("Titulo");
CREATE INDEX IF NOT EXISTS idx_antecedentes_cliente ON antecedentes("Cliente");
CREATE INDEX IF NOT EXISTS idx_antecedentes_area ON antecedentes("Area");
CREATE INDEX IF NOT EXISTS idx_antecedentes_fecha ON antecedentes("Fecha");
SQL
        fi
        
        # Crear tabla de servicios
        if [ "$collection_name" = "Servicios" ]; then
            docker-compose exec -T database psql -U ${DB_USER} -d ${DB_NAME} << 'SQL'
CREATE TABLE IF NOT EXISTS "Servicios" (
    id SERIAL PRIMARY KEY,
    "Titulo" VARCHAR(500),
    "Descripcion" TEXT,
    "Imagen" UUID,
    "Area" VARCHAR(200),
    "Cliente" VARCHAR(300),
    "Unidad_de_negocio" VARCHAR(100),
    "Presupuesto" BIGINT,
    "Fecha" DATE,
    "Antecedente" VARCHAR(100),
    date_created TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    date_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_servicios_titulo ON "Servicios"("Titulo");
CREATE INDEX IF NOT EXISTS idx_servicios_area ON "Servicios"("Area");
CREATE INDEX IF NOT EXISTS idx_servicios_cliente ON "Servicios"("Cliente");
SQL
        fi
        
        info "✅ Tabla $collection_name creada"
    else
        info "✅ Tabla $collection_name ya existe"
    fi
}

# Crear colecciones principales
create_collection "antecedentes" "Antecedentes"
create_collection "Servicios" "Servicios"

log "✅ Colecciones creadas correctamente"

# ================================================================
# FASE 7: IMPORTACIÓN DE DATOS
# ================================================================
log "📥 FASE 7: IMPORTANDO DATOS"
echo "============================"

info "Generando script de importación de antecedentes..."
# Crear script temporal de importación
cat > /tmp/import_antecedentes.sql << 'SQL'
-- Limpiar tabla si existe data previa
TRUNCATE TABLE antecedentes RESTART IDENTITY CASCADE;

-- Importar datos de antecedentes
INSERT INTO antecedentes (id, "Titulo", "Descripcion", "Imagen", "Fecha", "Cliente", "Unidad_de_negocio", "Area", "Presupuesto") VALUES
SQL

# Extraer datos del archivo JS y convertir a SQL
node -e "
const fs = require('fs');
const path = require('path');

// Leer archivo de antecedentes
const antecedentesFile = fs.readFileSync('./src/data/antecedentes_completos.js', 'utf8');
const antecedentesMatch = antecedentesFile.match(/export const antecedentesReales = (\[[\s\S]*?\]);/);

if (antecedentesMatch) {
    const antecedentesData = eval(antecedentesMatch[1]);
    
    const sqlValues = antecedentesData.slice(0, 100).map(item => {
        const titulo = (item.Titulo || '').replace(/'/g, \"''\");
        const descripcion = (item.Descripcion || '').replace(/'/g, \"''\");
        const cliente = (item.Cliente || '').replace(/'/g, \"''\");
        const area = (item.Area || '').replace(/'/g, \"''\");
        const unidad = (item.Unidad_de_negocio || 'OTR-999').replace(/'/g, \"''\");
        const imagen = item.Imagen ? \"'\" + item.Imagen + \"'\" : 'NULL';
        const fecha = item.Fecha ? \"'\" + item.Fecha + \"'\" : 'NULL';
        const presupuesto = item.Presupuesto || 0;
        
        return \`(\${item.id}, '\${titulo}', '\${descripcion}', \${imagen}, \${fecha}, '\${cliente}', '\${unidad}', '\${area}', \${presupuesto})\`;
    }).join(',\n');
    
    fs.appendFileSync('/tmp/import_antecedentes.sql', sqlValues + ';\n\n-- Actualizar secuencia\nSELECT setval(\'antecedentes_id_seq\', (SELECT MAX(id) FROM antecedentes), true);\n');
    console.log('✅ Script de antecedentes generado');
} else {
    console.error('❌ No se pudieron extraer los datos de antecedentes');
    process.exit(1);
}
"

info "Importando antecedentes a la base de datos..."
docker cp /tmp/import_antecedentes.sql $(docker-compose ps -q database):/tmp/import_antecedentes.sql
docker-compose exec -T database psql -U ${DB_USER} -d ${DB_NAME} -f /tmp/import_antecedentes.sql

# Verificar importación
antecedentes_count=$(docker-compose exec -T database psql -U ${DB_USER} -d ${DB_NAME} -t -c "SELECT COUNT(*) FROM antecedentes;" | tr -d ' ')
log "✅ Importados $antecedentes_count antecedentes"

# Importar servicios similares
info "Generando script de importación de servicios..."
cat > /tmp/import_servicios.sql << 'SQL'
-- Limpiar tabla si existe data previa
TRUNCATE TABLE "Servicios" RESTART IDENTITY CASCADE;

-- Importar datos de servicios
INSERT INTO "Servicios" (id, "Titulo", "Descripcion", "Imagen", "Area", "Cliente", "Unidad_de_negocio", "Presupuesto", "Fecha", "Antecedente") VALUES
SQL

# Extraer datos de servicios
node -e "
const fs = require('fs');

// Leer archivo de servicios
const serviciosFile = fs.readFileSync('./src/data/servicios_completos.js', 'utf8');
const serviciosMatch = serviciosFile.match(/export const serviciosReales = (\[[\s\S]*?\]);/);

if (serviciosMatch) {
    const serviciosData = eval(serviciosMatch[1]);
    
    const sqlValues = serviciosData.slice(0, 20).map(item => {
        const titulo = (item.Titulo || '').replace(/'/g, \"''\");
        const descripcion = (item.Descripcion || '').replace(/'/g, \"''\");
        const cliente = (item.Cliente || '').replace(/'/g, \"''\");
        const area = (item.Area || '').replace(/'/g, \"''\");
        const unidad = (item.Unidad_de_negocio || 'OTR-999').replace(/'/g, \"''\");
        const antecedente = (item.Antecedente || '101SW').replace(/'/g, \"''\");
        const imagen = item.Imagen ? \"'\" + item.Imagen + \"'\" : 'NULL';
        const fecha = item.Fecha ? \"'\" + item.Fecha + \"'\" : 'NULL';
        const presupuesto = item.Presupuesto || 0;
        
        return \`(\${item.id}, '\${titulo}', '\${descripcion}', \${imagen}, '\${area}', '\${cliente}', '\${unidad}', \${presupuesto}, \${fecha}, '\${antecedente}')\`;
    }).join(',\n');
    
    fs.appendFileSync('/tmp/import_servicios.sql', sqlValues + ';\n\n-- Actualizar secuencia\nSELECT setval(\'\"Servicios_id_seq\"\', (SELECT MAX(id) FROM \"Servicios\"), true);\n');
    console.log('✅ Script de servicios generado');
} else {
    console.error('❌ No se pudieron extraer los datos de servicios');
    process.exit(1);
}
"

info "Importando servicios a la base de datos..."
docker cp /tmp/import_servicios.sql $(docker-compose ps -q database):/tmp/import_servicios.sql
docker-compose exec -T database psql -U ${DB_USER} -d ${DB_NAME} -f /tmp/import_servicios.sql

# Verificar importación
servicios_count=$(docker-compose exec -T database psql -U ${DB_USER} -d ${DB_NAME} -t -c "SELECT COUNT(*) FROM \"Servicios\";" | tr -d ' ')
log "✅ Importados $servicios_count servicios"

# ================================================================
# FASE 8: CONFIGURACIÓN DE DIRECTUS
# ================================================================
log "🔧 FASE 8: CONFIGURANDO DIRECTUS"
echo "=================================="

info "Configurando permisos públicos..."
# Obtener token de administrador
admin_token=$(curl -s -X POST http://localhost:8055/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${DIRECTUS_ADMIN_EMAIL}\",\"password\":\"${DIRECTUS_ADMIN_PASSWORD}\"}" | \
  grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -n "$admin_token" ]; then
    info "✅ Token de administrador obtenido"
    
    # Configurar permisos de lectura pública para antecedentes
    curl -s -X POST http://localhost:8055/permissions \
      -H "Authorization: Bearer $admin_token" \
      -H "Content-Type: application/json" \
      -d '{
        "collection": "antecedentes",
        "action": "read",
        "role": null,
        "permissions": {},
        "fields": ["*"]
      }' > /dev/null
    
    # Configurar permisos de lectura pública para servicios
    curl -s -X POST http://localhost:8055/permissions \
      -H "Authorization: Bearer $admin_token" \
      -H "Content-Type: application/json" \
      -d '{
        "collection": "Servicios",
        "action": "read",
        "role": null,
        "permissions": {},
        "fields": ["*"]
      }' > /dev/null
    
    info "✅ Permisos públicos configurados"
else
    warning "No se pudo obtener token de administrador, configurar permisos manualmente"
fi

# ================================================================
# FASE 9: INICIANDO APLICACIÓN ASTRO
# ================================================================
log "🌟 FASE 9: INICIANDO APLICACIÓN ASTRO"
echo "====================================="

info "Construyendo aplicación Astro..."
docker-compose up -d astro-app

# Esperar a que Astro esté listo
info "Esperando que Astro se inicie..."
timeout=60
counter=0
while ! curl -s http://localhost:4321 | grep -q "ULTiMA MILLA" 2>/dev/null; do
    if [ $counter -ge $timeout ]; then
        warning "Astro puede estar iniciándose aún. Continúa verificando manualmente."
        break
    fi
    sleep 3
    counter=$((counter + 3))
    echo -n "."
done
echo ""

log "✅ Aplicación Astro iniciada"

# ================================================================
# FASE 10: VERIFICACIÓN FINAL
# ================================================================
log "✅ FASE 10: VERIFICACIÓN FINAL"
echo "==============================="

info "Verificando servicios..."
docker-compose ps

info "Verificando datos..."
echo "📊 Estadísticas finales:"
echo "   • Antecedentes: $(docker-compose exec -T database psql -U ${DB_USER} -d ${DB_NAME} -t -c 'SELECT COUNT(*) FROM antecedentes;' | tr -d ' ')"
echo "   • Servicios: $(docker-compose exec -T database psql -U ${DB_USER} -d ${DB_NAME} -t -c 'SELECT COUNT(*) FROM "Servicios";' | tr -d ' ')"
echo "   • Tablas Directus: $(docker-compose exec -T database psql -U ${DB_USER} -d ${DB_NAME} -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" | tr -d ' ')"

echo ""
log "🎉 SETUP COMPLETO FINALIZADO"
echo "=============================="
echo ""
echo -e "${GREEN}✅ Stack completamente funcional${NC}"
echo ""
echo -e "${BLUE}📱 URLs de acceso:${NC}"
echo "   • Astro (Front-end):   http://localhost:4321"
echo "   • Directus (Admin):    http://localhost:8055"
echo "   • PostgreSQL:          localhost:5432"
echo ""
echo -e "${PURPLE}👤 Credenciales Directus:${NC}"
echo "   • Usuario: ${DIRECTUS_ADMIN_EMAIL}"
echo "   • Contraseña: ${DIRECTUS_ADMIN_PASSWORD}"
echo ""
echo -e "${YELLOW}📋 Próximos pasos:${NC}"
echo "   1. Visita http://localhost:4321 para ver el sitio"
echo "   2. Visita http://localhost:8055 para el panel de administración"
echo "   3. Ejecuta ./import-all-data.sh para importar datos adicionales"
echo "   4. Ejecuta ./verify-complete-implementation.sh para testing completo"
echo ""

# Limpiar archivos temporales
rm -f /tmp/import_antecedentes.sql /tmp/import_servicios.sql

log "🏁 Setup completo ejecutado exitosamente en $(date)" 