import { SOFTWARE_FILM } from './cine/scenes';

// Miniaturas de la misma familia visual que la página de destino. Son imágenes
// editoriales de navegación, no fotografías presentadas como evidencia de obra.
const editorial = (name: string) => `/images/editorial/umsa-${name}-480.webp`;
export const SERVICE_NAV_MEDIA: Record<string, string> = {
  '101': editorial('service-redes'),
  '102': editorial('service-seguridad-electronica'),
  '103': editorial('service-telecomunicaciones'),
  '104': `/cine/media/cine-${SOFTWARE_FILM}-poster.avif`,
  '105': editorial('service-soporte-247'),
  '106': editorial('service-consultoria-it'),
  '107': editorial('service-deteccion-incendios'),
  '108': editorial('service-electricos-it'),
};
export const SECTOR_NAV_MEDIA: Record<string, string> = {
  bodegas: editorial('sector-bodegas'),
  aeropuertos: editorial('sector-aeropuertos'),
  salud: editorial('sector-salud'),
  mineria: editorial('sector-mineria'),
  industria: editorial('sector-industria'),
  constructoras: editorial('sector-constructoras'),
  gobiernosectorpublico: editorial('sector-gobierno'),
  'seguridad-electronica': editorial('sector-seguridad-electronica'),
  software: `/cine/media/cine-${SOFTWARE_FILM}-poster.avif`,
};
