#!/usr/bin/env node

/**
 * Script de Testing Exhaustivo - ULTIMA MILLA
 * Prueba todas las URLs, imágenes, componentes y funcionalidades
 */

import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';

// Configuración
const CONFIG = {
  baseUrl: 'https://umbot.com.ar',
  timeout: 15000,
  maxRetries: 3,
  logFile: 'test-results.json',
  reportFile: 'test-report.html'
};

// Resultados del test
let results = {
  startTime: new Date().toISOString(),
  endTime: null,
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    warnings: 0
  },
  tests: []
};

// URLs principales a testear
const MAIN_URLS = [
  '/',
  '/servicios',
  '/antecedentes',
  '/servicios/1/servicios-it',
  '/servicios/2/redes-de-datos', 
  '/servicios/3/software-y-servicios',
  '/servicios/4/seguridad-informatica',
  '/servicios/5/infraestructura-it',
  '/servicios/6/consultoria-tecnologica',
  '/antecedentes/10768/isi-solutions-redes-y-comunicaciones',
  '/antecedentes/10769/ministerio-de-deportes-software-a-medida',
  '/antecedentes/10770/telecombtw-sa-infraestructura-de-red'
];

// Imágenes críticas a verificar
const CRITICAL_IMAGES = [
  '/images/services/servicios-it.jpg',
  '/images/services/redes-de-datos.jpg',
  '/images/services/software-servicios.jpg',
  '/images/services/seguridad-informatica.jpg',
  '/images/antecedentes/default-antecedente.jpg',
  '/avif/um-logo.avif',
  '/avif/default.avif'
];

// Función para hacer request HTTP/HTTPS
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https:');
    const client = isHttps ? https : http;
    
    const requestOptions = {
      timeout: CONFIG.timeout,
      headers: {
        'User-Agent': 'ULTIMA-MILLA-Test-Bot/1.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
        'Cache-Control': 'no-cache',
        ...options.headers
      },
      ...options
    };

    const req = client.get(url, requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data,
          redirects: res.statusCode >= 300 && res.statusCode < 400 ? res.headers.location : null
        });
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.abort();
      reject(new Error('Request timeout'));
    });
  });
}

// Test individual de URL
async function testUrl(url, retries = 0) {
  const testResult = {
    url: url,
    type: 'url',
    startTime: new Date().toISOString(),
    status: 'running'
  };

  try {
    console.log(`🔍 Testing: ${CONFIG.baseUrl}${url}`);
    const response = await makeRequest(`${CONFIG.baseUrl}${url}`);
    
    testResult.statusCode = response.statusCode;
    testResult.responseTime = Date.now() - new Date(testResult.startTime).getTime();
    testResult.contentLength = response.data.length;
    testResult.headers = response.headers;

    // Validaciones
    const validations = [];
    
    if (response.statusCode === 200) {
      testResult.status = 'passed';
      validations.push('✅ HTTP 200 OK');
      
      // Validar contenido HTML
      if (response.headers['content-type']?.includes('text/html')) {
        if (response.data.includes('ULTIMA MILLA')) {
          validations.push('✅ Contiene marca ULTIMA MILLA');
        } else {
          validations.push('⚠️ No contiene marca ULTIMA MILLA');
          testResult.status = 'warning';
        }
        
        if (response.data.includes('<title>')) {
          const titleMatch = response.data.match(/<title[^>]*>([^<]*)</i);
          if (titleMatch) {
            testResult.pageTitle = titleMatch[1];
            validations.push(`✅ Título: ${titleMatch[1]}`);
          }
        }
        
        if (response.data.includes('og:title')) {
          validations.push('✅ Open Graph meta tags presentes');
        }
        
        // Verificar que no hay errores JavaScript visibles
        if (response.data.includes('Error') || response.data.includes('undefined')) {
          validations.push('⚠️ Posibles errores en el contenido');
          testResult.status = 'warning';
        }
      }
      
    } else if (response.statusCode >= 300 && response.statusCode < 400) {
      testResult.status = 'warning';
      testResult.redirect = response.redirects;
      validations.push(`⚠️ Redirect ${response.statusCode} a ${response.redirects}`);
      
    } else {
      testResult.status = 'failed';
      validations.push(`❌ HTTP ${response.statusCode}`);
    }

    testResult.validations = validations;
    testResult.endTime = new Date().toISOString();
    
  } catch (error) {
    if (retries < CONFIG.maxRetries) {
      console.log(`⚠️ Retry ${retries + 1}/${CONFIG.maxRetries} for ${url}`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      return testUrl(url, retries + 1);
    }
    
    testResult.status = 'failed';
    testResult.error = error.message;
    testResult.validations = [`❌ Error: ${error.message}`];
    testResult.endTime = new Date().toISOString();
  }

  return testResult;
}

// Test de imágenes
async function testImage(imagePath) {
  const testResult = {
    url: imagePath,
    type: 'image',
    startTime: new Date().toISOString(),
    status: 'running'
  };

  try {
    console.log(`🖼️ Testing image: ${CONFIG.baseUrl}${imagePath}`);
    const response = await makeRequest(`${CONFIG.baseUrl}${imagePath}`);
    
    testResult.statusCode = response.statusCode;
    testResult.responseTime = Date.now() - new Date(testResult.startTime).getTime();
    testResult.contentLength = response.data.length;
    testResult.contentType = response.headers['content-type'];

    const validations = [];
    
    if (response.statusCode === 200) {
      testResult.status = 'passed';
      validations.push('✅ Imagen carga correctamente');
      
      // Validar tipo de contenido
      if (response.headers['content-type']?.startsWith('image/')) {
        validations.push(`✅ Content-Type válido: ${response.headers['content-type']}`);
      } else {
        validations.push(`⚠️ Content-Type inesperado: ${response.headers['content-type']}`);
        testResult.status = 'warning';
      }
      
      // Validar tamaño
      if (response.data.length > 0) {
        validations.push(`✅ Tamaño: ${(response.data.length / 1024).toFixed(2)} KB`);
      }
      
    } else {
      testResult.status = 'failed';
      validations.push(`❌ HTTP ${response.statusCode}`);
    }

    testResult.validations = validations;
    testResult.endTime = new Date().toISOString();
    
  } catch (error) {
    testResult.status = 'failed';
    testResult.error = error.message;
    testResult.validations = [`❌ Error: ${error.message}`];
    testResult.endTime = new Date().toISOString();
  }

  return testResult;
}

// Test del API de Directus
async function testDirectusAPI() {
  const tests = [
    '/items/Servicios',
    '/items/Antecedentes?limit=5',
    '/files'
  ];

  const directusResults = [];
  const directusUrl = 'http://23.105.176.45:8055';

  for (const endpoint of tests) {
    const testResult = {
      url: endpoint,
      type: 'api',
      startTime: new Date().toISOString()
    };

    try {
      console.log(`🔌 Testing API: ${directusUrl}${endpoint}`);
      const response = await makeRequest(`${directusUrl}${endpoint}`, {
        headers: {
          'Authorization': 'Bearer k6P8LAY8_x_y1miB_KTlWnysCnx2Abky'
        }
      });

      testResult.statusCode = response.statusCode;
      testResult.responseTime = Date.now() - new Date(testResult.startTime).getTime();

      if (response.statusCode === 200) {
        const jsonData = JSON.parse(response.data);
        testResult.status = 'passed';
        testResult.recordCount = jsonData.data ? jsonData.data.length : 'N/A';
        testResult.validations = [
          '✅ API responde correctamente',
          `✅ Datos: ${testResult.recordCount} registros`
        ];
      } else {
        testResult.status = 'failed';
        testResult.validations = [`❌ HTTP ${response.statusCode}`];
      }

    } catch (error) {
      testResult.status = 'failed';
      testResult.error = error.message;
      testResult.validations = [`❌ Error: ${error.message}`];
    }

    testResult.endTime = new Date().toISOString();
    directusResults.push(testResult);
  }

  return directusResults;
}

// Generar reporte HTML
function generateHTMLReport() {
  const totalTests = results.tests.length;
  const passedTests = results.tests.filter(t => t.status === 'passed').length;
  const failedTests = results.tests.filter(t => t.status === 'failed').length;
  const warningTests = results.tests.filter(t => t.status === 'warning').length;

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reporte de Testing - ULTIMA MILLA</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; margin-bottom: 30px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .card { background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .passed { border-left: 4px solid #22c55e; }
        .failed { border-left: 4px solid #ef4444; }
        .warning { border-left: 4px solid #f59e0b; }
        .test-results { background: white; border-radius: 10px; padding: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .test-item { border-bottom: 1px solid #eee; padding: 15px 0; }
        .test-item:last-child { border-bottom: none; }
        .status { padding: 4px 8px; border-radius: 4px; color: white; font-size: 12px; }
        .status.passed { background: #22c55e; }
        .status.failed { background: #ef4444; }
        .status.warning { background: #f59e0b; }
        .validations { margin-top: 10px; font-size: 14px; }
        .meta { color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧪 Reporte de Testing Exhaustivo</h1>
            <h2>ULTIMA MILLA - Sitio Web</h2>
            <p>Ejecutado: ${results.startTime} - ${results.endTime}</p>
        </div>
        
        <div class="summary">
            <div class="card">
                <h3>📊 Total de Tests</h3>
                <div style="font-size: 2em; font-weight: bold;">${totalTests}</div>
            </div>
            <div class="card passed">
                <h3>✅ Exitosos</h3>
                <div style="font-size: 2em; font-weight: bold; color: #22c55e;">${passedTests}</div>
            </div>
            <div class="card failed">
                <h3>❌ Fallidos</h3>
                <div style="font-size: 2em; font-weight: bold; color: #ef4444;">${failedTests}</div>
            </div>
            <div class="card warning">
                <h3>⚠️ Advertencias</h3>
                <div style="font-size: 2em; font-weight: bold; color: #f59e0b;">${warningTests}</div>
            </div>
        </div>
        
        <div class="test-results">
            <h3>📝 Resultados Detallados</h3>
            ${results.tests.map(test => `
                <div class="test-item">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <strong>${test.type.toUpperCase()}: ${test.url}</strong>
                        <span class="status ${test.status}">${test.status.toUpperCase()}</span>
                    </div>
                    <div class="meta">
                        ${test.responseTime ? `Tiempo: ${test.responseTime}ms` : ''} 
                        ${test.statusCode ? `| Código: ${test.statusCode}` : ''}
                        ${test.contentLength ? `| Tamaño: ${(test.contentLength / 1024).toFixed(2)}KB` : ''}
                        ${test.pageTitle ? `| Título: ${test.pageTitle}` : ''}
                    </div>
                    <div class="validations">
                        ${test.validations ? test.validations.map(v => `<div>${v}</div>`).join('') : ''}
                        ${test.error ? `<div style="color: red;">Error: ${test.error}</div>` : ''}
                    </div>
                </div>
            `).join('')}
        </div>
    </div>
</body>
</html>`;

  fs.writeFileSync(CONFIG.reportFile, html);
}

// Función principal
async function runTests() {
  console.log('🚀 Iniciando Testing Exhaustivo - ULTIMA MILLA\n');
  
  // Test URLs principales
  console.log('📄 Testing URLs principales...');
  for (const url of MAIN_URLS) {
    const result = await testUrl(url);
    results.tests.push(result);
    results.summary.total++;
    results.summary[result.status]++;
    
    // Pequeña pausa entre requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n🖼️ Testing imágenes críticas...');
  for (const imagePath of CRITICAL_IMAGES) {
    const result = await testImage(imagePath);
    results.tests.push(result);
    results.summary.total++;
    results.summary[result.status]++;
    
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  
  console.log('\n🔌 Testing API de Directus...');
  const apiResults = await testDirectusAPI();
  apiResults.forEach(result => {
    results.tests.push(result);
    results.summary.total++;
    results.summary[result.status]++;
  });
  
  results.endTime = new Date().toISOString();
  
  // Guardar resultados
  fs.writeFileSync(CONFIG.logFile, JSON.stringify(results, null, 2));
  generateHTMLReport();
  
  // Mostrar resumen
  console.log('\n📊 RESUMEN DE TESTING:');
  console.log(`Total: ${results.summary.total}`);
  console.log(`✅ Exitosos: ${results.summary.passed}`);
  console.log(`❌ Fallidos: ${results.summary.failed}`);
  console.log(`⚠️ Advertencias: ${results.summary.warnings}`);
  console.log(`\n📄 Reportes generados:`);
  console.log(`- JSON: ${CONFIG.logFile}`);
  console.log(`- HTML: ${CONFIG.reportFile}`);
  
  // Exit code basado en resultados
  process.exit(results.summary.failed > 0 ? 1 : 0);
}

// Ejecutar si es llamado directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch(error => {
    console.error('❌ Error durante el testing:', error);
    process.exit(1);
  });
}
