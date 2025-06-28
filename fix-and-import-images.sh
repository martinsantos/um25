#!/bin/bash

# ================================================================
# SCRIPT DE CORRECCIÓN: INICIAR DIRECTUS Y RE-IMPORTAR IMÁGENES
# ================================================================
# Propósito: Solucionar el error "service not running" y completar la importación

echo "🛠️ INICIANDO SCRIPT DE CORRECCIÓN"
echo "===================================="
date

# 1. Ir al directorio del proyecto
cd /root/fumbling-field

# 2. Iniciar todos los servicios de Docker Compose en segundo plano
echo "🚀 Iniciando todos los servicios de Docker..."
docker-compose up -d

# 3. Esperar un momento para que los servicios se estabilicen
echo "⏳ Esperando 15 segundos para que los contenedores se inicien..."
sleep 15

# 4. Verificar el estado de los contenedores
echo "📊 Verificando estado de los contenedores:"
docker-compose ps

# 5. Comprobar específicamente que 'directus-app' está corriendo
# Usamos 'grep' para verificar el estado. Si no está 'Up', salimos.
if ! docker-compose ps | grep 'directus-app' | grep -q 'Up'; then
    echo "❌ ERROR: El contenedor 'directus-app' no pudo iniciarse."
    echo "   Por favor, revisa los logs con: docker-compose logs directus-app"
    exit 1
fi

echo "✅ Contenedor 'directus-app' está funcionando."

# 6. Re-ejecutar el proceso de importación
echo "🔄 Re-intentando la importación de imágenes..."

echo "   -> Creando directorio en Directus..."
docker-compose exec directus-app mkdir -p /directus/uploads

echo "   -> Copiando imágenes al contenedor..."
docker cp uploads/. $(docker-compose ps -q directus-app):/directus/uploads/

echo "   -> Ejecutando importación SQL en la base de datos..."
docker-compose exec -T database psql -U myuser -d mydatabase -f /root/fumbling-field/update_antecedentes_images_complete.sql

echo "   -> Reiniciando Directus para aplicar cambios..."
docker-compose restart directus-app

echo "⏳ Esperando 10 segundos a que reinicie..."
sleep 10

echo ""
echo "🎉 ¡PROCESO DE CORRECCIÓN E IMPORTACIÓN COMPLETADO!"
echo "======================================================"
echo "✅ Todos los servicios deberían estar funcionando."
echo "✅ Las imágenes han sido importadas correctamente."
echo ""
echo "👉 Por favor, realiza la verificación final con los comandos de 'COMANDOS_FINALES_SERVIDOR.md' o revisa el sitio web." 