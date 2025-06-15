# Checklist de Validación de Migración: Astro + Directus

## Objetivo
Verificar que la migración del proyecto desde `/fumbling-field` se haya completado correctamente y el sistema esté 100% operativo en producción.

---

## 🚀 Pre-Despliegue: Preparación del Entorno

### Configuración de Variables de Entorno
- [ ] **`.env.production`** configurado con credenciales correctas
- [ ] **DIRECTUS_URL** apunta al servidor correcto
- [ ] **DIRECTUS_TOKEN** válido y con permisos adecuados
- [ ] **Variables de base de datos** correctas (host, puerto, credenciales)
- [ ] **Certificados SSL** configurados si aplica

### Dependencias y Build
- [ ] `npm install` ejecutado sin errores
- [ ] `npm run build` completa exitosamente
- [ ] Archivos estáticos generados en `/dist`
- [ ] Assets optimizados y comprimidos

---

## 📊 Fase 1: Validación de Base de Datos

### 1.1 Estructura y Esquema
```sql
-- Script de validación de estructura
-- Verificar tablas críticas
SELECT table_name, table_rows 
FROM information_schema.tables 
WHERE table_schema = 'tu_database_name' 
AND table_name IN ('directus_files', 'antecedentes', 'categorias');

-- Verificar relaciones FK
SELECT 
    TABLE_NAME,
    COLUMN_NAME,
    CONSTRAINT_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM information_schema.KEY_COLUMN_USAGE
WHERE REFERENCED_TABLE_SCHEMA = 'tu_database_name';
```

**Checklist:**
- [ ] **Tablas principales** creadas y pobladas
- [ ] **Foreign keys** funcionando correctamente
- [ ] **Índices** aplicados en campos de búsqueda
- [ ] **Permisos** de usuario configurados

### 1.2 Integridad de Datos
```sql
-- Contar registros críticos
SELECT 
    'antecedentes' as tabla, COUNT(*) as total FROM antecedentes
UNION ALL
SELECT 
    'directus_files' as tabla, COUNT(*) as total FROM directus_files
UNION ALL
SELECT 
    'directus_users' as tabla, COUNT(*) as total FROM directus_users;

-- Detectar registros huérfanos (crítico)
SELECT COUNT(*) as huerfanos
FROM antecedentes a
LEFT JOIN directus_files f ON a.imagen_id = f.id
WHERE a.imagen_id IS NOT NULL AND f.id IS NULL;
```

**Checklist:**
- [ ] **Conteo de registros** coincide con origen
- [ ] **Sin registros huérfanos** detectados
- [ ] **Campos obligatorios** completos
- [ ] **Encoding UTF-8** correcto para caracteres especiales

---

## 🖼️ Fase 2: Validación de Assets e Imágenes

### 2.1 Archivos Físicos
```bash
#!/bin/bash
# validate-images.sh - Script de validación de imágenes

echo "🔍 Validando archivos de imágenes..."

# Directorio de uploads de Directus
UPLOADS_DIR="/var/directus/uploads"

# Contar archivos físicos
PHYSICAL_FILES=$(find $UPLOADS_DIR -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" -o -iname "*.webp" \) | wc -l)

# Contar referencias en BD
DB_REFERENCES=$(mysql -u $DB_USER -p$DB_PASS $DB_NAME -se "SELECT COUNT(*) FROM directus_files WHERE type LIKE 'image/%'")

echo "📁 Archivos físicos: $PHYSICAL_FILES"
echo "🗄️ Referencias en BD: $DB_REFERENCES"

if [ $PHYSICAL_FILES -eq $DB_REFERENCES ]; then
    echo "✅ Sincronización correcta"
else
    echo "❌ PROBLEMA: Desincronización detectada"
    exit 1
fi
```

**Checklist:**
- [ ] **Todos los archivos** físicamente presentes
- [ ] **Permisos de lectura** correctos (644 para archivos, 755 para directorios)
- [ ] **Referencias BD ↔ archivos** sincronizadas
- [ ] **Formatos válidos** y no corruptos

### 2.2 URLs y Accesibilidad
```javascript
// test-images.js - Validar accesibilidad de imágenes
const testImageUrls = async () => {
    const response = await fetch(`${process.env.DIRECTUS_URL}/files?limit=10`);
    const files = await response.json();
    
    let failedImages = 0;
    
    for (const file of files.data) {
        try {
            const imageUrl = `${process.env.DIRECTUS_URL}/assets/${file.id}`;
            const imgResponse = await fetch(imageUrl);
            
            if (imgResponse.status !== 200) {
                console.log(`❌ Error ${imgResponse.status}: ${imageUrl}`);
                failedImages++;
            } else {
                console.log(`✅ OK: ${file.filename_download}`);
            }
        } catch (error) {
            console.log(`❌ Error de red: ${file.filename_download}`);
            failedImages++;
        }
    }
    
    return failedImages === 0;
};
```

**Checklist:**
- [ ] **URLs de imágenes** accesibles desde navegador
- [ ] **Transformaciones** funcionando (`?width=300&height=200`)
- [ ] **Headers correctos** (Content-Type, Cache-Control)
- [ ] **CORS configurado** para el dominio del frontend

---

## 🔌 Fase 3: Conectividad Astro ↔ Directus

### 3.1 Autenticación y Tokens
```javascript
// test-auth.js - Validar autenticación
const testDirectusAuth = async () => {
    const endpoints = [
        '/server/info',
        '/items/antecedentes?limit=1',
        '/files?limit=1',
        '/collections'
    ];
    
    console.log('🔐 Testando autenticación Directus...');
    
    for (const endpoint of endpoints) {
        try {
            const response = await fetch(`${process.env.DIRECTUS_URL}${endpoint}`, {
                headers: {
                    'Authorization': `Bearer ${process.env.DIRECTUS_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                console.log(`✅ ${endpoint}: ${response.status}`);
            } else {
                console.log(`❌ ${endpoint}: ${response.status} - ${response.statusText}`);
                return false;
            }
        } catch (error) {
            console.log(`❌ ${endpoint}: Error de conexión`);
            return false;
        }
    }
    
    return true;
};
```

**Checklist:**
- [ ] **Token válido** y no expirado
- [ ] **Permisos de lectura** en colecciones necesarias
- [ ] **Rate limiting** configurado apropiadamente
- [ ] **Timeouts** configurados (30s recomendado)

### 3.2 APIs y Endpoints
```javascript
// test-api-endpoints.js - Validar endpoints críticos
const criticalEndpoints = [
    {
        path: '/items/antecedentes',
        test: 'Listar antecedentes',
        required: ['id', 'titulo', 'fecha']
    },
    {
        path: '/items/antecedentes?filter[status][_eq]=published',
        test: 'Filtrar publicados',
        required: ['id']
    },
    {
        path: '/items/antecedentes?sort=-fecha_creacion&limit=5',
        test: 'Ordenar y limitar',
        required: ['id']
    }
];

const validateEndpoints = async () => {
    for (const endpoint of criticalEndpoints) {
        const response = await fetch(`${process.env.DIRECTUS_URL}${endpoint.path}`);
        const data = await response.json();
        
        if (data.data && data.data.length > 0) {
            const hasRequiredFields = endpoint.required.every(field => 
                data.data[0].hasOwnProperty(field)
            );
            
            console.log(`${hasRequiredFields ? '✅' : '❌'} ${endpoint.test}`);
        }
    }
};
```

**Checklist:**
- [ ] **CRUD operations** funcionando
- [ ] **Filtros complejos** operativos
- [ ] **Paginación** implementada
- [ ] **Ordenamiento** funcionando
- [ ] **Búsqueda de texto** operativa

---

## 🌐 Fase 4: Testing de Frontend (Astro)

### 4.1 Build y Deploy
```bash
# deploy-test.sh - Script de despliegue y testing
#!/bin/bash

echo "🚀 Iniciando proceso de despliegue..."

# Build del proyecto
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Error en build"
    exit 1
fi

# Verificar archivos críticos
CRITICAL_FILES=(
    "dist/index.html"
    "dist/_astro"
    "dist/antecedentes"
)

for file in "${CRITICAL_FILES[@]}"; do
    if [ ! -e "$file" ]; then
        echo "❌ Archivo crítico faltante: $file"
        exit 1
    fi
done

echo "✅ Build completado exitosamente"

# Deploy (ajustar según tu método de deploy)
# rsync -avz dist/ usuario@servidor:/var/www/html/
# O tu método de deploy específico

echo "✅ Deploy completado"
```

**Checklist:**
- [ ] **Build sin errores** ni warnings críticos
- [ ] **Assets optimizados** y comprimidos
- [ ] **Rutas dinámicas** generadas correctamente
- [ ] **Sitemap** actualizado

### 4.2 Testing Funcional
```javascript
// e2e-tests.js - Tests end-to-end básicos
const puppeteer = require('puppeteer');

const runE2ETests = async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    try {
        // Test 1: Página principal carga
        await page.goto(process.env.SITE_URL);
        await page.waitForSelector('[data-testid="antecedentes-list"]', { timeout: 10000 });
        console.log('✅ Página principal carga correctamente');
        
        // Test 2: Imágenes se cargan
        const images = await page.$$('img');
        let loadedImages = 0;
        
        for (const img of images) {
            const naturalWidth = await img.evaluate(img => img.naturalWidth);
            if (naturalWidth > 0) loadedImages++;
        }
        
        console.log(`✅ ${loadedImages}/${images.length} imágenes cargadas`);
        
        // Test 3: Navegación funciona
        const links = await page.$$('a[href*="/antecedentes/"]');
        if (links.length > 0) {
            await links[0].click();
            await page.waitForNavigation();
            console.log('✅ Navegación interna funciona');
        }
        
        // Test 4: Sin errores 404
        const response = await page.goto(`${process.env.SITE_URL}/antecedentes`);
        if (response.status() === 200) {
            console.log('✅ Páginas internas accesibles');
        }
        
    } catch (error) {
        console.log(`❌ Error en testing: ${error.message}`);
    } finally {
        await browser.close();
    }
};
```

**Checklist:**
- [ ] **Página principal** carga < 3 segundos
- [ ] **Todas las imágenes** se muestran correctamente
- [ ] **Navegación interna** funciona
- [ ] **Sin errores 404** en consola
- [ ] **Responsive design** funciona en móvil
- [ ] **SEO meta tags** presentes

---

## ⚡ Fase 5: Performance y Optimización

### 5.1 Web Vitals
```javascript
// performance-test.js - Medir Core Web Vitals
const { chromium } = require('playwright');

const measurePerformance = async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    await page.goto(process.env.SITE_URL);
    
    const metrics = await page.evaluate(() => {
        return new Promise((resolve) => {
            new PerformanceObserver((list) => {
                const entries = list.getEntries();
                const vitals = {};
                
                entries.forEach((entry) => {
                    if (entry.name === 'first-contentful-paint') {
                        vitals.fcp = entry.startTime;
                    }
                    if (entry.name === 'largest-contentful-paint') {
                        vitals.lcp = entry.startTime;
                    }
                });
                
                resolve(vitals);
            }).observe({ entryTypes: ['paint', 'largest-contentful-paint'] });
            
            setTimeout(() => resolve({}), 5000);
        });
    });
    
    console.log('📊 Performance Metrics:');
    console.log(`FCP: ${metrics.fcp || 'N/A'}ms`);
    console.log(`LCP: ${metrics.lcp || 'N/A'}ms`);
    
    await browser.close();
};
```

**Checklist:**
- [ ] **LCP < 2.5s** (Largest Contentful Paint)
- [ ] **FCP < 1.8s** (First Contentful Paint)
- [ ] **TTI < 3.8s** (Time to Interactive)
- [ ] **CLS < 0.1** (Cumulative Layout Shift)

### 5.2 Lighthouse Audit
```bash
# lighthouse-test.sh - Audit automatizado
npx lighthouse $SITE_URL --output=json --output-path=./lighthouse-report.json

# Extraer scores críticos
node -e "
const report = require('./lighthouse-report.json');
const scores = report.lhr.categories;

console.log('🔍 Lighthouse Scores:');
console.log('Performance:', Math.round(scores.performance.score * 100));
console.log('Accessibility:', Math.round(scores.accessibility.score * 100));
console.log('Best Practices:', Math.round(scores['best-practices'].score * 100));
console.log('SEO:', Math.round(scores.seo.score * 100));
"
```

**Targets mínimos:**
- [ ] **Performance: 90+**
- [ ] **Accessibility: 95+**
- [ ] **Best Practices: 90+**
- [ ] **SEO: 95+**

---

## 🔧 Scripts de Automatización

### Script Master de Validación
```bash
#!/bin/bash
# validate-migration.sh - Validación completa automatizada

set -e  # Salir si cualquier comando falla

echo "🚀 INICIANDO VALIDACIÓN COMPLETA DE MIGRACIÓN"
echo "============================================="

# Fase 1: Base de datos
echo "📊 Fase 1: Validando base de datos..."
mysql -u $DB_USER -p$DB_PASS $DB_NAME < validation-queries.sql
echo "✅ Base de datos validada"

# Fase 2: Archivos
echo "🖼️ Fase 2: Validando archivos..."
./validate-images.sh
echo "✅ Archivos validados"

# Fase 3: API
echo "🔌 Fase 3: Validando conectividad API..."
node test-api-endpoints.js
echo "✅ API validada"

# Fase 4: Build y deploy
echo "🏗️ Fase 4: Build y deploy..."
npm run build
./deploy-test.sh
echo "✅ Deploy completado"

# Fase 5: Testing E2E
echo "🧪 Fase 5: Testing funcional..."
node e2e-tests.js
echo "✅ Tests funcionales completados"

# Fase 6: Performance
echo "⚡ Fase 6: Auditoria de performance..."
./lighthouse-test.sh
echo "✅ Performance auditada"

echo ""
echo "🎉 MIGRACIÓN VALIDADA EXITOSAMENTE"
echo "=================================="
echo "El proyecto está listo para producción"
```

### Package.json Scripts
```json
{
  "scripts": {
    "validate:full": "./validate-migration.sh",
    "validate:db": "mysql -u $DB_USER -p$DB_PASS $DB_NAME < validation-queries.sql",
    "validate:images": "./validate-images.sh",
    "validate:api": "node test-api-endpoints.js",
    "validate:e2e": "node e2e-tests.js",
    "validate:performance": "./lighthouse-test.sh",
    "deploy:staging": "npm run build && rsync -avz dist/ staging-server:/var/www/html/",
    "deploy:production": "npm run validate:full && npm run build && rsync -avz dist/ production-server:/var/www/html/"
  }
}
```

---

## 📋 Criterios de Éxito Final

### ✅ Migración COMPLETA requiere:

#### Datos (100% crítico)
- [ ] **0 registros huérfanos** en base de datos
- [ ] **100% antecedentes** migrados y accesibles
- [ ] **100% imágenes** funcionando correctamente

#### Funcionalidad (100% crítico)
- [ ] **API Directus** 100% operativa
- [ ] **Frontend Astro** desplegado sin errores
- [ ] **Navegación completa** funcional

#### Performance (mínimos aceptables)
- [ ] **Lighthouse Performance > 90**
- [ ] **LCP < 2.5 segundos**
- [ ] **0 errores 404** en consola

#### Testing (validación completa)
- [ ] **Tests E2E** pasando al 100%
- [ ] **Responsive** funcionando en móvil
- [ ] **SEO básico** implementado

---

## 🚨 Red Flags - Atención Inmediata

**Bloquantes críticos que impiden ir a producción:**
- ❌ **Base de datos**: Registros huérfanos o corrupción de datos
- ❌ **API**: Tokens expirados o endpoints devolviendo 500
- ❌ **Imágenes**: 90%+ de imágenes devolviendo 404
- ❌ **Build**: Fallos en el proceso de compilación
- ❌ **Performance**: LCP > 4 segundos o FCP > 3 segundos

**Observaciones menores (fix post-deploy):**
- ⚠️ **SEO**: Meta tags faltantes o incompletas
- ⚠️ **Accessibility**: Score < 90 en Lighthouse
- ⚠️ **Cache**: Headers de cache no optimizados

---

## 📊 Template de Reporte Final

```markdown
# Reporte de Migración - [FECHA]

## ✅ Estado General: MIGRACIÓN EXITOSA

### Resumen Ejecutivo
- **Antecedentes migrados**: XXX/XXX ✅
- **Imágenes operativas**: XXX/XXX ✅  
- **APIs funcionales**: 100% ✅
- **Performance**: Score XX/100 ✅

### Métricas Clave
- **Tiempo de carga**: X.X segundos
- **Lighthouse Score**: XX/100
- **Uptime test**: 100%
- **Tests E2E**: XX/XX passed

### Issues Resueltos
- [Lista de problemas encontrados y solucionados]

### Próximos Pasos
- [ ] Monitoreo post-deploy (24h)
- [ ] Backup de configuración actual
- [ ] Documentación actualizada

**Proyecto LISTO para producción** 🚀
```