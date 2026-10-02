// Fuente única de los frentes de servicio y sectores para navegación comercial
// (mega-menú desktop, barra de pestañas mobile y home). Los textos replican la
// home de producción; los conteos de casos salen del catálogo verificado.
import { SECTORS } from './cine/scenes';

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
    href: '/servicios/101/infraestructura-de-redes-cableado-fibra-optica-radioenlaces',
    image: '/img/servicios/redes.webp',
  },
  {
    code: '102',
    name: 'Seguridad electrónica',
    text: 'CCTV IP, accesos y monitoreo documentado.',
    href: '/servicios/102/sistemas-de-seguridad-electronica-cctv-control-acceso-sistemas-de-deteccion-de-incendios-sdi',
    image: '/img/servicios/seguridad-electronica.webp',
  },
  {
    code: '103',
    name: 'Telecomunicaciones',
    text: 'Enlaces de datos, voz y video para sitios remotos.',
    href: '/servicios/103/telecomunicaciones-datos-voz-video',
    image: '/img/servicios/telecomunicaciones.webp',
  },
  {
    code: '104',
    name: 'Software a medida',
    text: 'Sistemas, APIs y tableros para procesos críticos.',
    href: '/servicios/104/desarrollo-de-software-a-medida-web-mobile-erp',
    image: '/img/servicios/software-a-medida.webp',
  },
  {
    code: '105',
    name: 'Soporte 24/7',
    text: 'Mesa de ayuda, NOC y mantenimiento con SLA.',
    href: '/servicios/105/soporte-tecnico-247-mesa-de-ayuda-mantenimiento-it',
    image: '/img/servicios/soporte-247.webp',
  },
  {
    code: '106',
    name: 'Consultoría IT',
    text: 'Arquitectura, auditoría y roadmap operativo.',
    href: '/servicios/106/consultoria-it-y-transformacion-digital-arquitectura-auditoria',
    image: '/img/servicios/consultoria-it.webp',
  },
  {
    code: '107',
    name: 'Detección de incendios',
    text: 'SDI, sensores y paneles para entornos productivos.',
    href: '/servicios/107/sistemas-de-deteccion-y-alarma-de-incendios',
    image: '/img/servicios/deteccion-incendios.webp',
  },
  {
    code: '108',
    name: 'Eléctricos IT',
    text: 'Tableros, UPS y energía limpia para infraestructura.',
    href: '/servicios/108/servicios-electricos-para-it',
    image: '/img/servicios/electricos-it.webp',
  },
];

export interface NavSector {
  slug: string;
  name: string;
  text: string;
  href: string;
  count: string | number | null;
}

export const NAV_SECTORS: NavSector[] = SECTORS.map((s) => ({
  slug: s.slug,
  name: s.name,
  text: s.text,
  href: `/${s.slug}`,
  count: s.count ?? null,
}));

/** Pestañas de la barra inferior en teléfono (app shell). Cuatro destinos
 *  para que cada etiqueta entre a 16px en 360px; sectores queda en el menú. */
export const APP_TABS = [
  { href: '/', label: 'Inicio', icon: 'home' },
  { href: '/servicios', label: 'Servicios', icon: 'services' },
  { href: '/antecedentes', label: 'Proyectos', icon: 'projects' },
  { href: '/contacto', label: 'Contacto', icon: 'contact' },
] as const;
