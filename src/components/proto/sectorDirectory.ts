import { sectorDeclaredServices, sectorSystemTask } from '../../data/propuesta/sector-integration';
import { miningRadioHref } from '../../data/propuesta/workScenes';
import { NAV_SECTORS } from '../../data/navigation';
import { catalogResultsHref, matchesCatalogSector } from './catalogFilters';
import { pageCaseCandidates, sectorReference } from './caseSelection';
import { publicCaseTitle } from './casePresentation';
import { SECTOR_PHOTO, type Story } from './isoData';

export function sectorDirectory(stories: Story[]) {
  return NAV_SECTORS.map((sector) => {
    const members = stories.filter(story => matchesCatalogSector(story.sectorSlug, story.serviceCodes, sector.slug));
    const service = sector.slug === 'software' ? '104' : sector.slug === 'seguridad-electronica' ? '102' : undefined;
    const reference = sectorReference(sector.slug, pageCaseCandidates(members, sector.slug, service));
    const mineLink = sector.slug === 'mineria' && sectorDeclaredServices(sector.slug).includes('103')
      ? { title: sectorSystemTask(sector.slug, '103'), href: miningRadioHref(true) }
      : undefined;
    return {
      task: mineLink,
      slug: sector.slug,
      name: sector.name,
      reference: reference && { title: publicCaseTitle(reference), client: reference.client, href: reference.href },
      summary: sector.text,
      photo: SECTOR_PHOTO[sector.slug] || SECTOR_PHOTO.constructoras,
      href: sector.href,
      detailHref: sector.href + (service ? '#provision' : '#integracion'),
      detailLabel: service ? 'Qué proveemos' : 'Ver integración',
      archiveHref: catalogResultsHref({ sector: sector.slug }),
      count: members.length,
    };
  });
}
