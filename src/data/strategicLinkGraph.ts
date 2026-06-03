import { geoCommercialHubs, geoCommercialHubSlugs } from './geoCommercialHubs';

export type StrategicLinkKind = 'geoHub' | 'service' | 'sector' | 'case' | 'core' | 'geoResource';

export interface StrategicLinkItem {
  href: string;
  label: string;
  summary: string;
  eyebrow?: string;
  kind?: StrategicLinkKind;
  image?: string;
}

export interface StrategicLinkGroup {
  title: string;
  summary: string;
  items: StrategicLinkItem[];
}

const uniqueByHref = (items: StrategicLinkItem[]): StrategicLinkItem[] => {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.href)) return false;
    seen.add(item.href);
    return true;
  });
};

const normalizeSlug = (slug: string): string =>
  slug
    .trim()
    .toLowerCase()
    .replace(/^\/+|\/+$/g, '')
    .replace(/\.html?$/g, '');

export const commercialHubShortLabels: Record<string, string> = {
  '/servicios-it-empresas-mendoza': 'Servicios IT Mendoza',
  '/presupuesto-servicios-it-empresas': 'Presupuesto IT',
  '/proyectos-ingenieria-it-mendoza': 'Ingenieria IT',
  '/servicios-it-empresas-argentina': 'Servicios IT Argentina',
};

export const commercialHubLinkItems: StrategicLinkItem[] = geoCommercialHubSlugs.map((slug) => {
  const hub = geoCommercialHubs[slug];
  const href = `/${hub.slug}`;

  return {
    href,
    label: commercialHubShortLabels[href] || hub.h1,
    summary: hub.description,
    eyebrow: hub.market,
    kind: 'geoHub',
  };
});

export const serviceLinkItems: StrategicLinkItem[] = uniqueByHref(
  geoCommercialHubSlugs.flatMap((slug) =>
    geoCommercialHubs[slug].services.map((service) => ({
      href: service.href,
      label: service.title,
      summary: service.summary,
      eyebrow: 'Capacidad',
      kind: 'service' as const,
    })),
  ),
);

export const sectorLinkItems: StrategicLinkItem[] = uniqueByHref(
  geoCommercialHubSlugs.flatMap((slug) =>
    geoCommercialHubs[slug].sectors.map((sector) => ({
      href: sector.href,
      label: sector.title,
      summary: sector.summary,
      eyebrow: 'Sector',
      kind: 'sector' as const,
    })),
  ),
);

export const caseLinkItems: StrategicLinkItem[] = uniqueByHref(
  geoCommercialHubSlugs.flatMap((slug) =>
    geoCommercialHubs[slug].cases.map((caseItem) => ({
      href: caseItem.href,
      label: `${caseItem.client}: ${caseItem.title}`,
      summary: `Evidencia en ${caseItem.sector}: ${caseItem.title}.`,
      eyebrow: caseItem.sector,
      kind: 'case' as const,
    })),
  ),
);

export const contactStrategicLinkGroups: StrategicLinkGroup[] = [
  {
    title: 'Rutas comerciales',
    summary: 'Entradas preparadas para decisores que necesitan comprar, cotizar o comparar alcance.',
    items: commercialHubLinkItems,
  },
  {
    title: 'Capacidades conectadas',
    summary: 'Servicios que normalmente definen alcance tecnico, criticidad y tiempos de respuesta.',
    items: serviceLinkItems.slice(0, 4),
  },
  {
    title: 'Evidencia verificable',
    summary: 'Antecedentes de infraestructura, soporte y operaciones criticas vinculados al pedido.',
    items: caseLinkItems.slice(0, 4),
  },
  {
    title: 'Sectores criticos',
    summary: 'Verticales donde el relevamiento debe considerar continuidad, seguridad y trazabilidad.',
    items: sectorLinkItems.slice(0, 4),
  },
];

export const geoDiscoveryStrategicGroups: StrategicLinkGroup[] = [
  {
    title: 'Hubs de intencion comercial',
    summary: 'Paginas canonicas para compradores, LLMs y buscadores que necesitan resolver una consulta concreta.',
    items: commercialHubLinkItems,
  },
  {
    title: 'Fuentes legibles por maquinas',
    summary: 'Recursos GEO publicados para discovery, grounding y extraccion estructurada.',
    items: [
      {
        href: '/llms.txt',
        label: 'llms.txt',
        summary: 'Indice compacto para modelos de lenguaje y buscadores conversacionales.',
        eyebrow: 'GEO',
        kind: 'geoResource',
      },
      {
        href: '/llms-full.txt',
        label: 'llms-full.txt',
        summary: 'Contexto ampliado de servicios, evidencia y rutas canonicas.',
        eyebrow: 'GEO',
        kind: 'geoResource',
      },
      {
        href: '/geo/discovery.json',
        label: 'discovery.json',
        summary: 'Manifiesto JSON para descubrir entidades, servicios y hubs comerciales.',
        eyebrow: 'JSON',
        kind: 'geoResource',
      },
    ],
  },
];

export const siblingCommercialHubItems = (currentSlug: string, limit = 3): StrategicLinkItem[] =>
  commercialHubLinkItems
    .filter((item) => item.href !== `/${currentSlug}`)
    .slice(0, limit)
    .map((item) => ({
      ...item,
      eyebrow: 'Ruta relacionada',
    }));

const legacyRedirects: Record<string, string> = {
  about: '/nosotros',
  'about-us': '/nosotros',
  empresa: '/nosotros',
  'quienes-somos': '/nosotros',
  'index-corporate': '/',
  'index-corporate-restored': '/',
  'servicios-it-mendoza': '/servicios-it-empresas-mendoza',
  'servicios-informaticos-mendoza': '/servicios-it-empresas-mendoza',
  'servicios-tecnologicos-mendoza': '/servicios-it-empresas-mendoza',
  'empresa-de-sistemas-mendoza': '/servicios-it-empresas-mendoza',
  'cotizar-servicios-it': '/presupuesto-servicios-it-empresas',
  'presupuesto-it': '/presupuesto-servicios-it-empresas',
  'presupuesto-informatica': '/presupuesto-servicios-it-empresas',
  'ingenieria-it-mendoza': '/proyectos-ingenieria-it-mendoza',
  'proyectos-it-mendoza': '/proyectos-ingenieria-it-mendoza',
};

export const getLegacyRedirectTarget = (slug: string): string | undefined =>
  legacyRedirects[normalizeSlug(slug)];

export const legacyRedirectEntries = Object.entries(legacyRedirects).map(([slug, target]) => ({
  slug,
  target,
}));
