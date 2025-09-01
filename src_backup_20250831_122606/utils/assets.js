/**
 * Utilidades para el manejo de imágenes y recursos
 */

/**
 * Obtiene la URL completa de un recurso en Directus
 * @param {string|Object} assetData ID del recurso o objeto con datos del archivo
 * @param {Object} options Opciones de transformación
 * @returns {string} URL completa del recurso
 */
export function getAssetUrl(assetData, options = {}) {
  if (!assetData) return '';
  
  // Extraer el ID del asset de diferentes formatos posibles
  let assetId = null;
  
  if (typeof assetData === 'string') {
    // Si es un string, asumimos que es directamente el UUID
    assetId = assetData;
  } else if (typeof assetData === 'object') {
    // Si es un objeto, buscar el ID en diferentes propiedades
    assetId = assetData.id || 
              assetData.directus_files_id?.id || 
              assetData.directus_files_id ||
              assetData.file?.id ||
              assetData.data?.id;
  }
  
  if (!assetId) return '';
  
  const baseUrl = import.meta.env.PUBLIC_DIRECTUS_URL || 'http://localhost:8055';
  let url = `${baseUrl}/assets/${assetId}`;
  
  // Añadir parámetros de transformación si existen
  const params = new URLSearchParams();
  
  if (options.width) params.append('width', options.width);
  if (options.height) params.append('height', options.height);
  if (options.fit) params.append('fit', options.fit);
  if (options.quality) params.append('quality', options.quality);
  
  const paramsString = params.toString();
  if (paramsString) {
    url += `?${paramsString}`;
  }
  
  return url;
}

/**
 * Obtiene la URL de una imagen con tamaño optimizado para diferentes usos
 * @param {Object} file Objeto de archivo de Directus
 * @param {string} size Tamaño deseado (thumbnail, small, medium, large)
 * @returns {string} URL optimizada
 */
export function getOptimizedImageUrl(file, size = 'medium') {
  if (!file || !file.id) return '';
  
  const sizes = {
    thumbnail: { width: 200, quality: 70 },
    small: { width: 400, quality: 80 },
    medium: { width: 800, quality: 85 },
    large: { width: 1200, quality: 90 },
    original: {}
  };
  
  return getAssetUrl(file.id, sizes[size] || sizes.medium);
}

/**
 * Obtiene la URL para una imagen de fondo optimizada
 * @param {Object} file Objeto de archivo de Directus
 * @returns {string} URL optimizada para fondo
 */
export function getBackgroundImageUrl(file) {
  if (!file || !file.id) return '';
  return getAssetUrl(file.id, { width: 1920, quality: 85 });
}

/**
 * Obtiene el tipo MIME de un archivo
 * @param {Object} file Objeto de archivo de Directus
 * @returns {string} Tipo MIME del archivo
 */
export function getFileMimeType(file) {
  if (!file) return '';
  return file.type || '';
}

/**
 * Verifica si un archivo es una imagen
 * @param {Object} file Objeto de archivo de Directus
 * @returns {boolean} True si es una imagen
 */
export function isImage(file) {
  if (!file) return false;
  const mimeType = getFileMimeType(file);
  return mimeType.startsWith('image/');
}

/**
 * Obtiene la extensión de un archivo
 * @param {Object} file Objeto de archivo de Directus
 * @returns {string} Extensión del archivo
 */
export function getFileExtension(file) {
  if (!file || !file.filename) return '';
  const parts = file.filename.split('.');
  return parts.length > 1 ? parts.pop().toLowerCase() : '';
}

/**
 * Devuelve el HTML <picture> para una imagen optimizada con soporte WebP y fallback a JPG/PNG
 * @param {string} baseName - Nombre base del archivo (sin extensión)
 * @param {string} ext - Extensión original (jpg, png)
 * @param {string} alt - Texto alternativo
 * @param {object} [options] - Opciones adicionales (width, height, className)
 * @returns {string} - HTML <picture> string
 */
export function getPictureHtml(baseName, ext, alt, options = {}) {
  const webpPath = `/webp/${baseName}.webp`;
  const origPath = `/${baseName}.${ext}`;
  const { width = '', height = '', className = '' } = options;
  return `
    <picture>
      <source srcset="${webpPath}" type="image/webp">
      <img src="${origPath}" alt="${alt}"${width ? ` width=\"${width}\"` : ''}${height ? ` height=\"${height}\"` : ''}${className ? ` class=\"${className}\"` : ''} loading="lazy" />
    </picture>
  `;
}
