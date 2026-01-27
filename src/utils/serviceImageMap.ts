/**
 * Temporary image mapping while Directus assets are being fixed
 * Maps service/background images to local static assets
 */

export const serviceBackgroundImages: Record<string, string> = {
  // Hero backgrounds (used in HeroPageV4) - white background versions
  'hero-default': '/images/services/servicio-101-infraestructura.jpg',
  'hero-redes': '/images/services/servicio-101-infraestructura.jpg',
  'hero-seguridad': '/images/services/servicio-102-seguridad.jpg',
  'hero-telefonia': '/images/services/servicio-103-telecomunicaciones.jpg',
  'hero-web': '/images/services/servicio-104-software.jpg',

  // Service specific backgrounds - white background versions
  '101': '/images/services/servicio-101-infraestructura.jpg', // Infraestructura de Redes
  '102': '/images/services/servicio-102-seguridad.jpg', // Sistemas de Seguridad Electrónica
  '103': '/images/services/servicio-103-telecomunicaciones.jpg', // Telecomunicaciones
  '104': '/images/services/servicio-104-software.jpg', // Desarrollo de Software
  '105': '/images/services/servicio-105-soporte.jpg', // Soporte Técnico 24/7
  '106': '/images/services/servicio-106-consultoria.jpg', // Consultoría IT
  '107': '/images/services/servicio-107-incendios.jpg', // Sistemas de Detección de Incendios (fallback)
  '108': '/images/services/servicio-108-electricos.jpg', // Servicios Eléctricos (fallback)
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
