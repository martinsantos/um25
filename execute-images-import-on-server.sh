#!/bin/bash

# ================================================================
# SCRIPT FINAL: EJECUTAR EN EL SERVIDOR PARA IMPORTAR IMÁGENES
# ================================================================
# Instrucciones: Copiar y pegar estos comandos directamente en el servidor

echo "🔄 IMPORTANDO IMÁGENES DE ANTECEDENTES AL SISTEMA"
echo "=================================================="
date

# 1. Ir al directorio del proyecto
cd /root/fumbling-field

# 2. Verificar que existen los archivos
echo "📁 Verificando archivos..."
ls -la update_antecedentes_images_complete.sql
echo "📁 Total imágenes transferidas:"
ls uploads/ | wc -l

# 3. Copiar imágenes al directorio de uploads de Directus
echo "📂 Copiando imágenes al directorio de uploads de Directus..."
docker-compose exec directus-app mkdir -p /directus/uploads
docker cp uploads/. $(docker-compose ps -q directus-app):/directus/uploads/

# 4. Verificar que las imágenes están en el contenedor
echo "📋 Verificando imágenes en contenedor:"
docker-compose exec directus-app ls /directus/uploads/ | wc -l

# 5. Ejecutar script SQL de importación
echo "💾 Ejecutando importación SQL..."
docker-compose exec -T database psql -U myuser -d mydatabase -f /root/fumbling-field/update_antecedentes_images_complete.sql

# 6. Verificar registros en directus_files
echo "📊 Verificando registros importados en directus_files:"
docker-compose exec -T database psql -U myuser -d mydatabase -c "SELECT COUNT(*) as total_files FROM directus_files WHERE title LIKE '%-%';"

# 7. Verificar antecedentes con imágenes asignadas
echo "📊 Verificando antecedentes con imágenes:"
docker-compose exec -T database psql -U myuser -d mydatabase -c "SELECT COUNT(*) as antecedentes_with_images FROM \"Antecedentes\" WHERE \"Imagen\" IS NOT NULL;"

# 8. Reiniciar Directus para refrescar caché
echo "🔄 Reiniciando Directus..."
docker-compose restart directus-app

# 9. Esperar a que Directus esté listo
echo "⏳ Esperando a que Directus esté listo..."
sleep 10

# 10. Verificar que Directus está funcionando
echo "✅ Verificando estado de Directus:"
docker-compose exec directus-app curl -s http://localhost:8055/server/ping

echo ""
echo "🎉 ¡IMPORTACIÓN COMPLETADA!"
echo "========================================"
echo "✅ Todas las imágenes han sido importadas"
echo "✅ Base de datos actualizada"
echo "✅ Sistema listo para usar"
echo ""
echo "🌐 Panel de administración: https://www.ultimamilla.com.ar/admin"
echo "🌐 Sitio web: https://www.ultimamilla.com.ar/"
echo ""
echo "📋 Para verificar en el navegador:"
echo "   1. Ve a https://www.ultimamilla.com.ar/antecedentes/"
echo "   2. Verifica que todas las imágenes aparecen correctamente"
echo "   3. Accede al admin panel para gestionar contenido" 