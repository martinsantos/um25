const fs = require('fs');
const path = require('path');

const inputFile = path.join(__dirname, 'src/data/antecedentes_sgi.js');
const outputFile = path.join(__dirname, 'src/data/antecedentes_enhanced.js');
const imagesDir = path.join(__dirname, 'public/imagenes_antecedentes_versionproduccion');

// 1. READ ALL AVAILABLE UNIQUE IMAGES
let availableImages = [];
try {
    if (fs.existsSync(imagesDir)) {
        availableImages = fs.readdirSync(imagesDir).filter(f => f.match(/\.(png|jpg|jpeg|webp)$/i));
        console.log(`Found ${availableImages.length} unique images in ${imagesDir}`);
    } else {
        console.warn(`Warning: Images directory not found at ${imagesDir}`);
    }
} catch (e) {
    console.error("Error reading images directory:", e);
}

// Map of keywords for FALLBACK images (if no specific image found)
const fallbackMapping = [
  { keywords: ['bodega', 'viña', 'finca', 'wines', 'norton', 'esmeralda', 'nucete', 'cosecha', 'agricola', 'campo'], image: 'bodega_tech_overlay_1768237851113.png' },
  { keywords: ['sdi', 'incendio', 'detectores', 'humo', 'sheraton', 'hospital', 'alarma', 'evacuacion', 'seguridad fisica', 'matafuego', 'balizamiento'], image: 'fire_safety_industrial_sensors_1768237918477.png' },
  { keywords: ['cctv', 'camara', 'videovigilancia', 'seguridad', 'monitoreo', 'domo', 'ip', 'nvr', 'dvr', 'vigilancia', 'scanner', 'control de acceso'], image: 'security_camera_analytics_overlay_1768237955796.png' },
  { keywords: ['mantenimiento', 'soporte', 'infraestructura', 'rack', 'datos', 'redes', 'cableado', 'fibra', 'ups', 'data center', 'servidor', 'switch', 'telefonia', 'conmutador', 'wifi', 'ap', 'enlace', 'internet', 'bobina', 'cat.6', 'utp', 'tecnico', 'reparacion'], image: 'server_room_maintenance_tech_1768237985687.png' },
  { keywords: ['gobierno', 'municip', 'secretaria', 'ministerio', 'afip', 'atm', 'trazabilidad', 'digital', 'ciudad', 'departamento', 'publico', 'estado', 'fuesmen', 'hospital'], image: 'gobierno_digital_overlay_1768237887931.png' }
];

const fallbackImagesList = fallbackMapping.map(m => m.image);

// Helper to normalize strings for matching
function normalizeForMatch(str) {
    if (!str) return '';
    return str.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove accents
        .replace(/[^a-z0-9]/g, ""); // Remove non-alphanumeric
}

// Helper to enhance titles
function enhanceTitle(title, client, area, dateStr) {
    let lowerTitle = title.toLowerCase();
    let suffix = "";
    
    if (dateStr) {
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
            const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
            const month = months[date.getMonth()];
            const year = date.getFullYear();
            suffix = ` - ${month} ${year}`;
        }
    }

    if (lowerTitle.includes('mantenimiento') || lowerTitle.includes('soporte')) {
        let baseTitle = "";
        if (lowerTitle.includes('sdi') || lowerTitle.includes('incendio')) {
            baseTitle = `Mantenimiento Crítico de Sistemas de Detección`;
        } else if (lowerTitle.includes('cctv') || lowerTitle.includes('camara')) {
            baseTitle = `Gestión y Monitoreo de Seguridad Electrónica`;
        } else {
            baseTitle = `Soporte de Infraestructura IT de Alta Disponibilidad`;
        }
        return `${baseTitle} - ${client}${suffix}`;
    }

    if (lowerTitle.includes('cableado') || lowerTitle.includes('fibra')) {
        return `Implementación de Redes de Datos y Fibra Óptica - ${client}`;
    }

    if (lowerTitle.includes('software') || lowerTitle.includes('sistema') || lowerTitle.includes('licencia')) {
        return `Desarrollo de Software y Digitalización de Procesos - ${client}`;
    }

    if (title.length < 20) {
        return `${area}: ${title} - ${client}`;
    }

    return title; 
}

function enhanceDescription(desc, title, client) {
    if (!desc || desc === title || desc.length < 50) {
        return `Ejecución integral de ${title} para ${client}, asegurando continuidad operativa y cumplimiento de estándares técnicos de calidad. Solución implementada por el equipo de ingeniería de Última Milla.`;
    }
    return desc;
}

try {
    let content = fs.readFileSync(inputFile, 'utf8');
    
    // Extract array
    const arrayStart = content.indexOf('[');
    const arrayEnd = content.lastIndexOf(']');
    
    if (arrayStart === -1 || arrayEnd === -1) {
        throw new Error("Could not find array in file");
    }

    const jsonString = content.substring(arrayStart, arrayEnd + 1);
    let antecedentes = JSON.parse(jsonString);

    let specificMatchCount = 0;
    let fallbackCount = 0;
    
    const usedTitles = new Set();
    
    const enhanced = antecedentes.map((item, index) => {
        // ENHANCE TITLES
        const oldTitle = item.Titulo || "";
        let newTitle = enhanceTitle(oldTitle, item.Cliente || "", item.Area || "", item.Fecha);
        
        // Ensure uniqueness
        if (usedTitles.has(newTitle)) {
            let counter = 2;
            let distinctTitle = `${newTitle} (${counter})`;
            while (usedTitles.has(distinctTitle)) {
                counter++;
                distinctTitle = `${newTitle} (${counter})`;
            }
            newTitle = distinctTitle;
        }
        usedTitles.add(newTitle);

        const newDesc = enhanceDescription(item.Descripcion || "", newTitle, item.Cliente || "");

        // INTELLIGENT IMAGE ASSIGNMENT
        let assignedImage = null;
        
        // 1. Try to find a SPECIFIC image match
        // Matches if filename contains normalized client AND normalized title parts
        const normClient = normalizeForMatch(item.Cliente);
        // Take first 15 chars of title to avoid mismatch on long suffixes
        const normTitleShort = normalizeForMatch(oldTitle).substring(0, 15); 
        
        if (normClient.length > 3) {
             const manualMatch = availableImages.find(filename => {
                 const normFilename = normalizeForMatch(filename);
                 // Check if filename includes client and at least part of the title/area/keyword
                 return normFilename.includes(normClient);
             });
             
             if (manualMatch) {
                 // Use the existing logic for local path - but point to the correct folder
                 // NOTE: The filenames in 'availableImages' are physically in 'public/imagenes_antecedentes_versionproduccion'
                 // We will use the absolute path relative to web root so our component logic (checking for slash) works.
                 assignedImage = `/imagenes_antecedentes_versionproduccion/${manualMatch}`;
                 specificMatchCount++;
                 
                 // Remove from available so we don't reuse the exact same image too much if possible? 
                 // Actually, finding the *best* match involves scoring, but simple "includes client" is a huge step up 
                 // because the filenames have timestamps and are unique per project usually.
             }
        }

        // 2. Fallback to Generics if no specific match
        if (!assignedImage) {
            const searchText = (oldTitle + ' ' + (item.Cliente || '') + ' ' + (item.Area || '') + ' ' + (item.Unidad_de_negocio || '')).toLowerCase();
            
            for (const map of fallbackMapping) {
                if (map.keywords.some(k => searchText.includes(k))) {
                    assignedImage = `/images/generated/${map.image}`;
                    fallbackCount++;
                    break;
                }
            }
        }
        
        // 3. Last Resort Rotate
        if (!assignedImage) {
             const fallbackIndex = index % fallbackImagesList.length;
             assignedImage = `/images/generated/${fallbackImagesList[fallbackIndex]}`;
             fallbackCount++;
        }

        return {
            ...item,
            Titulo: newTitle,
            Descripcion: newDesc,
            Imagen: assignedImage, 
            imagen_generada: !!assignedImage // Flag
        };
    });

    const outputContent = `// ENHANCED SGI DATA - Generated on ${new Date().toISOString()}
// Optimized for SEO and Marketing Presentation

export const antecedentesEnhanced = ${JSON.stringify(enhanced, null, 2)};
`;

    fs.writeFileSync(outputFile, outputContent);
    console.log(`Successfully enhanced ${enhanced.length} records.`);
    console.log(`Specific Images Matched: ${specificMatchCount}`);
    console.log(`Fallback (Generic) Images: ${fallbackCount}`);
    console.log(`Written to ${outputFile}`);

} catch (err) {
    console.error("Error processing:", err);
    process.exit(1);
}
