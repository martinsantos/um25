// Datos públicos para navegación, filtros y escenas.
export const SECTOR_ROWS = [
  { slug: 'aeropuertos', name: 'Aeropuertos', text: 'Accesos de campo de vuelo y detección de incendios', scene: 'aeropuerto' },
  { slug: 'bodegas', name: 'Bodegas', text: 'Portería IP y detección de incendios', scene: 'bodega' },
  { slug: 'constructoras', name: 'Constructoras', text: 'Portería y cámaras para edificios', scene: 'fachada' },
  { slug: 'gobiernosectorpublico', name: 'Gobierno y Sector Público', text: 'Trazabilidad ambiental y sitios municipales', scene: 'fachada' },
  { slug: 'industria', name: 'Industria', text: 'Radioenlaces entre sitios y cableado de cámaras', scene: 'planta' },
  { slug: 'mineria', name: 'Minería', text: 'Conectividad entre base y campamento', scene: 'planta' },
  { slug: 'salud', name: 'Salud', text: 'Cableado de datos y tableros en hospitales', scene: 'hospital' },
  { slug: 'seguridad-electronica', name: 'Seguridad Electrónica', text: 'Cámaras IP y control de accesos', scene: 'aeropuerto' },
  { slug: 'software', name: 'Software', text: 'Trazabilidad y facturación electrónica', scene: 'fachada' },
] as const;
