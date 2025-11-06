// Mapeo de IDs de imágenes de Directus a archivos estáticos locales
export const imageMapping = {
  // Servicios IT (ID: 1)
  '2749f988-2e2d-4f32-9978-4dbeb4aa6ab2': '/images/services/servicios-it.jpg',
  'ccc32af0-df52-4e6e-8ca0-9660dddec095': '/images/services/servicios-it.jpg',

  // Redes de datos (ID: 2)
  '18b5f4e3-4bc8-485d-a01c-8cbd53e25f4d': '/images/services/redes-comunicaciones.jpg',
  '6e626d63-c3ca-4982-8ed3-4a5e75e1b179': '/images/services/redes-comunicaciones.jpg',

  // Seguridad Informática (ID: 3)
  'f2a65085-e6ad-49fc-a123-1b5dc19fc7ab': '/images/services/ciberseguridad.jpg',
  'b1a91d79-c979-4067-b78a-2cd97166fbcd': '/images/services/seguridad-informatica.jpg',

  // Telefonía (ID: 4)
  '4ffcefb0-6cb8-4cfa-a748-bd4c3da1d716': '/images/services/telefonia.jpg',

  // Servicios Web (ID: 6)
  'dc6d6069-23af-4d75-ae5a-38c830bf2b85': '/images/services/servicios-web.jpg'
};

const DEFAULT_SERVICE_IMAGE = '/images/default-service.jpg';
const DEFAULT_DIRECTUS_PUBLIC_BASE = 'http://localhost:8055';

const PUBLIC_DIRECTUS_ASSETS_URL = import.meta.env.PUBLIC_DIRECTUS_ASSETS_URL;
const PUBLIC_DIRECTUS_URL = import.meta.env.PUBLIC_DIRECTUS_URL;
const PUBLIC_DIRECTUS_TOKEN = import.meta.env.PUBLIC_DIRECTUS_TOKEN || '';

function normalizeBaseUrl(rawUrl) {
  if (!rawUrl) {
    return '';
  }

  let base = rawUrl.trim();
  if (!base) {
    return '';
  }

  if (base.endsWith('/')) {
    base = base.slice(0, -1);
  }

  // Reemplazar hostname interno de Docker o admin.ultimamilla.com.ar por localhost en servidor
  if (base.includes('directus-app:8055') || base.includes('admin.ultimamilla.com.ar')) {
    return DEFAULT_DIRECTUS_PUBLIC_BASE;
  }

  // Mantener http:// para localhost
  if (base.startsWith('http://localhost')) {
    return base;
  }

  if (base.startsWith('http://')) {
    return `https://${base.slice('http://'.length)}`;
  }

  return base;
}

const DIRECTUS_ASSETS_BASE =
  normalizeBaseUrl(PUBLIC_DIRECTUS_ASSETS_URL) ||
  normalizeBaseUrl(PUBLIC_DIRECTUS_URL) ||
  DEFAULT_DIRECTUS_PUBLIC_BASE;

function buildDirectusAssetUrl(assetId) {
  if (!assetId) {
    return '';
  }

  const base = normalizeBaseUrl(DIRECTUS_ASSETS_BASE);
  if (!base) {
    return '';
  }

  const assetUrl = `${base}/assets/${assetId}`;
  if (PUBLIC_DIRECTUS_TOKEN) {
    const separator = assetUrl.includes('?') ? '&' : '?';
    return `${assetUrl}${separator}access_token=${PUBLIC_DIRECTUS_TOKEN}`;
  }

  return assetUrl;
}

/**
 * Obtiene la URL de imagen estática para un servicio basado en su Directus asset ID
 * @param {string} assetId - ID del asset en Directus
 * @returns {string} - URL de la imagen estática local
 */
export function getServiceImageUrl(assetId) {
  // Siempre priorizar el mapeo local
  return getAssetUrl(assetId, false);
}

/**
 * Obtiene la URL de imagen con soporte para múltiples entornos
 * Prioriza imágenes estáticas locales sobre Directus assets
 * @param {string} assetId - ID del asset
 * @param {boolean} useDirectus - Si debe intentar usar Directus (para futuro)
 * @returns {string} - URL de la imagen
 */
export function getAssetUrl(assetId, useDirectus = false) {
  // 0. Si no hay assetId, devolver imagen por defecto
  if (!assetId) {
    console.warn('No se proporcionó assetId, usando imagen por defecto');
    return DEFAULT_SERVICE_IMAGE;
  }

  // 1. Verificar si el assetId es una URL completa
  if (typeof assetId === 'string' && (assetId.startsWith('http') || assetId.startsWith('/'))) {
    return assetId;
  }

  // 2. Buscar en el mapeo local primero
  if (imageMapping[assetId]) {
    console.log(`Usando imagen local mapeada para ${assetId}: ${imageMapping[assetId]}`);
    return imageMapping[assetId];
  }

  // 3. Si se solicita Directus, intentar construir la URL
  if (useDirectus) {
    try {
      const directusUrl = buildDirectusAssetUrl(assetId);
      if (directusUrl) {
        console.log(`Usando imagen de Directus para ${assetId}: ${directusUrl}`);
        return directusUrl;
      }
    } catch (error) {
      console.error(`Error al construir URL de Directus para ${assetId}:`, error);
    }
  }

  // 4. Si todo falla, usar imagen por defecto
  console.warn(`No se encontró imagen para ${assetId}, usando imagen por defecto`);
  return DEFAULT_SERVICE_IMAGE;
}

export default getServiceImageUrl;
