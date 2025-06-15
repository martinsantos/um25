import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';
import * as fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure sharp for better memory management
sharp.cache(false);
sharp.concurrency(1);

const publicDir = path.join(path.dirname(__dirname), 'public');
const cacheDir = path.join(publicDir, 'cache');

const sourceDir = path.join(__dirname, '../public/images');
const webpDir = path.join(__dirname, '../public/webp');

// Asegurarse de que el directorio webp existe
if (!fs.existsSync(webpDir)) {
    fs.mkdirSync(webpDir, { recursive: true });
}

async function processImage(file) {
    const sourcePath = path.join(sourceDir, file);
    const webpPath = path.join(webpDir, file.replace(/\.[^.]+$/, '.webp'));

    try {
        await sharp(sourcePath)
            .webp({ quality: 80 })
            .toFile(webpPath);
        console.log(`✅ Convertida: ${file} -> ${path.basename(webpPath)}`);
    } catch (error) {
        console.error(`❌ Error procesando ${file}:`, error.message);
    }
}

async function processAllImages() {
    console.log('🔄 Iniciando procesamiento de imágenes...');
    
    const files = fs.readdirSync(sourceDir)
        .filter(file => /\.(jpg|jpeg|png)$/i.test(file));

    for (const file of files) {
        await processImage(file);
    }

    console.log('✨ Procesamiento de imágenes completado');
}

processAllImages().catch(console.error);

// Placeholder for image processing
// This is a minimal version - you may want to add actual image processing logic
console.log('Starting image processing...');

try {
    if (!fs.existsSync(publicDir)) {
        console.log('Public directory not found, creating it...');
        fs.mkdirSync(publicDir, { recursive: true });
    }
    
    console.log('Image processing completed successfully');
} catch (error) {
    console.error('Error processing images:', error);
    process.exit(1);
}
