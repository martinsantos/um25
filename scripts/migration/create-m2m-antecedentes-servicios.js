#!/usr/bin/env node

/**
 * MIGRACIÓN: Crear relaciones M2M entre Antecedentes y Servicios
 *
 * Este script crea las relaciones Many-to-Many entre antecedentes y servicios
 * basándose en el mapeo existente en areaToServiceMap.js y análisis de contenido.
 *
 * El script:
 * 1. Lee todos los antecedentes de Directus
 * 2. Analiza el campo 'Descripcion' buscando palabras clave
 * 3. Mapea antecedentes a servicios según áreas/keywords
 * 4. Crea relaciones en la tabla junction 'antecedentes_servicios'
 *
 * Pre-requisitos:
 * - Relación M2M creada en Directus
 * - Tabla junction 'antecedentes_servicios' existe
 * - Antecedentes y Servicios poblados en Directus
 *
 * Uso:
 *   node scripts/migration/create-m2m-antecedentes-servicios.js
 *   node scripts/migration/create-m2m-antecedentes-servicios.js --dry-run
 *   node scripts/migration/create-m2m-antecedentes-servicios.js --limit=10  # Procesar solo 10
 */

import { createDirectus, rest, createItem, readItems } from '@directus/sdk';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

const DIRECTUS_URL = process.env.PUBLIC_DIRECTUS_URL || 'http://localhost:8055';
const DIRECTUS_TOKEN = process.env.PUBLIC_DIRECTUS_TOKEN;
const DRY_RUN = process.argv.includes('--dry-run');

const limitArg = process.argv.find(arg => arg.startsWith('--limit='));
const LIMIT = limitArg ? parseInt(limitArg.split('=')[1]) : null;

if (!DIRECTUS_TOKEN) {
  console.error('❌ Error: PUBLIC_DIRECTUS_TOKEN no configurado');
  process.exit(1);
}

const directus = createDirectus(DIRECTUS_URL).with(rest());

// ==========================================
// MAPEO DE KEYWORDS A SERVICIOS
// ==========================================

/**
 * Keywords que indican relación con cada servicio
 * Basado en análisis de contenido de antecedentes
 */
const KEYWORDS_TO_SERVICES = {
  101: { // Infraestructura de Redes
    keywords: [
      'red', 'redes', 'fibra óptica', 'cableado', 'estructurado',
      'lan', 'wan', 'switching', 'router', 'data center', 'datacenter',
      'patch panel', 'certificación fluke', 'radioenlace', 'wireless',
      'conectividad', 'backbone', 'cat6', 'cat6a', 'cat7'
    ],
    area: 'Redes'
  },
  102: { // Seguridad Electrónica
    keywords: [
      'cctv', 'cámara', 'camaras', 'videovigilancia', 'vigilancia',
      'control de acceso', 'alarma', 'detección', 'incendio', 'humo',
      'cerco eléctrico', 'perimetral', 'biométrico', 'reconocimiento facial',
      'monitoreo', 'seguridad', 'intrusión', 'sensor'
    ],
    area: 'Seguridad'
  },
  103: { // Telecomunicaciones
    keywords: [
      'telefonía', 'telefónica', 'voip', 'ip pbx', 'central telefónica',
      'comunicaciones', 'videoconferencia', 'sip', 'troncal', 'interno',
      'contact center', 'call center', 'ivr', 'grabación de llamadas',
      'wifi', 'inalámbrico', 'cobertura'
    ],
    area: 'Telecomunicaciones'
  },
  104: { // Desarrollo de Software
    keywords: [
      'software', 'aplicación', 'sistema', 'desarrollo', 'web',
      'app', 'móvil', 'erp', 'crm', 'gestión', 'base de datos',
      'automatización', 'integración', 'api', 'dashboard',
      'portal', 'plataforma', 'código', 'programación'
    ],
    area: 'Software'
  },
  105: { // Soporte Técnico
    keywords: [
      'soporte', 'mantenimiento', 'mesa de ayuda', 'helpdesk',
      'administración', 'monitoreo', 'backup', 'servidor',
      'infraestructura it', 'actualización', 'preventivo',
      'correctivo', 'troubleshooting'
    ],
    area: 'Soporte'
  },
  106: { // Consultoría IT
    keywords: [
      'consultoría', 'auditoría', 'asesoramiento', 'diseño',
      'arquitectura', 'plan director', 'transformación digital',
      'proyecto', 'gestión de proyecto', 'pmo', 'estrategia',
      'optimización', 'mejora continua'
    ],
    area: 'Consultoría'
  }
};

// ==========================================
// FUNCIONES DE ANÁLISIS
// ==========================================

/**
 * Analiza un antecedente y determina qué servicios están relacionados
 */
function analyzeAntecedente(antecedente) {
  const texto = `${antecedente.Nombre || ''} ${antecedente.Descripcion || ''}`.toLowerCase();
  const serviciosRelacionados = [];

  for (const [servicioId, config] of Object.entries(KEYWORDS_TO_SERVICES)) {
    let matchCount = 0;

    for (const keyword of config.keywords) {
      if (texto.includes(keyword)) {
        matchCount++;
      }
    }

    // Si tiene 2+ keywords, considerarlo relacionado
    if (matchCount >= 2) {
      serviciosRelacionados.push({
        servicioId: parseInt(servicioId),
        matchCount,
        destacado: matchCount >= 5 // Servicio principal si tiene 5+ keywords
      });
    }
  }

  // Ordenar por relevancia (más keywords = más relevante)
  serviciosRelacionados.sort((a, b) => b.matchCount - a.matchCount);

  return serviciosRelacionados;
}

/**
 * Crea una relación M2M en la junction table
 */
async function createRelation(antecedenteId, servicioId, orden, destacado) {
  const relationData = {
    antecedentes_id: antecedenteId,
    Servicios_id: servicioId,
    orden: orden,
    destacado: destacado
  };

  if (DRY_RUN) {
    console.log(`    📋 [DRY-RUN] Relación: Antecedente ${antecedenteId} → Servicio ${servicioId} (orden: ${orden}, destacado: ${destacado})`);
    return { success: true, dryRun: true };
  }

  try {
    const result = await directus.request(
      createItem('antecedentes_servicios', relationData)
    );

    console.log(`    ✅ Creada: Antecedente ${antecedenteId} → Servicio ${servicioId}`);
    return { success: true, id: result.id };
  } catch (error) {
    // Si ya existe, no es error crítico
    if (error.message?.includes('duplicate') || error.message?.includes('unique')) {
      console.log(`    ⚠️  Ya existe: Antecedente ${antecedenteId} → Servicio ${servicioId}`);
      return { success: true, duplicate: true };
    }

    console.error(`    ❌ Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Procesa un antecedente y crea sus relaciones
 */
async function processAntecedente(antecedente) {
  console.log(`\n  📄 Antecedente ${antecedente.id}: ${antecedente.Nombre}`);

  const serviciosRelacionados = analyzeAntecedente(antecedente);

  if (serviciosRelacionados.length === 0) {
    console.log('     ⚠️  No se detectaron servicios relacionados');
    return { total: 0, success: 0, errors: 0 };
  }

  console.log(`     🔍 ${serviciosRelacionados.length} servicios detectados:`);
  serviciosRelacionados.forEach((s, idx) => {
    const config = KEYWORDS_TO_SERVICES[s.servicioId];
    console.log(`        ${idx + 1}. ${config.area} (${s.matchCount} keywords${s.destacado ? ', DESTACADO' : ''})`);
  });

  const stats = {
    total: serviciosRelacionados.length,
    success: 0,
    errors: 0
  };

  // Crear relaciones
  for (let i = 0; i < serviciosRelacionados.length; i++) {
    const servicio = serviciosRelacionados[i];
    const result = await createRelation(
      antecedente.id,
      servicio.servicioId,
      i, // orden
      servicio.destacado
    );

    if (result.success) {
      stats.success++;
    } else {
      stats.errors++;
    }
  }

  return stats;
}

// ==========================================
// MAIN
// ==========================================

async function main() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║  MIGRACIÓN: Relaciones M2M Antecedentes ↔ Servicios   ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  if (DRY_RUN) {
    console.log('🔍 MODO DRY-RUN: No se modificará la base de datos\n');
  }

  if (LIMIT) {
    console.log(`📊 LÍMITE: Solo se procesarán ${LIMIT} antecedentes\n`);
  }

  // 1. Verificar conexión
  console.log('1️⃣  Verificando conexión...');
  try {
    const response = await fetch(`${DIRECTUS_URL}/server/info`, {
      headers: { 'Authorization': `Bearer ${DIRECTUS_TOKEN}` }
    });
    if (!response.ok) throw new Error('Conexión fallida');
    console.log(`   ✅ Conectado a: ${DIRECTUS_URL}\n`);
  } catch (error) {
    console.error('   ❌ Error:', error.message);
    process.exit(1);
  }

  // 2. Obtener antecedentes de Directus
  console.log('2️⃣  Obteniendo antecedentes de Directus...');

  try {
    const query = {
      fields: ['id', 'Nombre', 'Descripcion'],
      sort: ['id']
    };

    if (LIMIT) {
      query.limit = LIMIT;
    }

    const antecedentes = await directus.request(
      readItems('antecedentes', query)
    );

    console.log(`   ✅ ${antecedentes.length} antecedentes obtenidos\n`);

    if (antecedentes.length === 0) {
      console.error('❌ No hay antecedentes para procesar');
      process.exit(1);
    }

    // 3. Procesar antecedentes
    console.log('3️⃣  Analizando y creando relaciones...');
    console.log('   ════════════════════════════════════════════════════════');

    const globalStats = {
      antecedentes: antecedentes.length,
      relacionesTotal: 0,
      relacionesSuccess: 0,
      relacionesErrors: 0,
      sinRelaciones: 0
    };

    for (const antecedente of antecedentes) {
      const stats = await processAntecedente(antecedente);

      globalStats.relacionesTotal += stats.total;
      globalStats.relacionesSuccess += stats.success;
      globalStats.relacionesErrors += stats.errors;

      if (stats.total === 0) {
        globalStats.sinRelaciones++;
      }
    }

    // 4. Resumen
    console.log('\n\n╔════════════════════════════════════════════════════════╗');
    console.log('║  RESUMEN DE MIGRACIÓN                                  ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');

    console.log(`  📊 Antecedentes procesados:     ${globalStats.antecedentes}`);
    console.log(`  🔗 Relaciones totales:          ${globalStats.relacionesTotal}`);
    console.log(`  ✅ Relaciones creadas:          ${globalStats.relacionesSuccess}`);
    console.log(`  ❌ Errores:                     ${globalStats.relacionesErrors}`);
    console.log(`  ⚠️  Antecedentes sin relación:  ${globalStats.sinRelaciones}`);

    if (DRY_RUN) {
      console.log('\n  🔍 Modo DRY-RUN: Ejecutar sin --dry-run para aplicar cambios');
    } else {
      console.log('\n  ✅ Migración completada');

      // Mostrar distribución por servicio
      console.log('\n  📊 Distribución por servicio:');
      for (const [servicioId, config] of Object.entries(KEYWORDS_TO_SERVICES)) {
        console.log(`     ${config.area} (ID ${servicioId})`);
      }
    }

    console.log('\n═══════════════════════════════════════════════════════════\n');

    process.exit(globalStats.relacionesErrors > 0 ? 1 : 0);
  } catch (error) {
    console.error('\n❌ Error obteniendo antecedentes:', error.message);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('\n❌ Error fatal:', error);
  process.exit(1);
});
