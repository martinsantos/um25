import { BUSINESS_ADDRESS, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '../config/seo';
import { FOUNDING_DATE } from '../config/publicFacts';
import { NAV_SERVICES, NAV_SECTORS } from '../data/navigation';

/** One organization identity and canonical route graph for all public templates. */
export function publicStructuredData(path: string, title: string, description: string, lang = 'es') {
  const url = new URL(path, SITE_URL).href;
  const organizationId = SITE_URL + '/#organization';
  const english = lang === 'en';
  const parts = path.split('/').filter(Boolean);
  const service = parts[0] === 'servicios' ? NAV_SERVICES.find(item => item.code === parts[1]) : undefined;
  const sector = parts[0] === 'sectores' ? NAV_SECTORS.find(item => item.slug === parts[1]) : undefined;
  const labels: Record<string, string> = { servicios: 'Servicios', sectores: 'Sectores', antecedentes: 'Antecedentes', nosotros: 'Nosotros', contacto: 'Contacto', privacidad: 'Privacidad', terminos: 'Términos', documentacion: 'Documentación técnica', services: 'Services', about: 'About', contact: 'Contact' };
  const organization = {
    '@type': 'Organization', '@id': organizationId, name: SITE_NAME,
    legalName: 'ULTIMA MILLA S.A.', url: SITE_URL, foundingDate: FOUNDING_DATE,
    description: SITE_DESCRIPTION, logo: SITE_URL + '/images/um-logo.png',
    address: { '@type': 'PostalAddress', ...BUSINESS_ADDRESS },
    email: 'contacto@ultimamilla.com.ar',
    areaServed: ['Mendoza', 'San Juan', 'San Luis', 'Patagonia', 'Argentina'],
    contactPoint: { '@type': 'ContactPoint', contactType: 'customer service', email: 'contacto@ultimamilla.com.ar', url: SITE_URL + (english ? '/en/contact' : '/contacto'), availableLanguage: ['es', 'en'] },
    sameAs: ['https://www.linkedin.com/company/ultimamilla', 'https://x.com/ultimamilla'],
  };
  const graph: Record<string, unknown>[] = [organization,
    { '@type': 'WebSite', '@id': SITE_URL + '/#website', url: SITE_URL, name: SITE_NAME, publisher: { '@id': organizationId }, inLanguage: ['es-AR', 'en'] },
    { '@type': 'WebPage', '@id': url + '#webpage', url, name: title, description, inLanguage: english ? 'en' : 'es-AR', publisher: { '@id': organizationId }, isPartOf: { '@id': SITE_URL + '/#website' }, ...(service ? { mainEntity: { '@id': url + '#service' } } : {}) },
  ];
  if (service) graph.push({ '@type': 'Service', '@id': url + '#service', url, name: service.name, serviceType: service.name, description, provider: { '@id': organizationId }, areaServed: organization.areaServed });
  const home = english ? '/en' : '/';
  if (path !== home && path !== home + '/') {
    const crumbs = [{ name: english ? 'Home' : 'Inicio', path: home }];
    const section = english ? parts[1] : parts[0];
    if (!english && parts.length > 1 && labels[section]) crumbs.push({ name: labels[section], path: '/' + section });
    crumbs.push({ name: service?.name || sector?.name || (parts.length > (english ? 2 : 1) ? title : labels[section] || title), path });
    graph.push({ '@type': 'BreadcrumbList', '@id': url + '#breadcrumb', itemListElement: crumbs.map((item, index) => ({ '@type': 'ListItem', position: index + 1, name: item.name, item: new URL(item.path, SITE_URL).href })) });
  }
  return { '@context': 'https://schema.org', '@graph': graph };
}
