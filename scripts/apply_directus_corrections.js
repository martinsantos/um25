
import { createDirectus, rest, authentication, updateItem } from '@directus/sdk';

const DIRECTUS_URL = 'http://localhost:8055';
const EMAIL = 'admin@umbot.com.ar';
const PASSWORD = 'UmbotAdmin2025!';

// The Definitive Correction Map
const CORRECTIONS = [
    { id: 3509, client: "Estadio Malvinas Argentinas" },
    { id: 3527, client: "Aeropuerto de Mendoza" },
    { id: 3383, client: "Gate 7/24" },
    { id: 3557, client: "Palacio Policial" },
    { id: 3516, client: "H. Cámara de Senadores" },
    { id: 3515, client: "Rugby Championship" },
    { id: 3512, client: "Aseguradora de Cauciones S.A." },
    { id: 3518, client: "Copa Airlines" },
    { id: 3532, client: "Hospital Perrupato" },
    { id: 3382, client: "Municipalidad de Guaymallén" },
    { id: 3572, client: "Aeropuertos Argentina 2000" },
    { id: 3288, client: "Irrigación" },
    { id: 3531, client: "Aeropuerto de Mendoza" },
    { id: 3553, client: "PSA (Policía Seg. Aeroportuaria)" },
    { id: 3566, client: "Aeropuerto de Mendoza" },
    { id: 3567, client: "Adicional Emilio Civit" },
    { id: 3087, client: "Aeropuertos Argentina 2000" },
    { id: 3079, client: "Municipalidad de Guaymallén" }
];

console.log(`Initialized Directus Client for ${DIRECTUS_URL}`);
console.log(`Applying ${CORRECTIONS.length} corrections...`);

// SDK v15+ Syntax with Auth
const client = createDirectus(DIRECTUS_URL)
    .with(rest())
    .with(authentication('json', { autoRefresh: true }));

async function apply() {
    let success = 0;
    let errors = 0;
    
    try {
        console.log("Authenticating as Admin...");
        await client.login(EMAIL, PASSWORD);
        console.log("✅ Authenticated.");
    } catch (e) {
        console.error("❌ Auth Failed:", e.message);
        process.exit(1);
    }
    
    for (const item of CORRECTIONS) {
        try {
            console.log(`Updating ID ${item.id} -> ${item.client}...`);
            await client.request(updateItem('Antecedentes', item.id, {
                Cliente: item.client
            }));
            console.log(`✅ Success: ${item.id}`);
            success++;
        } catch (error) {
            console.error(`❌ Error updating ID ${item.id}:`, error);
            // Try to log nested details if available
            if (error.errors) console.error("Details:", JSON.stringify(error.errors, null, 2));
            errors++;
        }
    }

    console.log("-".repeat(50));
    console.log(`Finished. Success: ${success}, Errors: ${errors}`);
    
    if (errors === 0) {
        process.exit(0);
    } else {
        process.exit(1);
    }
}

apply();
