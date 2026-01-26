# V4 Templates - Listos para Implementación

## Estado: AUDITADO Y APROBADO

Fecha: 2026-01-23

---

## Archivos Incluidos (9 templates)

| Archivo | Descripción | Tamaño |
|---------|-------------|--------|
| `index-v4.html` | Homepage con hero + imagen de fondo | 38KB |
| `servicios-v4.html` | Listado de servicios | 37KB |
| `servicio-single-v4.html` | Detalle de servicio individual | 35KB |
| `antecedentes-index-v4.html` | Listado de proyectos/casos | 41KB |
| `antecedente-single-v4.html` | Detalle de proyecto individual | 31KB |
| `sectores-v4.html` | Listado de industrias | 28KB |
| `sector-single-v4.html` | Detalle de sector (ej: Aeropuertos) | 32KB |
| `nosotros-v4.html` | Página "Sobre nosotros" | 26KB |
| `contacto-v4.html` | Formulario de contacto | 26KB |

---

## Características Implementadas

### Mobile-First Responsive
- Navbar fixed con hamburger menu funcional
- Grids: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`
- Touch targets mínimos de 44x44px
- Tipografía fluida con clamp()

### Breakpoints Tailwind
- **Base**: 0-639px (móvil)
- **sm**: 640px+ (tablet portrait)
- **md**: 768px+ (tablet landscape)
- **lg**: 1024px+ (desktop)
- **xl**: 1280px+ (desktop grande)

### Consistencia Visual
- Hero padding: `pt-20 sm:pt-24`
- Breadcrumb margin: `mb-3 sm:mb-4`
- Navbar: `fixed top-0 left-0 right-0 z-50 backdrop-blur-md`
- Footer: Grid responsive `1 → 2 → 4 columnas`

### Accesibilidad
- ARIA labels en menú hamburguesa
- `aria-expanded` dinámico
- Respeta `prefers-reduced-motion`
- Focus states en todos los interactivos

---

## Mapeo de Rutas para Astro

```
v4-ready-to-deploy/          →  src/pages/
├── index-v4.html            →  index.astro
├── servicios-v4.html        →  servicios/index.astro
├── servicio-single-v4.html  →  servicios/[slug].astro
├── antecedentes-index-v4.html → antecedentes/index.astro
├── antecedente-single-v4.html → antecedentes/[id]/[slug].astro
├── sectores-v4.html         →  sectores/index.astro
├── sector-single-v4.html    →  sectores/[slug].astro (ej: aeropuertos)
├── nosotros-v4.html         →  nosotros.astro
└── contacto-v4.html         →  contacto.astro
```

---

## Pasos de Implementación

### 1. Backup del sitio actual
```bash
cd /root/fumbling-field
git checkout -b backup/pre-v4-$(date +%Y%m%d)
git add -A && git commit -m "Backup pre-V4 implementation"
git push origin backup/pre-v4-$(date +%Y%m%d)
```

### 2. Crear rama de feature
```bash
git checkout develop
git pull origin develop
git checkout -b feature/v4-templates
```

### 3. Convertir HTML → Astro
Para cada archivo:
1. Extraer el `<head>` → `Layout.astro`
2. Extraer navbar → `components/Navbar.astro`
3. Extraer footer → `components/Footer.astro`
4. Convertir contenido estático a componentes
5. Conectar con Directus para datos dinámicos

### 4. Testear en local
```bash
npm run dev
# Verificar en:
# - iPhone SE (375px)
# - iPhone 14 (390px)
# - iPad (768px)
# - Desktop (1280px)
```

### 5. Deploy gradual
```bash
git add -A
git commit -m "feat: Implement V4 templates with mobile-first design"
git push origin feature/v4-templates
# Crear PR a develop
# Merge y testear en staging
# Crear PR a master para producción
```

---

## Dependencias Externas

```html
<!-- CDN Tailwind (desarrollo) - Reemplazar con build en producción -->
<script src="https://cdn.tailwindcss.com"></script>

<!-- Google Fonts -->
<link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600;700&display=swap">

<!-- Lucide Icons -->
<script src="https://unpkg.com/lucide@latest"></script>
```

### Para Producción
- Instalar Tailwind localmente: `npm install tailwindcss`
- Configurar purge en `tailwind.config.js`
- Usar `@astrojs/tailwind` integration

---

## Colores del Sistema

```javascript
// tailwind.config.js
colors: {
  'um-primary': '#0ea5e9',      // Azul celeste principal
  'um-primary-dark': '#0284c7',
  'um-primary-light': '#38bdf8',
  'um-primary-bg': '#f0f9ff',
  'um-accent': '#dc2626',        // Rojo CTAs
  'um-accent-dark': '#b91c1c',
  'um-dark': '#111827',          // Fondos oscuros
  'um-slate': '#1e293b',
  'um-gray': '#6b7280',
  'um-gray-light': '#f3f4f6'
}
```

---

## Checklist Pre-Deploy

- [ ] Todos los links internos actualizados (quitar `-v4.html`)
- [ ] Imágenes optimizadas y URLs correctas
- [ ] Formulario de contacto conectado a backend
- [ ] Meta tags SEO actualizados
- [ ] Favicon correcto
- [ ] Analytics configurado
- [ ] Testear menú hamburguesa en dispositivos reales
- [ ] Verificar sin scroll horizontal en móvil
- [ ] Lighthouse score > 90 en mobile

---

## Contacto

Si hay problemas durante la implementación, revisar:
- `CLAUDE.md` - Documentación del proyecto
- `REGLAS_ARQUITECTURA_SERVIDOR.md` - Reglas de producción
