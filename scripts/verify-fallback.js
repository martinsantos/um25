import fs from 'fs';
import path from 'path';
import fallbackData from '../src/data/directus_fallback_offline.json' with { type: 'json' };

async function verify() {
    console.log('--- FALLBACK VERIFICATION REPORT ---');
    const totalAntecedentes = fallbackData.antecedentes.length;
    const totalServicios = fallbackData.servicios.length;
    
    console.log(`Total Antecedentes: ${totalAntecedentes}`);
    console.log(`Total Servicios: ${totalServicios}`);
    
    let withLocalImage = 0;
    const missingImages = [];

    for (const item of fallbackData.antecedentes) {
        if (item.LocalFallbackImage) {
            const fullPath = path.join('public', item.LocalFallbackImage);
            if (fs.existsSync(fullPath)) {
                withLocalImage++;
            } else {
                missingImages.push({ id: item.id, title: item.Titulo, path: item.LocalFallbackImage });
            }
        }
    }

    console.log(`Antecedentes with Local Image: ${withLocalImage} (${((withLocalImage/totalAntecedentes)*100).toFixed(1)}%)`);
    
    if (missingImages.length > 0) {
        console.warn(`⚠️ Warning: ${missingImages.length} items have paths but files are missing in public/img/sync-offline/`);
    }

    console.log('------------------------------------');
    if (withLocalImage > 400 || (withLocalImage > 200 && totalAntecedentes > 400)) {
        console.log('✅ Fallback system is ROBUST and ready.');
    } else {
        console.log('⚠️ Fallback coverage is lower than expected.');
    }
}

verify();
