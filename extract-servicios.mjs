// Script para extraer servicios de servicios_completos.js a JSON
import { readFileSync, writeFileSync } from 'fs';

// Leer archivo de servicios
console.log('📂 Leyendo archivo de servicios...');
const content = readFileSync('src/data/servicios_completos.js', 'utf8');

// Reemplazar export para que sea evaluable
const evaluableContent = content.replace('export const', 'const');

// Evaluar el contenido de forma segura
let serviciosReales;
try {
    eval(evaluableContent);
} catch (error) {
    console.error('❌ Error evaluando archivo:', error.message);
    process.exit(1);
}

// Limpiar datos para Directus
const cleanedServicios = serviciosReales.map(item => ({
    id: item.id,
    Titulo: String(item.Titulo || '').substring(0, 255),
    Descripcion: String(item.Descripcion || ''),
    Area: String(item.Area || '').substring(0, 100),
    Cliente: String(item.Cliente || '').substring(0, 255),
    Presupuesto: parseInt(item.Presupuesto) || 0
})).filter(item => item.id && item.Titulo);

console.log(`✅ Extraídos ${cleanedServicios.length} servicios`);

// Guardar como JSON
writeFileSync('directus-servicios.json', JSON.stringify(cleanedServicios, null, 2), 'utf8');
console.log('💾 Archivo directus-servicios.json generado exitosamente');

console.log('📊 Resumen:');
console.log(`   • Total servicios: ${cleanedServicios.length}`);
console.log(`   • Primeros 3 títulos:`);
cleanedServicios.slice(0, 3).forEach((item, index) => {
    console.log(`     ${index + 1}. ${item.Titulo.substring(0, 50)}...`);
}); 