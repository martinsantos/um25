const fs = require('fs');

// Read the raw SGI data
const rawData = JSON.parse(fs.readFileSync('projects_export_sgi.json', 'utf8'));

// Rubro mapping based on observation
const RUBRO_MAP = {
  '19': 'Infraestructura Hospitalaria',
  '5': 'Aeropuertos & Telecomunicaciones',
  '4': 'Seguridad Electrónica & SDI',
  '23': 'Gobierno & Sector Público',
  '7': 'Gobierno & Sector Público',
  '53': 'Servicios Corporativos',
  '6': 'Industria & Bodegas', 
  // Add more if needed or default to general
};

const processed = rawData.map(item => {
  // Determine Area
  let area = RUBRO_MAP[item.rubro_categoria_id] || 'Soluciones Tecnológicas';
  
  // Heuristics for Area based on description keywords if rubro is generic
  const lowerDesc = item.descripcion.toLowerCase();
  const lowerClient = (item.cliente_nombre || '').toLowerCase();

  if (lowerDesc.includes('sdi') || lowerDesc.includes('incendio') || lowerDesc.includes('detector')) {
    area = 'Detección de Incendios & Seguridad';
  } else if (lowerDesc.includes('cctv') || lowerDesc.includes('camara') || lowerDesc.includes('cámara')) {
    area = 'Video Vigilancia & Seguridad';
  } else if (lowerDesc.includes('cableado') || lowerDesc.includes('red') || lowerDesc.includes('fibra') || lowerDesc.includes('fo ')) {
    area = 'Conectividad & Redes';
  } else if (lowerDesc.includes('data center') || lowerDesc.includes('datacenter')) {
    area = 'Infraestructura de Data Center';
  }

  // Refine Client
  let cliente = item.cliente_nombre || 'Cliente Confidencial';
  if (lowerClient.includes('aeropuertos') || lowerClient.includes('aa2000')) cliente = 'Aeropuertos Argentina 2000';
  if (lowerClient.includes('hospital') || lowerClient.includes('fuesmen')) cliente = item.cliente_nombre; // Keep full name for authority

  // Construct Title if generic
  let titulo = item.descripcion.length > 60 ? item.descripcion.substring(0, 60) + '...' : item.descripcion;
  if (titulo.toLowerCase().startsWith('servicio de') || titulo.toLowerCase().startsWith('mantenimiento')) {
    titulo = `${titulo} - ${cliente}`; 
  }

  return {
    id: item.id, // Keep original UUID or generate new? Original is fine unique string
    Titulo: titulo.replace(/"/g, ''),
    Descripcion: item.descripcion.replace(/"/g, ''),
    Imagen: 'default-project-icon', // We don't have images in SGI DB directly easily mapped yet
    Fecha: item.fecha ? item.fecha.split(' ')[0] : '2025-01-01',
    Cliente: cliente,
    Unidad_de_negocio: 'SGI-Import',
    Area: area,
    Presupuesto: 0 // Unknown
  };
});

// Filter out very minor entries (e.g. "mouse USB")
const filtered = processed.filter(p => {
  const d = p.Descripcion.toLowerCase();
  return !d.includes('mouse') && !d.includes('teclado') && !d.includes('toner') && !d.includes('ficha rj45');
});

// Generate JS output
const content = `// Data imported from SGI DB on ${new Date().toISOString()}
export const antecedentesSGI = ${JSON.stringify(filtered, null, 2)};
`;

fs.writeFileSync('src/data/antecedentes_sgi.js', content);
console.log(`Processed ${rawData.length} records into ${filtered.length} clean entries.`);
