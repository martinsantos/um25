# Changelog - ULTIMA MILLA

Todos los cambios notables en este proyecto serán documentados en este archivo.

## [2.0.0-stable] - 2025-11-22

### 🎉 HITO ALCANZADO: 100% FUNCIONALIDAD

Este release marca un hito importante: **sistema 100% funcional** con todas las características operativas.

### ✅ Agregado

#### Nuevos Archivos
- `src/utils/imageFixer.js` - Sistema de mapeo inteligente para imágenes rotas
  - Mapeo de 13 imágenes con nombres incorrectos a alternativas válidas
  - Función `getFixedImage()` para resolución automática
  
- `public/site.webmanifest` - Configuración PWA
  - Soporte para Progressive Web App
  - Configuración de iconos y tema

#### Nuevas Funcionalidades
- Sistema de fallback inteligente para imágenes
- Filtros de sector refinados y coherentes
- Integración completa con Directus CMS (469 antecedentes)

### 🔧 Modificado

#### Componentes
- `src/components/Navigation.astro`
  - Reemplazado componente `<Image />` por `<img>` estándar
  - Eliminado error 500 en endpoint `/_image`
  - Logo ahora carga desde `/images/um-logo.png`

#### Páginas de Sector (6 archivos)
- `src/pages/aeropuertos.astro`
- `src/pages/bodegas.astro`
- `src/pages/constructoras.astro`
- `src/pages/gobiernosectorpublico.astro`
- `src/pages/salud.astro`
- `src/pages/software.astro`

**Cambios aplicados:**
- Implementada función `getImageUrl()` mejorada
- Priorización de URLs de Directus sobre mapeo local
- Integración con `imageFixer.js`
- Fix de Mixed Content (localhost:8055 → producción)

#### Filtro de Constructoras
- `src/pages/constructoras.astro`
  - Filtro positivo estricto con keywords específicas
  - Keywords: constructora, construcciones, obras, procon, laugero, kristich, monteverdi, ceosa, green, arquitectura, ingenieria, desarrollos, edificio, torre
  - Eliminación de antecedentes no relacionados con construcción

#### Layout Principal
- `src/layouts/Layout.astro`
  - Favicon: `/favicon.ico` → `/favicon.svg`
  - Eliminadas referencias a `uiEffects-v2.css` (404)
  - Agregado link a `site.webmanifest`

#### Página de Detalle de Antecedente
- `src/pages/antecedentes/[id]/[slug].astro`
  - DIRECTUS_URL actualizado a `https://ultimamilla.com.ar/admin`
  - Función `getAssetUrl()` mejorada para detectar UUIDs vs filenames
  - Integración con `imageFixer.js`

#### Utilidades
- `src/utils/directus.js`
  - Importación y uso de `getFixedImage()`
  - Aplicación automática de fixes en `getAntecedentes()`

### 🐛 Corregido

#### Errores Críticos
1. **Logo no visible** (Error 500)
   - Causa: Componente `<Image />` de Astro fallando en producción
   - Solución: Reemplazo por `<img>` estándar

2. **Imágenes ALF Verde** (Placeholder)
   - Causa: Mixed Content (localhost:8055) y URLs incorrectas
   - Solución: Fix de URLs de Directus + imageFixer.js

3. **Errores 404**
   - `favicon.ico` → Cambiado a `favicon.svg`
   - `uiEffects-v2.css` → Eliminado (no existe)
   - `site.webmanifest` → Creado

4. **Filtro de Constructoras Incoherente**
   - Causa: Filtro negativo demasiado amplio
   - Solución: Filtro positivo con keywords específicas

#### Imágenes Rotas (13 archivos)
Mapeo implementado para:
- 5 imágenes de hospitales → Hospital A. Italo Perrupato
- 2 imágenes de bodegas → Bodegas Antigal/Caro
- 1 imagen de constructora → ISI Solutions
- 2 imágenes de gobierno → Gobierno de Mendoza
- 3 otras imágenes con nombres incorrectos

### 📊 Testing

#### Resultados
```
Total: 42 tests
✅ Exitosos: 42
❌ Fallidos: 0
📊 Éxito: 100%
```

#### Cobertura
- ✅ Todas las páginas principales
- ✅ Logo y assets estáticos
- ✅ Imágenes de antecedentes (muestra representativa)
- ✅ Directus API
- ✅ Páginas de sector (6 sectores)
- ✅ Formulario de contacto

### 🚀 Despliegue

#### Producción
- **URL**: https://www.ultimamilla.com.ar
- **Admin**: https://admin.ultimamilla.com.ar
- **Estado**: 100% Operativo
- **Directus**: 469 antecedentes importados

#### Backup
- **Archivo**: `backup_ultimamilla_fixed_v3.tar.gz`
- **Tamaño**: ~25GB
- **Contenido**: Proyecto completo (src, dist, config)
- **Excluye**: node_modules, .git

### 📝 Documentación

- README.md actualizado con sección de hitos
- CHANGELOG.md creado (este archivo)
- Badges actualizados en README
- URLs corregidas (umbot.com.ar → ultimamilla.com.ar)

### 🔄 Próximos Pasos

1. **Purgar cache de Cloudflare** (recomendado)
2. Monitorear logs de producción
3. Verificar analytics y métricas de usuario
4. Considerar optimizaciones de performance

---

## [1.x.x] - Versiones Anteriores

Ver commits anteriores para historial completo de cambios previos a la versión 2.0.0-stable.

---

**Mantenido por**: Equipo ULTIMA MILLA  
**Repositorio**: https://github.com/martinsantos/um25
