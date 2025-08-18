#!/usr/bin/env node

/**
 * Script de auditoría para producción
 * Verifica optimizaciones, seguridad y configuraciones críticas
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

class ProductionAudit {
  constructor() {
    this.issues = [];
    this.warnings = [];
    this.passed = [];
  }

  log(type, message, details = '') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${type.toUpperCase()}: ${message}`;
    
    console.log(logMessage);
    if (details) console.log(`   Details: ${details}`);

    switch (type) {
      case 'error':
      case 'critical':
        this.issues.push({ type, message, details });
        break;
      case 'warning':
        this.warnings.push({ type, message, details });
        break;
      case 'success':
        this.passed.push({ type, message, details });
        break;
    }
  }

  // Verificar archivos críticos
  checkCriticalFiles() {
    const criticalFiles = [
      'astro.config.mjs',
      'package.json',
      '.env.production',
      'nginx-complete-fix-updated.conf',
      'dist/server/entry.mjs'
    ];

    criticalFiles.forEach(file => {
      const filePath = path.join(rootDir, file);
      if (fs.existsSync(filePath)) {
        this.log('success', `Archivo crítico encontrado: ${file}`);
      } else {
        this.log('error', `Archivo crítico faltante: ${file}`);
      }
    });
  }

  // Verificar configuración de Astro
  checkAstroConfig() {
    const configPath = path.join(rootDir, 'astro.config.mjs');
    
    try {
      const configContent = fs.readFileSync(configPath, 'utf8');
      
      // Verificar optimizaciones clave
      const checks = [
        { pattern: /output:\s*['"]server['"]/, message: 'Configuración SSR habilitada' },
        { pattern: /minify:\s*['"]terser['"]/, message: 'Minificación con Terser configurada' },
        { pattern: /compressHTML:\s*true/, message: 'Compresión HTML habilitada' },
        { pattern: /cssCodeSplit:\s*true/, message: 'División de CSS habilitada' },
        { pattern: /formats:\s*\[.*webp.*\]/, message: 'Formato WebP configurado para imágenes' }
      ];

      checks.forEach(check => {
        if (check.pattern.test(configContent)) {
          this.log('success', check.message);
        } else {
          this.log('warning', `Optimización no encontrada: ${check.message}`);
        }
      });

    } catch (error) {
      this.log('error', 'Error leyendo astro.config.mjs', error.message);
    }
  }

  // Verificar configuración de Nginx
  checkNginxConfig() {
    const nginxPath = path.join(rootDir, 'nginx-complete-fix-updated.conf');
    
    try {
      const nginxContent = fs.readFileSync(nginxPath, 'utf8');
      
      const checks = [
        { pattern: /gzip\s+on;/, message: 'Compresión Gzip habilitada' },
        { pattern: /brotli\s+on;/, message: 'Compresión Brotli habilitada' },
        { pattern: /expires\s+1y;/, message: 'Caché de larga duración configurado' },
        { pattern: /ssl_protocols\s+TLSv1\.2\s+TLSv1\.3;/, message: 'Protocolos SSL seguros' },
        { pattern: /Strict-Transport-Security/, message: 'HSTS configurado' },
        { pattern: /X-Content-Type-Options/, message: 'Headers de seguridad configurados' }
      ];

      checks.forEach(check => {
        if (check.pattern.test(nginxContent)) {
          this.log('success', `Nginx: ${check.message}`);
        } else {
          this.log('warning', `Nginx: ${check.message} - No encontrado`);
        }
      });

    } catch (error) {
      this.log('error', 'Error leyendo configuración de Nginx', error.message);
    }
  }

  // Verificar build de producción
  checkProductionBuild() {
    const distDir = path.join(rootDir, 'dist');
    
    if (!fs.existsSync(distDir)) {
      this.log('error', 'Directorio dist/ no encontrado - Ejecutar npm run build');
      return;
    }

    // Verificar estructura del build
    const buildPaths = [
      'dist/server',
      'dist/client',
      'dist/client/_astro'
    ];

    buildPaths.forEach(buildPath => {
      if (fs.existsSync(path.join(rootDir, buildPath))) {
        this.log('success', `Build: ${buildPath} generado correctamente`);
      } else {
        this.log('error', `Build: ${buildPath} faltante`);
      }
    });

    // Verificar assets optimizados
    const astroDir = path.join(distDir, 'client', '_astro');
    if (fs.existsSync(astroDir)) {
      const files = fs.readdirSync(astroDir);
      
      const jsFiles = files.filter(f => f.endsWith('.js'));
      const cssFiles = files.filter(f => f.endsWith('.css'));
      const webpFiles = files.filter(f => f.endsWith('.webp'));

      if (jsFiles.length > 0) {
        this.log('success', `Build: ${jsFiles.length} archivos JS generados`);
        
        // Verificar que tengan hash en el nombre
        const hashedFiles = jsFiles.filter(f => /\\.[a-z0-9]{8}\\./i.test(f));
        if (hashedFiles.length === jsFiles.length) {
          this.log('success', 'Build: Todos los archivos JS tienen hash para caché');
        } else {
          this.log('warning', 'Build: Algunos archivos JS no tienen hash');
        }
      }

      if (cssFiles.length > 0) {
        this.log('success', `Build: ${cssFiles.length} archivos CSS generados`);
      }

      if (webpFiles.length > 0) {
        this.log('success', `Build: ${webpFiles.length} imágenes WebP optimizadas`);
      } else {
        this.log('info', 'Build: No se encontraron imágenes WebP optimizadas');
      }
    }
  }

  // Verificar configuración de seguridad
  checkSecurity() {
    // Verificar archivos sensibles no expuestos
    const sensitiveFiles = [
      '.env',
      '.env.development',
      '.env.local',
      'node_modules',
      'src'
    ];

    const distClientDir = path.join(rootDir, 'dist', 'client');
    if (fs.existsSync(distClientDir)) {
      sensitiveFiles.forEach(file => {
        if (!fs.existsSync(path.join(distClientDir, file))) {
          this.log('success', `Seguridad: ${file} no expuesto en dist/client`);
        } else {
          this.log('critical', `Seguridad: ${file} expuesto en build público`);
        }
      });
    }

    // Verificar variables de entorno de producción
    const envProdPath = path.join(rootDir, '.env.production');
    if (fs.existsSync(envProdPath)) {
      const envContent = fs.readFileSync(envProdPath, 'utf8');
      
      // Verificar que no contenga valores por defecto inseguros
      const insecurePatterns = [
        { pattern: /PASSWORD=.*admin.*$/mi, message: 'Contraseña por defecto detectada' },
        { pattern: /SECRET=.*test.*$/mi, message: 'Secret por defecto detectado' },
        { pattern: /TOKEN=.*test.*$/mi, message: 'Token por defecto detectado' }
      ];

      insecurePatterns.forEach(check => {
        if (check.pattern.test(envContent)) {
          this.log('critical', `Seguridad: ${check.message} en .env.production`);
        }
      });
    }
  }

  // Verificar optimización de imágenes
  checkImageOptimization() {
    const imagesDirs = [
      'public/webp',
      'public/avif',
      'public/images'
    ];

    imagesDirs.forEach(dir => {
      const fullPath = path.join(rootDir, dir);
      if (fs.existsSync(fullPath)) {
        const files = fs.readdirSync(fullPath);
        this.log('info', `Imágenes: ${files.length} archivos en ${dir}`);
      }
    });

    // Verificar script de optimización
    const processScript = path.join(rootDir, 'scripts', 'process-images.js');
    if (fs.existsSync(processScript)) {
      this.log('success', 'Script de optimización de imágenes disponible');
    } else {
      this.log('warning', 'Script de optimización de imágenes no encontrado');
    }
  }

  // Generar reporte final
  generateReport() {
    console.log('\n' + '='.repeat(80));
    console.log('📊 REPORTE DE AUDITORÍA DE PRODUCCIÓN');
    console.log('='.repeat(80));
    
    console.log(`\\n✅ VERIFICACIONES EXITOSAS: ${this.passed.length}`);
    console.log(`⚠️  ADVERTENCIAS: ${this.warnings.length}`);
    console.log(`❌ PROBLEMAS CRÍTICOS: ${this.issues.length}`);

    if (this.issues.length > 0) {
      console.log('\\n🚨 PROBLEMAS CRÍTICOS QUE REQUIEREN ATENCIÓN:');
      this.issues.forEach((issue, index) => {
        console.log(`${index + 1}. ${issue.message}`);
        if (issue.details) console.log(`   → ${issue.details}`);
      });
    }

    if (this.warnings.length > 0) {
      console.log('\\n⚠️  ADVERTENCIAS Y MEJORAS RECOMENDADAS:');
      this.warnings.forEach((warning, index) => {
        console.log(`${index + 1}. ${warning.message}`);
        if (warning.details) console.log(`   → ${warning.details}`);
      });
    }

    console.log('\\n📈 RECOMENDACIONES:');
    console.log('1. Ejecutar npm run build antes del despliegue');
    console.log('2. Verificar que todas las variables de entorno estén configuradas');
    console.log('3. Probar la configuración de Nginx antes del despliegue');
    console.log('4. Ejecutar npm run optimize-images para imágenes optimizadas');
    console.log('5. Configurar monitoreo de rendimiento en producción');

    console.log('\\n' + '='.repeat(80));
    
    const overallHealth = this.issues.length === 0 ? 
      (this.warnings.length <= 2 ? '🟢 EXCELENTE' : '🟡 BUENO') : 
      '🔴 REQUIERE ATENCIÓN';
      
    console.log(`ESTADO GENERAL: ${overallHealth}`);
    console.log('='.repeat(80));
  }

  // Ejecutar auditoría completa
  async run() {
    console.log('🔍 Iniciando auditoría de producción...');
    console.log('-'.repeat(50));

    this.checkCriticalFiles();
    this.checkAstroConfig();
    this.checkNginxConfig();
    this.checkProductionBuild();
    this.checkSecurity();
    this.checkImageOptimization();
    
    this.generateReport();
    
    // Código de salida basado en issues críticos
    process.exit(this.issues.length > 0 ? 1 : 0);
  }
}

// Ejecutar auditoría si se llama directamente
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  const audit = new ProductionAudit();
  audit.run().catch(console.error);
} else {
  // También ejecutar si no se detecta como main module pero se está ejecutando este archivo
  const audit = new ProductionAudit();
  audit.run().catch(console.error);
}

export default ProductionAudit;
