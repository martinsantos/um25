const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');
const glob = require('glob');

const SIZES = [320, 640, 800, 1024, 1280, 1920];
const FORMATS = ['webp', 'jpeg'];
const QUALITY = 80;

async function processImage(inputPath) {
    try {
        // Verificar si el archivo existe antes de procesarlo
        try {
            await fs.access(inputPath);
        } catch {
            console.warn(`Archivo no encontrado: ${inputPath} - saltando procesamiento`);
            return;
        }

        const dir = path.dirname(inputPath);
        const filename = path.basename(inputPath, path.extname(inputPath));
        const cacheDir = path.join('public', 'cache');

        // Asegurar que existe el directorio de caché
        await fs.mkdir(cacheDir, { recursive: true });

        // Procesar cada tamaño y formato
        for (const size of SIZES) {
            for (const format of FORMATS) {
                const outputPath = path.join(cacheDir, `${filename}-${size}.${format}`);
                
                try {
                    await sharp(inputPath)
                        .resize(size, null, {
                            withoutEnlargement: true,
                            fit: 'inside'
                        })
                        [format]({ quality: QUALITY })
                        .toFile(outputPath);
                    
                    console.log(`Procesado: ${outputPath}`);
                } catch (error) {
                    console.warn(`Error procesando ${inputPath} a ${outputPath}:`, error);
                }
            }
        }
    } catch (error) {
        console.warn(`Error general procesando ${inputPath}:`, error);
    }
}

async function processAllImages() {
    try {
        // Encontrar todas las imágenes en la carpeta public
        const images = glob.sync('public/**/*.{jpg,jpeg,png}', {
            ignore: ['public/cache/**']
        });

        console.log(`Found ${images.length} images to process`);

        // Procesar todas las imágenes
        await Promise.all(images.map(processImage));

        console.log('All images processed successfully');
    } catch (error) {
        console.error('Error processing images:', error);
        process.exit(1);
    }
}

// Ejecutar el procesamiento
processAllImages();
