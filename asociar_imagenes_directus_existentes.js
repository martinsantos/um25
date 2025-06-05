import fs from 'fs/promises';

async function asociarImagenesDirectusExistentes() {
    let antecedentes;
    try {
        const data = await fs.readFile('./antev3.json', 'utf-8');
        antecedentes = JSON.parse(data);
    } catch (e) {
        console.error('No se pudo leer el archivo de antecedentes:', e.message);
        process.exit(1);
    }

    // Leer el archivo JSON de imágenes
    let datosImagenes;
    try {
        const imagenesData = await fs.readFile('./datos_imagenes_para_directus_20250415_181330.json', 'utf-8');
        datosImagenes = JSON.parse(imagenesData);
    } catch (e) {
        console.error('No se pudo leer el archivo de imágenes:', e.message);
        process.exit(1);
    }

    let asociados = 0, sinImagen = 0, sinItem = 0;
    for (const ant of antecedentes) {
        const imagenData = datosImagenes.find(img => img.titulo_original === ant.Titulo);
        if (imagenData) {
            const fileId = imagenData.nombre_archivo_generado; 
            let items = [];
            try {
                items = await buscarItemsPorTitulo(ant.Titulo, token);
            } catch (e) {
                console.error(`Error buscando antecedente '${ant.Titulo}':`, e.message);
                continue;
            }
            if (!items.length) {
                sinItem++;
                continue;
            }
            for (const item of items) {
                try {
                    await actualizarItemConImagen(item.id, fileId, token);
                    asociados++;
                } catch (e) {
                    console.error(`Error asociando imagen a item ID ${item.id}:`, e.message);
                }
            }
        } else {
            sinImagen++;
        }
    }
    console.log(`\nResumen: Asociados: ${asociados}, Sin imagen: ${sinImagen}, Sin antecedente: ${sinItem}`);
}

// --- Ejecución ---
asociarImagenesDirectusExistentes().catch(e => {
    console.error('Error inesperado:', e.message);
    process.exit(1);
});