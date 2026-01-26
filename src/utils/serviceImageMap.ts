/**
 * Temporary image mapping while Directus assets are being fixed
 * Maps service/background images to local static assets
 */

export const serviceBackgroundImages: Record<string, string> = {
  // Hero backgrounds (used in HeroPageV4)
  'hero-default': '/images/services/servicios-it.jpg',
  'hero-redes': '/images/services/redes-comunicaciones.jpg',
  'hero-seguridad': '/images/services/ciberseguridad.jpg',
  'hero-telefonia': '/images/services/telefonia.jpg',
  'hero-web': '/images/services/servicios-web.jpg',

  // Service specific backgrounds
  '101': '/images/services/redes-comunicaciones.jpg', // Redes
  '102': '/images/services/ciberseguridad.jpg', // Seguridad
  '103': '/images/services/telefonia.jpg', // Telecom
  '104': '/images/services/servicios-web.jpg', // Software
  '105': '/images/services/servicios-it.jpg', // Consultoría
  '106': '/images/services/servicios-it.jpg', // Cloud
  '107': '/images/services/seguridad-informatica.jpg', // Seguridad Informatica
  '108': '/images/services/servicios-it.jpg', // IoT
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
