// Fuente única de los frentes de servicio y sectores para navegación comercial
// (mega-menú desktop, barra de pestañas mobile y home). Los textos replican la
// home de producción; los conteos de casos salen del catálogo verificado.
import { SECTOR_ROWS } from './sectorDirectoryRows';

export interface NavService {
  code: string;
  name: string;
  text: string;
  href: string;
  image: string;
}

export const NAV_SERVICES: NavService[] = [
  {
    code: '101',
    name: 'Redes',
    text: 'Cableado estructurado y fibra óptica certificada.',
    href: '/servicios/101',
    image: '/cine/media/cine-fachada-redes-poster.jpg',
  },
  {
    code: '102',
    name: 'Seguridad electrónica',
    text: 'CCTV IP, accesos y monitoreo documentado.',
    href: '/servicios/102',
    image: '/cine/media/cine-aeropuerto-seguridad-poster.jpg',
  },
  {
    code: '103',
    name: 'Telecomunicaciones',
    text: 'Enlaces de datos, voz y video para sitios remotos.',
    href: '/servicios/103',
    image: '/cine/media/cine-planta-telecom-poster.jpg',
  },
  {
    code: '104',
    name: 'Software a medida',
    text: 'Sistemas, APIs y tableros para procesos críticos.',
    href: '/servicios/104',
    image: '/cine/media/cine-hospital-software-poster.jpg',
  },
  {
    code: '105',
    name: 'Soporte 24/7',
    text: 'Mesa de ayuda, NOC y mantenimiento con SLA.',
    href: '/servicios/105',
    image: '/cine/media/cine-aeropuerto-soporte-poster.jpg',
  },
  {
    code: '106',
    name: 'Consultoría IT',
    text: 'Arquitectura, auditoría y roadmap operativo.',
    href: '/servicios/106',
    image: '/cine/media/cine-fachada-consultoria-poster.jpg',
  },
  {
    code: '107',
    name: 'Detección de incendios',
    text: 'SDI, sensores y paneles para entornos productivos.',
    href: '/servicios/107',
    image: '/cine/media/cine-bodega-incendios-poster.jpg',
  },
  {
    code: '108',
    name: 'Eléctricos IT',
    text: 'Tableros, UPS y energía limpia para infraestructura.',
    href: '/servicios/108',
    image: '/cine/media/cine-hospital-electricos-poster.jpg',
  },
];

export interface NavSector {
  slug: string;
  name: string;
  text: string;
  href: string;
}

export const NAV_SECTORS: NavSector[] = SECTOR_ROWS.map((s) => ({
  slug: s.slug,
  name: s.name,
  text: s.text,
  href: ['software', 'seguridad-electronica'].includes(s.slug) ? `/${s.slug}` : `/sectores/${s.slug}`,
}));

export function directoryCardId(href: string) {
  return 'ficha-' + href.split('/').filter(Boolean).pop();
}

/** On a listed detail page, the directory link returns to that same card. */
export function directoryReturnHref(directory: string, currentPath: string) {
  const path = currentPath.replace(/\/$/, '');
  const entries = directory === '/servicios' ? NAV_SERVICES : directory === '/sectores' ? NAV_SECTORS : [];
  const entry = entries.find(item => item.href === path ||
    (directory === '/servicios' && path === item.href + '/ficha'));
  return entry ? directory + '#' + directoryCardId(entry.href) : directory;
}

/** Pestañas de la barra inferior en teléfono (app shell). Cuatro destinos
 *  con acceso al inicio desde la marca de la cabecera. */
export const APP_TABS = [
  { href: '/servicios', label: 'Servicios', icon: 'services' },
  { href: '/sectores', label: 'Sectores', icon: 'sectors' },
  { href: '/antecedentes', label: 'Antecedentes', icon: 'projects' },
  { href: '/contacto', label: 'Contacto', icon: 'contact' },
] as const;
