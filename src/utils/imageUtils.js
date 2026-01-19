// Mapeo de IDs de imágenes de Directus a archivos estáticos locales
// Este mapeo asegura consistencia entre la página de listado y las páginas de detalle
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
  
  // Mapeos adicionales para compatibilidad con IDs alternativos
  'b1a91d79-c979-4067-b78a-2cd97166fbcd': '/images/services/seguridad-informatica.jpg',
  '6e626d63-c3ca-4982-8ed3-4a5e75e1b179': '/images/services/redes-comunicaciones.jpg',
  'ccc32af0-df52-4e6e-8ca0-9660dddec095': '/images/services/servicios-it.jpg'
};

/**
 * Obtiene la URL de imagen estática para un servicio basado en su Directus asset ID
 * @param {string} assetId - ID del asset en Directus
 * @returns {string} - URL de la imagen estática local
 */
export function getServiceImageUrl(assetId, directusUrl = null) {
  if (!assetId) {
    return '/images/antecedentes-hero-bg.jpg';
  }
  
  // Si tenemos un mapeo estático, usarlo
  if (imageMapping[assetId]) {
    return imageMapping[assetId];
  }
  
  // Si nos pasaron una URL de Directus ya formada, usarla
  if (directusUrl) {
    return directusUrl;
  }
  
  // Fallback a imagen de fondo neutra (NO ALF)
  return '/images/antecedentes-hero-bg.jpg';
}

/**
 * Obtiene la URL de imagen con soporte para múltiples entornos
 * En producción podría conectar con Directus real, en desarrollo usa archivos estáticos
 * @param {string} assetId - ID del asset
 * @param {boolean} useDirectus - Si debe intentar usar Directus (para futuro)
 * @returns {string} - URL de la imagen
 */
export function getAssetUrl(assetId, useDirectus = false) {
  if (!assetId) {
    return '/images/antecedentes-hero-bg.jpg';
  }
  
  // Por ahora siempre usar imágenes estáticas hasta que Directus esté configurado
  if (!useDirectus || process.env.NODE_ENV === 'development') {
    return getServiceImageUrl(assetId);
  }
  
  // En el futuro: integración con Directus en producción
  const directusUrl = process.env.DIRECTUS_URL || 'https://admin.ultimamilla.com';
  return `${directusUrl}/assets/${assetId}`;
}

export default getServiceImageUrl;
