/**
 * Service image mapping — local static assets as primary source
 * Directus file records exist in DB but actual files are missing from disk,
 * so we use local images under /public/images/services/
 */

export const serviceBackgroundImages: Record<string, string> = {
  // Hero backgrounds (used in HeroPageV4)
  'hero-default': '/images/services/servicio-101-infraestructura.jpg',
  'hero-redes': '/images/services/servicio-101-infraestructura.jpg',
  'hero-seguridad': '/images/services/servicio-102-seguridad.jpg',
  'hero-telefonia': '/images/services/servicio-103-telecomunicaciones.jpg',
  'hero-web': '/images/services/servicio-104-software.jpg',

  // Service header images (numbered PNGs with transparent bg)
  '101': '/images/services/1.png',
  '102': '/images/services/2.png',
  '103': '/images/services/3.png',
  '104': '/images/services/4.png',
  '105': '/images/services/5.png',
  '106': '/images/services/6.png',
  '107': '/images/services/7.png',
  '108': '/images/services/8.png',
};

// Map service IDs to product image folders
const serviceIdToFolder: Record<string, string> = {
  '101': 'infraestructura',
  '102': 'seguridad',
  '103': 'telecomunicaciones',
  '104': 'software',
  '105': 'soporte',
  '106': 'consultoria',
  '107': 'incendios',
  '108': 'electricos',
};

// Service ID number prefix for product images (101→1, 102→2, etc.)
const serviceIdToNum: Record<string, string> = {
  '101': '1', '102': '2', '103': '3', '104': '4',
  '105': '5', '106': '6', '107': '7', '108': '8',
};

/**
 * Get local product image path.
 * Files are named: /images/services/productos/{folder}/{num}.{order+1}.png
 */
export const getProductImage = (serviceId: string | number, productIndex: number): string => {
  const sid = String(serviceId);
  const folder = serviceIdToFolder[sid];
  const num = serviceIdToNum[sid];
  if (!folder || !num) return '/images/services/default-service.jpg';
  return `/images/services/productos/${folder}/${num}.${productIndex + 1}.png`;
};

export const getServiceBackground = (key?: string | number): string => {
  if (!key) return serviceBackgroundImages['hero-default'];

  const imageKey = String(key);
  return serviceBackgroundImages[imageKey] || serviceBackgroundImages['hero-default'];
};

export const getHeroBackground = (page?: string): string => {
  const backgrounds: Record<string, string> = {
    'servicios': serviceBackgroundImages['hero-redes'],
    'antecedentes': '/images/antecedentes-hero-bg.jpg',
    'sectores': serviceBackgroundImages['hero-seguridad'],
    'nosotros': serviceBackgroundImages['hero-default'],
    'contacto': serviceBackgroundImages['hero-web'],
  };

  return backgrounds[page || 'default'] || serviceBackgroundImages['hero-default'];
};
