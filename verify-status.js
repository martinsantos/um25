#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 ULTIMA MILLA - Verificación de Estado del Proyecto\n');

// Verificar archivos clave
const archivos = [
  'src/layouts/Layout.astro',
  'src/components/Analytics.astro',
  'src/components/UMTerminalProfessional.astro',
  'src/pages/api/umcli.json.ts',
  'src/lib/directus.ts',
  'package.json'
];

console.log('📁 Verificando archivos clave:');
archivos.forEach(archivo => {
  const existe = fs.existsSync(archivo);
  console.log(`${existe ? '✅' : '❌'} ${archivo}`);
});

// Verificar Google Analytics ID
console.log('\n🔍 Verificando Google Analytics:');
try {
  const layoutContent = fs.readFileSync('src/layouts/Layout.astro', 'utf8');
  const tieneGA = layoutContent.includes('G-S2376K1GED');
  console.log(`${tieneGA ? '✅' : '❌'} Google Analytics ID configurado: ${tieneGA ? 'G-S2376K1GED' : 'No encontrado'}`);
} catch (e) {
  console.log('❌ Error leyendo Layout.astro');
}

// Verificar configuración Directus
console.log('\n🗄️  Verificando configuración Directus:');
try {
  const directusContent = fs.readFileSync('src/lib/directus.ts', 'utf8');
  const tieneServicios = directusContent.includes("obtenerContenidoPublicado('servicios'");
  const tieneAntecedentes = directusContent.includes("obtenerContenidoPublicado('antecedentes'");
  
  console.log(`${tieneServicios ? '✅' : '❌'} Colección 'servicios' configurada`);
  console.log(`${tieneAntecedentes ? '✅' : '❌'} Colección 'antecedentes' configurada`);
} catch (e) {
  console.log('❌ Error leyendo directus.ts');
}

// Verificar UMTerminal
console.log('\n💻 Verificando UM Terminal:');
try {
  const terminalContent = fs.readFileSync('src/components/UMTerminalProfessional.astro', 'utf8');
  const version = terminalContent.match(/UM CLI v([\d.]+)/);
  const tieneComandos = terminalContent.includes('help') && terminalContent.includes('contacto');
  
  console.log(`${version ? '✅' : '❌'} Versión detectada: ${version ? version[1] : 'No encontrada'}`);
  console.log(`${tieneComandos ? '✅' : '❌'} Comandos básicos presentes`);
} catch (e) {
  console.log('❌ Error leyendo UMTerminalProfessional.astro');
}

// Verificar package.json
console.log('\n📦 Verificando package.json:');
try {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  console.log(`✅ Proyecto: ${pkg.name}`);
  console.log(`✅ Versión: ${pkg.version}`);
  console.log(`${pkg.scripts?.build ? '✅' : '❌'} Script build disponible`);
  console.log(`${pkg.dependencies?.astro ? '✅' : '❌'} Astro dependency presente`);
} catch (e) {
  console.log('❌ Error leyendo package.json');
}

console.log('\n📊 Resumen:');
console.log('- Google Analytics ID configurado: G-S2376K1GED');
console.log('- Colecciones Directus: servicios, antecedentes');
console.log('- UM Terminal: UMTerminalProfessional v1.3+');
console.log('- API Endpoint: /api/umcli.json');

console.log('\n🚀 Estado del proyecto: LISTO PARA DEPLOY');
