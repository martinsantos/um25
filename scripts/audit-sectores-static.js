/**
 * Script para auditar sectores usando datos estáticos
 * Analiza antecedentes_completos.js y sugiere nuevos sectores
 *
 * Uso: node scripts/audit-sectores-static.js
 */

import { antecedentesReales } from '../src/data/antecedentes_completos.js';

// Sectores existentes en colorSystem
const EXISTING_SECTORS = [
  'aeropuertos',
  'bodegas',
  'gobierno',
  'salud',
  'construccion',
  'industria',
  'software',
  'mineria',
  'seguridad',
  'telecomunicaciones',
  'datacenter',
  'hoteleria',
  'retail',
  'energia',
  'educacion'
];

/**
 * Normaliza un área a sector (misma lógica que ProjectCard.astro)
 */
function normalizeSector(area) {
  const keywords = area?.toLowerCase().trim() || '';

  if (keywords.includes('aeropuerto')) return 'aeropuertos';
  if (keywords.includes('bodega') || keywords.includes('vitivinícola')) return 'bodegas';
  if (keywords.includes('gobierno') || keywords.includes('municipal') || keywords.includes('público')) return 'gobierno';
  if (keywords.includes('salud') || keywords.includes('hospital') || keywords.includes('clínica')) return 'salud';
  if (keywords.includes('construcción') || keywords.includes('constructora') || keywords.includes('obra')) return 'construccion';
  if (keywords.includes('industria') || keywords.includes('industrial') || keywords.includes('fábrica')) return 'industria';
  if (keywords.includes('software') || keywords.includes('desarrollo') || keywords.includes('aplicación')) return 'software';
  if (keywords.includes('minería') || keywords.includes('minera') || keywords.includes('mining')) return 'mineria';
  if (keywords.includes('seguridad') || keywords.includes('cctv') || keywords.includes('vigilancia')) return 'seguridad';
  if (keywords.includes('telecomunicaciones') || keywords.includes('redes') || keywords.includes('telefonía') || keywords.includes('comunicaciones')) return 'telecomunicaciones';
  if (keywords.includes('data center') || keywords.includes('datacenter') || keywords.includes('centro de datos')) return 'datacenter';
  if (keywords.includes('hotel') || keywords.includes('hotelería') || keywords.includes('turismo')) return 'hoteleria';
  if (keywords.includes('retail') || keywords.includes('comercio') || keywords.includes('tienda') || keywords.includes('shopping')) return 'retail';
  if (keywords.includes('energía') || keywords.includes('eléctrica') || keywords.includes('renovable') || keywords.includes('distribuidora')) return 'energia';
  if (keywords.includes('educación') || keywords.includes('universidad') || keywords.includes('escuela') || keywords.includes('instituto')) return 'educacion';

  return 'tecnologia'; // fallback
}

/**
 * Audita los sectores
 */
function auditSectores() {
  console.log('🔍 Auditando sectores en Antecedentes...\n');

  const antecedentes = antecedentesReales;
  console.log(`📊 Total de antecedentes: ${antecedentes.length}\n`);

  // Contar ocurrencias por Area
  const areaCounts = {};
  antecedentes.forEach(ant => {
    const area = ant.Area || 'Sin Area';
    areaCounts[area] = (areaCounts[area] || 0) + 1;
  });

  // Ordenar por cantidad descendente
  const sortedAreas = Object.entries(areaCounts).sort((a, b) => b[1] - a[1]);

  console.log('📋 Distribución por Area (top 30):\n');
  sortedAreas.slice(0, 30).forEach(([area, count]) => {
    const sector = normalizeSector(area);
    const emoji = sector === 'tecnologia' ? '⚠️ ' : '✅ ';
    console.log(`${emoji}${area.padEnd(40)} → ${count.toString().padStart(3)} antecedentes → ${sector}`);
  });

  // Analizar cobertura
  console.log('\n\n🎯 Análisis de Cobertura:\n');

  const sectorCounts = {};
  let unmappedCount = 0;

  antecedentes.forEach(ant => {
    const sector = normalizeSector(ant.Area);
    sectorCounts[sector] = (sectorCounts[sector] || 0) + 1;
    if (sector === 'tecnologia') {
      unmappedCount++;
    }
  });

  const sortedSectors = Object.entries(sectorCounts).sort((a, b) => b[1] - a[1]);

  sortedSectors.forEach(([sector, count]) => {
    const percentage = ((count / antecedentes.length) * 100).toFixed(1);
    const emoji = sector === 'tecnologia' ? '❌' : '✅';
    console.log(`${emoji} ${sector.padEnd(20)} → ${count.toString().padStart(3)} antecedentes (${percentage}%)`);
  });

  const coveragePercent = ((antecedentes.length - unmappedCount) / antecedentes.length * 100).toFixed(1);
  console.log(`\n📈 Cobertura Total: ${coveragePercent}% (${antecedentes.length - unmappedCount}/${antecedentes.length})`);

  // Áreas sin mapear
  console.log('\n\n⚠️  Áreas sin mapear (fallback a "tecnologia"):\n');

  const unmappedAreas = sortedAreas.filter(([area]) => normalizeSector(area) === 'tecnologia');
  unmappedAreas.forEach(([area, count]) => {
    if (area !== 'Sin Area') {
      console.log(`   - ${area} (${count} antecedentes)`);
    }
  });

  // Sugerencias de nuevos sectores
  console.log('\n\n💡 Sugerencias para nuevos sectores (≥6 antecedentes):\n');

  const suggestions = unmappedAreas.filter(([area, count]) => count >= 6 && area !== 'Sin Area');
  if (suggestions.length === 0) {
    console.log('   ✅ No hay sugerencias - Todas las áreas con ≥6 antecedentes están mapeadas!');
  } else {
    suggestions.forEach(([area, count]) => {
      console.log(`   🆕 Crear sector para: "${area}" (${count} antecedentes)`);
    });
  }

  // Verificar sectores definidos pero sin uso
  console.log('\n\n🔍 Sectores definidos pero sin antecedentes:\n');

  const unusedSectors = EXISTING_SECTORS.filter(sector => !sectorCounts[sector] || sectorCounts[sector] === 0);
  if (unusedSectors.length === 0) {
    console.log('   ✅ Todos los sectores tienen antecedentes asignados!');
  } else {
    unusedSectors.forEach(sector => {
      console.log(`   ⚪ ${sector} - Sin antecedentes`);
    });
  }

  console.log('\n\n✅ Auditoría completada!\n');
}

// Ejecutar
auditSectores();
