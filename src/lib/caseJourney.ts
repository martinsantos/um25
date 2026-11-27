import type { APIContext } from 'astro';
import type { Story } from '../components/proto/isoData';
import { sectorSystemEvidence } from '../components/proto/sectorSystemEvidence';
import { NAV_SECTORS, NAV_SERVICES, directoryCardId } from '../data/navigation';
import { matchesServiceReference, serviceOverview } from '../components/proto/serviceReference';
import { pageCaseCandidates, sectorReference } from '../components/proto/caseSelection';
import { sectorSystemTask } from '../data/propuesta/sector-integration';
import { sectorJourney, serviceJourney } from '../data/propuesta/recorrido';
import { wineryContactParams, wineryZoneForCase, wineryZones } from '../data/propuesta/wineryZones';
import { miningRadioHref, provisionDestination, sectorSystemAnchor } from '../data/propuesta/workScenes';
import { contactLink } from './contactEntry';
import { publicDespiecePath } from './despieceRoutes';

/** The caller's query identifies a journey only when the catalogue links that task to this work. */
export function caseJourney(story: Story, params: URLSearchParams, stories: Story[]) {
  const id = story.id;
  const zone = wineryZoneForCase(id, params.get('zona'));
  if (zone) return {
    href: `/sectores/bodegas?zona=${zone.key}#integracion`,
    label: 'Bodegas · ' + zone.label,
    contact: new URLSearchParams({ ...Object.fromEntries(wineryContactParams(zone)), zona: zone.key }),
  };

  const code = params.get('sistema') || '';
  const origin = params.get('desde');
  if (origin === 'ejemplo-mineria' && sectorSystemEvidence(stories, 'industria', '103').story?.id === id) {
    return {
      href: miningRadioHref(params.get('via') === 'inicio'),
      label: 'Volver al radioenlace de Minería',
      contact: new URLSearchParams({ desde: origin, ...(params.get('via') === 'inicio' ? { via: 'inicio' } : {}) }),
    };
  }

  if (origin === 'directorio' || origin === 'inicio') {
    const slug = params.get('sector');
    const entry = slug ? NAV_SECTORS.find(sector => sector.slug === slug) : NAV_SERVICES.find(service => service.code === code);
    if (!entry || (slug && code)) return;
    const technicalService = slug === 'software' ? '104' : slug === 'seguridad-electronica' ? '102' : undefined;
    const reference = slug ? sectorReference(slug, pageCaseCandidates([story], slug, technicalService))
      : serviceOverview(stories, code).reference;
    if (reference?.id !== id) return;
    const directory = slug ? 'sectores' : 'servicios';
    const href = origin === 'inicio'
      ? slug ? `/#obra-sector-${slug}` : `/?servicio=${code}#referencia-servicio-${code}`
      : `/${directory}#obra-${directoryCardId(entry.href)}`;
    return {
      href,
      label: (origin === 'inicio' ? 'Inicio' : slug ? 'Sectores' : 'Servicios') + ' · ' + entry.name,
      contact: new URLSearchParams({ desde: origin, ...(slug ? { sector: slug } : { sistema: code }) }),
    };
  }
  if (!/^10[1-8]$/.test(code)) return;
  if (origin === 'sector') {
    const slug = params.get('sector') || '';
    if (!Object.prototype.hasOwnProperty.call(sectorJourney, slug)) return;
    const technical = slug === 'software' || slug === 'seguridad-electronica';
    if (technical) {
      const expected = slug === 'software' ? '104' : '102';
      if (expected !== code || !pageCaseCandidates([story], undefined, code).length) return;
    } else if (sectorSystemEvidence(stories, slug, code).story?.id !== id) return;
    const label = sectorJourney[slug]!.name;
    const task = sectorSystemTask(slug, code) || serviceJourney[code]!.name;
    return {
      href: technical ? `/${slug}#provision` : `/sectores/${slug}#${sectorSystemAnchor(slug, code)}`,
      label: technical ? label : label + ' · ' + task,
      contact: new URLSearchParams({ desde: 'sector', sector: slug, sistema: code }),
    };
  }
  if (origin !== 'servicio') return;
  const group = params.get('grupo') || '';
  const service = serviceJourney[code];
  if (!service || !Object.prototype.hasOwnProperty.call(service.groups, group) || service.groups[group]?.reference?.id !== id) return;
  const destination = provisionDestination(code, group);
  return {
    href: `/servicios/${code}#${destination.id}`,
    label: service.name + ' · ' + destination.label,
    contact: new URLSearchParams({ desde: 'servicio', sistema: code, grupo: group }),
  };
}

/** Link only to the sector registered for this public work. */
export function sectorWorkLink(story: Story) {
  const entry = NAV_SECTORS.find(sector => sector.slug === story.sectorSlug);
  if (!entry) return;

  const source = new URLSearchParams({ desde: 'obra', antecedente: String(story.id) });
  const anchor = entry.href.startsWith('/sectores/')
    ? entry.slug === 'bodegas' ? '#sistemas' : '#integracion'
    : '#provision';
  return {
    story,
    href: entry.href + '?' + source + anchor,
    contact: new URLSearchParams({ ...Object.fromEntries(source), sector: entry.slug }),
  };
}

export function sectorWorkEnquiry(slug: string, query: URLSearchParams, stories: Story[]) {
  if (query.get('desde') !== 'obra') return;
  const id = query.get('antecedente');
  if (!id || !/^\d{1,8}$/.test(id)) return;
  const story = stories.find(item => item.sectorSlug === slug && String(item.id) === id);
  return story && sectorWorkLink(story);
}

/** Render the same work, task or explicitly chosen winery zone in all contact links. */
export function pageContactLink({ url: from, locals }: Pick<APIContext, 'url' | 'locals'>, destination = '/contacto') {
  const pathname = publicDespiecePath(from.pathname);
  const project = /^\/antecedentes\/(\d+)(?:\/|$)/.exec(pathname);
  const journey = project && locals.caseJourney;
  const zone = pathname === '/sectores/bodegas' && wineryZones.find(item => item.key === from.searchParams.get('zona'));
  const enquiry = locals.serviceWorkEnquiry;
  const sectorEnquiry = locals.sectorWorkEnquiry;
  if (!journey && !zone && !enquiry && !sectorEnquiry) return contactLink(from.pathname, destination);

  const target = new URL(destination, from);
  const reference = target.searchParams.get('antecedente');
  const workId = enquiry?.id ?? sectorEnquiry?.story.id ?? project?.[1];
  if (reference && reference !== String(workId)) return contactLink(from.pathname, destination);
  if (zone && target.searchParams.has('sistema')) return contactLink(from.pathname, destination);

  const params = enquiry
    ? new URLSearchParams({
        sistema: enquiry.code,
        antecedente: String(enquiry.id),
        ...(enquiry.group ? { grupo: enquiry.group } : { desde: 'obra' }),
      })
    : zone ? wineryContactParams(zone) : sectorEnquiry?.contact ?? (journey && journey.contact);
  params?.forEach((value, key) => target.searchParams.set(key, value));
  return contactLink(from.pathname, target.pathname + target.search);
}

/** The page restores only a selection available in its current catalogue. */
export function contactPanelReturn(from: string, params: URLSearchParams, work?: Story) {
  const source = params.get('desde');
  if (source === 'obra' && work) {
    const sector = NAV_SECTORS.find(item => item.href === from && item.slug === params.get('sector'));
    const enquiry = sector && work.sectorSlug === sector.slug ? sectorWorkLink(work) : undefined;
    if (enquiry) return { href: enquiry.href, label: 'Volver al sector' };
  }

  const code = params.get('sistema') || '';
  if (!/^10[1-8]$/.test(code)) return;

  if (from === '/sectores/bodegas' && params.get('sector') === 'bodegas' && params.get('budgetSector') === 'Bodegas') {
    const zone = wineryZones.find(item => item.service === code && item.label === params.get('budgetScope'));
    if (zone) return { href: from + '?zona=' + zone.key + '#integracion', label: 'Volver a la zona' };
  }

  if (source === 'obra' && from === '/servicios/' + code && work?.serviceCodes.includes(code)) {
    const query = new URLSearchParams({ desde: 'obra', antecedente: String(work.id) });
    return { href: from + '?' + query + '#provision', label: 'Volver al servicio' };
  }

  if (source === 'prestacion' && from === '/servicios/' + code) {
    const group = params.get('grupo')?.trim();
    if (!group || group.length > 160) return;
    const reference = serviceJourney[code]?.groups[group]?.reference;
    const query = work && reference && matchesServiceReference(work, reference)
      ? new URLSearchParams({ desde: 'obra', grupo: group, antecedente: String(work.id) })
      : new URLSearchParams({ prestacion: group });
    return { href: from + '?' + query + '#provision', label: 'Volver a la prestación' };
  }

  if (source !== 'sistema') return;
  const sector = NAV_SECTORS.find(entry => entry.href === from && entry.slug === params.get('sector'));
  if (!sector) return;
  if (sector.href.startsWith('/sectores/')) {
    const anchor = sector.slug === 'bodegas' ? '#sistemas' : '#integracion';
    return { href: from + '?sistema=' + code + anchor, label: 'Volver al sistema' };
  }
  if ((sector.slug === 'software' && code === '104') || (sector.slug === 'seguridad-electronica' && code === '102')) {
    return { href: from + '#provision', label: 'Volver al sistema' };
  }
  return undefined;
}
