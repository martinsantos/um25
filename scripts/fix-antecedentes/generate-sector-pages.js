#!/usr/bin/env node

/**
 * Generate Updated Sector Pages - Directus-only with ProjectCard
 *
 * This script generates updated versions of all sector pages using:
 * - Directus-only queries (no JS fallback)
 * - ProjectCard component for consistent display
 * - getDirectusImageUrl() for images
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Sector configurations
const sectors = {
  bodegas: {
    name: 'Bodegas',
    emoji: '🍷',
    heroImage: 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=1920&q=80',
    description: 'Soluciones tecnológicas especializadas para la industria vitivinícola argentina.',
    keywords: ['bodega', 'vino', 'viñedo', 'enología', 'vitivinicola', 'catena', 'trapiche', 'norton', 'luigi bosca', 'zuccardi'],
    color: 'purple',
    seoTitle: 'Tecnología para Bodegas | Mendoza, Cuyo y Patagonia | ULTIMA MILLA',
    seoDescription: 'Servicios tecnológicos para bodegas argentinas. Redes, seguridad, control de accesos y soluciones IT para la industria vitivinícola.',
    seoKeywords: 'tecnologia bodegas mendoza, sistemas vitivinicolas, redes bodegas cuyo',
  },
  constructoras: {
    name: 'Constructoras',
    emoji: '🏗️',
    heroImage: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1920&q=80',
    description: 'Infraestructura tecnológica para proyectos de construcción y desarrollos inmobiliarios.',
    keywords: ['construcción', 'obra', 'edificio', 'constructora', 'inmobiliaria', 'desarrollo', 'infraestructura'],
    color: 'orange',
    seoTitle: 'Tecnología para Constructoras | Mendoza, Cuyo y Patagonia | ULTIMA MILLA',
    seoDescription: 'Servicios tecnológicos para constructoras. Redes temporales de obra, seguridad en construcción, comunicaciones en proyectos.',
    seoKeywords: 'tecnologia construccion mendoza, redes obras cuyo, seguridad constructoras',
  },
  aeropuertos: {
    name: 'Aeropuertos',
    emoji: '✈️',
    heroImage: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1920&q=80',
    description: 'Sistemas críticos de comunicaciones y seguridad para aeropuertos y aviación.',
    keywords: ['aeropuerto', 'aéreo', 'aviación', 'terminal', 'vuelo', 'orsna', 'anac'],
    color: 'sky',
    seoTitle: 'Tecnología para Aeropuertos | Mendoza, Cuyo y Patagonia | ULTIMA MILLA',
    seoDescription: 'Servicios tecnológicos para aeropuertos. Redes críticas, seguridad aeroportuaria, sistemas de comunicaciones.',
    seoKeywords: 'tecnologia aeropuertos mendoza, sistemas aviacion cuyo, seguridad aeroportuaria',
  },
  industria: {
    name: 'Industria',
    emoji: '🏭',
    heroImage: 'https://images.unsplash.com/photo-1587293852726-70cdb56c2866?w=1920&q=80',
    description: 'Soluciones IT robustas para ambientes industriales y manufactureros.',
    keywords: ['industria', 'industrial', 'manufactura', 'planta', 'fabrica', 'produccion'],
    color: 'slate',
    seoTitle: 'Tecnología para Industria | Mendoza, Cuyo y Patagonia | ULTIMA MILLA',
    seoDescription: 'Servicios tecnológicos para industrias. Redes industriales, seguridad en plantas, automatización IT.',
    seoKeywords: 'tecnologia industrial mendoza, redes plantas cuyo, automatizacion industria',
  },
  mineria: {
    name: 'Minería',
    emoji: '⛏️',
    heroImage: 'https://images.unsplash.com/photo-1611448746698-e06c1a9e4fd0?w=1920&q=80',
    description: 'Infraestructura tecnológica especializada para operaciones mineras.',
    keywords: ['minería', 'minera', 'mina', 'extracción', 'minero', 'yacimiento'],
    color: 'amber',
    seoTitle: 'Tecnología para Minería | Mendoza, Cuyo y Patagonia | ULTIMA MILLA',
    seoDescription: 'Servicios tecnológicos para minería. Comunicaciones en minas, redes remotas, seguridad minera.',
    seoKeywords: 'tecnologia mineria mendoza, comunicaciones minas cuyo, redes yacimientos',
  },
  software: {
    name: 'Software',
    emoji: '💻',
    heroImage: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=1920&q=80',
    description: 'Desarrollo de software a medida y soluciones digitales personalizadas.',
    keywords: ['software', 'desarrollo', 'aplicación', 'sistema', 'app', 'programacion', 'web'],
    color: 'blue',
    seoTitle: 'Desarrollo de Software | Mendoza, Cuyo y Patagonia | ULTIMA MILLA',
    seoDescription: 'Desarrollo de software a medida. Aplicaciones web, móviles, sistemas de gestión y soluciones digitales.',
    seoKeywords: 'desarrollo software mendoza, aplicaciones cuyo, programacion patagonia',
  },
  gobiernosectorpublico: {
    name: 'Gobierno y Sector Público',
    emoji: '🏛️',
    heroImage: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=1920&q=80',
    description: 'Soluciones tecnológicas para organismos gubernamentales y sector público.',
    keywords: ['gobierno', 'municipal', 'público', 'estado', 'municipio', 'ministerio', 'provincia'],
    color: 'emerald',
    seoTitle: 'Tecnología para Gobierno | Mendoza, Cuyo y Patagonia | ULTIMA MILLA',
    seoDescription: 'Servicios tecnológicos para sector público. Redes gubernamentales, seguridad institucional, e-government.',
    seoKeywords: 'tecnologia gobierno mendoza, sistemas municipales cuyo, e-government patagonia',
  },
  'seguridad-electronica': {
    name: 'Seguridad Electrónica',
    emoji: '🔒',
    heroImage: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=1920&q=80',
    description: 'Sistemas integrados de seguridad electrónica y vigilancia.',
    keywords: ['seguridad', 'vigilancia', 'cctv', 'alarma', 'control acceso', 'biometrico', 'monitoreo'],
    color: 'red',
    seoTitle: 'Seguridad Electrónica | Mendoza, Cuyo y Patagonia | ULTIMA MILLA',
    seoDescription: 'Sistemas de seguridad electrónica. CCTV, control de accesos, alarmas, videovigilancia y monitoreo 24/7.',
    seoKeywords: 'seguridad electronica mendoza, cctv cuyo, alarmas patagonia',
  },
};

// Template generator function
function generateSectorPage(sectorKey, config) {
  return `---
/**
 * ${config.name} Sector Page - V4 Design System
 * Updated: Uses Directus-only queries, no fallback to JS data
 */

import LayoutV4 from '../layouts/LayoutV4.astro';
import ProjectCard from '../components/ProjectCard.astro';
import { generateSlug } from '../utils/slugUtils.js';
import { getClient } from '../lib/directus';
import { readItems } from '@directus/sdk';

// Helper function to get Directus image URL
function getDirectusImageUrl(imageId: string | null | undefined): string {
  if (!imageId) {
    return 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80';
  }
  const directusUrl = import.meta.env.PUBLIC_DIRECTUS_URL || 'http://localhost:8055';
  return \`\${directusUrl}/assets/\${imageId}\`;
}

const sectorConfig = {
  name: '${config.name}',
  emoji: '${config.emoji}',
  heroImage: '${config.heroImage}',
  description: '${config.description}',
  keywords: ${JSON.stringify(config.keywords)},
};

const seoConfig = {
  title: '${config.seoTitle}',
  description: '${config.seoDescription}',
  keywords: '${config.seoKeywords}',
};

// Fetch antecedentes from Directus ONLY
let antecedentes: any[] = [];
try {
  const client = getClient();
  const allAntecedentes = await client.request(
    readItems('antecedentes', {
      filter: {
        status: { _eq: 'published' }
      },
      fields: ['id', 'Nombre', 'Titulo', 'Cliente', 'Descripcion', 'Area', 'imagen', 'Fecha', 'Unidad_de_negocio'],
      limit: 500
    })
  );

  // Filter by sector keywords
  antecedentes = allAntecedentes
    .filter(item => {
      const texto = \`\${item.Cliente || ''} \${item.Titulo || ''} \${item.Area || ''} \${item.Descripcion || ''} \${item.Nombre || ''}\`.toLowerCase();
      return sectorConfig.keywords.some(k => texto.includes(k.toLowerCase()));
    })
    .slice(0, 6)
    .map(item => ({
      ...item,
      slug: generateSlug(item.Titulo || item.Nombre || 'proyecto'),
      imageUrl: getDirectusImageUrl(item.imagen)
    }));

  console.log(\`[${config.name.toUpperCase()}] Found \${antecedentes.length} antecedentes from Directus\`);
} catch (error) {
  console.error('[${config.name.toUpperCase()}] Error fetching from Directus:', error);
}

const serviciosRelacionados = [
  { id: 101, nombre: 'Infraestructura de Redes', descripcion: 'Cableado estructurado y redes empresariales' },
  { id: 102, nombre: 'Seguridad Electrónica', descripcion: 'CCTV, alarmas y control de accesos' },
  { id: 104, nombre: 'Telecomunicaciones', descripcion: 'Telefonía IP y comunicaciones' },
];
---

<LayoutV4 title={seoConfig.title} description={seoConfig.description} keywords={seoConfig.keywords}>
  <section class="relative bg-um-dark pt-20 sm:pt-24 pb-8 sm:pb-12 lg:pb-16 overflow-hidden">
    <div class="absolute inset-0 opacity-40" style={\`background-image: url('\$\{sectorConfig.heroImage\}'); background-position: center; background-size: cover;\`}></div>
    <div class="absolute inset-0 bg-gradient-to-b from-um-dark/70 to-um-dark/90"></div>

    <div class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center gap-2 mb-4 sm:mb-6">
        <a href="/" class="text-white/60 hover:text-white text-xs sm:text-sm transition-colors">Inicio</a>
        <svg class="w-4 h-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
        <a href="/sectores" class="text-white/60 hover:text-white text-xs sm:text-sm transition-colors">Sectores</a>
        <svg class="w-4 h-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
        <span class="text-white text-xs sm:text-sm">{sectorConfig.name}</span>
      </div>

      <div class="max-w-3xl">
        <h1 class="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-white leading-tight mb-4 sm:mb-6">
          <span class="inline-block mr-2 sm:mr-3">{sectorConfig.emoji}</span>
          {sectorConfig.name}
        </h1>
        <p class="text-base sm:text-lg lg:text-xl text-white/90 mb-6 sm:mb-8">{sectorConfig.description}</p>
        <div class="flex flex-wrap items-center gap-3 sm:gap-4">
          <div class="bg-white/10 backdrop-blur-sm rounded-xl p-4 sm:p-5 text-center border border-white/20 min-w-[100px] sm:min-w-[120px]">
            <div class="text-2xl sm:text-3xl font-extrabold text-white">{antecedentes.length}+</div>
            <div class="text-xs sm:text-sm text-white/70 mt-1">Proyectos</div>
          </div>
          <div class="bg-white/10 backdrop-blur-sm rounded-xl p-4 sm:p-5 text-center border border-white/20 min-w-[100px] sm:min-w-[120px]">
            <div class="text-2xl sm:text-3xl font-extrabold text-white">99.9%</div>
            <div class="text-xs sm:text-sm text-white/70 mt-1">Uptime</div>
          </div>
          <div class="bg-white/10 backdrop-blur-sm rounded-xl p-4 sm:p-5 text-center border border-white/20 min-w-[100px] sm:min-w-[120px]">
            <div class="text-2xl sm:text-3xl font-extrabold text-white">24/7</div>
            <div class="text-xs sm:text-sm text-white/70 mt-1">Soporte</div>
          </div>
        </div>
      </div>
    </div>
  </section>

  {antecedentes.length > 0 && (
    <section class="py-10 sm:py-14 lg:py-20 bg-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-8 sm:mb-12">
          <span class="text-${config.color}-600 font-semibold text-xs sm:text-sm uppercase tracking-wider">Casos de Éxito</span>
          <h2 class="text-2xl sm:text-3xl lg:text-4xl font-bold text-um-dark mt-3 sm:mt-4 mb-3 sm:mb-4">Proyectos en {sectorConfig.name}</h2>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {antecedentes.map((ant) => (
            <ProjectCard
              id={String(ant.id)}
              titulo={ant.Titulo || ant.Nombre || 'Proyecto'}
              cliente={ant.Cliente || ''}
              descripcion={ant.Descripcion || ''}
              fecha={ant.Fecha || new Date().toISOString()}
              area={ant.Area || ant.Unidad_de_negocio || sectorConfig.name}
              servicio={ant.Unidad_de_negocio || sectorConfig.name}
              imagen={ant.imageUrl}
              slug={ant.slug}
            />
          ))}
        </div>
      </div>
    </section>
  )}

  <section class="py-10 sm:py-14 lg:py-16 bg-gradient-to-br from-${config.color}-600 to-${config.color}-700">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
      <h2 class="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4 sm:mb-6">¿Listo para transformar su infraestructura tecnológica?</h2>
      <p class="text-base sm:text-lg text-white/90 mb-6 sm:mb-8 max-w-2xl mx-auto">Contactenos hoy para una consultoría gratuita.</p>
      <a href="/contacto" class="inline-block px-6 sm:px-8 py-3 sm:py-4 bg-white text-${config.color}-600 rounded-lg font-bold shadow-xl hover:shadow-2xl transition-all hover:scale-105">Solicitar Consultoría Gratuita</a>
    </div>
  </section>
</LayoutV4>

<style>
  .card-hover {
    transition: all 0.3s ease;
  }
  .card-hover:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 24px rgba(0,0,0,0.1);
  }
</style>
`;
}

// Generate all sector pages
console.log('🔧 Generating updated sector pages...\n');

const outputDir = path.join(__dirname, '../../src/pages');

let generated = 0;
for (const [sectorKey, config] of Object.entries(sectors)) {
  const filename = `${sectorKey}.astro`;
  const outputPath = path.join(outputDir, filename);

  const content = generateSectorPage(sectorKey, config);

  fs.writeFileSync(outputPath, content);
  console.log(`✅ Generated: ${filename}`);
  generated++;
}

console.log(`\n🎉 Successfully generated ${generated} sector pages!`);
console.log('\nUpdated pages use:');
console.log('  - Directus-only queries (no JS fallback)');
console.log('  - ProjectCard component for consistent display');
console.log('  - getDirectusImageUrl() for images');
console.log('\n✨ All sector pages are now standardized!');
