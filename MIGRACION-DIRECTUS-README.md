# MIGRACIÓN COMPLETA A DIRECTUS - CONTROL TOTAL DEL CONTENIDO

**Fecha**: 28 Enero 2026
**Estado**: 🟡 En Progreso (Fase 1/2 completada)
**Objetivo**: Eliminar TODO el contenido hardcodeado y moverlo a Directus

---

## 📊 RESUMEN EJECUTIVO

### ✅ COMPLETADO

1. **Nueva Marca 2026** aplicada (logos SVG vectoriales + favicons)
2. **Script de migración** creado (`scripts/migrate-to-directus.mjs`)
3. **Helpers TypeScript** creados (`src/utils/sectoresHelpers.ts`)
4. **Template de referencia** creado (`src/pages/constructoras-directus.astro`)

### 🔄 PENDIENTE

1. Ejecutar script de migración en servidor Directus
2. Aplicar template a las 8 páginas restantes
3. Testing completo
4. Deployment a producción

---

## 🎯 DATOS A MIGRAR

### Contenido Hardcodeado Actual

```
📦 9 Páginas de Sectores
├── aeropuertos.astro          (3 value props + 6 servicios)
├── bodegas.astro               (3 value props + 6 servicios)
├── constructoras.astro         (3 value props + 6 servicios)
├── gobiernosectorpublico.astro (3 value props + 6 servicios)
├── industria.astro             (3 value props + 6 servicios)
├── mineria.astro               (3 value props + 6 servicios)
├── salud.astro                 (3 value props + 6 servicios)
├── seguridad-electronica.astro (3 value props + 6 servicios)
└── software.astro              (3 value props + 6 servicios)

TOTAL:
• 9 sectores completos
• 27 value propositions (3 × 9)
• 54 relaciones sector-servicio (6 × 9)
• 9 configuraciones de SEO
• 9 sets de keywords
• 18+ stats personalizados
```

---

## 📁 ESTRUCTURA DIRECTUS NUEVA

### Colecciones Creadas

```
Directus
├── sectores (nueva colección)
│   ├── id (PK)
│   ├── slug (único)
│   ├── nombre
│   ├── emoji
│   ├── descripcion
│   ├── hero_image
│   ├── keywords (JSON array)
│   ├── color_theme (select)
│   ├── seo_title
│   ├── seo_description
│   ├── seo_keywords
│   ├── stats (JSON array)
│   ├── activo (boolean)
│   ├── orden (integer)
│   └── [relaciones]
│
├── sector_value_props (nueva colección)
│   ├── id (PK)
│   ├── sector_id (FK → sectores)
│   ├── icono (string)
│   ├── titulo
│   ├── descripcion
│   └── orden
│
└── sectores_servicios (junction table M:M)
    ├── id (PK)
    ├── sectores_id (FK → sectores)
    ├── servicios_id (FK → Servicios)
    ├── orden
    └── descripcion_custom (opcional)
```

---

## 🚀 PASO A PASO: COMPLETAR LA MIGRACIÓN

### PASO 1: Ejecutar Script de Migración en Servidor

```bash
# SSH al servidor
ssh ultimamilla

# Ir al directorio
cd /root/fumbling-field

# Ejecutar migración
node scripts/migrate-to-directus.mjs

# Verificar en Directus Admin
open http://admin.ultimamilla.com.ar
```

**Resultado esperado**:
```
✅ Colección "sectores" creada
✅ Colección "sector_value_props" creada
✅ Relación sectores-servicios creada
✅ 9 sectores cargados
✅ 27 value props creados
✅ 54 relaciones establecidas
```

---

### PASO 2: Actualizar Páginas de Sectores

Aplicar el template `constructoras-directus.astro` a las 8 páginas restantes.

**Script automático** (ejecutar localmente):

```bash
# Crear script de conversión automática
cat > scripts/convert-sector-pages.sh << 'EOF'
#!/bin/bash

SECTORS="aeropuertos bodegas gobiernosectorpublico industria mineria salud seguridad-electronica software"

for sector in $SECTORS; do
  echo "Convirtiendo $sector.astro..."

  # Backup
  cp src/pages/${sector}.astro src/pages/${sector}.astro.backup-hardcoded

  # Copiar template
  cp src/pages/constructoras-directus.astro src/pages/${sector}.astro

  # Reemplazar slug
  sed -i '' "s/'constructoras'/'${sector}'/g" src/pages/${sector}.astro

  echo "✅ ${sector}.astro actualizado"
done

echo ""
echo "✅ TODAS LAS PÁGINAS CONVERTIDAS"
EOF

chmod +x scripts/convert-sector-pages.sh
./scripts/convert-sector-pages.sh
```

**O manualmente**, para cada archivo:

1. Abrir `src/pages/{sector}.astro`
2. Reemplazar contenido con template de `constructoras-directus.astro`
3. Cambiar línea: `const sectorData = await getSectorBySlug('SLUG_AQUI');`
4. Guardar

---

### PASO 3: Eliminar Contenido Hardcodeado

Una vez verificado que todo funciona desde Directus:

```bash
# Eliminar backups hardcodeados
rm src/pages/*.backup-hardcoded

# Eliminar archivos de datos antiguos (opcional)
rm src/data/sectores_legacy.js
```

---

### PASO 4: Testing Completo

**Verificar cada sector en local**:

```bash
npm run dev

# Abrir en navegador:
http://localhost:4321/aeropuertos
http://localhost:4321/bodegas
http://localhost:4321/constructoras
http://localhost:4321/gobiernosectorpublico
http://localhost:4321/industria
http://localhost:4321/mineria
http://localhost:4321/salud
http://localhost:4321/seguridad-electronica
http://localhost:4321/software
```

**Checklist por página**:
- [ ] Hero section muestra emoji + título correcto
- [ ] Value props (3) se cargan desde Directus
- [ ] Servicios relacionados (6) se cargan desde Directus
- [ ] Antecedentes filtrados correctamente
- [ ] Colores del theme aplicados
- [ ] Stats personalizados visibles
- [ ] SEO metadata correcto en `<head>`

---

### PASO 5: Deployment a Producción

```bash
# Commit final
git add -A
git commit -m "feat: Aplicar migración Directus a todos los sectores

- Todas las 9 páginas de sectores consumen desde Directus
- Eliminado contenido hardcodeado completo
- Directus tiene control total del contenido

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"

# Push a master (trigger auto-deploy)
git push origin master
```

**Monitorear deployment**:
- GitHub Actions: https://github.com/martinsantos/um25/actions
- Tiempo estimado: 5-8 minutos

---

## 📝 GESTIÓN DE CONTENIDO POST-MIGRACIÓN

### Cómo Editar Sectores en Directus

1. **Acceder a Directus Admin**:
   ```
   https://admin.ultimamilla.com.ar
   ```

2. **Navegar a colección "sectores"**

3. **Editar cualquier campo**:
   - Nombre, emoji, descripción
   - Hero image (URL de Unsplash)
   - Keywords para filtrado
   - Color theme
   - SEO metadata
   - Stats

4. **Editar Value Props**:
   - Click en sector → Tab "Value Props"
   - Agregar/editar/eliminar diferenciales
   - Cambiar orden

5. **Editar Servicios Relacionados**:
   - Click en sector → Tab "Servicios"
   - Agregar/quitar servicios
   - Cambiar orden de aparición
   - Personalizar descripción

6. **Guardar** → Cambios reflejados en segundos sin redeploy

---

## 🎨 COLORES DE THEMES

Colores disponibles para `color_theme`:

| Theme | Uso Actual | Color Principal |
|-------|------------|-----------------|
| `sky` | Aeropuertos | #0EA5E9 |
| `purple` | Bodegas | #A855F7 |
| `amber` | Constructoras | #F59E0B |
| `blue` | Gobierno | #3B82F6 |
| `indigo` | Industria | #6366F1 |
| `orange` | Minería | #F97316 |
| `emerald` | Salud | #10B981 |
| `red` | Seguridad | #DC2626 |
| `cyan` | Software | #06B6D4 |

---

## 🛠️ TROUBLESHOOTING

### Error: "Colección 'sectores' no existe"

**Solución**: El script de migración no se ejecutó.

```bash
ssh ultimamilla
cd /root/fumbling-field
node scripts/migrate-to-directus.mjs
```

---

### Error: "getSectorBySlug is not a function"

**Solución**: Falta el helper.

```bash
# Verificar que existe
ls -la src/utils/sectoresHelpers.ts

# Si falta, crear desde git
git checkout src/utils/sectoresHelpers.ts
```

---

### Error: "Cannot read properties of null"

**Causa**: Directus devolvió `null` (sector no encontrado).

**Solución**:
1. Verificar que el slug en la página coincide con Directus
2. Verificar que el sector está marcado como `activo: true`

```typescript
// Verificar en página:
const sectorData = await getSectorBySlug('constructoras');
//                                        ^^^^^^^^^^^^^^
//                                        Debe coincidir con DB
```

---

### Página en blanco después de migración

**Debug**:

```bash
# Ver logs de Astro
npm run dev

# Ver console del navegador
# Buscar errores de fetch o TypeScript
```

**Solución común**:
- Directus offline → reiniciar Docker
- Autenticación fallida → verificar token
- Red interna → verificar firewall

---

## 📊 BENEFICIOS DE LA MIGRACIÓN

### ANTES (Hardcodeado)

❌ Cambiar contenido requiere:
- Editar código `.astro`
- Commit a git
- Rebuild completo
- Redeploy (5-8 min)
- Conocimiento técnico

❌ Riesgos:
- Sintaxis incorrecta rompe build
- Cambios sin testing
- No hay historial de versiones de contenido
- DRY violation (9 archivos duplicados)

### DESPUÉS (Directus)

✅ Cambiar contenido requiere:
- Login a Directus
- Editar campo
- Guardar → **Reflejado en segundos**

✅ Beneficios:
- Sin redeploy
- Sin conocimiento técnico
- Versioning automático
- Preview antes de publicar
- Gestión centralizada
- Rollback fácil
- Colaboración multi-usuario

---

## 🎯 MÉTRICAS DE ÉXITO

### KPIs

- [ ] **100% de contenido en Directus**: 9/9 sectores migrados
- [ ] **0 arrays hardcodeados** en archivos `.astro`
- [ ] **Build time**: sin cambios (<10s)
- [ ] **Page load time**: sin cambios (<1s)
- [ ] **Tiempo de cambio de contenido**: De 8 min → 10 segundos
- [ ] **Usuarios no-técnicos** pueden editar contenido

---

## 📞 SOPORTE

**Documentación Directus**:
- https://docs.directus.io

**Helpers creados**:
- `src/utils/sectoresHelpers.ts` - Funciones de fetch
- `scripts/migrate-to-directus.mjs` - Script de migración

**Logs**:
```bash
# Ver logs de Directus
ssh ultimamilla
docker logs directus-app

# Ver logs de Astro
pm2 logs astro-ultimamilla
```

---

## ✅ CHECKLIST FINAL

### Antes de Considerar Completo

- [ ] Script de migración ejecutado exitosamente
- [ ] Directus tiene las 3 colecciones nuevas
- [ ] 9 sectores cargados en Directus con todos sus datos
- [ ] 27 value props visibles en Directus
- [ ] 54 relaciones sector-servicio configuradas
- [ ] 9 archivos `.astro` actualizados para consumir desde Directus
- [ ] Build local exitoso
- [ ] Testing de las 9 páginas en local
- [ ] Deployment a producción exitoso
- [ ] Testing de las 9 páginas en producción
- [ ] Backups hardcodeados eliminados
- [ ] Documentación actualizada

---

**Estado Actual**: Migración preparada, pendiente de ejecución en servidor.

**Próximo paso**: Ejecutar `node scripts/migrate-to-directus.mjs` en servidor Directus.
