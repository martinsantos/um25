#!/bin/bash

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}📦 Empaquetando UMBot Emergency App...${NC}"

# Crear directorio temporal
TEMP_DIR="umbot-emergency-app-dist"
rm -rf $TEMP_DIR
mkdir -p $TEMP_DIR

# Copiar archivos necesarios
cp index.html $TEMP_DIR/
cp service-worker.js $TEMP_DIR/
cp manifest.json $TEMP_DIR/
cp README.md $TEMP_DIR/
cp icon.svg $TEMP_DIR/

# Generar iconos básicos si no existen
if [ ! -f "icon-192.png" ]; then
    echo -e "${YELLOW}⚠️ Generando iconos placeholder...${NC}"
    # Crear iconos placeholder usando ImageMagick si está disponible
    if command -v convert &> /dev/null; then
        convert -size 192x192 xc:red -fill white -gravity center -pointsize 120 -annotate +0+0 "UM" icon-192.png
        convert -size 512x512 xc:red -fill white -gravity center -pointsize 320 -annotate +0+0 "UM" icon-512.png
        convert -size 96x96 xc:red -fill white -gravity center -pointsize 60 -annotate +0+0 "UM" icon-96.png
    else
        echo "⚠️ ImageMagick no instalado. Los iconos se generarán manualmente."
    fi
fi

# Copiar iconos si existen
[ -f "icon-192.png" ] && cp icon-192.png $TEMP_DIR/
[ -f "icon-512.png" ] && cp icon-512.png $TEMP_DIR/
[ -f "icon-96.png" ] && cp icon-96.png $TEMP_DIR/

# Crear archivo ZIP
ZIP_NAME="umbot-emergency-app-v1.0.0.zip"
cd $TEMP_DIR
zip -r ../$ZIP_NAME *
cd ..

echo -e "${GREEN}✅ ZIP creado: $ZIP_NAME${NC}"

# Crear versión GitHub Pages
GH_PAGES_DIR="gh-pages"
rm -rf $GH_PAGES_DIR
cp -r $TEMP_DIR $GH_PAGES_DIR

# Agregar archivo index para GitHub Pages
cat > $GH_PAGES_DIR/404.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="refresh" content="0; url=/">
</head>
</html>
EOF

echo -e "${GREEN}✅ Directorio GitHub Pages creado: $GH_PAGES_DIR${NC}"

# Crear README de distribución
cat > DISTRIBUTION.md << 'EOF'
# 📦 Distribución UMBot Emergency App

## 🚀 Métodos de Distribución

### 1. ZIP para Email
- Archivo: `umbot-emergency-app-v1.0.0.zip`
- Tamaño: ~50KB
- Instrucciones incluidas en README.md

### 2. GitHub Pages
```bash
# Subir a GitHub
git add gh-pages
git commit -m "feat: UMBot Emergency App v1.0.0"
git push origin main

# Crear rama gh-pages
git subtree push --prefix=umbot-emergency-app/gh-pages origin gh-pages
```

### 3. Servidor Web
```bash
# Copiar al servidor
scp -r umbot-emergency-app-dist/* root@servidor:/var/www/emergency/

# O usar el script de deploy
./deploy-emergency-app.sh
```

### 4. CDN/Hosting
- Netlify: Arrastrar carpeta `gh-pages`
- Vercel: `vercel --prod`
- Surge: `surge gh-pages emergency-umbot.surge.sh`

## 📱 URLs de Acceso

### Producción
- https://emergency.umbot.com.ar
- https://martinsantos.github.io/umbot-emergency

### Desarrollo
- http://localhost:8002

## 🔐 Credenciales

### Directus
- URL: https://umbot.com.ar/admin
- Email: admin@example.com
- Password: d1r3ctu5

### SSH
- Servidor: 23.105.176.45
- Usuario: root
- Puerto: 22

## 📋 Checklist de Distribución

- [ ] ZIP creado y probado
- [ ] GitHub Pages configurado
- [ ] Servidor de producción configurado
- [ ] SSL/HTTPS funcionando
- [ ] PWA instalable verificada
- [ ] Modo offline probado
- [ ] Documentación actualizada

---

**Versión**: 1.0.0  
**Fecha**: $(date +"%d/%m/%Y")
EOF

echo -e "${GREEN}✅ Documentación de distribución creada: DISTRIBUTION.md${NC}"

# Limpiar
rm -rf $TEMP_DIR

echo -e "${BLUE}📊 Resumen de archivos creados:${NC}"
echo "  - $ZIP_NAME (para email)"
echo "  - gh-pages/ (para GitHub Pages)"
echo "  - DISTRIBUTION.md (documentación)"

echo -e "${GREEN}🎉 ¡Empaquetado completado exitosamente!${NC}" 