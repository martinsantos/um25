/**
 * El relato de la empresa con datos del sitio (2026-10-30). Nada inventado: la presentación y
 * los principios vienen de /nosotros, la documentación de /certificaciones, los casos y los
 * clientes del catálogo real de antecedentes (registro completo de Directus, con descripción).
 */
import { antecedentesReales as antecedentesCompletos } from '../../data/antecedentes_completos.js';

export const EMPRESA = {
  titulo: 'Una empresa técnica para operaciones que no pueden detenerse',
  lead: 'ULTIMA MILLA integra infraestructura, comunicaciones, seguridad y software con criterio de continuidad operativa. Diseño, instalación y soporte trabajan en un mismo sistema.',
  cobertura: 'Desde Mendoza para Cuyo, Patagonia y el país.',
  coberturaDetalle: 'Base técnica en Mendoza, con cobertura regional para proyectos, mantenimiento y soporte.',
  principios: [
    ['Ingeniería primero', 'Cada decisión se justifica por disponibilidad, seguridad, mantenibilidad y costo operativo.'],
    ['Ejecución en campo', 'Diseñamos con conocimiento real de obra, salas técnicas, racks, tendidos, energía y operación diaria.'],
    ['Documentación útil', 'Cada entrega se puede operar, auditar, ampliar y sostener en el tiempo.'],
    ['Continuidad como criterio', 'El soporte, el mantenimiento y la trazabilidad forman parte del diseño desde el primer día.'],
  ],
  historia: [
    ['2003', 'Origen en infraestructura y telecomunicaciones', 'Instalación, tendidos y continuidad para organizaciones con operación presencial.'],
    ['2010', 'Integración de seguridad electrónica y software operativo', 'Un solo criterio para red, monitoreo, accesos y sistemas que sostienen el negocio.'],
    ['2018', 'Soporte 24/7 y archivo de proyectos', 'Respuesta en incidentes y registro verificable por sector y servicio.'],
    ['Hoy', 'Servicios IT integrales en Argentina', 'Mendoza, Cuyo, Patagonia y proyectos nacionales con evidencia en campo.'],
  ],
  sedes: [
    { name: 'Mendoza', role: 'Sede central', detail: 'Houssay 1159, Guaymallén' },
    { name: 'San Juan', role: 'Cuyo' },
    { name: 'San Luis', role: 'Cuyo' },
    { name: 'Neuquén', role: 'Patagonia' },
  ],
};

export const CUMPLIMIENTO = [
  ['Protocolos y entregables de obra', 'Cada proyecto cierra con protocolos de prueba, entregables y documentación de obra según el alcance contratado, listos para recepción técnica y auditoría.'],
  ['Certificación de puntos de cableado', 'Cableado estructurado y canalizaciones certificados punto por punto con equipamiento Fluke, con reporte de mediciones por canal y documentación de obra.'],
  ['Seguridad de la información por proyecto', 'Accesos, respaldos y continuidad se acuerdan con cada cliente y quedan documentados como parte del proyecto.'],
  ['Ingeniería de detección de incendios', 'Ingeniería, instalación y mantenimiento de SDI en aeropuertos, salud, industria y edificios corporativos, según las normas aplicables a cada obra (IRAM, NFPA 72).'],
  ['Dossiers para licitaciones y auditorías', 'Para pliegos, seguros y auditorías de proveedor, ULTIMA MILLA arma un dossier con antecedentes, protocolos y documentación técnica del rubro.'],
];

type Registro = { id: number; Titulo?: string; Descripcion?: string; Cliente?: string; Fecha?: string; Area?: string };
const registros = (Array.isArray(antecedentesCompletos) ? antecedentesCompletos : []) as Registro[];
const limpiar = (v: unknown) => String(v ?? '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

/** El registro completo viene cortado a 300 caracteres: se cierra en la última frase entera. */
export const cerrarTexto = (texto: string, cliente: string) => {
  let t = limpiar(texto);
  const prefijo = `${limpiar(cliente)} - `;
  if (t.toLowerCase().startsWith(prefijo.toLowerCase())) t = t.slice(prefijo.length);
  if (/[.!?]$/.test(t)) return t;
  const corte = Math.max(t.lastIndexOf('. '), t.lastIndexOf(', '), t.lastIndexOf('; '));
  if (corte > t.length * .45) t = t.slice(0, corte);
  else t = t.replace(/\s+\S*$/, '');
  return t.replace(/[,;:\s-]+$/, '') + '.';
};

const descripcionCompleta = (id: number) => { const r = registros.find((x) => x.id === id); return r ? cerrarTexto(r.Descripcion || '', r.Cliente || '') : ''; };

/** Fichas del catálogo publicado cuya descripción completa está en el registro de origen. */
export const DESCRIPCION_ORIGEN: Record<number, number> = {
  3552: 10728, 3126: 11146, 3144: 11145, 3119: 11141, 3588: 11154, 3102: 11173, 3099: 11176,
  3640: 10927, 3655: 10878, 3646: 10917, 3396: 10914, 3653: 10883, 3165: 11136, 3320: 10961,
  3636: 10940, 3650: 10907, 3431: 10890, 3460: 10863,
};
export const descripcionDeOrigen = (idPublicado: number) => { const o = DESCRIPCION_ORIGEN[idPublicado]; return o ? descripcionCompleta(o) : ''; };

export type Caso = { id: number; publicado?: number; titulo: string; cliente: string; year: number; sector: string; servicios: string[]; texto: string };

/** Casos que cuentan el expertise: los registros con descripción técnica completa. Título y texto son del registro. */
const CASOS_BASE: Omit<Caso, 'texto' | 'year'>[] = [
  { id: 10728, publicado: 3552, titulo: 'Infraestructura de datos y telefonía para la Cumbre de Presidentes del Mercosur', cliente: 'Cancillería de la República Argentina', sector: 'gobiernosectorpublico', servicios: ['101', '103', '105'] },
  { id: 10740, titulo: 'Cableado estructurado, telefonía y data center para la Copa América en el Estadio Malvinas Argentinas', cliente: 'Estadio Malvinas Argentinas', sector: 'gobiernosectorpublico', servicios: ['101', '103', '102'] },
  { id: 11146, publicado: 3126, titulo: 'Sistema de detección de incendios en el balizamiento del aeropuerto', cliente: 'Aeropuertos Argentina 2000', sector: 'aeropuertos', servicios: ['107'] },
  { id: 11173, publicado: 3102, titulo: 'Cableado estructurado para el Hospital General Las Heras', cliente: 'FUESMEN · Fundación Escuela de Medicina Nuclear', sector: 'salud', servicios: ['101'] },
  { id: 11145, publicado: 3144, titulo: 'Cableado estructurado para la Casa de la Salud de la Mujer', cliente: 'Ministerio de Desarrollo Social, Salud y Deportes de Mendoza', sector: 'salud', servicios: ['101', '103'] },
  { id: 11141, publicado: 3119, titulo: 'Tableros eléctricos para circuitos de informática', cliente: 'Poder Judicial de Mendoza', sector: 'gobiernosectorpublico', servicios: ['108'] },
  { id: 11154, publicado: 3588, titulo: 'Portería IP y CCTV para un complejo de departamentos', cliente: 'Kristich Desarrollos', sector: 'constructoras', servicios: ['102', '101'] },
  { id: 11176, publicado: 3099, titulo: 'Red de datos y fibra óptica para las sucursales de Mendoza y San Juan', cliente: 'Headcomm S.A', sector: 'industria', servicios: ['101'] },
];
export const CASOS: Caso[] = CASOS_BASE.map((c) => { const r = registros.find((x) => x.id === c.id); return { ...c, year: Number((r?.Fecha || '').slice(0, 4)), texto: descripcionCompleta(c.id) }; }).filter((c) => c.texto);
