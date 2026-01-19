
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('src/data/directus_fallback_offline.json', 'utf8'));

const proposedCorrections = [];

data.antecedentes.forEach(item => {
    const id = item.id;
    const client = (item.Cliente || "").trim();
    const area = item.Area || "";
    const titulo = item.Titulo || "";
    const desc = item.Descripcion || "";
    const fullText = `${titulo} ${desc} ${client}`.toLowerCase();
    let suggestedArea = area;

    if (fullText.includes("municipio") || fullText.includes("municipalidad") || fullText.includes("gobierno") || fullText.includes("ministerio") || fullText.includes("irrigación") || fullText.includes("secretaria ambiente")) {
        if (area !== "Gobierno & Sector Público") suggestedArea = "Gobierno & Sector Público";
    }

    if (fullText.includes("hospital") || fullText.includes("clínica") || fullText.includes("sanatorio") || fullText.includes("salud de la mujer") || fullText.includes("fuesmen")) {
        if (area !== "Salud & Sector Salud") suggestedArea = "Salud & Sector Salud";
    }

    if (fullText.includes("aeropuerto") || fullText.includes("aa2000") || fullText.includes("avianca")) {
        if (area !== "Aeropuertos & Telecomunicaciones") suggestedArea = "Aeropuertos & Telecomunicaciones";
    }

    if (suggestedArea !== area) {
        proposedCorrections.push({ id, area: suggestedArea });
    }
});

const scriptContent = `
import { createDirectus, rest, authentication, updateItem } from '@directus/sdk';

const DIRECTUS_URL = 'http://localhost:8055';
const EMAIL = 'admin@umbot.com.ar';
const PASSWORD = 'UmbotAdmin2025!';

const CORRECTIONS = ${JSON.stringify(proposedCorrections, null, 2)};

const client = createDirectus(DIRECTUS_URL)
    .with(rest())
    .with(authentication('json', { autoRefresh: true }));

async function apply() {
    try {
        await client.login(EMAIL, PASSWORD);
        console.log("✅ Authenticated.");
    } catch (e) {
        console.error("❌ Auth Failed:", e.message);
        process.exit(1);
    }
    
    let success = 0;
    for (const item of CORRECTIONS) {
        try {
            await client.request(updateItem('Antecedentes', item.id, {
                Area: item.area
            }));
            process.stdout.write(".");
            success++;
        } catch (error) {
            console.error(\`\\n❌ Error ID \${item.id}:\`, error.message);
        }
    }
    console.log(\`\\nFinished. Success: \${success}/\${CORRECTIONS.length}\`);
}
apply();
`;

fs.writeFileSync('scripts/apply_category_corrections.js', scriptContent);
console.log("Generated scripts/apply_category_corrections.js");
