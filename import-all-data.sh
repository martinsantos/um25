#!/bin/bash

# Script para importar todos los datos reales a Directus en producción
# UM25-0.3 - Importación completa de datos

echo "🔄 IMPORTANDO DATOS COMPLETOS A DIRECTUS"
echo "========================================"

# Verificar si estamos en el directorio correcto
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ ERROR: No se encuentra docker-compose.yml"
    echo "📍 Ejecuta este script desde el directorio del proyecto"
    exit 1
fi

# Verificar que los contenedores estén corriendo
echo "📋 Verificando contenedores..."
docker compose ps | grep -q "Up" || {
    echo "❌ ERROR: Los contenedores no están corriendo"
    echo "🚀 Iniciando contenedores..."
    docker compose up -d
    sleep 10
}

# Función para ejecutar SQL en PostgreSQL
execute_sql() {
    local sql_file=$1
    echo "📄 Ejecutando: $sql_file"
    docker compose exec -T database psql -U myuser -d mydatabase < "$sql_file"
    if [ $? -eq 0 ]; then
        echo "✅ $sql_file ejecutado exitosamente"
    else
        echo "❌ Error ejecutando $sql_file"
        return 1
    fi
}

# Función para verificar si una tabla tiene datos
check_table_data() {
    local table_name=$1
    local count=$(docker compose exec -T database psql -U myuser -d mydatabase -t -c "SELECT COUNT(*) FROM \"$table_name\";")
    echo "📊 Tabla $table_name: $count registros"
}

echo ""
echo "🗄️ IMPORTANDO DATOS PRINCIPALES"
echo "================================"

# 1. Importar antecedentes (469 registros)
if [ -f "datos_antecedentes.sql" ]; then
    echo "📦 Importando 469 antecedentes..."
    execute_sql "datos_antecedentes.sql" || exit 1
else
    echo "⚠️  Archivo datos_antecedentes.sql no encontrado"
fi

# 2. Importar servicios
if [ -f "datos_servicios.sql" ]; then
    echo "🔧 Importando servicios..."
    execute_sql "datos_servicios.sql" || exit 1
else
    echo "⚠️  Archivo datos_servicios.sql no encontrado"
fi

# 3. Importar archivos e imágenes de Directus
if [ -f "restore_directus_files.sql" ]; then
    echo "🖼️  Importando archivos e imágenes (821 imágenes)..."
    execute_sql "restore_directus_files.sql" || exit 1
else
    echo "⚠️  Archivo restore_directus_files.sql no encontrado"
fi

echo ""
echo "🔧 ACTUALIZANDO SECUENCIAS"
echo "=========================="

# Actualizar secuencias para evitar conflictos de ID
docker compose exec -T database psql -U myuser -d mydatabase << 'EOF'
-- Actualizar secuencias basándose en los datos importados
SELECT setval('"Antecedentes_id_seq"', (SELECT MAX(id) FROM "Antecedentes"), true);
SELECT setval('"Servicios_id_seq"', (SELECT MAX(id) FROM "Servicios"), true);
SELECT setval('directus_files_id_seq', (SELECT MAX(id) FROM directus_files), true);
EOF

echo ""
echo "📊 VERIFICANDO DATOS IMPORTADOS"
echo "==============================="

# Verificar que los datos se importaron correctamente
check_table_data "Antecedentes"
check_table_data "Servicios"
check_table_data "directus_files"

echo ""
echo "🔄 REINICIANDO DIRECTUS"
echo "======================="

# Reiniciar Directus para que reconozca los nuevos datos
docker compose restart directus-app
echo "⏳ Esperando que Directus se reinicie..."
sleep 15

echo ""
echo "🧪 PROBANDO CONEXIÓN A DIRECTUS"
echo "==============================="

# Probar que Directus responda
if curl -s http://localhost:8055/server/health | grep -q "ok"; then
    echo "✅ Directus está respondiendo correctamente"
else
    echo "⚠️  Directus puede estar iniciándose aún..."
fi

echo ""
echo "🎉 IMPORTACIÓN COMPLETADA"
echo "========================="
echo ""
echo "📊 RESUMEN:"
echo "• Antecedentes: $(docker compose exec -T database psql -U myuser -d mydatabase -t -c 'SELECT COUNT(*) FROM "Antecedentes";' | tr -d ' ')"
echo "• Servicios: $(docker compose exec -T database psql -U myuser -d mydatabase -t -c 'SELECT COUNT(*) FROM "Servicios";' | tr -d ' ')"
echo "• Archivos: $(docker compose exec -T database psql -U myuser -d mydatabase -t -c 'SELECT COUNT(*) FROM directus_files;' | tr -d ' ')"
echo ""
echo "🌐 URLs de acceso:"
echo "• Sitio web: http://23.105.176.45"
echo "• Directus admin: http://23.105.176.45:8055"
echo "• Credenciales: admin@example.com / d1r3ctu5"
echo ""
echo "✅ ¡El sitio web ahora debería mostrar todos los datos reales!" 