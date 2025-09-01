#!/bin/bash
# Script para desplegar corrección de servicios singles

echo "🚀 Desplegando corrección de servicios singles..."

# Copiar template corregido al contenedor
echo "📁 Copiando template corregido..."
docker cp src/pages/servicios/[id]/[slug].astro astro-app:/app/src/pages/servicios/[id]/[slug].astro

# Reiniciar contenedor Astro para aplicar cambios
echo "🔄 Reiniciando contenedor astro-app..."
docker restart astro-app

# Esperar que el contenedor esté listo
echo "⏳ Esperando contenedor..."
sleep 10

# Verificar estado del contenedor
echo "📊 Estado del contenedor:"
docker ps | grep astro-app

# Verificar que las URLs estén funcionando
echo "🌐 Verificando URLs..."
curl -I https://ultimamilla.com.ar/servicios/1/servicios-it
curl -I https://ultimamilla.com.ar/servicios/2/redes-de-datos
curl -I https://ultimamilla.com.ar/servicios/3/seguridad-informatica

echo "✅ Despliegue completado"
