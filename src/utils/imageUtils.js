// Utilidades de imágenes para servicios
// Usa Directus como fuente primaria con fallback a imágenes locales

const DIRECTUS_URL = 'https://admin.ultimamilla.com.ar';

// Mapeo de IDs de imágenes de Directus a archivos estáticos locales (fallback)
export const imageMapping = {
  // Servicios IT (ID: 1)
  '2749f988-2e2d-4f32-9978-4dbeb4aa6ab2': '/images/services/servicios-it.jpg',

  // Redes de datos (ID: 2)
  '18b5f4e3-4bc8-485d-a01c-8cbd53e25f4d': '/images/services/redes-comunicaciones.jpg',

  // Seguridad Informática (ID: 3)
  'f2a65085-e6ad-49fc-a123-1b5dc19fc7ab': '/images/services/ciberseguridad.jpg',

  // Telefonía y Citoina (ID: 4)
  '4ffcefb0-6cb8-4cfa-a748-bd4c3da1d716': '/images/services/telefonia.jpg',

  // Servicios Web (ID: 6)
  'dc6d6069-23af-4d75-ae5a-38c830bf2b85': '/images/services/servicios-web.jpg',

  // Mapeos adicionales para compatibilidad
  'b1a91d79-c979-4067-b78a-2cd97166fbcd': '/images/services/seguridad-informatica.jpg',
  '6e626d63-c3ca-4982-8ed3-4a5e75e1b179': '/images/services/redes-comunicaciones.jpg',
  'ccc32af0-df52-4e6e-8ca0-9660dddec095': '/images/services/servicios-it.jpg'
};

/**
 * Obtiene la URL de imagen para un servicio
 * Prioridad: Directus UUID → Imagen local mapeada → Default
 * @param {string} assetId - ID del asset en Directus o path
 * @returns {string} - URL de la imagen
 */
export function getServiceImageUrl(assetId) {
  if (!assetId) {
    return '/images/services/default-service.jpg';
  }

  // Si es un UUID de Directus (formato: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
  if (assetId.includes('-') && assetId.length > 30) {
    // Usar Directus directamente para mejor calidad
    return `${DIRECTUS_URL}/assets/${assetId}`;
  }

  // Si ya es una URL completa
  if (assetId.startsWith('http')) {
    return assetId;
  }

  // Si es un path local
  if (assetId.startsWith('/')) {
    return assetId;
  }

  // Fallback
  return '/images/services/default-service.jpg';
}

/**
 * Obtiene URL con fallback local (para cuando Directus no está disponible)
 */
export function getServiceImageUrlWithFallback(assetId) {
  if (!assetId) {
    return '/images/services/default-service.jpg';
  }

  // Si tenemos mapeo local, usarlo como fallback confiable
  if (imageMapping[assetId]) {
    return imageMapping[assetId];
  }

  // Si es UUID, intentar Directus
  if (assetId.includes('-') && assetId.length > 30) {
    return `${DIRECTUS_URL}/assets/${assetId}`;
  }

  return '/images/services/default-service.jpg';
}

export default getServiceImageUrl;
