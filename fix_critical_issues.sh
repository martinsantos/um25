#!/bin/bash

# Script de Corrección de Issues Críticos - Fumbling Field
# Basado en el análisis de logs del 12 de Agosto 2025

echo "🔧 INICIANDO CORRECCIONES CRÍTICAS - FUMBLING FIELD"
echo "=================================================="

# 1. Renombrar archivo backup problemático
echo "📝 1. Corrigiendo archivo backup de Astro..."
if [ -f "src/pages/servicios/[id]/[slug].astro.backup" ]; then
    mv src/pages/servicios/[id]/[slug].astro.backup src/pages/servicios/[id]/_[slug].astro.backup
    echo "✅ Archivo backup renombrado correctamente"
else
    echo "⚠️  Archivo backup no encontrado en la ubicación esperada"
fi

# 2. Crear middleware de seguridad para Astro
echo "🔒 2. Creando middleware de seguridad para Astro..."
mkdir -p src/middleware

cat > src/middleware/security.js << 'EOF'
/**
 * Middleware de Seguridad HTTP para Astro
 * Implementa headers de seguridad esenciales
 */
export function onRequest(context, next) {
  const response = next();
  
  // Headers de seguridad básicos
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Content Security Policy adaptado para Astro + Directus
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: https: blob:",
    "font-src 'self' data: https://fonts.gstatic.com",
    "connect-src 'self' http://directus-app:8055 http://localhost:8055",
    "media-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; ');
  
  response.headers.set('Content-Security-Policy', csp);
  
  // HSTS solo en producción HTTPS
  if (context.request.url.startsWith('https://')) {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  
  return response;
}
EOF

echo "✅ Middleware de seguridad creado en src/middleware/security.js"

# 3. Actualizar astro.config.mjs para incluir middleware
echo "⚙️  3. Actualizando configuración de Astro..."

# Crear backup de la configuración actual
cp astro.config.mjs astro.config.mjs.backup

# Verificar si ya existe la configuración de middleware
if ! grep -q "middleware" astro.config.mjs; then
    # Agregar configuración de middleware
    sed -i.bak '/export default defineConfig({/a\
  // Middleware de seguridad\
  middleware: {\
    security: "./src/middleware/security.js"\
  },\
' astro.config.mjs
    echo "✅ Configuración de middleware agregada a astro.config.mjs"
else
    echo "⚠️  Configuración de middleware ya existe en astro.config.mjs"
fi

# 4. Actualizar docker-compose.yml para nueva versión de Directus
echo "🔄 4. Preparando actualización de Directus..."

# Crear backup del docker-compose actual
cp docker-compose.yml docker-compose.yml.backup

# Actualizar versión de Directus
sed -i.bak 's/directus\/directus:11.7.2/directus\/directus:11.10.1/' docker-compose.yml

# Agregar PUBLIC_URL al environment de Directus
if ! grep -q "PUBLIC_URL" docker-compose.yml; then
    sed -i.bak '/LOG_LEVEL: debug/a\
      PUBLIC_URL: https://www.ultimamilla.com.ar' docker-compose.yml
    echo "✅ PUBLIC_URL agregada a configuración de Directus"
fi

echo "✅ docker-compose.yml actualizado para Directus 11.10.1"

# 5. Crear script de actualización de dependencias npm
echo "📦 5. Creando script de actualización de dependencias..."

cat > update_dependencies.sh << 'EOF'
#!/bin/bash

echo "🔍 Verificando vulnerabilidades NPM..."
npm audit

echo "🔧 Aplicando correcciones automáticas..."
npm audit fix

echo "📊 Verificación final..."
npm audit

echo "⚠️  Para correcciones que requieren breaking changes, ejecutar:"
echo "npm audit fix --force"
echo ""
echo "⚠️  PRECAUCIÓN: Probar en entorno de desarrollo antes de aplicar --force"
EOF

chmod +x update_dependencies.sh
echo "✅ Script de actualización de dependencias creado: ./update_dependencies.sh"

# 6. Crear archivo de configuración de ambiente mejorado
echo "🌐 6. Creando archivo de configuración de ambiente..."

cat > .env.security << 'EOF'
# Configuración de Seguridad - Fumbling Field
# ==========================================

# Directus - Configuración de Seguridad
PUBLIC_URL=https://www.ultimamilla.com.ar
CORS_ENABLED=true
CORS_ORIGIN=https://www.ultimamilla.com.ar,http://localhost:4321
CORS_METHODS=GET,POST,PATCH,DELETE,OPTIONS
CORS_ALLOWED_HEADERS=Content-Type,Authorization

# Configuración de Tokens - Renovar cada 24h en producción
TOKEN_TTL=86400
REFRESH_TOKEN_TTL=604800

# Configuración SSL/TLS
FORCE_HTTPS=true
SECURE_COOKIES=true

# Headers de Seguridad adicionales
SECURITY_HEADERS_ENABLED=true

# Rate Limiting
RATE_LIMITER_ENABLED=true
RATE_LIMITER_POINTS=50
RATE_LIMITER_DURATION=60
EOF

echo "✅ Archivo de configuración de seguridad creado: .env.security"

# 7. Crear docker-compose override para desarrollo seguro
echo "🐳 7. Creando configuración Docker para desarrollo seguro..."

cat > docker-compose.security.yml << 'EOF'
# Docker Compose Override para Configuración de Seguridad
version: '3.8'

services:
  directus-app:
    environment:
      # Configuración de CORS más restrictiva
      CORS_ENABLED: "true"
      CORS_ORIGIN: "http://localhost:4321,https://www.ultimamilla.com.ar"
      CORS_METHODS: "GET,POST,PATCH,DELETE,OPTIONS"
      CORS_ALLOWED_HEADERS: "Content-Type,Authorization,X-Requested-With"
      
      # Configuración de tokens más segura
      ACCESS_TOKEN_TTL: "15m"
      REFRESH_TOKEN_TTL: "7d"
      REFRESH_TOKEN_COOKIE_SECURE: "false"  # true solo en HTTPS
      REFRESH_TOKEN_COOKIE_SAME_SITE: "lax"
      
      # Rate Limiting
      RATE_LIMITER_ENABLED: "true"
      RATE_LIMITER_POINTS: "50"
      RATE_LIMITER_DURATION: "60"
      
      # Configuración de seguridad adicional
      PUBLIC_URL: "http://localhost:8055"  # Para desarrollo
      
  astro-app:
    environment:
      # Variables de seguridad para Astro
      SECURITY_HEADERS_ENABLED: "true"
      CSP_ENABLED: "true"
      HTTPS_ONLY: "false"  # true solo en producción
EOF

echo "✅ Configuración Docker de seguridad creada: docker-compose.security.yml"

# 8. Crear script de verificación post-implementación
echo "✅ 8. Creando script de verificación..."

cat > verify_security.sh << 'EOF'
#!/bin/bash

echo "🔍 VERIFICACIÓN DE IMPLEMENTACIÓN DE SEGURIDAD"
echo "=============================================="

# Verificar que el middleware existe
if [ -f "src/middleware/security.js" ]; then
    echo "✅ Middleware de seguridad: PRESENTE"
else
    echo "❌ Middleware de seguridad: FALTANTE"
fi

# Verificar configuración en astro.config.mjs
if grep -q "middleware" astro.config.mjs; then
    echo "✅ Configuración middleware en Astro: PRESENTE"
else
    echo "❌ Configuración middleware en Astro: FALTANTE"
fi

# Verificar versión de Directus en docker-compose
if grep -q "directus/directus:11.10.1" docker-compose.yml; then
    echo "✅ Directus actualizado: PRESENTE (11.10.1)"
else
    echo "❌ Directus actualizado: PENDIENTE"
fi

# Verificar PUBLIC_URL en docker-compose
if grep -q "PUBLIC_URL" docker-compose.yml; then
    echo "✅ PUBLIC_URL configurado: PRESENTE"
else
    echo "❌ PUBLIC_URL configurado: FALTANTE"
fi

echo ""
echo "🌐 Para probar headers de seguridad después del restart:"
echo "curl -I http://localhost:4321"
echo ""
echo "🐳 Para aplicar cambios, ejecutar:"
echo "docker-compose down && docker-compose up -d --build"
EOF

chmod +x verify_security.sh
echo "✅ Script de verificación creado: ./verify_security.sh"

echo ""
echo "🎉 CORRECCIONES CRÍTICAS COMPLETADAS"
echo "===================================="
echo ""
echo "📋 PRÓXIMOS PASOS:"
echo "1. Ejecutar: ./update_dependencies.sh"
echo "2. Reiniciar contenedores: docker-compose down && docker-compose up -d --build"
echo "3. Verificar implementación: ./verify_security.sh"
echo "4. Probar headers de seguridad: curl -I http://localhost:4321"
echo ""
echo "⚠️  IMPORTANTE: Probar en desarrollo antes de aplicar en producción"
echo "⚠️  Revisar logs después del restart para confirmar que todo funciona"
echo ""
echo "📁 Archivos creados:"
echo "   - src/middleware/security.js (middleware de seguridad)"
echo "   - .env.security (configuración de seguridad)"
echo "   - docker-compose.security.yml (override de seguridad)"
echo "   - update_dependencies.sh (actualización de dependencias)"
echo "   - verify_security.sh (script de verificación)"
echo ""
echo "📄 Archivos respaldados:"
echo "   - astro.config.mjs.backup"
echo "   - docker-compose.yml.backup"
