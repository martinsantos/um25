// Textos del shell (cabecera, mega-menú, barra de pestañas, pie) en los dos
// idiomas del sitio. Los destinos de servicios y sectores siguen en español:
// no tienen páginas en inglés todavía (fase 6 del refactor).
import { hasEnglishAlternate, resolveEnglishPath, resolvePageLanguage, resolveSpanishPath } from './i18nRoutes';

export type ShellLang = 'es' | 'en';

export interface ShellStrings {
  nav: { home: string; services: string; sectors: string; projects: string; blog: string; more: string; contact: string };
  megaServices: { kicker: string; lead: string; all: string; open: string };
  megaSectors: { kicker: string; lead: string; all: string; open: string };
  mobile: { more: string; hours: string; open: string; close: string };
  tabs: { home: string; services: string; projects: string; contact: string; aria: string };
  footer: { privacy: string; terms: string; rights: string };
  lang: { label: string; switchTo: string; code: string };
  footerShell: { company: string; projects: string; industries: string; contact: string; documentation: string; locationHours: string; home: string };
  destinationLabel: (label: string) => string;
}

const STRINGS: Record<ShellLang, ShellStrings> = {
  es: {
    nav: { home: 'Inicio', services: 'Servicios', sectors: 'Sectores', projects: 'Antecedentes', blog: 'Blog', more: 'Más', contact: 'Contactar' },
    megaServices: { kicker: 'Ocho frentes de servicio', lead: 'Un mismo equipo releva, instala, documenta y sostiene cada sistema, de la obra a la operación diaria.', all: 'Ver los ocho servicios', open: 'Abrir servicios' },
    megaSectors: { kicker: 'Nueve sectores', lead: 'Entrá por su sector y revisá casos comparables antes de contratar. El número es la cantidad de casos documentados.', all: 'Ver todos los sectores', open: 'Abrir sectores' },
    mobile: { more: 'Más', hours: 'Lunes a viernes, 8 a 18 h · Mendoza', open: 'Abrir menú', close: 'Cerrar menú' },
    tabs: { home: 'Inicio', services: 'Servicios', projects: 'Proyectos', contact: 'Contacto', aria: 'Navegación rápida' },
    footer: { privacy: 'Privacidad', terms: 'Términos', rights: 'Todos los derechos reservados.' },
    lang: { label: 'Idioma', switchTo: 'English version', code: 'EN' },
    footerShell: { company: 'Empresa', projects: 'Antecedentes', industries: 'Sectores', contact: 'Contacto', documentation: 'Certificaciones', locationHours: 'Lunes a viernes, 8 a 18 h', home: 'Ir al inicio' },
    destinationLabel: (label) => label,
  },
  en: {
    nav: { home: 'Home', services: 'Services', sectors: 'Industries', projects: 'Projects', blog: 'Blog', more: 'More', contact: 'Contact' },
    megaServices: { kicker: 'Eight service lines', lead: 'One team surveys, installs, documents and supports every system, from the job site to daily operation.', all: 'See all eight services', open: 'Open services' },
    megaSectors: { kicker: 'Nine industries', lead: 'Enter through your industry and review comparable projects before contracting. The number is the count of documented projects.', all: 'See all industries', open: 'Open industries' },
    mobile: { more: 'More', hours: 'Monday to Friday, 8 am to 6 pm · Mendoza, Argentina', open: 'Open menu', close: 'Close menu' },
    tabs: { home: 'Home', services: 'Services', projects: 'Cases', contact: 'Contact', aria: 'Quick navigation' },
    footer: { privacy: 'Privacy', terms: 'Terms', rights: 'All rights reserved.' },
    lang: { label: 'Language', switchTo: 'Versión en español', code: 'ES' },
    footerShell: { company: 'Company', projects: 'Projects', industries: 'Industries', contact: 'Contact', documentation: 'Technical documentation', locationHours: 'Monday to Friday, 8 am to 6 pm', home: 'Go to English home' },
    destinationLabel: (label) => `${label} (ES)`,
  },
};

export const shellStrings = (lang: ShellLang) => STRINGS[lang];

const SERVICE_EN: Record<string, { name: string; text: string }> = {
  '101': { name: 'Networks', text: 'Certified structured cabling and fiber optics.' },
  '102': { name: 'Electronic security', text: 'IP CCTV, access control and documented monitoring.' },
  '103': { name: 'Telecommunications', text: 'Data, voice and video links for remote sites.' },
  '104': { name: 'Custom software', text: 'Systems, APIs and dashboards for critical processes.' },
  '105': { name: '24/7 support', text: 'Help desk, NOC and SLA-backed maintenance.' },
  '106': { name: 'IT consulting', text: 'Architecture, audits and operational roadmaps.' },
  '107': { name: 'Fire detection', text: 'Detection systems, sensors and panels for production environments.' },
  '108': { name: 'IT electrical systems', text: 'Panels, UPS and clean power for infrastructure.' },
};

const SECTOR_EN: Record<string, { name: string; text: string }> = {
  aeropuertos: { name: 'Airports', text: '24/7 perimeter CCTV' },
  bodegas: { name: 'Wineries', text: 'End-to-end wine production traceability' },
  constructoras: { name: 'Construction', text: 'Certified structured cabling' },
  gobiernosectorpublico: { name: 'Government and public sector', text: 'Digital public services' },
  industria: { name: 'Industry', text: '24/7 industrial plant networks' },
  mineria: { name: 'Mining', text: 'Telecommunications for remote camps' },
  salud: { name: 'Healthcare', text: 'Networks for medical imaging' },
  'seguridad-electronica': { name: 'Electronic security', text: '24/7 monitoring center' },
  software: { name: 'Software', text: 'Custom ERPs and platforms' },
};

export function shellServiceCopy(lang: ShellLang, code: string, name: string, text: string) {
  const translated = SERVICE_EN[code];
  return lang === 'en' && translated ? translated : { name, text };
}

export function shellSectorCopy(lang: ShellLang, slug: string, name: string, text: string) {
  const translated = SECTOR_EN[slug];
  return lang === 'en' && translated ? translated : { name, text };
}

/** Idioma de la ruta y enlace al otro idioma (a la home del otro idioma si
 *  la página no tiene alternativa). */
export function shellLocale(pathname: string) {
  const lang = resolvePageLanguage(pathname);
  const t = STRINGS[lang];
  const alternate = hasEnglishAlternate(pathname)
    ? (lang === 'en' ? resolveSpanishPath(pathname) : resolveEnglishPath(pathname))
    : (lang === 'en' ? '/' : '/en/');
  return { lang, t, alternate, alternateLang: lang === 'en' ? 'es' : 'en' as const };
}

/** Rutas principales por idioma (las que no existen en inglés quedan en español). */
export function shellRoutes(lang: ShellLang) {
  return lang === 'en'
    ? { home: '/en/', services: '/en/services', sectors: '/sectores', projects: '/antecedentes', blog: '/blog', about: '/en/about', contact: '/en/contacto', certifications: '/certificaciones', cctv: '/cctvai' }
    : { home: '/', services: '/servicios', sectors: '/sectores', projects: '/antecedentes', blog: '/blog', about: '/nosotros', contact: '/contacto', certifications: '/certificaciones', cctv: '/cctvai' };
}
