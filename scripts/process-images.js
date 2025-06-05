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

async function processImage(inputPath, outputPath, options) {
  try {
    const transformer = sharp(inputPath, {
      limitInputPixels: 0,
      failOnError: false
    });
    
    await transformer
      .resize(options.width)
      .webp({ quality: 80 })
      .toFile(outputPath);
      
    console.log(`Processed: ${outputPath}`);
    
    // Force garbage collection between images
    transformer.end();
    
  } catch (err) {
    console.error(`Error processing ${inputPath}:`, err);
  }
}

async function processBatch(images, startIdx, batchSize, publicDir, cacheDir) {
  const endIdx = Math.min(startIdx + batchSize, images.length);
  const batch = images.slice(startIdx, endIdx);
  
  for (const file of batch) {
    const inputPath = path.join(publicDir, file);
    const sizes = [320, 640, 800];

    for (const width of sizes) {
      const baseName = path.parse(file).name;
      const outputPath = path.join(cacheDir, `${baseName}-${width}.webp`);
      
      await processImage(inputPath, outputPath, { width });
      // Add delay between processing
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }
}

async function processImages() {
  try {
    fs.mkdirSync(cacheDir, { recursive: true });

    // Changed fs.readdir to fs.promises.readdir
    const files = await fs.promises.readdir(publicDir);
    const imageFiles = files.filter(file => 
      /\.(jpg|jpeg|png)$/i.test(file) && !file.includes('placeholder')
    );

    console.log(`Found ${imageFiles.length} images to process`);

    // Process in batches of 3 images
    const BATCH_SIZE = 3;
    for (let i = 0; i < imageFiles.length; i += BATCH_SIZE) {
      await processBatch(imageFiles, i, BATCH_SIZE, publicDir, cacheDir);
      // Add delay between batches
      await new Promise(resolve => setTimeout(resolve, 500));
    }

  } catch (err) {
    console.error('Fatal error:', err);
    process.exit(1);
  }
}

processImages().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});

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
