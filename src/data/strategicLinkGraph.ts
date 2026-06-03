import { geoCommercialHubs, geoCommercialHubSlugs } from './geoCommercialHubs';
import { sectorVisualOrder, sectorVisualSystem } from './sectorVisualSystem';

export type StrategicLinkKind = 'geoHub' | 'service' | 'sector' | 'case' | 'core' | 'geoResource';

export interface StrategicLinkItem {
  href: string;
  label: string;
  summary: string;
  reason?: string;
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
  '/proyectos-ingenieria-it-mendoza': 'Ingeniería IT',
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

export const sectorLinkItems: StrategicLinkItem[] = uniqueByHref([
  ...sectorVisualOrder.map((slug) => {
    const sector = sectorVisualSystem[slug];
    return {
      href: `/${sector.slug}`,
      label: sector.label,
      summary: sector.summary,
      eyebrow: 'Sector',
      kind: 'sector' as const,
    };
  }),
  ...geoCommercialHubSlugs.flatMap((slug) =>
    geoCommercialHubs[slug].sectors.map((sector) => ({
      href: sector.href,
      label: sector.title,
      summary: sector.summary,
      eyebrow: 'Sector',
      kind: 'sector' as const,
    })),
  ),
]);

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
    title: 'Compra y cobertura',
    summary: 'Accesos preparados para decisores que necesitan comprar, cotizar o comparar alcance.',
    items: commercialHubLinkItems,
  },
  {
    title: 'Servicios relacionados',
    summary: 'Servicios que normalmente definen alcance técnico, criticidad y tiempos de respuesta.',
    items: serviceLinkItems.slice(0, 4),
  },
  {
    title: 'Evidencia verificable',
    summary: 'Antecedentes de infraestructura, soporte y operaciones críticas vinculados al pedido.',
    items: caseLinkItems.slice(0, 4),
  },
  {
    title: 'Sectores críticos',
    summary: 'Verticales donde el relevamiento debe considerar continuidad, seguridad y trazabilidad.',
    items: sectorLinkItems.slice(0, 4),
  },
];

export const geoDiscoveryStrategicGroups: StrategicLinkGroup[] = [
  {
    title: 'Hubs de intención comercial',
    summary: 'Páginas canónicas para compradores, LLMs y buscadores que necesitan resolver una consulta concreta.',
    items: commercialHubLinkItems,
  },
  {
    title: 'Fuentes legibles por máquinas',
    summary: 'Recursos GEO publicados para discovery, grounding y extracción estructurada.',
    items: [
      {
        href: '/llms.txt',
        label: 'llms.txt',
        summary: 'Índice compacto para modelos de lenguaje y buscadores conversacionales.',
        eyebrow: 'GEO',
        kind: 'geoResource',
      },
      {
        href: '/llms-full.txt',
        label: 'llms-full.txt',
        summary: 'Contexto ampliado de servicios, evidencia y rutas canónicas.',
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
      eyebrow: 'Cobertura relacionada',
    }));

const SITE_ORIGIN = 'https://www.ultimamilla.com.ar';

type RecordLike = Record<string, unknown>;

export interface StrategicPageContext {
  currentPath?: string;
  serviceId?: string | number;
  serviceName?: string;
  sectorSlug?: string;
  sectorName?: string;
  title?: string;
  summary?: string;
  text?: string;
  category?: string;
  tags?: string[];
  relatedServices?: RecordLike[];
  relatedCases?: RecordLike[];
  relatedPosts?: RecordLike[];
}

const serviceAliasesById: Record<string, string[]> = {
  '101': ['red', 'redes', 'fibra', 'cableado', 'switching', 'wifi', 'radioenlace', 'infraestructura'],
  '102': ['seguridad electronica', 'cctv', 'camara', 'camaras', 'control de acceso', 'intrusion', 'perimetro'],
  '103': ['telecomunicaciones', 'datos', 'voz', 'video', 'comunicaciones', 'enlace', 'radioenlace'],
  '104': ['software', 'desarrollo', 'sistema', 'api', 'integracion', 'erp', 'web', 'mobile', 'digitalizacion'],
  '105': ['soporte', 'mesa de ayuda', 'mantenimiento', 'monitoreo', 'sla', '24/7', 'incidente'],
  '106': ['consultoria', 'auditoria', 'arquitectura', 'roadmap', 'transformacion digital', 'riesgo'],
  '107': ['incendio', 'deteccion', 'sdi', 'alarma', 'notifier', 'sensor', 'bomberos'],
  '108': ['energia', 'electrico', 'electricos', 'ups', 'tablero', 'puesta a tierra', 'data center'],
};

const cleanText = (value: unknown): string =>
  String(value || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const truncateText = (value: unknown, max = 160): string => {
  const clean = cleanText(value);
  if (clean.length <= max) return clean;
  return `${clean.slice(0, Math.max(0, max - 3)).trimEnd()}...`;
};

const normalizeText = (value: unknown): string =>
  cleanText(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9/]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const toPath = (href = ''): string => {
  const raw = String(href || '').trim();
  if (!raw) return '';
  try {
    const pathname = raw.startsWith('http') ? new URL(raw).pathname : raw.split(/[?#]/)[0];
    const normalized = normalizeSlug(pathname);
    return normalized ? `/${normalized}` : '/';
  } catch {
    const normalized = normalizeSlug(raw.split(/[?#]/)[0]);
    return normalized ? `/${normalized}` : '/';
  }
};

const isSamePath = (a?: string, b?: string): boolean => Boolean(a && b && toPath(a) === toPath(b));

const serviceIdFromHref = (href: string): string => href.match(/\/servicios\/(\d+)\//)?.[1] || '';

const firstString = (record: RecordLike, keys: string[]): string => {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number') return String(value);
  }
  return '';
};

const itemFromRecord = (
  record: RecordLike,
  kind: StrategicLinkKind,
  reason: string,
): StrategicLinkItem | null => {
  const explicitHref = firstString(record, ['href', 'url']);
  const id = firstString(record, ['id']);
  const slug = firstString(record, ['slug']);
  const href = explicitHref || (
    kind === 'service' && id && slug
      ? `/servicios/${id}/${slug}`
      : kind === 'case' && id && slug
        ? (slug.includes('/') ? `/antecedentes/${slug}` : `/antecedentes/${id}/${slug}`)
        : kind === 'core' && slug
          ? `/blog/${slug}`
          : ''
  );
  if (!href) return null;

  const title = firstString(record, ['label', 'title', 'titulo', 'Titulo', 'nombre', 'Nombre']);
  const client = firstString(record, ['client', 'Cliente']);
  const label = kind === 'case' && client && title && !title.includes(client)
    ? `${client}: ${title}`
    : title || client || href;
  const summary = truncateText(
    firstString(record, ['summary', 'resumen', 'Resumen', 'lead', 'descripcion', 'Descripcion', 'description']) ||
    (kind === 'case' ? `Evidencia vinculada a ${client || 'la operación'}.` : `Contenido relacionado: ${label}.`),
    150,
  );
  const eyebrow = firstString(record, ['eyebrow', 'Area', 'area', 'categoria']) || (
    kind === 'service' ? 'Capacidad' :
    kind === 'sector' ? 'Sector' :
    kind === 'case' ? 'Evidencia' :
    'Relacionado'
  );
  const image = firstString(record, ['image', 'imageUrl', 'imagen', 'Imagen']);

  return { href, label, summary, reason, eyebrow, kind, ...(image ? { image } : {}) };
};

const scoreItem = (item: StrategicLinkItem, contextText: string, aliases: string[] = []): number => {
  const context = normalizeText(contextText);
  if (!context) return 0;

  const label = normalizeText(item.label);
  const summary = normalizeText(item.summary);
  let score = 0;

  if (label && context.includes(label)) score += 8;
  if (summary && context.includes(summary.slice(0, 48))) score += 2;

  const labelTokens = label.split(' ').filter((token) => token.length > 3);
  score += labelTokens.reduce((total, token) => total + (context.includes(token) ? 1 : 0), 0);
  score += aliases.reduce((total, alias) => total + (context.includes(normalizeText(alias)) ? 3 : 0), 0);

  return score;
};

const scoredItems = (
  items: StrategicLinkItem[],
  contextText: string,
  currentPath = '',
  limit = 4,
  aliasesForItem: (item: StrategicLinkItem) => string[] = () => [],
): StrategicLinkItem[] => {
  const scored = items
    .filter((item) => !isSamePath(item.href, currentPath))
    .map((item, index) => ({
      item,
      index,
      score: scoreItem(item, contextText, aliasesForItem(item)),
    }))
    .sort((a, b) => b.score - a.score || a.index - b.index);

  const matching = scored.filter((entry) => entry.score > 0).map((entry) => entry.item);
  const fallback = scored.map((entry) => entry.item);
  return uniqueByHref((matching.length > 0 ? matching : fallback).slice(0, limit));
};

const decorateItems = (
  items: StrategicLinkItem[],
  reason: (item: StrategicLinkItem) => string,
): StrategicLinkItem[] =>
  items.map((item) => ({
    ...item,
    reason: item.reason || reason(item),
  }));

const serviceAliasesForItem = (item: StrategicLinkItem): string[] =>
  serviceAliasesById[serviceIdFromHref(item.href)] || [];

const serviceItemsFromRecords = (records: RecordLike[] = [], reason: string): StrategicLinkItem[] =>
  uniqueByHref(records.map((record) => itemFromRecord(record, 'service', reason)).filter(Boolean) as StrategicLinkItem[]);

const caseItemsFromRecords = (records: RecordLike[] = [], reason: string, currentPath = ''): StrategicLinkItem[] =>
  uniqueByHref(
    (records.map((record) => itemFromRecord(record, 'case', reason)).filter(Boolean) as StrategicLinkItem[])
      .filter((item) => !isSamePath(item.href, currentPath)),
  );

const postItemsFromRecords = (records: RecordLike[] = [], reason: string, currentPath = ''): StrategicLinkItem[] =>
  uniqueByHref(
    (records.map((record) => itemFromRecord(record, 'core', reason)).filter(Boolean) as StrategicLinkItem[])
      .filter((item) => !isSamePath(item.href, currentPath)),
  );

const matchingCommercialHubItems = (context: StrategicPageContext, limit = 4): StrategicLinkItem[] => {
  const contextText = [
    context.serviceName,
    context.sectorName,
    context.title,
    context.summary,
    context.text,
    context.tags?.join(' '),
  ].filter(Boolean).join(' ');
  const currentPath = context.currentPath || '';
  const serviceId = context.serviceId ? String(context.serviceId) : '';
  const sectorPath = context.sectorSlug ? `/${context.sectorSlug}` : '';
  const normalizedContext = normalizeText(contextText);

  const scored = geoCommercialHubSlugs.map((slug, index) => {
    const hub = geoCommercialHubs[slug];
    const href = `/${hub.slug}`;
    let score = isSamePath(href, currentPath) ? -100 : 0;

    if (serviceId && hub.services.some((service) => serviceIdFromHref(service.href) === serviceId)) score += 12;
    if (sectorPath && hub.sectors.some((sector) => isSamePath(sector.href, sectorPath))) score += 10;
    score += hub.searchTerms.reduce((total, term) => total + (normalizedContext.includes(normalizeText(term)) ? 3 : 0), 0);
    score += hub.services.reduce((total, service) => total + (normalizedContext.includes(normalizeText(service.title)) ? 2 : 0), 0);
    score += hub.sectors.reduce((total, sector) => total + (normalizedContext.includes(normalizeText(sector.title)) ? 2 : 0), 0);

    return { slug, hub, index, score };
  }).sort((a, b) => b.score - a.score || a.index - b.index);

  const selected = scored.filter((entry) => entry.score > 0).slice(0, limit);
  const fallback = scored.filter((entry) => entry.score >= 0).slice(0, limit);

  return (selected.length > 0 ? selected : fallback).map(({ hub }) => {
    const href = `/${hub.slug}`;
    const item = commercialHubLinkItems.find((candidate) => candidate.href === href) || {
      href,
      label: hub.h1,
      summary: hub.description,
      eyebrow: hub.market,
      kind: 'geoHub' as const,
    };
    const reason = serviceId && hub.services.some((service) => serviceIdFromHref(service.href) === serviceId)
      ? 'Incluye esta capacidad dentro de una consulta comercial concreta.'
      : sectorPath && hub.sectors.some((sector) => isSamePath(sector.href, sectorPath))
        ? 'Conecta este vertical con compra, presupuesto o ingeniería.'
        : 'Amplía la consulta hacia presupuesto, cobertura o ingeniería.';

    return { ...item, reason };
  });
};

const actionItems = (mode: 'service' | 'sector' | 'case' | 'blog'): StrategicLinkItem[] => {
  const common: StrategicLinkItem[] = [
    {
      href: '/contacto',
      label: 'Contacto técnico',
      summary: 'Enviar contexto, sede, urgencia y alcance esperado para recibir el próximo paso.',
      reason: 'Convierte lectura en una solicitud con contexto técnico.',
      eyebrow: 'Acción',
      kind: 'core',
    },
    {
      href: '/presupuesto-servicios-it-empresas',
      label: 'Presupuesto IT',
      summary: 'Ordena variables de alcance, criticidad, materiales, SLA y documentación.',
      reason: 'Ayuda a comparar alcance antes de hablar de precio.',
      eyebrow: 'Compra',
      kind: 'geoHub',
    },
    {
      href: '/antecedentes',
      label: 'Archivo de antecedentes',
      summary: 'Evidencia operativa para contrastar servicios, sectores y casos comparables.',
      reason: 'Lleva la decisión hacia evidencia verificable.',
      eyebrow: 'Evidencia',
      kind: 'case',
    },
  ];

  if (mode === 'blog') {
    return [
      common[0],
      {
        href: '/servicios',
        label: 'Servicios IT',
        summary: 'Capacidades técnicas para pasar de la lectura a un alcance posible.',
        reason: 'Conecta contenido editorial con servicios aplicables.',
        eyebrow: 'Servicios',
        kind: 'service',
      },
      common[2],
    ];
  }

  return common;
};

export const buildServiceStrategicLinkGroups = (context: StrategicPageContext): StrategicLinkGroup[] => {
  const contextText = [context.serviceName, context.title, context.summary, context.text].filter(Boolean).join(' ');
  const currentServiceId = context.serviceId ? String(context.serviceId) : '';
  const complementaryServices = scoredItems(serviceLinkItems, contextText, context.currentPath, 4, serviceAliasesForItem)
    .filter((item) => serviceIdFromHref(item.href) !== currentServiceId)
    .slice(0, 4);

  return [
    {
      title: 'Presupuesto y cobertura',
      summary: 'Opciones para empezar por zona, compra o alcance.',
      items: matchingCommercialHubItems(context),
    },
    {
      title: 'Capacidades complementarias',
      summary: 'Servicios que suelen completar el alcance técnico y operativo.',
      items: decorateItems(complementaryServices, () => 'Complementa el servicio principal en proyectos reales.'),
    },
    {
      title: 'Sectores donde aplica',
      summary: 'Verticales donde cambia el riesgo, la criticidad o la documentación.',
      items: decorateItems(scoredItems(sectorLinkItems, contextText, context.currentPath, 4), () => 'Muestra el mismo servicio en un contexto operativo distinto.'),
    },
    {
      title: 'Evidencia y avance',
      summary: 'Casos y acciones para pasar de lectura a relevamiento.',
      items: decorateItems(scoredItems(caseLinkItems, contextText, context.currentPath, 2), () => 'Caso comparable para validar experiencia ejecutada.').concat(actionItems('service').slice(0, 2)),
    },
  ];
};

export const buildSectorStrategicLinkGroups = (context: StrategicPageContext): StrategicLinkGroup[] => {
  const contextText = [context.sectorName, context.title, context.summary, context.text, context.tags?.join(' ')].filter(Boolean).join(' ');
  const serviceItems = serviceItemsFromRecords(context.relatedServices || [], `Servicio aplicado al mapa operativo de ${context.sectorName || 'este sector'}.`);
  const inferredServices = decorateItems(scoredItems(serviceLinkItems, contextText, context.currentPath, 4, serviceAliasesForItem), () => 'Capacidad inferida por el riesgo y la necesidad del sector.');
  const caseItems = caseItemsFromRecords(context.relatedCases || [], `Evidencia ejecutada para ${context.sectorName || 'este sector'}.`, context.currentPath);

  return [
    {
      title: 'Servicios aplicados',
      summary: 'Capacidades que sostienen la operación del vertical.',
      items: (serviceItems.length > 0 ? serviceItems : inferredServices).slice(0, 4),
    },
    {
      title: 'Evidencia del sector',
      summary: 'Antecedentes que explican el vínculo entre riesgo y solución.',
      items: caseItems.slice(0, 4),
    },
    {
      title: 'Presupuesto y cobertura',
      summary: 'Opciones para conectar vertical, compra y presupuesto.',
      items: matchingCommercialHubItems(context),
    },
    {
      title: 'Siguiente paso',
      summary: 'Acciones para llevar el dossier a una conversación técnica.',
      items: actionItems('sector'),
    },
  ];
};

export const buildCaseStrategicLinkGroups = (context: StrategicPageContext): StrategicLinkGroup[] => {
  const serviceItems = serviceItemsFromRecords(context.relatedServices || [], 'Servicio aplicado o inferido desde el alcance del antecedente.');
  const contextText = [
    context.title,
    context.summary,
    context.sectorName,
    context.text,
    serviceItems.map((item) => item.label).join(' '),
  ].filter(Boolean).join(' ');

  return [
    {
      title: 'Servicio aplicado',
      summary: 'Capacidad técnica conectada directamente con este antecedente.',
      items: (serviceItems.length > 0
        ? serviceItems
        : decorateItems(scoredItems(serviceLinkItems, contextText, context.currentPath, 3, serviceAliasesForItem), () => 'Capacidad inferida por título, descripción o sector del caso.')
      ).slice(0, 4),
    },
    {
      title: 'Casos comparables',
      summary: 'Evidencia cercana por vertical, cliente, alcance o tecnología.',
      items: caseItemsFromRecords(context.relatedCases || [], 'Comparte sector, criticidad o tipo de intervención.', context.currentPath).slice(0, 4),
    },
    {
      title: 'Presupuesto y cobertura',
      summary: 'Opciones para convertir esta evidencia en una decisión comercial.',
      items: matchingCommercialHubItems({ ...context, text: contextText }),
    },
    {
      title: 'Siguiente paso',
      summary: 'Acciones para pedir un relevamiento similar o ver más evidencia.',
      items: actionItems('case'),
    },
  ];
};

export const buildBlogStrategicLinkGroups = (context: StrategicPageContext): StrategicLinkGroup[] => {
  const contextText = [
    context.title,
    context.summary,
    context.category,
    context.tags?.join(' '),
    context.text,
  ].filter(Boolean).join(' ');
  const relatedPosts = postItemsFromRecords(context.relatedPosts || [], 'Lectura cercana por fecha, categoría o continuidad editorial.', context.currentPath);

  return [
    {
      title: 'Servicios relacionados',
      summary: 'Capacidades técnicas que dan contexto comercial a la lectura.',
      items: decorateItems(scoredItems(serviceLinkItems, contextText, context.currentPath, 4, serviceAliasesForItem), () => 'La nota menciona esta capacidad o un problema que suele resolver.'),
    },
    {
      title: 'Sectores sugeridos',
      summary: 'Verticales donde el tema cambia por criticidad, cumplimiento o continuidad.',
      items: decorateItems(scoredItems(sectorLinkItems, contextText, context.currentPath, 4), () => 'Sector donde esta lectura puede convertirse en decisión operativa.'),
    },
    {
      title: 'Presupuesto y cobertura',
      summary: 'Opciones para continuar desde la lectura hacia compra o alcance.',
      items: matchingCommercialHubItems(context),
    },
    {
      title: relatedPosts.length > 0 ? 'Lecturas cercanas' : 'Acciones',
      summary: relatedPosts.length > 0
        ? 'Notas contiguas para continuar el recorrido editorial.'
        : 'Accesos para conectar la lectura con evidencia y contacto.',
      items: (relatedPosts.length > 0 ? relatedPosts.slice(0, 3) : actionItems('blog')),
    },
  ];
};

export const strategicLinkGroupUrls = (groups: StrategicLinkGroup[], siteUrl = SITE_ORIGIN): string[] =>
  Array.from(new Set(
    groups
      .flatMap((group) => group.items.map((item) => item.href))
      .filter(Boolean)
      .map((href) => new URL(href, siteUrl).toString()),
  ));

export const buildStrategicWebPageStructuredData = ({
  url,
  name,
  description,
  groups,
}: {
  url: string;
  name: string;
  description?: string;
  groups: StrategicLinkGroup[];
}) => {
  const significantLinks = strategicLinkGroupUrls(groups);

  return {
    '@type': 'WebPage',
    '@id': `${url}#webpage`,
    url,
    name,
    ...(description ? { description } : {}),
    significantLink: significantLinks,
    relatedLink: significantLinks.slice(0, 12),
    hasPart: significantLinks.slice(0, 12).map((link) => ({
      '@type': 'WebPage',
      url: link,
    })),
  };
};

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
