#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colores para output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

console.log(`${colors.blue}Generando reporte de migración...${colors.reset}\n`);

// Función para ejecutar comandos y capturar su salida
function runCommand(command) {
  try {
    return execSync(command, { encoding: 'utf8' });
  } catch (error) {
    return `Error: ${error.message}`;
  }
}

// 1. Validar base de datos
console.log(`${colors.yellow}1. Validando base de datos...${colors.reset}`);
const dbValidation = runCommand('./scripts/validate-database.sh');
console.log(dbValidation);

// 2. Validar imágenes
console.log(`\n${colors.yellow}2. Validando imágenes...${colors.reset}`);
const imageValidation = runCommand('./scripts/validate-images.sh');
console.log(imageValidation);

// 3. Validar API
console.log(`\n${colors.yellow}3. Validando API...${colors.reset}`);
const apiValidation = runCommand('./scripts/test-connectivity.sh');
console.log(apiValidation);

// 4. Verificar performance
console.log(`\n${colors.yellow}4. Verificando performance...${colors.reset}`);
const performanceTest = runCommand('curl -s -w "%{time_total}\n" -o /dev/null http://localhost:8055/');
console.log(`Tiempo de respuesta API: ${performanceTest.trim()} segundos`);

// 5. Verificar tests
console.log(`\n${colors.yellow}5. Ejecutando tests...${colors.reset}`);
const testResults = runCommand('npm run test:ci');
console.log(testResults);

// Generar resumen
console.log(`\n${colors.blue}=== RESUMEN DE MIGRACIÓN ===${colors.reset}`);

// Verificar criterios de éxito
const successCriteria = {
  'Antecedentes migrados': dbValidation.includes('27 relations found'),
  'Imágenes accesibles': !imageValidation.includes('Error'),
  'Sin errores 404': !apiValidation.includes('404'),
  'API funcional': apiValidation.includes('Token obtenido correctamente'),
  'Performance aceptable': parseFloat(performanceTest) < 3,
  'Tests pasando': !testResults.includes('FAIL')
};

Object.entries(successCriteria).forEach(([criterion, passed]) => {
  console.log(`${passed ? colors.green + '✅' : colors.red + '❌'} ${criterion}${colors.reset}`);
});

// Verificar red flags
const redFlags = {
  'Registros huérfanos': dbValidation.includes('orphaned records'),
  'Imágenes no encontradas': imageValidation.includes('not found'),
  'Tokens inválidos': apiValidation.includes('Invalid user credentials'),
  'Errores 500': apiValidation.includes('500'),
  'Memory leaks': testResults.includes('memory leak')
};

console.log(`\n${colors.blue}=== RED FLAGS ===${colors.reset}`);
Object.entries(redFlags).forEach(([flag, detected]) => {
  if (detected) {
    console.log(`${colors.red}❌ ${flag}${colors.reset}`);
  }
});

// Guardar reporte en archivo
const report = {
  timestamp: new Date().toISOString(),
  successCriteria,
  redFlags,
  details: {
    database: dbValidation,
    images: imageValidation,
    api: apiValidation,
    performance: performanceTest,
    tests: testResults
  }
};

fs.writeFileSync(
  'migration-report.json',
  JSON.stringify(report, null, 2)
);

console.log(`\n${colors.green}Reporte guardado en migration-report.json${colors.reset}`); 