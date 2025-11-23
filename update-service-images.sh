#!/bin/bash
# Script para actualizar imágenes de servicios con mejores imágenes

echo "🖼️ ACTUALIZANDO IMÁGENES DE SERVICIOS"
echo "===================================="

cd /root/fumbling-field

echo "1️⃣ Respaldando imágenes actuales..."
mkdir -p backup-images-services
cp public/images/services/*.jpg backup-images-services/

echo "2️⃣ Seleccionando mejores imágenes de antecedentes..."

# Redes y comunicaciones - usar imagen de aeropuertos
echo "📡 Actualizando imagen de redes y comunicaciones..."
cp imagenes_antecedentes_versionproduccion/ultimamilla_aeropuertos_argentina_2000_-_redes_y_comunicaciones_20250415_184337_s2268593650.png /tmp/redes-temp.png
convert /tmp/redes-temp.png -resize 960x480^ -gravity center -extent 960x480 public/images/services/redes-comunicaciones.jpg

# Telefonía - usar imagen de hospital
echo "📞 Actualizando imagen de telefonía..."
cp imagenes_antecedentes_versionproduccion/ultimamilla_hospital_teodoro_schestakow_-_telefonía_20250416_052225_s3104990614.png /tmp/telefonia-temp.png
convert /tmp/telefonia-temp.png -resize 960x480^ -gravity center -extent 960x480 public/images/services/telefonia.jpg

# Servicios IT - usar imagen de servicios
echo "💻 Actualizando imagen de servicios IT..."
cp imagenes_antecedentes_versionproduccion/ultimamilla_servicios_y_consultoría_sa_-_redes_y_comunicaciones_20250415_202345_s671036068.png /tmp/servicios-it-temp.png
convert /tmp/servicios-it-temp.png -resize 960x480^ -gravity center -extent 960x480 public/images/services/servicios-it.jpg

# Ciberseguridad - crear imagen representativa
echo "🔒 Actualizando imagen de ciberseguridad..."
cp imagenes_antecedentes_versionproduccion/ultimamilla_afip_-_redes_y_comunicaciones_20250415_190637_s2971405631.png /tmp/ciberseg-temp.png
convert /tmp/ciberseg-temp.png -resize 960x480^ -gravity center -extent 960x480 public/images/services/ciberseguridad.jpg

# Seguridad informática
echo "🛡️ Actualizando imagen de seguridad informática..."
cp imagenes_antecedentes_versionproduccion/ultimamilla_afip_-_redes_y_comunicaciones_20250415_212039_s3900341752.png /tmp/seguridad-temp.png
convert /tmp/seguridad-temp.png -resize 960x480^ -gravity center -extent 960x480 public/images/services/seguridad-informatica.jpg

# Servicios web - usar imagen de software
echo "🌐 Actualizando imagen de servicios web..."
cp imagenes_antecedentes_versionproduccion/ultimamilla_municipalidad_de_maipú_-_software_servicios_20250415_182056_s1379068004.png /tmp/web-temp.png
convert /tmp/web-temp.png -resize 960x480^ -gravity center -extent 960x480 public/images/services/servicios-web.jpg

echo "3️⃣ Verificando imágenes actualizadas..."
ls -la public/images/services/
file public/images/services/*.jpg | head -3

echo "4️⃣ Limpiando archivos temporales..."
rm -f /tmp/*-temp.png

echo "5️⃣ Reconstruyendo contenedor Astro para aplicar cambios..."
docker-compose -f docker-compose.static.yml up -d --build --no-deps umbot-astro-static

echo "✅ IMÁGENES DE SERVICIOS ACTUALIZADAS!"
echo ""
echo "📋 RESUMEN:"
echo "   - Imágenes respaldadas en: backup-images-services/"
echo "   - Nuevas imágenes: 960x480 pixels"
echo "   - Origen: Imágenes reales de proyectos"
echo "   - Contenedor reconstruido para aplicar cambios" 