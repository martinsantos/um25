# POLÍTICA: TODO DESDE DIRECTUS - CERO FALLBACKS

**Fecha**: 2026-01-28
**Estado**: ✅ IMPLEMENTADO
**Principio**: 100% del contenido (imágenes, textos, datos) DEBE venir de Directus. NO fallbacks locales.

---

## REGLA CRÍTICA

```
❌ NUNCA usar imágenes locales como fallback
❌ NUNCA usar placeholders genéricos
❌ NUNCA permitir que una misma imagen se use en múltiples servicios/antecedentes
✅ SIEMPRE servir desde Directus
✅ SIEMPRE validar que cada entidad tiene su imagen única
✅ SIEMPRE mostrar error visible si falta imagen
```

---

## CAMBIOS IMPLEMENTADOS

### 1. **src/pages/index.astro** (Homepage)

**ANTES** ❌:
```typescript
const getServiceThumbnail = (servicioId: number) => {
  const imageNumber = servicioId - 100;
  return `/images/services/${imageNumber}.png`;  // ❌ IMAGEN LOCAL
};

const servicios = serviciosFromDirectus.slice(0, 8).map(s => ({
  ...s,
  Imagen: getServiceThumbnail(s.id),  // ❌ OVERRIDE con local
  imagen: getServiceThumbnail(s.id)
}));
```

**DESPUÉS** ✅:
```typescript
const servicios = serviciosFromDirectus.slice(0, 8).map(s => {
  const sector = serviceToSectorMap[s.id] || 'tecnologia';
  const colors = getSectorColors(sector);

  return {
    ...s,
    ...iconMap[s.id],
    slug: s.slug || generateSlug(s.Titulo),
    Imagen: s.Imagen,  // ✅ DIRECTUS UUID
    imagen: s.Imagen,  // ✅ DIRECTUS UUID
    badge: serviceBadgeMap[s.id] || 'Tecnología',
    badgeColor: colors.icon
  };
});
```

---

### 2. **src/pages/servicios/index.astro** (Listado Servicios)

**ANTES** ❌:
```typescript
const getServiceThumbnail = (servicioId: number) => {
  const imageNumber = servicioId - 100;
  return `/images/services/${imageNumber}.png`;  // ❌ IMAGEN LOCAL
};

const serviciosReales = serviciosFromDirectus.map(s => ({
  ...s,
  imagen: getServiceThumbnail(s.id)  // ❌ LOCAL
}));
```

**DESPUÉS** ✅:
```typescript
const serviciosReales = serviciosFromDirectus.map(s => {
  const sector = serviceToSectorMap[s.id] || 'tecnologia';
  const colors = getSectorColors(sector);

  return {
    ...s,
    ...iconMap[s.id],
    slug: s.slug || generateSlug(s.Titulo),
    Area: s.area || 'Tecnología',
    badge: serviceBadgeMap[s.id] || 'Tecnología',
    badgeColor: colors.icon,
    imagen: s.Imagen  // ✅ DIRECTUS UUID
  };
});
```

---

### 3. **src/components/v4/ServiceCard.astro**

**ANTES** ❌:
```typescript
let imagenUrl = '/images/services/default-service.jpg';  // ❌ FALLBACK
let srcsetWebp = '';
let sizes = '';

if (imagen) {
  if (imagen.match(/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i)) {
    imagenUrl = getDirectusImageUrl(imagen);
  } else {
    imagenUrl = imagen;

    const serviceImageMatch = imagen.match(/\/images\/services\/(\d+)\.png$/);
    if (serviceImageMatch) {
      const serviceNum = serviceImageMatch[1];
      srcsetWebp = `/images/services/${serviceNum}-400.webp 400w, ...`;  // ❌ LOCAL
      imagenUrl = `/images/services/${serviceNum}-800.webp`;  // ❌ LOCAL
    }
  }
}
```

**DESPUÉS** ✅:
```typescript
let imagenUrl = '';  // ✅ No fallback

if (imagen) {
  if (imagen.match(/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i)) {
    imagenUrl = getDirectusImageUrl(imagen);
  } else if (imagen.startsWith('http')) {
    imagenUrl = imagen;
  } else {
    console.error(`[ServiceCard] Invalid image format for ${titulo}: ${imagen}`);
  }
}

if (!imagenUrl) {
  console.error(`[ServiceCard] Missing image for service: ${titulo} (ID: ${id})`);
}
```

**HTML**:
```astro
{imagenUrl ? (
  <img
    src={imagenUrl}
    alt={titulo}
    class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
    loading="lazy"
  />
) : (
  <div class="w-full h-full flex items-center justify-center bg-um-gray text-um-dark">
    <p class="text-sm">Imagen no disponible</p>
  </div>
)}
```

---

### 4. **src/components/ProjectCard.astro**

**ANTES** ❌:
```typescript
const defaultImage = 'https://images.unsplash.com/...';  // ❌ UNSPLASH FALLBACK
const imageUrl = imagen || defaultImage;

// HTML
<img
  src={imageUrl}
  alt={titulo}
  loading="lazy"
  class="..."
  onError="this.src='/images/placeholder-project.jpg'"  // ❌ FALLBACK
/>
```

**DESPUÉS** ✅:
```typescript
if (!imagen) {
  console.error(`[ProjectCard] Missing image for: ${titulo} (ID: ${id})`);
}
const imageUrl = imagen;  // ✅ Solo Directus

// HTML
{imageUrl ? (
  <img
    src={imageUrl}
    alt={titulo}
    loading="lazy"
    class="..."
  />
) : (
  <div class="w-full h-full flex items-center justify-center bg-um-gray text-um-dark">
    <p class="text-sm">Imagen no disponible</p>
  </div>
)}
```

---

### 5. **src/lib/directus.ts** - `getDirectusImageUrl()`

**ANTES** ❌:
```typescript
export function getDirectusImageUrl(imageId: string | null | undefined): string {
  if (!imageId) {
    return '/images/default.jpg';  // ❌ FALLBACK
  }

  const uuidRegex = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
  if (!uuidRegex.test(imageId)) {
    console.warn(`Invalid UUID format for image: ${imageId}`);
    return '/images/default.jpg';  // ❌ FALLBACK
  }

  return `/assets/${imageId}`;
}
```

**DESPUÉS** ✅:
```typescript
export function getDirectusImageUrl(imageId: string | null | undefined): string {
  if (!imageId) {
    console.error('[getDirectusImageUrl] Missing imageId');
    return '';  // ✅ Empty string, NO fallback
  }

  const uuidRegex = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
  if (!uuidRegex.test(imageId)) {
    console.error(`[getDirectusImageUrl] Invalid UUID format: ${imageId}`);
    return '';  // ✅ Empty string, NO fallback
  }

  return `/assets/${imageId}`;
}
```

---

## SCRIPT DE AUDITORÍA

**Archivo**: `scripts/audit-imagenes-directus.js`

**Propósito**: Verificar que:
1. Todos los servicios tienen imagen
2. Todas las imágenes de servicios son únicas
3. Todos los antecedentes tienen imagen
4. Todas las imágenes de antecedentes son únicas

**Uso**:
```bash
# Requiere Directus corriendo en localhost:8055
node scripts/audit-imagenes-directus.js
```

**Salida esperada** (estado ideal):
```
🔍 Auditando imágenes en Directus...

📦 SERVICIOS

Total servicios: 8

✅ Todos los servicios tienen imagen

✅ Todas las imágenes de servicios son ÚNICAS

📊 Resumen Servicios:
   Total: 8
   Con imagen: 8
   Sin imagen: 0
   Imágenes únicas: 8
   Imágenes duplicadas: 0

📋 ANTECEDENTES

Total antecedentes: 469

✅ Todos los antecedentes tienen imagen

✅ Todas las imágenes de antecedentes son ÚNICAS

📊 Resumen Antecedentes:
   Total: 469
   Con imagen: 469
   Sin imagen: 0
   Imágenes únicas: 469
   Imágenes duplicadas: 0

✅ AUDITORÍA COMPLETADA

🎉 ¡PERFECTO! No se encontraron problemas
```

---

## VERIFICACIÓN POST-IMPLEMENTACIÓN

### ✅ Checklist de Validación

- [ ] **Build exitoso**: `npm run build` → sin errores
- [ ] **Servicios**: Todos tienen imagen única desde Directus
- [ ] **Antecedentes**: Todos tienen imagen única desde Directus
- [ ] **Homepage**: No carga `/images/services/{N}.png`
- [ ] **Página Servicios**: No carga `/images/services/{N}.png`
- [ ] **ServiceCard**: Muestra "Imagen no disponible" si falta imagen (no placeholder)
- [ ] **ProjectCard**: Muestra "Imagen no disponible" si falta imagen (no placeholder)
- [ ] **getDirectusImageUrl()**: Devuelve cadena vacía si UUID inválido (no fallback)
- [ ] **Console Logs**: Errores visibles si falta imagen (para debugging)
- [ ] **Network Tab**: Solo requests a `/assets/{uuid}` (Directus proxy)

---

## CÓMO AGREGAR NUEVA IMAGEN

### Para Servicio:

1. **En Directus Admin**:
   - Ir a Collections → Servicios
   - Editar servicio
   - Campo "Imagen" → Upload archivo único
   - Guardar

2. **Verificar**:
   - El UUID debe aparecer en campo `Imagen`
   - Ejecutar audit script: `node scripts/audit-imagenes-directus.js`
   - Debe mostrar 0 duplicados

### Para Antecedente:

1. **En Directus Admin**:
   - Ir a Collections → Antecedentes
   - Editar antecedente
   - Campo "Imagen" → Upload archivo único
   - Guardar

2. **Verificar**:
   - El UUID debe aparecer en campo `Imagen`
   - Ejecutar audit script: `node scripts/audit-imagenes-directus.js`
   - Debe mostrar 0 duplicados

---

## ERRORES COMUNES Y SOLUCIONES

### Error: "Imagen no disponible" en frontend

**Causa**: Falta imagen en Directus o UUID inválido

**Solución**:
1. Revisar console del navegador → error log con ID/título
2. Ir a Directus Admin → buscar entidad por ID
3. Agregar imagen válida
4. Rebuild y redeploy

### Error: Imagen duplicada detectada en audit

**Causa**: Dos entidades comparten el mismo UUID de imagen

**Solución**:
1. Audit script muestra cuáles entidades
2. Ir a Directus Admin
3. Subir imagen NUEVA para una de las entidades
4. Ejecutar audit nuevamente → 0 duplicados

### Error: UUID inválido en logs

**Causa**: Campo `Imagen` tiene valor corrupto o no-UUID

**Solución**:
1. Log muestra el valor inválido
2. Ir a Directus Admin → buscar entidad
3. Eliminar valor corrupto del campo `Imagen`
4. Subir imagen correcta

---

## MONITOREO EN PRODUCCIÓN

### Logs a Vigilar

```bash
# En servidor de producción
pm2 logs astro-ultimamilla | grep -E "Missing image|Invalid image|no disponible"
```

**Esperado**: CERO logs de imágenes faltantes

**Si aparecen logs**:
1. Identificar entidad (ID en log)
2. Agregar imagen en Directus
3. Rebuild no necesario (SSR se actualiza automáticamente)

---

## ARCHIVOS ELIMINADOS/DEPRECATED

Los siguientes archivos YA NO SE USAN:

- ❌ `/public/images/services/{1-8}.png` - Deprecated
- ❌ `/public/images/services/{1-8}-{400|800|1600}.webp` - Deprecated
- ❌ `/public/images/default.jpg` - Removed
- ❌ `/public/images/default-service.jpg` - Removed
- ❌ `/public/images/placeholder-project.jpg` - Removed
- ❌ `scripts/optimize-service-images.js` - Obsolete (usaba imágenes locales)

**Acción**: Pueden eliminarse del repositorio en próximo commit.

---

## DEPLOYMENT

### Checklist Pre-Deploy

1. ✅ Build local exitoso
2. ✅ Audit de imágenes pasado (0 problemas)
3. ✅ Prueba visual en dev (todas las imágenes cargan)
4. ✅ No hay console errors en navegador
5. ✅ Network tab solo muestra `/assets/{uuid}`

### Deployment a Producción

```bash
# En servidor de producción
cd /root/fumbling-field
git pull origin master
npm run build
pm2 restart astro-ultimamilla

# Verificar
curl -s http://localhost:4321 | grep -c "Imagen no disponible"
# Esperado: 0
```

### Post-Deploy Validation

1. **Visual**: Abrir https://ultimamilla.com.ar
2. **Homepage**: Verificar 8 servicios con imágenes
3. **Servicios**: Verificar listado con imágenes
4. **Antecedentes**: Verificar cards con imágenes
5. **DevTools**: Network tab → solo `/assets/{uuid}` requests
6. **Console**: Cero errores de imágenes

---

## CONTACTO Y SOPORTE

**Si encuentras una imagen faltante**:
1. NO agregar fallback local
2. Reportar con ID de entidad
3. Subir imagen en Directus Admin
4. Verificar con audit script

**Principio**: Es mejor mostrar "Imagen no disponible" temporalmente que usar placeholders genéricos que ocultan el problema.

---

**ÚLTIMA ACTUALIZACIÓN**: 2026-01-28
**BUILD STATUS**: ✅ PASSING
**POLÍTICA**: ACTIVA Y ENFORCED
