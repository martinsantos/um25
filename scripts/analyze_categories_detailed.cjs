
const fs = require('fs');
const path = require('path');

// 1. Load Data
const DATA_PATH = 'src/data/directus_fallback_offline.json';
const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));

// 2. Identification Logic
// 2. Detection & Correction Logic
const proposedCorrections = [];

data.antecedentes.forEach(item => {
    const id = item.id;
    const client = (item.Cliente || "").trim();
    const area = item.Area || "";
    const titulo = item.Titulo || "";
    const desc = item.Descripcion || "";

    const fullText = `${titulo} ${desc} ${client}`.toLowerCase();
    let suggestedArea = area;

    // RULE 1: Government/Public Sector Mismatches
    if (fullText.includes("municipio") || fullText.includes("municipalidad") || fullText.includes("gobierno") || fullText.includes("ministerio") || fullText.includes("irrigación") || fullText.includes("secretaria ambiente")) {
        if (area !== "Gobierno & Sector Público") {
            suggestedArea = "Gobierno & Sector Público";
        }
    }

    // RULE 2: Hospital/Healthcare Mismatches
    if (fullText.includes("hospital") || fullText.includes("clínica") || fullText.includes("sanatorio") || fullText.includes("salud de la mujer") || fullText.includes("fuesmen")) {
        if (area !== "Salud & Sector Salud") {
            suggestedArea = "Salud & Sector Salud";
        }
    }

    // RULE 3: Airport Mismatches (If not in Aeropuertos but mentions Aeropuerto)
    if (fullText.includes("aeropuerto") || fullText.includes("aa2000") || fullText.includes("avianca")) {
        if (area !== "Aeropuertos & Telecomunicaciones") {
            suggestedArea = "Aeropuertos & Telecomunicaciones";
        }
    }

    // RULE 4: Data Center Mismatches
    if (fullText.includes("data center") || fullText.includes("datacenter") || fullText.includes("piso técnico")) {
        if (area !== "Infraestructura de Data Center" && area !== "Conectividad & Redes") { // It might be Conectividad, but Infra is more specific
             // suggestedArea = "Infraestructura de Data Center";
        }
    }

    // Flag if suggested is different
    if (suggestedArea !== area) {
        proposedCorrections.push({
            id,
            client,
            currentArea: area,
            suggestedArea,
            context: titulo
        });
    }
});

// 3. Generate Report
let mdContent = "# Proposed Category Corrections (Vertical Mismatches)\n\n";
mdContent += "| ID | Cliente | Current Area | Suggested Area | Context |\n";
mdContent += "|---|---|---|---|---|\n";

proposedCorrections.forEach(p => {
    mdContent += `| ${p.id} | ${p.client} | ${p.currentArea} | **${p.suggestedArea}** | ${p.context.substring(0, 50)}... |\n`;
});

fs.writeFileSync('CATEGORY_CORRECTIONS_PROPOSAL.md', mdContent);
console.log(`Generated proposal with ${proposedCorrections.length} corrections.`);
