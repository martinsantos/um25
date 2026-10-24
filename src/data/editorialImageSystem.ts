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

// Pósters Blender propios (1920×1080). Las portadas editoriales eran imágenes generadas.
const poster = (scene: string, service?: string) => `/cine/media/cine-${scene}${service ? `-${service}` : ''}-poster.jpg`;

export const editorialImages = {
  defaultOg: poster('bodega'),
  homeHero: poster('bodega'),
  homeServices: poster('fachada'),
  aboutHero: poster('fachada', 'consultoria'),
  aboutCapabilities: poster('fachada'),
  sectors: {
    aeropuertos: poster('aeropuerto'),
    bodegas: poster('bodega'),
    gobiernosectorpublico: poster('fachada', 'software'),
    salud: poster('hospital'),
    constructoras: poster('fachada'),
    industria: poster('planta'),
    mineria: poster('planta', 'telecom'),
    'seguridad-electronica': poster('aeropuerto', 'seguridad'),
    software: poster('hospital', 'software'),
  },
  services: {
    101: poster('fachada', 'redes'),
    102: poster('aeropuerto', 'seguridad'),
    103: poster('planta', 'telecom'),
    104: poster('hospital', 'software'),
    105: poster('aeropuerto', 'soporte'),
    106: poster('fachada', 'consultoria'),
    107: poster('bodega', 'incendios'),
    108: poster('hospital', 'electricos'),
  },
} as const;

export function getSectorEditorialImage(slug: string | null | undefined): string {
  return editorialImages.sectors[slug as keyof typeof editorialImages.sectors] || editorialImages.defaultOg;
}

export function getServiceEditorialImage(serviceId: string | number | null | undefined): string {
  return editorialImages.services[Number(serviceId) as keyof typeof editorialImages.services] || editorialImages.defaultOg;
}
