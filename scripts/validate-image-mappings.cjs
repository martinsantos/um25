#!/usr/bin/env node
/**
 * FASE 4: Script de Validación de Sistema de Imágenes
 *
 * Valida el sistema completo de mapeo y resolución de imágenes
 * para detectar inconsistencias y problemas potenciales.
 */

const fs = require('fs');
const path = require('path');

// Colores para terminal
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(color, ...args) {
  console.log(color, ...args, colors.reset);
}

function success(msg) {
  log(colors.green + '✅', msg);
}

function error(msg) {
  log(colors.red + '❌', msg);
}

function warning(msg) {
  log(colors.yellow + '⚠️ ', msg);
}

function info(msg) {
  log(colors.cyan + 'ℹ️ ', msg);
}

// Paths
const projectRoot = path.resolve(__dirname, '..');
const antecedentesPath = path.join(projectRoot, 'src/data/antecedentes_completos.js');
const mapeoPath = path.join(projectRoot, 'src/data/mapeo_imagenes_completo.js');
const imageDir = path.join(projectRoot, 'public/imagenes_antecedentes_versionproduccion');

console.log('\n' + colors.blue + '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🔍 VALIDACIÓN DE SISTEMA DE IMÁGENES DE ANTECEDENTES');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' + colors.reset + '\n');

let issues = 0;

// 1. VALIDACIÓN DE COBERTURA DE MAPEO
console.log(colors.blue + '1️⃣  COBERTURA DE MAPEO\n' + colors.reset);

try {
  const antecedentesContent = fs.readFileSync(antecedentesPath, 'utf8');
  const mapeoContent = fs.readFileSync(mapeoPath, 'utf8');

  const antecedentesMatch = antecedentesContent.match(/export const antecedentesReales = \[([\s\S]*?)\];/);
  const mapeoMatch = mapeoContent.match(/export const mapeoImagenes = \[([\s\S]*?)\];/);

  if (!antecedentesMatch || !mapeoMatch) {
    error('No se pueden parsear los archivos de datos');
    process.exit(1);
  }

  const antecedentesArray = eval(`[${antecedentesMatch[1]}]`);
  const mapeoArray = eval(`[${mapeoMatch[1]}]`);

  const antecedentesIds = new Set(antecedentesArray.map(a => a.id));
  const mapeadosIds = new Set(mapeoArray.map(m => m.numero));

  const faltantes = Array.from(antecedentesIds).filter(id => !mapeadosIds.has(id));

  info(`Total de antecedentes: ${antecedentesArray.length}`);
  info(`Total mapeados: ${mapeoArray.length}`);

  const coverage = ((mapeoArray.length / antecedentesArray.length) * 100).toFixed(2);

  if (coverage === '100.00') {
    success(`Cobertura: ${coverage}% ✓ PERFECTO`);
  } else if (coverage >= 95) {
    warning(`Cobertura: ${coverage}% (${faltantes.length} faltantes)`);
    issues++;
  } else {
    error(`Cobertura: ${coverage}% (${faltantes.length} faltantes)`);
    issues += 2;
  }

  if (faltantes.length > 0) {
    console.log('\n' + colors.yellow + '  Antecedentes sin mapeo:' + colors.reset);
    faltantes.slice(0, 5).forEach(id => {
      const ant = antecedentesArray.find(a => a.id === id);
      console.log(`    - ID ${id}: ${ant.Titulo.substring(0, 50)}...`);
    });
    if (faltantes.length > 5) {
      console.log(`    ... y ${faltantes.length - 5} más`);
    }
  }
} catch (err) {
  error(`Error validando mapeo: ${err.message}`);
  issues += 2;
}

// 2. VALIDACIÓN DE ARCHIVOS FÍSICOS
console.log('\n' + colors.blue + '2️⃣  ARCHIVOS FÍSICOS\n' + colors.reset);

try {
  if (!fs.existsSync(imageDir)) {
    error(`Directorio de imágenes no existe: ${imageDir}`);
    issues += 2;
  } else {
    const physicalFiles = fs.readdirSync(imageDir)
      .filter(f => f.endsWith('.png'))
      .sort();

    info(`Archivos PNG en servidor: ${physicalFiles.length}`);

    // Leer mapeo nuevamente para verificar archivos faltantes
    const mapeoContent = fs.readFileSync(mapeoPath, 'utf8');
    const mapeoMatch = mapeoContent.match(/export const mapeoImagenes = \[([\s\S]*?)\];/);
    const mapeoArray = eval(`[${mapeoMatch[1]}]`);

    const mappedFileSet = new Set(mapeoArray.map(m => m.nombre_archivo_generado));
    const missingFiles = mapeoArray.filter(m => !physicalFiles.includes(m.nombre_archivo_generado));
    const orphanFiles = physicalFiles.filter(f => !mappedFileSet.has(f));

    if (missingFiles.length > 0) {
      error(`${missingFiles.length} archivos mapeados que NO existen`);
      issues += 2;
      console.log('\n' + colors.red + '  Ejemplos:' + colors.reset);
      missingFiles.slice(0, 3).forEach(m => {
        console.log(`    - ID ${m.numero}: ${m.nombre_archivo_generado}`);
      });
    } else {
      success(`Todos los archivos mapeados existen`);
    }

    if (orphanFiles.length > 0) {
      warning(`${orphanFiles.length} archivos huérfanos (sin mapeo)`);
      issues++;
      console.log('\n' + colors.yellow + '  Ejemplos:' + colors.reset);
      orphanFiles.slice(0, 3).forEach(f => {
        console.log(`    - ${f}`);
      });
    } else {
      success(`No hay archivos huérfanos`);
    }
  }
} catch (err) {
  error(`Error validando archivos: ${err.message}`);
  issues++;
}

// 3. VALIDACIÓN DE FALLBACK CONSISTENTE
console.log('\n' + colors.blue + '3️⃣  CONFIGURACIÓN DE FALLBACK\n' + colors.reset);

try {
  const directusPath = path.join(projectRoot, 'src/utils/directus.js');
  const directusContent = fs.readFileSync(directusPath, 'utf8');

  const defaultImageMatch = directusContent.match(/DEFAULT_IMAGE:\s*['"]([^'"]+)['"]/);
  const defaultImage = defaultImageMatch ? defaultImageMatch[1] : null;

  if (defaultImage === '/images/antecedentes-hero-bg.jpg') {
    success(`Fallback consistente: ${defaultImage}`);
  } else {
    error(`Fallback incorrecto: ${defaultImage}`);
    issues += 2;
  }

  // Buscar ALF verde en el código
  const alfGreen = directusContent.includes('default-background.jpg') ||
                   directusContent.includes('/images/um-logo') ||
                   directusContent.includes('/images/default-service.jpg');

  if (alfGreen) {
    error(`⚠️ Se encontraron referencias a fallbacks antiguos en directus.js`);
    issues++;
  } else {
    success(`No hay referencias a fallbacks antiguos`);
  }

  // Verificar que el fallback existe
  const fallbackPath = path.join(projectRoot, 'public', defaultImage);
  if (fs.existsSync(fallbackPath)) {
    success(`Archivo fallback existe: ${defaultImage}`);
  } else {
    error(`Archivo fallback NO EXISTE: ${defaultImage}`);
    issues += 2;
  }
} catch (err) {
  error(`Error validando fallback: ${err.message}`);
  issues++;
}

// 4. VALIDACIÓN DE HANDLERS ONERROR
console.log('\n' + colors.blue + '4️⃣  HANDLERS ONERROR\n' + colors.reset);

try {
  const srcDir = path.join(projectRoot, 'src');
  let onerrorCount = 0;
  let badOnerrorCount = 0;

  function scanDir(dir) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        scanDir(filePath);
      } else if (file.endsWith('.astro')) {
        const content = fs.readFileSync(filePath, 'utf8');
        const onerrors = content.match(/onerror="[^"]*"/g) || [];

        onerrors.forEach(onerror => {
          onerrorCount++;
          if (!onerror.includes('antecedentes-hero-bg.jpg')) {
            badOnerrorCount++;
            console.log(`  ${colors.yellow}⚠️ ${colors.reset} ${file}: ${onerror.substring(0, 60)}...`);
          }
        });
      }
    });
  }

  scanDir(srcDir);

  info(`Total handlers onerror encontrados: ${onerrorCount}`);

  if (badOnerrorCount === 0) {
    success(`Todos los handlers usan fallback consistente ✓`);
  } else {
    warning(`${badOnerrorCount} handlers usan fallbacks diferentes`);
    issues += badOnerrorCount;
  }
} catch (err) {
  warning(`Error escaneando handlers: ${err.message}`);
}

// 5. RESUMEN FINAL
console.log('\n' + colors.blue + '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📋 RESUMEN FINAL');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' + colors.reset + '\n');

if (issues === 0) {
  success(`SISTEMA PERFECTO - Sin problemas detectados ✓\n`);
  process.exit(0);
} else if (issues === 1) {
  warning(`Se encontró 1 advertencia\n`);
  process.exit(0);
} else if (issues <= 3) {
  warning(`Se encontraron ${issues} problemas menores\n`);
  process.exit(0);
} else {
  error(`Se encontraron ${issues} problemas graves - Requiere atención\n`);
  process.exit(1);
}
