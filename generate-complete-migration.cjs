#!/usr/bin/env node

/**
 * GENERADOR DE MIGRACIÓN COMPLETA - 469 ANTECEDENTES
 * Convierte src/data/antecedentes_completos.js a SQL optimizado
 */

const fs = require('fs');
const path = require('path');

// Función para escapar strings SQL
function escapeSqlString(str) {
  if (!str) return 'NULL';
  return `'${str.toString().replace(/'/g, "''")}'`;
}

// Función para formatear fecha
function formatDate(dateStr) {
  if (!dateStr) return 'NULL';
  return `'${dateStr}'`;
}

// Función para formatear número
function formatNumber(num) {
  if (num === null || num === undefined) return 'NULL';
  return num.toString();
}

async function generateCompleteMigration() {
  console.log('🚀 INICIANDO GENERACIÓN DE MIGRACIÓN COMPLETA...');
  
  try {
    // 1. Leer archivo de antecedentes
    const antecedentesPath = path.join(__dirname, 'src/data/antecedentes_completos.js');
    console.log(`📁 Leyendo: ${antecedentesPath}`);
    
    if (!fs.existsSync(antecedentesPath)) {
      throw new Error(`❌ Archivo no encontrado: ${antecedentesPath}`);
    }
    
    // 2. Importar datos (usando eval para simular import)
    const fileContent = fs.readFileSync(antecedentesPath, 'utf8');
    const exportMatch = fileContent.match(/export const antecedentesReales = (\[[\s\S]*\]);/);
    
    if (!exportMatch) {
      throw new Error('❌ No se pudo extraer antecedentesReales del archivo');
    }
    
    // 3. Evaluar el array de datos
    const antecedentesData = eval(exportMatch[1]);
    console.log(`✅ Datos cargados: ${antecedentesData.length} antecedentes`);
    
    // 4. Generar header del SQL
    let sql = `-- MIGRACIÓN COMPLETA AUTOMÁTICA DE ${antecedentesData.length} ANTECEDENTES
-- Generado automáticamente el ${new Date().toISOString()}
-- Fuente: src/data/antecedentes_completos.js

-- Configuración para optimización
SET statement_timeout = '30min';
SET work_mem = '256MB';

-- Backup de datos actuales
CREATE TABLE antecedentes_backup_${Date.now()} AS SELECT * FROM antecedentes;

-- Limpiar tabla actual (mantener estructura)
TRUNCATE TABLE antecedentes RESTART IDENTITY CASCADE;

-- Insertar todos los ${antecedentesData.length} antecedentes en lotes optimizados
`;

    // 5. Generar inserts en lotes de 50 para optimización
    const batchSize = 50;
    let totalBatches = Math.ceil(antecedentesData.length / batchSize);
    
    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const startIndex = batchIndex * batchSize;
      const endIndex = Math.min(startIndex + batchSize, antecedentesData.length);
      const batch = antecedentesData.slice(startIndex, endIndex);
      
      sql += `\n-- LOTE ${batchIndex + 1}/${totalBatches}: Registros ${startIndex + 1}-${endIndex}\n`;
      sql += `INSERT INTO antecedentes (id, titulo, descripcion, imagen, fecha, cliente, unidad_de_negocio, area, presupuesto, date_created, date_updated) VALUES\n`;
      
      const values = batch.map((antecedente, index) => {
        const values = [
          formatNumber(antecedente.id),
          escapeSqlString(antecedente.Titulo),
          escapeSqlString(antecedente.Descripcion),
          escapeSqlString(antecedente.Imagen),
          formatDate(antecedente.Fecha),
          escapeSqlString(antecedente.Cliente),
          escapeSqlString(antecedente.Unidad_de_negocio),
          escapeSqlString(antecedente.Area),
          formatNumber(antecedente.Presupuesto),
          'NOW()',
          'NOW()'
        ];
        
        const isLast = index === batch.length - 1;
        return `(${values.join(', ')})${isLast ? ';' : ','}`;
      });
      
      sql += values.join('\n');
      sql += '\n';
    }
    
    // 6. Agregar verificaciones y optimizaciones
    sql += `
-- Verificación de la migración
SELECT 'MIGRACIÓN COMPLETADA:' as status;
SELECT COUNT(*) as total_antecedentes FROM antecedentes;
SELECT 'Primeros 5 registros:' as info;
SELECT id, titulo, cliente, fecha FROM antecedentes ORDER BY id LIMIT 5;
SELECT 'Últimos 5 registros:' as info;
SELECT id, titulo, cliente, fecha FROM antecedentes ORDER BY id DESC LIMIT 5;

-- Verificar integridad de imágenes
SELECT 'Imágenes únicas:' as info;
SELECT COUNT(DISTINCT imagen) as imagenes_unicas FROM antecedentes;

-- Estadísticas por área
SELECT 'Distribución por área:' as info;
SELECT area, COUNT(*) as cantidad FROM antecedentes GROUP BY area ORDER BY cantidad DESC;

-- Estadísticas por cliente
SELECT 'Top 10 clientes:' as info;
SELECT cliente, COUNT(*) as proyectos FROM antecedentes GROUP BY cliente ORDER BY proyectos DESC LIMIT 10;

-- Crear índices para performance
CREATE INDEX IF NOT EXISTS idx_antecedentes_cliente ON antecedentes(cliente);
CREATE INDEX IF NOT EXISTS idx_antecedentes_area ON antecedentes(area);
CREATE INDEX IF NOT EXISTS idx_antecedentes_fecha ON antecedentes(fecha);
CREATE INDEX IF NOT EXISTS idx_antecedentes_imagen ON antecedentes(imagen);
CREATE INDEX IF NOT EXISTS idx_antecedentes_titulo_search ON antecedentes USING gin(to_tsvector('spanish', titulo));
CREATE INDEX IF NOT EXISTS idx_antecedentes_descripcion_search ON antecedentes USING gin(to_tsvector('spanish', descripcion));

-- Configurar permisos de lectura pública
INSERT INTO directus_permissions (collection, action, permissions, validation, presets, fields, policy) 
VALUES ('antecedentes', 'read', '{}', '{}', NULL, '*', 'abf8a154-5b1c-4a46-ac9c-7300570f4f17') 
ON CONFLICT DO NOTHING;

-- Resultado final
SELECT 'MIGRACIÓN COMPLETA DE ' || COUNT(*) || ' ANTECEDENTES FINALIZADA' as resultado FROM antecedentes;
`;

    // 7. Escribir archivo SQL
    const outputPath = 'migrate-469-antecedentes-complete.sql';
    fs.writeFileSync(outputPath, sql);
    
    // 8. Generar estadísticas
    const uniqueClients = [...new Set(antecedentesData.map(a => a.Cliente))].length;
    const uniqueAreas = [...new Set(antecedentesData.map(a => a.Area))].length;
    const uniqueImages = [...new Set(antecedentesData.map(a => a.Imagen))].length;
    const totalPresupuesto = antecedentesData.reduce((sum, a) => sum + (a.Presupuesto || 0), 0);
    
    console.log('\n✅ MIGRACIÓN GENERADA EXITOSAMENTE');
    console.log('================================================');
    console.log(`📄 Archivo SQL: ${outputPath}`);
    console.log(`📊 Total antecedentes: ${antecedentesData.length}`);
    console.log(`👥 Clientes únicos: ${uniqueClients}`);
    console.log(`🏢 Áreas únicas: ${uniqueAreas}`);
    console.log(`🖼️ Imágenes únicas: ${uniqueImages}`);
    console.log(`💰 Presupuesto total: $${totalPresupuesto.toLocaleString()}`);
    console.log(`📦 Lotes generados: ${totalBatches} (${batchSize} registros/lote)`);
    console.log(`📏 Tamaño archivo: ${(fs.statSync(outputPath).size / 1024 / 1024).toFixed(2)} MB`);
    
    // 9. Crear script de ejecución
    const executeScript = `#!/bin/bash
# SCRIPT DE EJECUCIÓN DE MIGRACIÓN COMPLETA
# Generado automáticamente el ${new Date().toISOString()}

echo "🚀 INICIANDO MIGRACIÓN DE ${antecedentesData.length} ANTECEDENTES..."

# Verificar conectividad
echo "1️⃣ Verificando conectividad al servidor..."
ssh root@23.105.176.45 "docker exec -i fumbling-field-database-1 psql -U myuser -d mydatabase -c 'SELECT version();'" || {
  echo "❌ Error de conectividad. Verificar SSH y contenedores."
  exit 1
}

# Ejecutar migración
echo "2️⃣ Ejecutando migración completa..."
ssh root@23.105.176.45 "docker exec -i fumbling-field-database-1 psql -U myuser -d mydatabase" < ${outputPath}

# Verificar resultado
echo "3️⃣ Verificando migración..."
ssh root@23.105.176.45 "docker exec -i fumbling-field-database-1 psql -U myuser -d mydatabase -c 'SELECT COUNT(*) as total FROM antecedentes;'"

echo "✅ MIGRACIÓN COMPLETA FINALIZADA"
`;
    
    const executeScriptPath = 'execute-complete-migration.sh';
    fs.writeFileSync(executeScriptPath, executeScript);
    fs.chmodSync(executeScriptPath, '755');
    
    console.log(`🔧 Script de ejecución: ${executeScriptPath}`);
    console.log('\n🎯 PRÓXIMOS PASOS:');
    console.log(`   1. Ejecutar: ./${executeScriptPath}`);
    console.log(`   2. Verificar APIs: curl http://www.umbot.com.ar:8055/items/antecedentes`);
    console.log(`   3. Verificar frontend: http://localhost:4321/antecedentes`);
    
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  generateCompleteMigration();
}

module.exports = { generateCompleteMigration }; 