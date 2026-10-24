import { sectorPoster, servicePoster } from './cine/posters';

export const editorialImageDimensions = {
  width: 1920,
  height: 1080,
};

export const generatedAntecedenteImageDimensions = {
  width: 1920,
  height: 1080,
};

/** Las curadas eran imágenes generadas; cada antecedente usa su póster Blender. */
export const curatedAntecedenteImages: Record<string, string> = {};

// Pósters isométricos limpios propios (1920×1080); ver `cine/posters.ts`. Las portadas
// editoriales anteriores eran imágenes generadas.
export const editorialImages = {
  defaultOg: sectorPoster('constructoras'),
  homeHero: sectorPoster('aeropuertos'),
  homeServices: sectorPoster('constructoras'),
  aboutHero: sectorPoster('constructoras'),
  aboutCapabilities: sectorPoster('constructoras'),
  sectors: {
    aeropuertos: sectorPoster('aeropuertos'),
    bodegas: sectorPoster('bodegas'),
    gobiernosectorpublico: sectorPoster('gobiernosectorpublico'),
    salud: sectorPoster('salud'),
    constructoras: sectorPoster('constructoras'),
    industria: sectorPoster('industria'),
    mineria: sectorPoster('mineria'),
    'seguridad-electronica': sectorPoster('seguridad-electronica'),
    software: sectorPoster('software'),
  },
  services: {
    101: servicePoster(101),
    102: servicePoster(102),
    103: servicePoster(103),
    104: servicePoster(104),
    105: servicePoster(105),
    106: servicePoster(106),
    107: servicePoster(107),
    108: servicePoster(108),
  },
} as const;

export function getSectorEditorialImage(slug: string | null | undefined): string {
  return editorialImages.sectors[slug as keyof typeof editorialImages.sectors] || editorialImages.defaultOg;
}

export function getServiceEditorialImage(serviceId: string | number | null | undefined): string {
  return editorialImages.services[Number(serviceId) as keyof typeof editorialImages.services] || editorialImages.defaultOg;
}
