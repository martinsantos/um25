import { ANTECEDENTES } from './um26-data/antecedentes';
import { BLOG_POSTS } from './um26-data/blog';
import { getAntecedenteImage, getSectorCover, getServiceCover } from './um26-data/images';
import { SECTORES } from './um26-data/sectores';
import { SERVICIOS } from './um26-data/servicios';
import type {
  Antecedente as SourceAntecedente,
  BlogPost as SourceBlogPost,
  Sector as SourceSector,
  Servicio as SourceServicio,
  ServiceCode,
} from './um26-data/types';

type FetchOptions = {
  limit?: number;
  sort?: string;
};

export type Servicio = {
  code: number;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  capabilities: string[];
  alcance_operativo: string;
  scope_operativo: { titulo?: string; label?: string; desc?: string; value?: string }[];
  proceso: { titulo: string; desc: string; icon?: string }[];
  metadata: { label: string; value: string }[];
  icon: string;
  sectors: string[];
  cover: string;
};

export type Sector = {
  slug: string;
  name: string;
  short_name: string;
  icon: string;
  description: string;
  accent_color: string;
  services: number[];
  highlights: string[];
  antecedentes_count: number;
  cover: string;
};

export type Antecedente = {
  id: number;
  title: string;
  slug: string;
  client: string;
  sector_slug: string;
  service_codes: number[];
  year: number;
  month: number;
  location: string;
  scope: string[];
  status: 'verificado' | 'operativo' | 'mantenimiento';
  image: string;
  summary: string;
  tags: string[];
};

export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  author: string;
  date: string;
  reading_minutes: number;
  tags: string[];
  featured: boolean;
  summary: string;
  body?: string;
};

function toServicio(servicio: SourceServicio): Servicio {
  return {
    code: servicio.code,
    name: servicio.name,
    slug: servicio.slug,
    tagline: servicio.tagline,
    description: servicio.description,
    capabilities: servicio.capabilities,
    alcance_operativo: servicio.alcanceOperativo,
    scope_operativo: servicio.scopeOperativo.map((point) => ({
      titulo: point.label,
      desc: point.value,
      label: point.label,
      value: point.value,
    })),
    proceso: servicio.proceso.map((step) => ({ titulo: step.title, desc: step.description })),
    metadata: servicio.metadata,
    icon: servicio.icon,
    sectors: servicio.sectorIds,
    cover: getServiceCover(servicio.code),
  };
}

function toSector(sector: SourceSector): Sector {
  return {
    slug: sector.slug,
    name: sector.name,
    short_name: sector.shortName,
    icon: sector.icon,
    description: sector.description,
    accent_color: sector.accentColor,
    services: sector.services,
    highlights: sector.highlights,
    antecedentes_count: sector.antecedentesCount,
    cover: getSectorCover(sector.slug),
  };
}

function toAntecedente(antecedente: SourceAntecedente): Antecedente {
  return {
    id: antecedente.id,
    title: antecedente.title,
    slug: antecedente.slug,
    client: antecedente.client,
    sector_slug: antecedente.sectorSlug,
    service_codes: antecedente.serviceCodes,
    year: antecedente.year,
    month: antecedente.month,
    location: antecedente.location,
    scope: antecedente.scope,
    status: antecedente.status,
    image: getAntecedenteImage(
      antecedente.sectorSlug,
      antecedente.serviceCodes as ServiceCode[],
      antecedente.id,
    ),
    summary: antecedente.summary,
    tags: antecedente.tags,
  };
}

function toBlogPost(post: SourceBlogPost): BlogPost {
  return {
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    category: post.category,
    author: post.author,
    date: post.date,
    reading_minutes: post.readingMinutes,
    tags: post.tags,
    featured: post.featured,
    summary: post.summary,
  };
}

function sortAntecedentes(items: Antecedente[], sort = '-year,-month') {
  if (sort === '-year,-month') {
    return [...items].sort((a, b) => b.year - a.year || b.month - a.month);
  }
  return items;
}

function sortBlog(items: BlogPost[], sort = '-date') {
  if (sort === '-date') return [...items].sort((a, b) => b.date.localeCompare(a.date));
  return items;
}

function limit<T>(items: T[], n?: number) {
  return typeof n === 'number' ? items.slice(0, n) : items;
}

function normalizeRouteSlug(slug: string) {
  return String(slug || '').replace(/^\d+-/, '');
}

export async function getServicios(): Promise<Servicio[]> {
  return SERVICIOS.map(toServicio).sort((a, b) => a.code - b.code);
}

export async function getServicioByCode(code: number): Promise<Servicio | null> {
  return (await getServicios()).find((servicio) => servicio.code === Number(code)) ?? null;
}

export async function getSectores(): Promise<Sector[]> {
  return SECTORES.map(toSector);
}

export async function getSectorBySlug(slug: string): Promise<Sector | null> {
  return (await getSectores()).find((sector) => sector.slug === slug) ?? null;
}

export async function getAntecedentes(options: FetchOptions = {}): Promise<Antecedente[]> {
  return limit(sortAntecedentes(ANTECEDENTES.map(toAntecedente), options.sort), options.limit);
}

export async function getAntecedenteById(id: number): Promise<Antecedente | null> {
  return (await getAntecedentes({ limit: 1000 })).find((antecedente) => antecedente.id === Number(id)) ?? null;
}

export async function getAntecedenteBySlug(slug: string): Promise<Antecedente | null> {
  const normalizedSlug = normalizeRouteSlug(slug);
  return (await getAntecedentes({ limit: 1000 })).find((antecedente) =>
    antecedente.slug === slug || normalizeRouteSlug(antecedente.slug) === normalizedSlug
  ) ?? null;
}

export async function getAntecedentesBySector(sectorSlug: string): Promise<Antecedente[]> {
  return (await getAntecedentes({ limit: 1000 })).filter((antecedente) => antecedente.sector_slug === sectorSlug);
}

export async function getAntecedentesByService(code: number): Promise<Antecedente[]> {
  return (await getAntecedentes({ limit: 1000 })).filter((antecedente) =>
    antecedente.service_codes.includes(Number(code)),
  );
}

export async function getBlogPosts(options: FetchOptions = {}): Promise<BlogPost[]> {
  return limit(sortBlog(BLOG_POSTS.map(toBlogPost), options.sort), options.limit);
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  return (await getBlogPosts({ limit: 1000 })).find((post) => post.slug === slug) ?? null;
}

export async function getBlogPostsByCategory(category: string): Promise<BlogPost[]> {
  return (await getBlogPosts({ limit: 1000 })).filter((post) => post.category === category);
}
