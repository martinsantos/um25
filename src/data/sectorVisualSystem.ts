import { editorialImages } from './editorialImageSystem';

export interface SectorVisualSpec {
  slug: string;
  label: string;
  headline: string;
  summary: string;
  proof: string;
  cases: string;
  image: string;
  imageAlt: string;
  services: string[];
  operatingNeed: string;
}

export const sectorVisualSystem: Record<string, SectorVisualSpec> = {
  aeropuertos: {
    slug: 'aeropuertos',
    label: 'Aeropuertos',
    headline: 'Infraestructura IT para operación aeroportuaria continua',
    summary: 'Redes, seguridad electrónica, comunicaciones y soporte para sitios donde la disponibilidad no admite improvisación.',
    proof: 'Operación 24/7, enlaces redundantes, control de acceso y trazabilidad de incidentes.',
    cases: '15+ proyectos',
    image: editorialImages.sectors.aeropuertos,
    imageAlt: 'Infraestructura de comunicaciones para operación aeroportuaria',
    services: ['Telecomunicaciones', 'Seguridad electrónica', 'Soporte 24/7'],
    operatingNeed: 'Continuidad, control perimetral y comunicaciones críticas.'
  },
  bodegas: {
    slug: 'bodegas',
    label: 'Bodegas',
    headline: 'Conectividad y control para producción vitivinícola',
    summary: 'Infraestructura preparada para plantas productivas, trazabilidad, monitoreo y continuidad en entornos industriales.',
    proof: 'Redes industriales, CCTV, sensores, automatización e integración de datos.',
    cases: '45+ proyectos',
    image: editorialImages.sectors.bodegas,
    imageAlt: 'Infraestructura tecnológica en planta productiva vitivinícola',
    services: ['Redes', 'Seguridad electrónica', 'Software a medida'],
    operatingNeed: 'Trazabilidad, supervisión y estabilidad de planta.'
  },
  gobiernosectorpublico: {
    slug: 'gobiernosectorpublico',
    label: 'Gobierno y sector público',
    headline: 'Plataformas tecnológicas para servicios públicos',
    summary: 'Redes, videovigilancia, software y soporte para organismos con escala, auditoría y continuidad institucional.',
    proof: 'Proyectos para municipios, organismos, edificios públicos y operaciones distribuidas.',
    cases: '80+ proyectos',
    image: editorialImages.sectors.gobiernosectorpublico,
    imageAlt: 'Centro técnico para infraestructura de gobierno y sector público',
    services: ['Redes', 'Telecomunicaciones', 'Software a medida'],
    operatingNeed: 'Escala, gobernanza técnica y continuidad de servicios.'
  },
  salud: {
    slug: 'salud',
    label: 'Salud',
    headline: 'Infraestructura estable para ámbitos clínicos',
    summary: 'Redes, seguridad, soporte y comunicaciones para edificios sanitarios que dependen de disponibilidad permanente.',
    proof: 'Cableado, CCTV, control de acceso, soporte y mantenimiento para entornos sensibles.',
    cases: '35+ proyectos',
    image: editorialImages.sectors.salud,
    imageAlt: 'Equipamiento de seguridad y conectividad para sector salud',
    services: ['Redes', 'Seguridad electrónica', 'Soporte 24/7'],
    operatingNeed: 'Disponibilidad, privacidad operativa y respuesta rápida.'
  },
  constructoras: {
    slug: 'constructoras',
    label: 'Construcción',
    headline: 'Tecnología incorporada desde la obra',
    summary: 'Pre-cableado, energía, seguridad, redes y documentación para edificios preparados desde su etapa constructiva.',
    proof: 'Coordinación con obra civil, tableros, racks, canalizaciones y puesta en marcha.',
    cases: '60+ proyectos',
    image: editorialImages.sectors.constructoras,
    imageAlt: 'Infraestructura eléctrica y de datos en obra tecnológica',
    services: ['Eléctricos para IT', 'Redes', 'Detección de incendios'],
    operatingNeed: 'Diseño temprano, ejecución limpia y entrega verificable.'
  },
  industria: {
    slug: 'industria',
    label: 'Industria',
    headline: 'Redes, control y soporte para plantas activas',
    summary: 'Soluciones IT/OT para ambientes productivos, con foco en robustez, mantenimiento y mínima interrupción.',
    proof: 'Cableado industrial, enlaces, CCTV, monitoreo y soporte operativo.',
    cases: '50+ proyectos',
    image: editorialImages.sectors.industria,
    imageAlt: 'Sistemas técnicos en planta industrial',
    services: ['Redes', 'Telecomunicaciones', 'Soporte 24/7'],
    operatingNeed: 'Robustez física, trazabilidad y disponibilidad.'
  },
  mineria: {
    slug: 'mineria',
    label: 'Minería',
    headline: 'Comunicaciones para sitios remotos y exigentes',
    summary: 'Enlaces, seguridad perimetral, energía y soporte para operaciones con distancia, clima y continuidad como variables críticas.',
    proof: 'Radioenlaces, redes, soporte remoto, seguridad y evidencia técnica.',
    cases: '25+ proyectos',
    image: editorialImages.sectors.mineria,
    imageAlt: 'Equipamiento de soporte y comunicaciones para operación remota',
    services: ['Telecomunicaciones', 'Eléctricos para IT', 'Seguridad electrónica'],
    operatingNeed: 'Alcance, redundancia y mantenimiento remoto.'
  },
  'seguridad-electronica': {
    slug: 'seguridad-electronica',
    label: 'Seguridad electrónica',
    headline: 'Control visual, acceso y perímetro con criterio operativo',
    summary: 'CCTV, accesos, intrusión y monitoreo para proteger activos físicos y continuidad del negocio.',
    proof: 'Arquitectura de cámaras, accesos, analítica, retención y soporte.',
    cases: '120+ proyectos',
    image: editorialImages.sectors['seguridad-electronica'],
    imageAlt: 'Sistema de CCTV y control para seguridad electrónica',
    services: ['Seguridad electrónica', 'Redes', 'Soporte 24/7'],
    operatingNeed: 'Evidencia, disuasión, control y respuesta.'
  },
  software: {
    slug: 'software',
    label: 'Software',
    headline: 'Sistemas propios conectados a la operación real',
    summary: 'Aplicaciones, APIs, tableros e integraciones que reducen tareas manuales y dejan evidencia de gestión.',
    proof: 'SGI, licitaciones, integraciones internas, automatización y soporte evolutivo.',
    cases: '40+ proyectos',
    image: editorialImages.sectors.software,
    imageAlt: 'Software operativo e integraciones para empresa',
    services: ['Software a medida', 'Consultoría IT', 'Soporte 24/7'],
    operatingNeed: 'Procesos medibles, integración y mejora continua.'
  }
};

export const sectorVisualOrder = [
  'aeropuertos',
  'bodegas',
  'gobiernosectorpublico',
  'salud',
  'constructoras',
  'industria',
  'mineria',
  'seguridad-electronica',
  'software'
];

export function getSectorVisualSpec(slug: string): SectorVisualSpec | undefined {
  return sectorVisualSystem[slug];
}
