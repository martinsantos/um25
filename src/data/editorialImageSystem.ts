export const editorialImageDimensions = {
  width: 1672,
  height: 941,
};

export const generatedAntecedenteImageDimensions = {
  width: 1600,
  height: 1000,
};

/** Imágenes curadas (1600×1000) que reemplazan a la generada de esos antecedentes. */
export const curatedAntecedenteImages: Record<string, string> = {
  '3064': '/img/antecedentes/curadas/3064-gobierno-software.webp',
  '3065': '/img/antecedentes/curadas/3065-aeropuerto-cctv.webp',
  '3075': '/img/antecedentes/curadas/3075-fuesmen-redes.webp',
  '3334': '/img/antecedentes/curadas/3334-bodega-servidores.webp',
};

export const editorialImages = {
  defaultOg: '/images/editorial/umsa-home-operations.webp',
  homeHero: '/images/editorial/umsa-home-operations.webp',
  homeServices: '/images/editorial/umsa-home-operations.webp',
  aboutHero: '/images/editorial/umsa-about-engineering.webp',
  aboutCapabilities: '/images/editorial/umsa-sector-constructoras.webp',
  sectors: {
    aeropuertos: '/images/editorial/umsa-sector-aeropuertos.webp',
    bodegas: '/images/editorial/umsa-sector-bodegas.webp',
    gobiernosectorpublico: '/images/editorial/umsa-sector-gobierno.webp',
    salud: '/images/editorial/umsa-sector-salud.webp',
    constructoras: '/images/editorial/umsa-sector-constructoras.webp',
    industria: '/images/editorial/umsa-sector-industria.webp',
    mineria: '/images/editorial/umsa-sector-mineria.webp',
    'seguridad-electronica': '/images/editorial/umsa-sector-seguridad-electronica.webp',
    software: '/images/editorial/umsa-sector-software.webp',
  },
  services: {
    101: '/images/editorial/umsa-service-redes.webp',
    102: '/images/editorial/umsa-service-seguridad-electronica.webp',
    103: '/images/editorial/umsa-service-telecomunicaciones.webp',
    104: '/images/editorial/umsa-service-software-a-medida.webp',
    105: '/images/editorial/umsa-service-soporte-247.webp',
    106: '/images/editorial/umsa-service-consultoria-it.webp',
    107: '/images/editorial/umsa-service-deteccion-incendios.webp',
    108: '/images/editorial/umsa-service-electricos-it.webp',
  },
} as const;

export function getSectorEditorialImage(slug: string | null | undefined): string {
  return editorialImages.sectors[slug as keyof typeof editorialImages.sectors] || editorialImages.defaultOg;
}

export function getServiceEditorialImage(serviceId: string | number | null | undefined): string {
  return editorialImages.services[Number(serviceId) as keyof typeof editorialImages.services] || editorialImages.defaultOg;
}
