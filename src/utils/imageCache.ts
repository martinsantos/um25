import NodeCache from 'node-cache';
import sharp from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';

// Configuración del caché
const cache = new NodeCache({
    stdTTL: 3600, // 1 hora de tiempo de vida
    checkperiod: 600, // Revisar caducidad cada 10 minutos
});

// Directorio para el caché de imágenes
const CACHE_DIR = path.join(process.cwd(), 'public', 'cache');

// Asegurar que el directorio de caché existe
async function ensureCacheDir() {
    try {
        await fs.access(CACHE_DIR);
    } catch {
        await fs.mkdir(CACHE_DIR, { recursive: true });
    }
}

// Generar un hash único para la imagen y sus opciones
function generateImageKey(imagePath: string, width: number, height?: number, format?: string): string {
    const key = `${imagePath}-${width}-${height || 'auto'}-${format || 'original'}`;
    return key.replace(/[^a-z0-9]/gi, '_');
}

// Procesar y cachear una imagen
export async function processAndCacheImage(
    imagePath: string,
    width: number,
    height?: number,
    format: 'jpeg' | 'webp' | 'png' = 'webp'
): Promise<string> {
    await ensureCacheDir();

    const cacheKey = generateImageKey(imagePath, width, height, format);
    const cachedPath = path.join(CACHE_DIR, `${cacheKey}.${format}`);

    // Verificar si la imagen está en caché
    if (cache.has(cacheKey)) {
        return cachedPath;
    }

    try {
        // Verificar si el archivo cacheado existe
        try {
            await fs.access(cachedPath);
            cache.set(cacheKey, cachedPath);
            return cachedPath;
        } catch {
            // El archivo no existe, procesarlo
        }

        // Procesar la imagen
        const absoluteImagePath = path.join(process.cwd(), 'public', imagePath);
        let sharpInstance = sharp(absoluteImagePath).resize(width, height, {
            fit: 'cover',
            position: 'center'
        });

        // Convertir al formato deseado
        switch (format) {
            case 'jpeg':
                sharpInstance = sharpInstance.jpeg({ quality: 80 });
                break;
            case 'webp':
                sharpInstance = sharpInstance.webp({ quality: 80 });
                break;
            case 'png':
                sharpInstance = sharpInstance.png({ quality: 80 });
                break;
        }

        // Guardar la imagen procesada
        await sharpInstance.toFile(cachedPath);

        // Almacenar en caché
        cache.set(cacheKey, cachedPath);

        return cachedPath;
    } catch (error) {
        console.error('Error procesando imagen:', error);
        throw error;
    }
}

// Limpiar el caché de imágenes
export async function clearImageCache(): Promise<void> {
    try {
        const files = await fs.readdir(CACHE_DIR);
        await Promise.all(
            files.map(file => fs.unlink(path.join(CACHE_DIR, file)))
        );
        cache.flushAll();
    } catch (error) {
        console.error('Error limpiando caché:', error);
        throw error;
    }
}

// Obtener estadísticas del caché
export function getCacheStats() {
    return {
        keys: cache.keys(),
        stats: cache.getStats()
    };
}
