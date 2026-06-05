import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '../config/seo';
import { generateSlug } from '../utils/slugUtils.js';
import { canonicalUrl } from '../utils/seoUrl';
import { geoCommercialHubs } from './geoCommercialHubs';
import { sectorVisualOrder, sectorVisualSystem } from './sectorVisualSystem';
import { serviceVisualOrder, serviceVisualSystem } from './serviceVisualSystem';
import antecedentesSnapshot from './snapshots/antecedentes.json';
import serviciosSnapshot from './snapshots/servicios.json';
import { getInstitutionalProofLines } from '../utils/verifiedProof';
import {
  getAntecedentesImageEvidenceCoverage,
  getAntecedentesImageEvidenceEntries,
} from '../utils/antecedentesImageEvidence';

type Snapshot<T> = { data?: T[] } | T[];

interface SnapshotService {
  id: number;
  Titulo: string;
  Descripcion?: string;
  slug?: string;
}

interface SnapshotCase {
  id: number;
  Titulo: string;
  Descripcion?: string;
  Cliente?: string;
  Area?: string;
  Fecha?: string;
}

const snapshotData = <T>(snapshot: Snapshot<T>): T[] => (
  Array.isArray(snapshot) ? snapshot : snapshot.data || []
);

export const geoVersion = '2026-06-05';

export const geoHubRoutes = Object.values(geoCommercialHubs).map((hub) => ({
  slug: hub.slug,
  url: canonicalUrl(`/${hub.slug}`),
  title: hub.title,
  h1: hub.h1,
  description: hub.description,
  intent: hub.intent,
  market: hub.market,
  buyerNeed: hub.buyerNeed,
  ctas: [hub.primaryCta, hub.secondaryCta],
  linkedServices: hub.services.map((service) => service.title),
  linkedSectors: hub.sectors.map((sector) => sector.title),
  evidence: hub.cases.map((item) => `${item.client}: ${item.title}`),
}));

export const geoServiceResources = snapshotData<SnapshotService>(serviciosSnapshot as Snapshot<SnapshotService>)
  .map((service) => {
    const visual = serviceVisualSystem[Number(service.id)];
    const slug = service.slug || generateSlug(service.Titulo);

    return {
      id: service.id,
      name: visual?.shortName || service.Titulo,
      canonicalName: service.Titulo,
      url: canonicalUrl(`/servicios/${service.id}/${slug}`),
      summary: visual?.proof || service.Descripcion || '',
      category: visual?.eyebrow || 'Servicios IT integrales',
      signal: visual?.signal,
      order: serviceVisualOrder.indexOf(Number(service.id)) + 1 || 99,
    };
  })
  .sort((a, b) => a.order - b.order);

export const geoSectorResources = sectorVisualOrder.map((slug) => {
  const sector = sectorVisualSystem[slug];

  return {
    slug,
    name: sector.label,
    url: canonicalUrl(`/${slug}`),
    headline: sector.headline,
    summary: sector.summary,
    proof: sector.proof,
    operatingNeed: sector.operatingNeed,
    services: sector.services,
    cases: sector.cases,
  };
});

const prioritizedCaseIds = new Set<number>(
  Object.values(geoCommercialHubs)
    .flatMap((hub) => hub.cases)
    .map((item) => Number(item.href.split('/')[2]))
    .filter(Boolean)
);

export const geoCaseResources = snapshotData<SnapshotCase>(antecedentesSnapshot as Snapshot<SnapshotCase>)
  .filter((item, index) => prioritizedCaseIds.has(item.id) || index < 64)
  .map((item) => ({
    id: item.id,
    title: item.Titulo,
    client: item.Cliente || 'Cliente institucional',
    sector: item.Area || 'Servicios IT',
    url: canonicalUrl(`/antecedentes/${item.id}/${generateSlug(item.Titulo)}`),
    summary: item.Descripcion || '',
    date: item.Fecha || null,
    priority: prioritizedCaseIds.has(item.id) ? 'high' : 'supporting',
  }));

export function buildGeoResource(resource: string) {
  const common = {
    version: geoVersion,
    canonicalDomain: SITE_URL,
    language: 'es-AR',
    brand: SITE_NAME,
  };

  switch (resource) {
    case 'brand-facts':
      return {
        ...common,
        name: SITE_NAME,
        website: SITE_URL,
        description: SITE_DESCRIPTION,
        position: 'Servicios IT integrales para operaciones que no pueden detenerse.',
        location: 'Mendoza, Argentina',
        coverage: ['Mendoza', 'Cuyo', 'Patagonia', 'Argentina según alcance'],
        proof: getInstitutionalProofLines(),
        accentColor: '#DC2626',
        publicContact: `${SITE_URL}/contacto`,
      };

    case 'services':
      return { ...common, services: geoServiceResources };

    case 'sectors':
      return { ...common, sectors: geoSectorResources };

    case 'cases':
      return { ...common, cases: geoCaseResources };

    case 'image-evidence': {
      const imageEvidence = getAntecedentesImageEvidenceEntries();

      return {
        ...common,
        role: 'Mapa verificable de imagenes generadas, aprobadas y asociadas a antecedentes publicos.',
        policy: [
          'No inventar nombres de clientes, ubicaciones ni resultados a partir de la imagen.',
          'Usar pageUrl como fuente canonica del antecedente y imageUrl como evidencia visual asociada.',
          'Si un campo aparece como null, tratarlo como no publicado.',
        ],
        coverage: getAntecedentesImageEvidenceCoverage(),
        sitemap: canonicalUrl('/sitemap-images.xml'),
        images: imageEvidence.map((entry) => ({
          id: entry.id,
          title: entry.title,
          pageUrl: entry.pageUrl,
          imageUrl: entry.imageUrl,
          client: entry.client,
          sector: entry.sector,
          date: entry.date,
        })),
      };
    }

    case 'faqs':
      return {
        ...common,
        faqs: Object.values(geoCommercialHubs).flatMap((hub) => (
          hub.faqs.map((faq) => ({
            source: canonicalUrl(`/${hub.slug}`),
            market: hub.market,
            question: faq.question,
            answer: faq.answer,
          }))
        )),
      };

    case 'authority':
      return {
        ...common,
        evidenceModel: 'Servicios, sectores, antecedentes, hubs comerciales y FAQs enlazados con canonicals estables.',
        trustSignals: ['Trayectoria pública', 'Casos documentados', 'Cobertura regional', 'Servicios conectados', 'Contacto institucional'],
        canonicalHubs: geoHubRoutes,
      };

    case 'topics':
      return {
        ...common,
        topics: [
          'servicios IT para empresas',
          'infraestructura de redes',
          'soporte técnico 24/7',
          'seguridad electrónica',
          'telecomunicaciones',
          'software a medida',
          'energía para infraestructura IT',
          'proyectos de ingeniería IT',
          'presupuesto de servicios IT',
        ],
      };

    case 'buyer-intents':
      return {
        ...common,
        intents: Object.values(geoCommercialHubs).map((hub) => ({
          intent: hub.intent,
          page: canonicalUrl(`/${hub.slug}`),
          queryFamilies: hub.searchTerms,
          buyerNeed: hub.buyerNeed,
          decisionFrame: hub.decisionFrame,
          primaryCta: hub.primaryCta,
        })),
      };

    case 'blog-index':
      return {
        ...common,
        blog: {
          url: canonicalUrl('/blog'),
          role: 'Archivo editorial técnico para explicar riesgos, criterios de decisión, normativa y operación IT.',
          recommendedTopics: ['continuidad operativa', 'seguridad electrónica', 'soporte IT', 'software operativo', 'infraestructura documentada'],
        },
      };

    default:
      return null;
  }
}

export const geoResourceNames = [
  'brand-facts',
  'services',
  'sectors',
  'cases',
  'image-evidence',
  'faqs',
  'authority',
  'topics',
  'buyer-intents',
  'blog-index',
];
