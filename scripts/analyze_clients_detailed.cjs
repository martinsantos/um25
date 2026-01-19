
const fs = require('fs');
const path = require('path');

// 1. Load Data
const DATA_PATH = 'src/data/directus_fallback_offline.json';
const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));

// 2. Blacklists
const LOCATIONS = [
    "Mendoza", "Godoy Cruz", "Guaymallen", "Guaymallén", "Las Heras", 
    "Lujan", "Luján", "Lujan de Cuyo", "Luján de Cuyo", "Maipu", "Maipú", 
    "San Martin", "San Martín", "Rivadavia", "Junin", "Junín", 
    "Santa Rosa", "La Paz", "Lavalle", "Tupungato", "Tunuyan", "Tunuyán", 
    "San Carlos", "General Alvear", "Alvear", "Malargue", "Malargüe", 
    "San Rafael", "Capital", "Ciudad", "Argentina", "Cuyo"
].map(l => l.toUpperCase());

const MONTHS = [
    "ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", 
    "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"
];

const GENERIC_OBJS = [
    "EL SISTEMA", "LA RED", "LOS EQUIPOS", "LAS INSTALACIONES", 
    "EDIFICIO", "PLANTA", "SUCURSAL", "CASA", "OFICINA", "LOCAL", 
    "NAVE", "BODEGA", "FINCA", "HOTEL", "HOSPITAL", "CLINICA", 
    "ESCUELA", "COLEGIO", "UNIVERSIDAD", "MUNICIPIO", "GOBIERNO", 
    "PROVINCIA", "NACION", "CLIENTE CONFIDENCIAL", "SISTEMAS", 
    "ENLACE", "INTERNET", "SOFTWARE", "SOLUCIONES", "TECNOLOGIAS",
    "RED", "DATOS", "FIBRA", "OPTICA", "CABLEADO", "ESTRUCTURADO",
    "CAMARA", "CCTV", "CONTROL", "ACCESO", "DETECCION", "INCENDIO",
    "ALARMA", "INTRUSION", "CENTRAL", "TELEFONICA", "RADIO",
    "SERVIDOR", "VIRTUALIZACION", "BACKUP", "STORAGE", "UPS",
    "GENERADOR", "TABLERO", "LUMINARIA", "LED", "SOLAR", "ENERGIA",
    "DOMOTICA", "INMOTICA"
];

// Helper to check if text is significantly a location or generic
function isInvalidCandidate(text) {
    if (!text || text.length < 3) return true;
    const upper = text.toUpperCase().trim();
    
    if (LOCATIONS.includes(upper)) return true;
    if (GENERIC_OBJS.includes(upper)) return true;
    
    // Check if it starts with a Month (common pattern "Abril 2024")
    const firstWord = upper.split(' ')[0];
    if (MONTHS.includes(firstWord)) return true;

    return false;
}

// 3. Extraction Logic
const results = [];

data.antecedentes.forEach(item => {
    // Only interest in "Cliente Confidencial" or empty clients
    if (!item.Cliente || item.Cliente.toUpperCase().includes("CONFIDENCIAL")) {
        
        // Clean the description first to remove "Cliente Confidencial" noise
        let desc = item.Descripcion || "";
        // Case insensitive removal
        desc = desc.replace(/Cliente\s+Confidencial/gi, ""); 
        
        let candidate = null;

        // Pattern 1: "para [Client] ," or "para [Client] ." or "para [Client] aseg"
        const matchPara = desc.match(/para\s+([^,.\-]+?)(?:\s+(?:,|y|asegurando|con|en)\b|\.|$)/i);
        
        if (matchPara && matchPara[1]) {
            let potential = matchPara[1].trim();
            potential = potential.replace(/\s+(el|la|los|las|lo)\s+cual.*$/i, "");
            
            if (!isInvalidCandidate(potential)) {
                candidate = potential;
            }
        }

        // Context: "Ejecución integral de [Servicio] - [CLIENTE]"
        if (!candidate) {
            const matchDash = desc.match(/-\s+([^-]+?)(?:\s+(?:,|y|asegurando)\b|\.|$)/);
            if (matchDash && matchDash[1]) {
                let potential = matchDash[1].trim();
                // Fix common dash issue: "IT - Infraestructura"
                if (!isInvalidCandidate(potential) && potential.length < 40) { 
                     candidate = potential;
                }
            }
        }

        results.push({
            id: item.id,
            original_client: item.Cliente,
            extracted: candidate || "UKNOWN_REQUIRES_MANUAL",
            description: item.Descripcion // Keep original for context
        });
    }
});

// 4. Generate Markdown Report
let mdContent = "# Candidate Client Name Corrections\n\nPlease review the extracted names. If a name is 'UKNOWN_REQUIRES_MANUAL' or incorrect, ignore it or specify manually.\n\n";
mdContent += "| ID | Original | Extracted Candidate | Context (Description Snip) |\n";
mdContent += "|---|---|---|---|\n";

results.forEach(r => {
    // Snip description around the candidate if possible, or start
    let snip = r.description.length > 60 ? r.description.substring(0, 60) + "..." : r.description;
    
    // Highlight syntax
    const candidateDisplay = r.extracted === "UKNOWN_REQUIRES_MANUAL" 
        ? "❌ *MANUAL CHECK*" 
        : `**${r.extracted}**`;

    mdContent += `| ${r.id} | ${r.original_client} | ${candidateDisplay} | ${snip} |\n`;
});

fs.writeFileSync('CLIENT_CORRECTION_PREVIEW.md', mdContent);
console.log(`Generated preview for ${results.length} items.`);
