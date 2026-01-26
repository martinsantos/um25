# TASK LIST - Migración V4 + PRODUCTOS

**Proyecto**: Última Milla - Migración Template V4 + Integración PRODUCTOS a Directus
**Fecha de inicio**: Lunes (próxima semana)
**Duración estimada**: 3-4 semanas
**Plan completo**: Ver `plannuevotemplatev4.md`

---

## 📅 SEMANA 1: Backend - Schema Directus + Migración de Datos

### Lunes - Día 1

- [ ] **Configurar Directus Admin**
  - [ ] Acceder a https://admin.ultimamilla.com.ar
  - [ ] Verificar permisos de administrador
  - [ ] Backup de base de datos actual

- [ ] **Crear Colección `productos`**
  - [ ] Settings → Data Model → Create Collection: `productos`
  - [ ] Agregar 9 campos:
    - [ ] `servicio_id` (Many-to-One → Servicios, Required)
    - [ ] `titulo` (String 255, Required)
    - [ ] `descripcion` (Text, WYSIWYG)
    - [ ] `imagen` (Image/File relation)
    - [ ] `features` (JSON)
    - [ ] `destacado` (Text)
    - [ ] `marcas` (JSON)
    - [ ] `orden` (Integer, Default: 0)
    - [ ] `estado` (Dropdown: publicado/borrador)
  - [ ] Configurar relación reversa en `Servicios`: campo `productos`

### Martes - Día 2

- [ ] **Extender Colección `Servicios`**
  - [ ] Agregar campo `subtitulo` (String)
  - [ ] Agregar campo `stats` (JSON)
  - [ ] Agregar campo `marcas` (JSON)
  - [ ] Agregar campo `por_que_elegirnos` (JSON)
  - [ ] Agregar campo `area` (String)
  - [ ] Agregar campo `slug` (String, unique)

- [ ] **Crear Relación M2M `antecedentes_servicios`**
  - [ ] Ir a colección `antecedentes`
  - [ ] Crear campo `servicios_relacionados` (Many-to-Many)
  - [ ] Related Collection: `Servicios`
  - [ ] Auto-generar junction table

- [ ] **Verificar Schema en PostgreSQL**
  - [ ] `docker exec -it directus-postgres psql -U directus`
  - [ ] `\dt productos` - verificar tabla existe
  - [ ] `\dt antecedentes_servicios` - verificar junction table
  - [ ] `\d productos` - verificar columnas

### Miércoles - Día 3

- [ ] **Subir Imágenes de Productos**
  - [ ] Preparar directorio con ~48 imágenes de productos
  - [ ] File Library → Upload
  - [ ] Organizar en carpetas: `productos/{servicio_nombre}/`
  - [ ] Anotar UUIDs de imágenes subidas

- [ ] **Crear Script de Migración**
  - [ ] Crear `scripts/migrate-productos-to-directus.js`
  - [ ] Implementar funciones:
    - [ ] `getImageUUID()` - mapear URLs a UUIDs
    - [ ] `migrarDatos()` - migrar servicios y productos
  - [ ] Configurar autenticación con `DIRECTUS_ADMIN_TOKEN`

### Jueves - Día 4

- [ ] **Ejecutar Migración de Datos**
  - [ ] `DIRECTUS_ADMIN_TOKEN=xxx node scripts/migrate-productos-to-directus.js`
  - [ ] Verificar en logs: 6 servicios actualizados
  - [ ] Verificar en logs: ~40 productos creados
  - [ ] Verificar en Directus Admin UI que productos aparecen

- [ ] **Crear Script de Relaciones M2M**
  - [ ] Crear `scripts/create-antecedentes-servicios-relations.js`
  - [ ] Usar `areaToServiceMap.js` para mapear antecedentes → servicios
  - [ ] Ejecutar script
  - [ ] Verificar: 469 relaciones creadas

### Viernes - Día 5

- [ ] **Testing de Integridad de Datos**
  - [ ] Verificar en Directus Admin:
    - [ ] Servicio 101 (Infraestructura) tiene 8 productos
    - [ ] Servicio 104 (Software) tiene 6 productos
    - [ ] Todos los productos tienen imágenes (UUIDs)
    - [ ] Campo `features` tiene formato JSON correcto
  - [ ] Verificar relaciones M2M:
    - [ ] Antecedente id=10784 tiene servicio relacionado
    - [ ] Servicio 104 tiene antecedentes vinculados
  - [ ] Documentar cualquier inconsistencia

---

## 📅 SEMANA 2: Frontend - Componentes + Actualización de Páginas

### Lunes - Día 6

- [ ] **Crear Branch de Trabajo**
  - [ ] `git checkout develop`
  - [ ] `git pull origin develop`
  - [ ] `git checkout -b feature/v4-productos`

- [ ] **Crear Helper `/src/utils/directusHelpers.ts`**
  - [ ] `getServicioConProductos(id)` - query con productos
  - [ ] `getServiciosRelacionadosPorAntecedente(id)` - query M2M
  - [ ] `parseJSONField(field)` - parsear JSON con error handling
  - [ ] `getDirectusImageUrl(imageId, options)` - construir URLs de imágenes

### Martes - Día 7

- [ ] **Crear Componente `ProductCard.astro`**
  - [ ] Ubicación: `/src/components/v4/ProductCard.astro`
  - [ ] Props: producto, reversed, colorIndex
  - [ ] Layout: imagen + contenido (alternado)
  - [ ] Renderizar: título, descripción, features, destacado, marcas
  - [ ] Estilos: colores alternados (sky, emerald, purple, etc.)

- [ ] **Crear Componente `StatsBar.astro`**
  - [ ] Ubicación: `/src/components/v4/StatsBar.astro`
  - [ ] Props: stats (array de {value, label})
  - [ ] Layout: grid 2x2 mobile, 1x4 desktop
  - [ ] Estilos: números grandes con color `um-primary`

### Miércoles - Día 8

- [ ] **Crear Componente `ServiceCard.astro`**
  - [ ] Ubicación: `/src/components/v4/ServiceCard.astro`
  - [ ] Props: servicio con id, Titulo, Descripcion, Area, Imagen
  - [ ] Layout: imagen con overlay + contenido
  - [ ] Hover effects: scale, translateY
  - [ ] Badge de área en esquina

- [ ] **Crear Componente `CTASection.astro`**
  - [ ] Ubicación: `/src/components/v4/CTASection.astro`
  - [ ] Props: title, description, primaryCTA, secondaryCTA
  - [ ] Layout: centrado con botones
  - [ ] Background: gradiente `um-dark` con overlay `um-primary`

### Jueves - Día 9

- [ ] **Actualizar `/src/pages/servicios/[id]/[slug].astro`**
  - [ ] Importar `getServicioConProductos` de directusHelpers
  - [ ] Línea 10: Reemplazar `getServicioCompleto()` con query Directus
  - [ ] Agregar fallback a datos JS si Directus falla
  - [ ] Importar componentes: ProductCard, StatsBar, CTASection
  - [ ] Líneas 314-393: Reemplazar HTML con componente ProductCard
  - [ ] Parsear JSON fields: stats, marcas
  - [ ] Ordenar productos por campo `orden`

### Viernes - Día 10

- [ ] **Testing Local de Servicios**
  - [ ] `npm run dev`
  - [ ] Visitar: http://localhost:4321/servicios/101/infraestructura-de-redes
  - [ ] Verificar:
    - [ ] Stats bar renderiza con 4 métricas
    - [ ] 8 productos se muestran
    - [ ] Imágenes cargan desde Directus
    - [ ] Features aparecen con checkmarks
    - [ ] Destacado aparece en box de color
    - [ ] Marcas aparecen al final
  - [ ] Probar otros servicios: 102, 103, 104, 105, 106
  - [ ] Documentar bugs encontrados

---

## 📅 SEMANA 3: Antecedentes + Conversión HTML

### Lunes - Día 11

- [ ] **Actualizar `/src/pages/antecedentes/[id]/[slug].astro`**
  - [ ] Importar `getServiciosRelacionadosPorAntecedente` de helpers
  - [ ] Líneas 144-163: Reemplazar `areaToServiceMap` con query M2M
  - [ ] Mantener fallback a `getServiceIdFromArea()` si M2M vacío
  - [ ] Renderizar sección "Tecnología Implementada"
  - [ ] Mostrar primeros 3 productos del servicio relacionado
  - [ ] Agregar botón "Ver todos los productos"

### Martes - Día 12

- [ ] **Testing Local de Antecedentes**
  - [ ] Visitar: http://localhost:4321/antecedentes/10784/teatro-cervantes-software-a-medida
  - [ ] Verificar:
    - [ ] Sección "Tecnología Implementada" existe
    - [ ] 3 productos del servicio Software (id=104) se muestran
    - [ ] Imágenes de productos cargan
    - [ ] Features aparecen (máximo 2 por producto)
    - [ ] Botón vincula a `/servicios/104/...`
  - [ ] Probar con otros antecedentes de diferentes áreas

### Miércoles - Día 13

- [ ] **Convertir Homepage `/src/pages/index.astro`**
  - [ ] Basarse en `umnueva25/index-v4.html`
  - [ ] Implementar Hero section con stats
  - [ ] Query a Directus: servicios destacados (agregar campo `destacado` a Servicios)
  - [ ] Usar componente ServiceCard para grid de servicios
  - [ ] Agregar CTASection al final
  - [ ] Testing local

### Jueves - Día 14

- [ ] **Crear `/src/pages/sectores/[slug].astro`**
  - [ ] Basarse en `umnueva25/sector-single-v4.html`
  - [ ] getStaticPaths para sectores conocidos
  - [ ] Hero con imagen del sector
  - [ ] Filtrar antecedentes por sector
  - [ ] Grid de antecedentes del sector
  - [ ] Servicios relacionados
  - [ ] CTA final

### Viernes - Día 15

- [ ] **Actualizar páginas secundarias**
  - [ ] `/src/pages/servicios/index.astro` - listado con ServiceCard
  - [ ] `/src/pages/nosotros.astro` - convertir de `nosotros-v4.html`
  - [ ] `/src/pages/contacto.astro` - convertir de `contacto-v4.html`
  - [ ] Testing local de todas las páginas

---

## 📅 SEMANA 4: Testing + Deployment

### Lunes - Día 16

- [ ] **Tests Unitarios**
  - [ ] Crear `__tests__/directus-productos.test.js`
  - [ ] Test: Servicio 101 tiene productos en Directus
  - [ ] Test: Productos tienen imágenes con UUID válido
  - [ ] Test: JSON fields parsean correctamente
  - [ ] Test: parseJSONField maneja null gracefully
  - [ ] Ejecutar: `npm test`

- [ ] **Tests de Relaciones M2M**
  - [ ] Test: Antecedente 10784 tiene servicios relacionados
  - [ ] Test: Servicio 104 tiene antecedentes vinculados
  - [ ] Ejecutar tests y verificar todos pasan

### Martes - Día 17

- [ ] **Validación Manual Completa**
  - [ ] Homepage: http://localhost:4321/
  - [ ] Servicios listado: http://localhost:4321/servicios
  - [ ] Servicio single: http://localhost:4321/servicios/101/infraestructura-de-redes
  - [ ] Otro servicio: http://localhost:4321/servicios/104/desarrollo-de-software-a-medida
  - [ ] Antecedentes listado: http://localhost:4321/antecedentes
  - [ ] Antecedente single: http://localhost:4321/antecedentes/10784/teatro-cervantes-software-a-medida
  - [ ] Sectores: http://localhost:4321/sectores
  - [ ] Sector single: http://localhost:4321/sectores/aeropuertos
  - [ ] Nosotros: http://localhost:4321/nosotros
  - [ ] Contacto: http://localhost:4321/contacto

- [ ] **Performance Testing**
  - [ ] Crear `scripts/performance-test.js`
  - [ ] Medir tiempo de carga de páginas críticas
  - [ ] Objetivo: < 3s por página
  - [ ] Documentar resultados

### Miércoles - Día 18

- [ ] **Pre-Deploy Checklist**
  - [ ] `npm run build` - sin errores
  - [ ] `npm test` - todos los tests pasan
  - [ ] `npm run lint` - sin errores ESLint
  - [ ] `npm run preview` - funciona en modo producción
  - [ ] Crear script `scripts/validate-product-images.js`
  - [ ] Ejecutar validación de imágenes - todas cargan

- [ ] **Commit y Push**
  - [ ] `git add .`
  - [ ] Commit con mensaje descriptivo (ver template en plan)
  - [ ] `git push origin feature/v4-productos`

### Jueves - Día 19

- [ ] **PR a Develop**
  - [ ] `gh pr create --base develop --head feature/v4-productos`
  - [ ] Título: "feat: V4 Design System + PRODUCTOS Integration"
  - [ ] Body: Resumen completo (ver template en plan)
  - [ ] Esperar CI/CD checks pasen
  - [ ] Review y merge

- [ ] **Testing en Develop Branch**
  - [ ] Verificar GitHub Actions: build, tests, lint
  - [ ] Esperar confirmación de deploy exitoso
  - [ ] Hacer smoke tests en ambiente develop (si existe)

### Viernes - Día 20

- [ ] **Deploy a Production**
  - [ ] `git checkout develop`
  - [ ] `git pull origin develop`
  - [ ] `gh pr create --base master --head develop`
  - [ ] Título: "release: V4 Design + PRODUCTOS Integration v1.0.0"
  - [ ] Esperar aprobación
  - [ ] Merge PR (GitHub Actions ejecuta deploy automático)

- [ ] **Post-Deploy Monitoring (primeros 30 minutos)**
  - [ ] SSH al servidor: `ssh ultimamilla`
  - [ ] Monitorear logs: `pm2 logs astro-ultimamilla --lines 200`
  - [ ] Verificar status: `pm2 status`
  - [ ] Test endpoints:
    - [ ] `curl -I https://www.ultimamilla.com.ar/`
    - [ ] `curl -I https://www.ultimamilla.com.ar/servicios/101/infraestructura-de-redes`
    - [ ] `curl -I https://www.ultimamilla.com.ar/antecedentes/10784/teatro-cervantes-software-a-medida`
  - [ ] Verificar health check log: `tail -f /var/log/health-check.log`
  - [ ] Métricas: HTTP 200, PM2 running, Memory < 512MB, Response time < 3s

---

## 📋 CHECKLIST 24H POST-DEPLOY

- [ ] **Verificar health checks están pasando**
  - [ ] `ssh ultimamilla`
  - [ ] `tail -100 /var/log/health-check.log`
  - [ ] Últimas 20 entradas deben ser "OK"

- [ ] **Verificar PM2 no ha reiniciado múltiples veces**
  - [ ] `pm2 info astro-ultimamilla | grep "restart time"`
  - [ ] Debe ser 0 o 1 (no múltiples restarts)

- [ ] **Verificar logs sin errores críticos**
  - [ ] `pm2 logs astro-ultimamilla --lines 1000 | grep -i "error"`
  - [ ] Sin errores relacionados a Directus o productos

- [ ] **Test manual de páginas críticas desde exterior**
  - [ ] `curl -I https://www.ultimamilla.com.ar/servicios/101/infraestructura-de-redes`
  - [ ] HTTP 200 OK

---

## 🚨 ROLLBACK SCENARIOS

### Si Build Falla en CI/CD
1. Revisar logs de GitHub Actions
2. Reproducir localmente: `npm run build`
3. Fixear error en feature branch
4. Nuevo commit y push
5. NO mergear hasta que build pase

### Si Deploy Exitoso pero Páginas 500
1. SSH al servidor: `ssh ultimamilla`
2. Ver logs: `pm2 logs astro-ultimamilla --err --lines 100`
3. Si error de Directus: `echo "USE_DIRECTUS_FALLBACK=true" >> /root/fumbling-field/.env`
4. `pm2 restart astro-ultimamilla`
5. Si persiste: `git checkout v0.0.1-production-baseline && pm2 restart astro-ultimamilla`

### Si Imágenes No Cargan
1. Verificar imágenes en Directus Files
2. Verificar UUIDs en campo `imagen` de productos
3. Verificar `PUBLIC_DIRECTUS_URL` correcto
4. Temporal: editar `directusHelpers.ts` con fallback URLs

### Si Relaciones M2M Vacías
1. El código tiene fallback a `areaToServiceMap.js` (funcionará igual)
2. Ejecutar: `node scripts/create-antecedentes-servicios-relations.js`
3. Verificar en Directus Admin que junction table tiene registros

---

## 📊 MÉTRICAS DE ÉXITO

- ✅ 6 servicios con datos completos en Directus
- ✅ ~40 productos creados y asociados correctamente
- ✅ 469 relaciones M2M antecedentes↔servicios
- ✅ 11 páginas migradas a diseño v4
- ✅ Todos los tests pasan (unitarios + E2E)
- ✅ Performance < 3s por página
- ✅ Zero downtime durante deploy
- ✅ Rollback plan validado y listo

---

## 📝 NOTAS

- **Backup obligatorio** antes de cada cambio en Directus
- **Git Flow estricto**: feature → develop → master
- **Fallbacks activos** durante todo el período de transición
- **Monitoreo intensivo** primeros 30 min post-deploy
- **Documentar todo**: bugs, decisiones, workarounds

---

**Plan completo**: `plannuevotemplatev4.md`
**Inicio**: Lunes próxima semana
**Contacto**: https://admin.ultimamilla.com.ar | ssh ultimamilla
