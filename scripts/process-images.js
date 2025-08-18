import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';
import * as fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure sharp for better memory management and performance
sharp.cache(false);
sharp.concurrency(1);

const publicDir = path.join(path.dirname(__dirname), 'public');
const sourceDir = path.join(__dirname, '../public/images');
const webpDir = path.join(__dirname, '../public/webp');
const avifDir = path.join(__dirname, '../public/avif');

// Crear directorios de salida si no existen
[webpDir, avifDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Configuraciones de calidad por formato
const qualitySettings = {
    webp: 85,
    avif: 80,
    jpeg: 85,
    png: 90
};

// Configuraciones de compresión por tamaño
const compressionConfig = {
    small: { width: 400, quality: 90 },
    medium: { width: 800, quality: 85 },
    large: { width: 1200, quality: 80 },
    xlarge: { width: 1920, quality: 75 }
};

async function processImage(file) {
    const sourcePath = path.join(sourceDir, file);
    const fileName = path.parse(file).name;
    const webpPath = path.join(webpDir, `${fileName}.webp`);
    const avifPath = path.join(avifDir, `${fileName}.avif`);

    try {
        // Obtener metadatos de la imagen
        const metadata = await sharp(sourcePath).metadata();
        console.log(`📊 Procesando ${file}: ${metadata.width}x${metadata.height}, ${metadata.format}`);

        // Generar versión WebP optimizada
        await sharp(sourcePath)
            .webp({ 
                quality: qualitySettings.webp,
                effort: 6 // Mayor esfuerzo de compresión
            })
            .toFile(webpPath);
        
        // Generar versión AVIF (más moderna y eficiente)
        try {
            await sharp(sourcePath)
                .avif({ 
                    quality: qualitySettings.avif,
                    effort: 6
                })
                .toFile(avifPath);
            console.log(`✅ Convertida: ${file} -> WebP + AVIF`);
        } catch (avifError) {
            console.log(`⚠️  AVIF no soportado para ${file}, solo WebP generado`);
        }

        // Generar versiones responsivas para imágenes grandes
        if (metadata.width > 800) {
            await generateResponsiveVersions(sourcePath, fileName);
        }

        // Mostrar estadísticas de compresión
        await showCompressionStats(sourcePath, webpPath, avifPath);
        
    } catch (error) {
        console.error(`❌ Error procesando ${file}:`, error.message);
    }
}

async function generateResponsiveVersions(sourcePath, fileName) {
    const responsiveDir = path.join(webpDir, 'responsive');
    if (!fs.existsSync(responsiveDir)) {
        fs.mkdirSync(responsiveDir, { recursive: true });
    }

    for (const [size, config] of Object.entries(compressionConfig)) {
        try {
            const outputPath = path.join(responsiveDir, `${fileName}-${size}.webp`);
            await sharp(sourcePath)
                .resize(config.width, null, {
                    withoutEnlargement: true,
                    fit: 'inside'
                })
                .webp({ 
                    quality: config.quality,
                    effort: 6
                })
                .toFile(outputPath);
        } catch (error) {
            console.error(`Error generando versión ${size} para ${fileName}:`, error.message);
        }
    }
}

async function showCompressionStats(originalPath, webpPath, avifPath) {
    try {
        const originalStats = fs.statSync(originalPath);
        const webpStats = fs.existsSync(webpPath) ? fs.statSync(webpPath) : null;
        const avifStats = fs.existsSync(avifPath) ? fs.statSync(avifPath) : null;

        const originalSize = (originalStats.size / 1024).toFixed(1);
        const webpSize = webpStats ? (webpStats.size / 1024).toFixed(1) : 'N/A';
        const avifSize = avifStats ? (avifStats.size / 1024).toFixed(1) : 'N/A';
        
        const webpSavings = webpStats ? ((1 - webpStats.size / originalStats.size) * 100).toFixed(1) : 'N/A';
        const avifSavings = avifStats ? ((1 - avifStats.size / originalStats.size) * 100).toFixed(1) : 'N/A';

        console.log(`💾 Tamaños: Original: ${originalSize}KB, WebP: ${webpSize}KB (-${webpSavings}%), AVIF: ${avifSize}KB (-${avifSavings}%)`);
    } catch (error) {
        console.error('Error calculando estadísticas:', error.message);
    }
}

async function processAllImages() {
    console.log('🔄 Iniciando procesamiento optimizado de imágenes...');
    console.log('📁 Directorios:', { sourceDir, webpDir, avifDir });
    
    if (!fs.existsSync(sourceDir)) {
        console.log('📂 Directorio de imágenes no encontrado, creándolo...');
        fs.mkdirSync(sourceDir, { recursive: true });
        console.log('✅ Directorio creado. Coloca imágenes en public/images/');
        return;
    }

    const files = fs.readdirSync(sourceDir)
        .filter(file => /\.(jpg|jpeg|png|gif|tiff|bmp)$/i.test(file));

    if (files.length === 0) {
        console.log('📷 No se encontraron imágenes para procesar en public/images/');
        return;
    }

    console.log(`🎯 Procesando ${files.length} imágenes...`);
    
    for (const file of files) {
        await processImage(file);
        console.log('---');
    }

    console.log('✨ Procesamiento de imágenes completado');
    console.log('🎉 Archivos generados en:', { webpDir, avifDir });
}

// Ejecutar el procesamiento principal
processAllImages().catch(error => {
    console.error('💥 Error en el procesamiento:', error);
    process.exit(1);
});

// Verificación básica de directorio público
console.log('🚀 Iniciando optimización de imágenes...');

try {
    if (!fs.existsSync(publicDir)) {
        console.log('📁 Directorio público no encontrado, creándolo...');
        fs.mkdirSync(publicDir, { recursive: true });
    }
    
    console.log('✅ Verificación inicial completada');
} catch (error) {
    console.error('❌ Error en verificación inicial:', error);
    process.exit(1);
}
