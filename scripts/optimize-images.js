const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const glob = require('glob');

const SIZES = [320, 640, 960, 1280];
const QUALITY = 80;

async function optimizeImage(inputPath) {
    const dir = path.dirname(inputPath);
    const ext = path.extname(inputPath);
    const name = path.basename(inputPath, ext);

    // Procesar cada tamaño
    for (const width of SIZES) {
        const outputPath = path.join(dir, `${name}-${width}${ext}`);
        
        await sharp(inputPath)
            .resize(width, null, {
                withoutEnlargement: true,
                fit: 'inside'
            })
            .jpeg({ quality: QUALITY })
            .toFile(outputPath);
        
        console.log(`Optimized: ${outputPath}`);
    }
}

async function processImages() {
    const images = glob.sync('public/**/*.{jpg,jpeg,png}');
    
    for (const image of images) {
        try {
            await optimizeImage(image);
        } catch (error) {
            console.error(`Error processing ${image}:`, error);
        }
    }
}

processImages().catch(console.error);
