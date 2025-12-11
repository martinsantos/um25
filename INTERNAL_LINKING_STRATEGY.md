# Estrategia de Internal Linking - ULTIMA MILLA

## 1. ARQUITECTURA DE LINKING

### 1.1 Estructura Jerárquica

```
Homepage (/)
├── /servicios (página hub)
│   ├── /servicios/[id]/[slug] (páginas individuales)
│   └── Links a sectores relevantes
├── /antecedentes (página hub)
│   ├── /antecedentes/[id]/[slug] (casos de estudio)
│   └── Related projects
├── /seguridad-electronica (sector hub)
├── /mineria (sector hub)
├── /software (sector hub)
└── /nosotros, /contacto (supportive pages)
```

---

## 2. ESTRATEGIA POR PÁGINA

### 2.1 Homepage (/)

**Objetivo:** Autoridad + Navegación

**Links internos estratégicos:**

```markdown
### Servicios Principales
- [Servicios IT Integrales](/servicios) - anchor: "Ver todos nuestros servicios"
- [Redes de Datos](/servicios/2/redes-de-datos) - anchor: "Diseño de redes"
- [Detección de Incendio](/seguridad-electronica) - anchor: "Sistemas de seguridad"
- [Desarrollo de Software](/software) - anchor: "Soluciones personalizadas"

### Casos de Éxito Destacados
- [+469 proyectos](/antecedentes) - anchor: "Explora nuestro portfolio"
- [Proyectos en minería](/antecedentes?area=Telecomunicaciones) - anchor: "Ver proyectos similares"

### Por Sector
- [Para Minería](/mineria)
- [Para Bodegas](/bodegas)
- [Para Constructoras](/constructoras)
- [Para Aeropuertos](/aeropuertos)
```

**Distribución de PageRank:** 5-8 links internos principales

---

### 2.2 Página de Servicios (/servicios)

**Objetivo:** Hub de servicios + Distribución de autoridad

**Links internos:**

```markdown
### Links a Servicios Detallados
[ID 1] Servicios IT
- [Ver details](/servicios/1/servicios-it)
- Links relacionados: minería, bodegas, constructoras

[ID 2] Redes de Datos
- [Ver details](/servicios/2/redes-de-datos)
- Links relacionados: cableado estructurado, minería

[ID 9] CCTV y Seguridad
- [Ver details](/servicios/9/ciberseguridad-cctv)
- Links relacionados: detección incendio, aeropuertos

### Links a Sectores
- [Soluciones para Minería](/mineria)
- [Soluciones para Bodegas](/bodegas)
- [Soluciones para Constructoras](/constructoras)

### Links a Casos de Estudio
- [+50 proyectos en telecomunicaciones](/antecedentes?area=Telecomunicaciones)
- [+30 proyectos en redes](/antecedentes?area=Redes)
```

**Distribución de PageRank:** 15-20 links contextuales

---

### 2.3 Página de Antecedentes (/antecedentes)

**Objetivo:** Hub de portfolio + Filtrado inteligente

**Links internos NUEVOS a implementar:**

```markdown
### Filtros con Links Internos
Por Área:
- [Telecomunicaciones (150 proyectos)](/antecedentes?area=Telecomunicaciones)
- [Redes Informáticas (80 proyectos)](/antecedentes?area=Redes)
- [Software/Servicios (60 proyectos)](/antecedentes?area=Software)
- [Corrientes Débiles (40 proyectos)](/antecedentes?area=Corrientes%20Débiles)
- [Detección de Incendio (25 proyectos)](/antecedentes?area=Detección)

Por Sector:
- [Proyectos Minería (90)](/antecedentes?unidad_negocio=Minería)
- [Proyectos Bodegas (75)](/antecedentes?unidad_negocio=Bodegas)
- [Proyectos Constructoras (60)](/antecedentes?unidad_negocio=Constructoras)
- [Proyectos Aeropuertos (50)](/antecedentes?unidad_negocio=Aeropuertos)

### Links a Sector Pages
- [Descubre soluciones para Minería](/mineria)
- [Descubre soluciones para Bodegas](/bodegas)
- [Descubre soluciones para Constructoras](/constructoras)

### Links Contextuales
- Mostrar "3 Proyectos Similares" basados en:
  - Misma Area de servicio
  - Mismo sector/cliente
```

**Distribución de PageRank:** 20+ links estratégicos

---

### 2.4 Páginas Individuales de Antecedentes (/antecedentes/[id]/[slug])

**Objetivo:** Linkage de proyecto + Contexto relacionado

**Links internos NUEVOS a implementar:**

```markdown
### Links Contextuales por Proyecto
[Ejemplo: ISI Solutions - Redes y comunicaciones]

Servicio Principal:
- [Redes de Datos Empresariales](/servicios/2/redes-de-datos)
  Anchor: "Conoce nuestros servicios de {{Area}}"

Sector:
- [Soluciones para {{Sector}}](/{{sector-slug}})
  Anchor: "Más soluciones para {{Sector}}"

Servicios Relacionados (automático basado en Area):
- Si Area = "Telecomunicaciones":
  - [Telefonía IP](/servicios/4/telefonia)
  - [Servicios de Telecomunicaciones](/servicios)

Proyectos Similares (automático):
- [Proyecto 1 - Mismo Area](/antecedentes/xxx/yyy)
  Anchor: "Otro proyecto en {{Area}}"
- [Proyecto 2 - Mismo Sector](/antecedentes/yyy/zzz)
  Anchor: "Más proyectos en {{Sector}}"
- [Proyecto 3 - Mismo Cliente](/antecedentes/zzz/www)
  Anchor: "Más trabajos para {{Cliente}}"

Navegación:
- [Ver todos los casos de estudio](/antecedentes)
  Anchor: "Volver al portfolio completo"
- [Filtrar por {{Area}}](/antecedentes?area={{Area}})
  Anchor: "Ver otros proyectos de {{Area}}"

Call-to-Action:
- [Solicita tu consulta gratuita](/contacto)
  Anchor: "¿Necesitas una solución similar?"
```

**Distribución de PageRank:** 8-12 links por página

---

### 2.5 Páginas de Sectores (/mineria, /bodegas, /constructoras, etc.)

**Objetivo:** Autoridad sectorial + Linkage a servicios y casos

**Links internos:**

```markdown
### Servicios para este Sector
- [Redes de Datos](/servicios/2/redes-de-datos)
  Anchor: "Infraestructura de redes para {{Sector}}"
- [Telecomunicaciones](/servicios)
  Anchor: "Comunicaciones empresariales"
- [Seguridad Electrónica](/seguridad-electronica)
  Anchor: "Sistemas de seguridad integrados"

### Casos de Éxito Específicos
- [Ver 90 proyectos en {{Sector}}](/antecedentes?unidad_negocio={{Sector}})
  Anchor: "Nuestros trabajos en {{Sector}}"
- [Caso 1: Proyecto X](/antecedentes/xxx/xxx)
  Anchor: "Caso de éxito: [Nombre Proyecto]"
- [Caso 2: Proyecto Y](/antecedentes/yyy/yyy)
  Anchor: "Infraestructura para [Empresa]"

### Sectores Relacionados
Si Minería:
- [Soluciones para Construcción](/constructoras)
  Anchor: "Soluciones para sectores similares"

Si Bodegas:
- [Soluciones para Constructoras](/constructoras)
  Anchor: "Casos en logística industrial"

### CTA
- [Consulta nuestros servicios completos](/servicios)
  Anchor: "Descubre más soluciones"
- [Contacta a nuestro equipo](/contacto)
  Anchor: "Solicita asesoramiento gratuito"
```

**Distribución de PageRank:** 8-10 links

---

## 3. PATRONES DE LINKING AUTOMÁTICO

### 3.1 Recomendaciones de Proyectos Similares

**Componente a crear:** `RelatedProjects.astro`

```javascript
// Lógica de recomendación
const getRelatedProjects = (currentProject, allProjects) => {
  // Peso de criterios
  const weights = {
    sameArea: 3,        // Misma Area = 3 puntos
    sameSector: 2,      // Mismo sector = 2 puntos
    sameClient: 1       // Mismo cliente = 1 punto
  };

  return allProjects
    .filter(p => p.id !== currentProject.id)
    .map(p => ({
      project: p,
      score:
        (p.Area === currentProject.Area ? weights.sameArea : 0) +
        (p.Unidad_de_negocio === currentProject.Unidad_de_negocio ? weights.sameSector : 0) +
        (p.Cliente === currentProject.Cliente ? weights.sameClient : 0)
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)  // Top 3 relacionados
    .map(r => r.project);
};
```

**Implementación en template:**

```astro
---
const relatedProjects = getRelatedProjects(antecedente, allAntecedentes);
---

{relatedProjects.length > 0 && (
  <section class="related-projects">
    <h3>Proyectos Relacionados</h3>
    <ul>
      {relatedProjects.map(project => (
        <li>
          <a href={`/antecedentes/${project.id}/${generateSlug(project.Titulo)}`}>
            {project.Titulo}
          </a>
          <span class="meta">{project.Area} • {project.Cliente}</span>
        </li>
      ))}
    </ul>
  </section>
)}
```

---

### 3.2 Links a Servicios Dinámicos

**En cada antecedente, linkear al servicio correspondiente:**

```javascript
// Mapeo Area → Service ID
const areaToServiceMap = {
  'Telecomunicaciones': [4, 2],  // IDs 4 (Telefonía) y 2 (Redes)
  'Redes Informáticas': [2, 6],  // IDs 2 (Redes) y 6 (Servicios Web)
  'Software': [6],               // ID 6 (Servicios Web)
  'Corrientes Débiles': [9],     // ID 9 (Ciberseguridad)
  'Detección de Incendio': [9],  // ID 9
  'Seguridad': [9]               // ID 9
};

const getServiceLinks = (area) => {
  return areaToServiceMap[area] || [];
};
```

---

## 4. IMPLEMENTACIÓN TÉCNICA

### 4.1 Cambios en Componentes

**Archivo:** `src/components/antecedentes/AntecedenteServicios.astro` (nuevo/modificado)

```astro
---
import { serviciosReales } from '../../data/servicios_reales_db.js';

interface Props {
  area: string;
  cliente: string;
}

const { area, cliente } = Astro.props;

// Obtener servicios relacionados por Area
const serviciosRelacionados = serviciosReales.filter(s =>
  s.Area === area || s.Descripcion.includes(area)
).slice(0, 3);
---

<section class="servicios-relacionados">
  <h3>Servicios Relacionados</h3>
  <div class="servicios-grid">
    {serviciosRelacionados.map(servicio => (
      <div class="servicio-card">
        <h4>
          <a href={`/servicios/${servicio.id}/${generateSlug(servicio.Titulo)}`}>
            {servicio.Titulo}
          </a>
        </h4>
        <p>{servicio.Descripcion.substring(0, 100)}...</p>
      </div>
    ))}
  </div>
</section>

<style>
  .servicios-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1rem;
  }

  .servicio-card {
    padding: 1rem;
    border: 1px solid #ddd;
    border-radius: 8px;
    transition: all 0.3s ease;
  }

  .servicio-card:hover {
    border-color: #0066cc;
    background: #f9f9f9;
  }

  .servicio-card h4 a {
    color: #0066cc;
    text-decoration: none;
  }

  .servicio-card h4 a:hover {
    text-decoration: underline;
  }
</style>
```

---

### 4.2 Cambios en Páginas de Antecedentes

**Archivo:** `src/pages/antecedentes/[id]/[slug].astro`

```astro
// Agregar al frontmatter
import AntecedenteServicios from '../../../components/antecedentes/AntecedenteServicios.astro';
import RelatedProjects from '../../../components/antecedentes/RelatedProjects.astro';

// En el JSX:
<section>
  <AntecedenteServicios area={antecedente.Area} cliente={antecedente.Cliente} />
  <RelatedProjects currentProject={antecedente} allProjects={allAntecedentes} />
</section>
```

---

## 5. ANCHOR TEXT STRATEGY

### 5.1 Tipos de Anchor Text

| Tipo | Ejemplo | Uso |
|------|---------|-----|
| Branded | "ULTIMA MILLA" | 10% |
| Exact Match | "Redes de Datos Mendoza" | 20% |
| Partial Match | "Servicios de redes" | 30% |
| Generic | "Aprende más", "Ver detalles" | 25% |
| URL | `/servicios/2/redes-de-datos` | 15% |

**Distribución Natural en Antecedentes:**
- "Conoce nuestros servicios de [Area]" → Exact Match
- "Más trabajos en [Sector]" → Partial Match
- "Contacta a nuestro equipo" → Generic
- "Ver otros casos similares" → Generic

---

### 5.2 Keywords en Anchor Text

**No hacer (Black Hat):**
- ❌ 20+ links con mismo anchor exacto
- ❌ Anchor text sin relación al contenido
- ❌ Anchor text oculto (color blanco, font-size:0)

**Hacer (White Hat):**
- ✅ Variación natural de anchor text
- ✅ Anchor relevante al contenido
- ✅ Mezcla de branded, exact match, partial match
- ✅ Links contextuales integrados

---

## 6. IMPLEMENTACIÓN ROADMAP

### Fase 1: Infraestructura (Semana 1)
- [ ] Crear componentes de linking automático
- [ ] Implementar Related Projects component
- [ ] Crear AntecedenteServicios component

### Fase 2: Antecedentes (Semana 2)
- [ ] Agregar links a servicios en cada antecedente
- [ ] Implementar "Proyectos Similares"
- [ ] Agregar links de vuelta a filtros de antecedentes

### Fase 3: Páginas de Sectores (Semana 3)
- [ ] Implementar links a casos por sector
- [ ] Agregar links a servicios relacionados
- [ ] Crear navegación entre sectores

### Fase 4: Testing y Optimización (Semana 4)
- [ ] Validar con Screaming Frog
- [ ] Revisar distribución de PageRank
- [ ] Optimizar anchor text si es necesario

---

## 7. HERRAMIENTAS DE VALIDACIÓN

### Validar con Screaming Frog

```bash
# Descargar reportes de links
1. Tools > Extract > All Links
2. Filtrar por internal links
3. Revisar que cada antecedente tenga 8+ links

# Generar mapa de link structure
Tools > Site Crawl > Internal Links Report
```

### PageRank Flow

```
Homepage (100 points)
├── /servicios (15 points)
├── /antecedentes (15 points)
├── /seguridad-electronica (10 points)
├── /mineria (10 points)
└── Other pages (50 points spread)
```

---

## 8. MONITOREO POST-IMPLEMENTACIÓN

**Métricas a trackear (mes a mes):**

| Métrica | Objetivo M1 | Objetivo M2 | Objetivo M3 |
|---------|-----------|-----------|-----------|
| Links internos (total) | 500 | 1000 | 1500 |
| Links a antecedentes | 100 | 250 | 400 |
| Links a servicios | 75 | 150 | 250 |
| CTR desde links internos | 1% | 2% | 3%+ |
| Bounce rate antecedentes | <60% | <50% | <45% |

---

**Última Actualización:** 2025-12-11
**Versión:** 1.0
**Estado:** Listo para implementación
