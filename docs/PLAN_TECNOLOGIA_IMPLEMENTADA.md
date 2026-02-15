# Plan: Tecnología Implementada con Productos Reales

## Objetivo
Mostrar imágenes de **productos reales** del servicio relacionado en la sección "Tecnología Implementada" de cada Antecedente Single.

---

## Mapeo de Áreas → Servicios

| Área del Antecedente | Service ID | Servicio | Productos Disponibles |
|---------------------|------------|----------|----------------------|
| Servicios de Telecomunicaciones | 103 | Telecomunicaciones | 6 productos |
| Comunicaciones y Telecomunicaciones | 103 | Telecomunicaciones | 6 productos |
| Electrónica y Comunicaciones | 103 | Telecomunicaciones | 6 productos |
| Redes Informáticas | 101 | Infraestructura de Redes | 8 productos |
| Redes de Cableado Estructurado | 101 | Infraestructura de Redes | 8 productos |
| Redes de Fibra Óptica | 101 | Infraestructura de Redes | 8 productos |
| Seguridad Informática | 102 | Seguridad Electrónica | 6 productos |
| Seguridad Digital | 102 | Seguridad Electrónica | 6 productos |
| Videovigilancia en Circuito Cerrado | 102 | Seguridad Electrónica | 6 productos |
| Soporte TIC | 105 | Soporte 24/7 | 5 productos |
| Soporte Técnico | 105 | Soporte 24/7 | 5 productos |

---

## Ejemplo Visual: Antecedente de "Redes Informáticas"

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│  │ Tecnología Implementada                                                  │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │
│  │                 │  │                 │  │                 │             │
│  │   [IMAGEN]      │  │   [IMAGEN]      │  │   [IMAGEN]      │             │
│  │   1.1.png       │  │   1.2.png       │  │   1.3.png       │             │
│  │   Fibra Óptica  │  │   Patch Panel   │  │   Cableado      │             │
│  │                 │  │                 │  │   Estructurado  │             │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘             │
│                                                                             │
│  Productos de: Infraestructura de Redes (ID 101)                           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Ejemplo Visual: Antecedente de "Seguridad" (incluye Detección de Incendios)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│  │ Tecnología Implementada                                                  │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │
│  │                 │  │                 │  │                 │             │
│  │   [IMAGEN]      │  │   [IMAGEN]      │  │   [IMAGEN]      │             │
│  │   2.1.png       │  │   2.2.png       │  │   2.4.png       │             │
│  │   CCTV IP       │  │   Control de    │  │   Detección     │             │
│  │   Profesional   │  │   Acceso        │  │   Incendios     │             │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘             │
│                                                                             │
│  Productos de: Seguridad Electrónica (ID 102)                              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Diseño Mejorado con Tooltips

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  ─── Tecnología Implementada ───────────────────────────────────────────    │
│                                                                             │
│  ┌───────────────────────┐  ┌───────────────────────┐  ┌──────────────────┐│
│  │                       │  │                       │  │                  ││
│  │      [IMAGEN]         │  │      [IMAGEN]         │  │    [IMAGEN]      ││
│  │                       │  │                       │  │                  ││
│  │                       │  │                       │  │                  ││
│  ├───────────────────────┤  ├───────────────────────┤  ├──────────────────┤│
│  │ Fibra Óptica Alta     │  │ Centro Distribución   │  │ Cableado         ││
│  │ Capacidad             │  │ de Red                │  │ Estructurado     ││
│  │                       │  │                       │  │ Certificado      ││
│  │ ✓ Hasta 100 Gbps      │  │ ✓ Gestión fácil       │  │ ✓ Garantía 25    ││
│  │ ✓ Sin interferencias  │  │ ✓ Expansión simple    │  │   años           ││
│  └───────────────────────┘  └───────────────────────┘  └──────────────────┘│
│                                                                             │
│  Ver servicio completo: Infraestructura de Redes →                         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Implementación Técnica

### 1. Crear mapeo de áreas a servicios

```javascript
// src/data/areaToServiceMap.js

export const areaToServiceMap = {
  // Telecomunicaciones → 103
  'Servicios de Telecomunicaciones': 103,
  'Comunicaciones y Telecomunicaciones': 103,
  'Electrónica y Comunicaciones': 103,

  // Redes → 101
  'Redes Informáticas': 101,
  'Redes de Cableado Estructurado': 101,
  'Redes de Fibra Óptica': 101,

  // Seguridad → 102
  'Seguridad Informática': 102,
  'Seguridad Digital': 102,
  'Videovigilancia en Circuito Cerrado': 102,

  // Soporte → 105
  'Soporte TIC': 105,
  'Soporte Técnico': 105,

  // Default → 101 (Infraestructura)
  'default': 101
};

export function getServiceIdFromArea(area) {
  return areaToServiceMap[area] || areaToServiceMap['default'];
}
```

### 2. Función para obtener productos del servicio

```javascript
// En antecedentes/[id]/[slug].astro

import { serviciosCompletos } from '../../../data/servicios_completos_v4.js';
import { getServiceIdFromArea } from '../../../data/areaToServiceMap.js';

const getProductsForArea = (area) => {
  const serviceId = getServiceIdFromArea(area);
  const servicio = serviciosCompletos[serviceId];

  if (!servicio || !servicio.Productos) {
    return [];
  }

  // Retornar los primeros 3 productos con sus imágenes
  return servicio.Productos.slice(0, 3).map(p => ({
    imagen: p.imagen,
    titulo: p.titulo,
    features: p.features?.slice(0, 2) || []
  }));
};
```

### 3. Componente actualizado

```astro
<!-- Tecnología Implementada Section -->
{products.length > 0 && (
  <div class="flex flex-col gap-4 sm:gap-5">
    <div class="flex items-center gap-3">
      <div class="w-1 h-5 sm:h-6 bg-um-primary rounded-sm"></div>
      <h2 class="text-lg sm:text-xl lg:text-[22px] font-bold text-gray-900">
        Tecnología Implementada
      </h2>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {products.map((product) => (
        <div class="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 group">
          <div class="aspect-[4/3] overflow-hidden">
            <img
              src={product.imagen}
              alt={product.titulo}
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          </div>
          <div class="p-4">
            <h4 class="font-semibold text-gray-900 text-sm mb-2">{product.titulo}</h4>
            <ul class="space-y-1">
              {product.features.map(f => (
                <li class="flex items-center gap-2 text-xs text-gray-600">
                  <svg class="w-3 h-3 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                  </svg>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ))}
    </div>

    <!-- Link al servicio -->
    <a href={`/servicios/${serviceId}/${generateSlug(servicio.Titulo)}`}
       class="inline-flex items-center gap-2 text-um-primary font-semibold text-sm hover:underline">
      Ver servicio completo: {servicio.Titulo}
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
      </svg>
    </a>
  </div>
)}
```

---

## Rutas de Imágenes de Productos

### Infraestructura de Redes (101)
```
/images/services/productos/infraestructura/1.1.png - Fibra Óptica
/images/services/productos/infraestructura/1.2.png - Patch Panel
/images/services/productos/infraestructura/1.3.png - Cableado Estructurado
/images/services/productos/infraestructura/1.4.png - Switching
/images/services/productos/infraestructura/1.5.png - Data Center
/images/services/productos/infraestructura/1.6.png - Radioenlaces
/images/services/productos/infraestructura/1.7.png - Certificación Fluke
/images/services/productos/infraestructura/1.8.png - ODF Fibra
```

### Seguridad Electrónica (102)
```
/images/services/productos/seguridad/2.1.png - CCTV IP
/images/services/productos/seguridad/2.2.png - Control de Acceso
/images/services/productos/seguridad/2.3.png - Detección Intrusión
/images/services/productos/seguridad/2.4.png - Detección Incendios  ← Para antecedentes de incendios
/images/services/productos/seguridad/2.5.png - Integración Sistemas
/images/services/productos/seguridad/2.6.png - Centro Monitoreo
```

### Telecomunicaciones (103)
```
/images/services/productos/telecom/3.1.png - Central Telefónica
/images/services/productos/telecom/3.2.png - Videoconferencia
/images/services/productos/telecom/3.3.png - VoIP
/images/services/productos/telecom/3.4.png - Telefonía IP
/images/services/productos/telecom/3.5.png - Radiocomunicaciones
/images/services/productos/telecom/3.6.png - Comunicaciones Unificadas
```

---

## Resultado Esperado

**ANTES (Imágenes genéricas de stock):**
```
[Imagen Unsplash]  [Imagen Unsplash]  [Imagen Unsplash]
```

**DESPUÉS (Productos reales del servicio):**
```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ Fibra Óptica    │  │ Patch Panel     │  │ Cableado Cat6   │
│ [Foto real]     │  │ [Foto real]     │  │ [Foto real]     │
│                 │  │                 │  │                 │
│ ✓ 100 Gbps      │  │ ✓ Gestión fácil │  │ ✓ Certificado   │
│ ✓ 80km alcance  │  │ ✓ Expandible    │  │ ✓ 25 años gtía  │
└─────────────────┘  └─────────────────┘  └─────────────────┘

Ver servicio completo: Infraestructura de Redes →
```

---

## Próximos Pasos

1. ✅ Crear `src/data/areaToServiceMap.js`
2. ✅ Actualizar `src/pages/antecedentes/[id]/[slug].astro`
3. ⏳ Verificar que las imágenes de productos existen en producción
4. ⏳ Probar con diferentes antecedentes de cada área
