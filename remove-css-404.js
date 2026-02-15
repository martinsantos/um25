import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Función para remover las referencias CSS 404 del HTML
function removeCss404References(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf-8');
    
    // Remover las líneas de Layout.css e index-optimized.css
    content = content.replace(/<link rel="stylesheet" href="\/Layout\.css"><\/link>/g, '');
    content = content.replace(/<link rel="stylesheet" href="\/Layout\.css">/g, '');
    content = content.replace(/<link rel="stylesheet" href="\/index-optimized\.css"><\/link>/g, '');
    content = content.replace(/<link rel="stylesheet" href="\/index-optimized\.css">/g, '');
    
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`✅ Removidas referencias CSS 404 de: ${filePath}`);
  } catch (error) {
    console.error(`❌ Error procesando ${filePath}:`, error.message);
  }
}

// Procesar todos los archivos HTML en dist
function processDistFolder(distPath) {
  if (!fs.existsSync(distPath)) {
    console.log(`⚠️ Carpeta dist no encontrada: ${distPath}`);
    return;
  }

  const files = fs.readdirSync(distPath);
  
  files.forEach(file => {
    const filePath = path.join(distPath, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      processDistFolder(filePath);
    } else if (file.endsWith('.html')) {
      removeCss404References(filePath);
    }
  });
}

// Ejecutar
const distPath = path.join(__dirname, 'dist', 'client');
console.log('🔍 Buscando archivos HTML en:', distPath);
processDistFolder(distPath);
console.log('✅ Proceso completado');
