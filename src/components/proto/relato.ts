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
  t = t.replace(/[,;:\s-]+$/, '') + '.';
  return t.charAt(0).toUpperCase() + t.slice(1);
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

/** Título legible a partir del del registro ("Cliente - Lo que se hizo"). */
const tituloDe = (r: Registro) => {
  let t = limpiar(r.Titulo);
  const c = limpiar(r.Cliente);
  if (c && t.toLowerCase().startsWith(c.toLowerCase())) t = t.slice(c.length).replace(/^\s*[-–·.]\s*/, '');
  t = t.replace(/\.\s*Redes y comunicaciones\.?/gi, '').replace(/Corrientes Débiles|IncendiosCorr.*$/g, '').replace(/\s+/g, ' ').replace(/[\s.·-]+$/, '').trim();
  return t.charAt(0).toUpperCase() + t.slice(1);
};
/** Nombres de cliente tal como se presentan (el registro trae etiquetas de evento o caja irregular). */
const CLIENTE_PRESENTADO: Record<string, string> = {
  'COPA AMERICA 2012. Estadio Malvinas Argentinas': 'Estadio Malvinas Argentinas',
  'Cancillería de la República Argentina. Cumbre Mercosur 2017': 'Cancillería de la República Argentina',
  'Suprema Corte de Justicia. Poder Judicial Mendoza': 'Suprema Corte de Justicia de Mendoza',
  'Poder judicial mendoza': 'Poder Judicial de Mendoza',
  'PISPER S. A': 'Pisper S.A.',
  'Headcomm S.A': 'Headcomm S.A.',
  'CERVECERIA Y MALTERIA QUILMES': 'Cervecería y Maltería Quilmes',
  'Inspección de Causes asociadas de San Martín': 'Inspección de Cauces Asociadas de San Martín',
  'Inspecciones de Causes Asociadas de San Martín': 'Inspección de Cauces Asociadas de San Martín',
};
const clienteDe = (r: Registro) => { const c = limpiar(r.Cliente); if (CLIENTE_PRESENTADO[c]) return CLIENTE_PRESENTADO[c]; return c === c.toUpperCase() ? c.toLowerCase().replace(/(^|\s)(\S)/g, (m) => m.toUpperCase()).replace(/\b(Y|De|Del|La)\b/g, (w) => w.toLowerCase()) : c; };
/** Si el título del registro es sólo la categoría ("SDI", "CCTV", "Redes y comunicaciones"), el título es la primera frase del alcance. */
const GENERICO = /^(sdi|cctv|electrico|eléctrico|redes y comunicaciones|redes de cableado estructurado|cableado estructurado|sistema de cctv|detección|deteccion|redes y comunicaciones\.?\s*detección)$/i;
const tituloFinal = (r: Registro, texto: string) => {
  const t = tituloDe(r);
  if (t.length >= 28 && !GENERICO.test(t)) return t;
  let f = texto.split(/[.;]\s/)[0].replace(/\s*-\s*/g, ' · ');
  if (f.length > 110) f = f.slice(0, 110).replace(/\s+\S*$/, '');
  f = f.replace(/\s+(de|del|la|el|y|o|u|en|para|por|con|a|un|una|las|los|al)$/i, '').replace(/[.,:;·\s]+$/, '');
  return f.replace(/\bSdi\b/g, 'SDI').replace(/\bCctv\b/gi, 'CCTV');
};

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
/** Más registros con alcance técnico completo, por sector y por servicio (ids del registro de origen). */
export const CASOS_SECTOR: Record<string, number[]> = {
  aeropuertos: [11146, 10737, 11158, 11166],
  salud: [11173, 11179, 11174, 11145],
  gobiernosectorpublico: [10728, 10881, 11141, 10817, 10778, 10792],
  constructoras: [11154, 11152, 10740, 11141],
  industria: [10878, 10927, 11176, 10776],
  bodegas: [10798, 10813, 10771, 11162, 10903],
  mineria: [],
  software: [10817, 10778, 10779, 10792, 10813],
  'seguridad-electronica': [11158, 11166, 10877, 11154],
};
export const CASOS_SERVICIO: Record<string, number[]> = {
  '101': [10728, 11173, 11145, 10881, 11176, 11179],
  '102': [11154, 11158, 11166, 10877, 10740],
  '103': [10728, 10740, 11145, 10798],
  '104': [10817, 10778, 10813, 10792, 10779],
  '105': [10903, 10744, 10728, 10778],
  '106': [11152, 10776, 10771],
  '107': [11146, 10737, 10914, 10804, 10903],
  '108': [11141, 10878, 10881],
};
const SECTOR_DE: Record<number, string> = { 11146: 'aeropuertos', 10737: 'aeropuertos', 11158: 'aeropuertos', 11166: 'aeropuertos', 11173: 'salud', 11179: 'salud', 11174: 'salud', 11145: 'salud', 10728: 'gobiernosectorpublico', 10881: 'gobiernosectorpublico', 11141: 'gobiernosectorpublico', 10817: 'gobiernosectorpublico', 10778: 'gobiernosectorpublico', 10792: 'gobiernosectorpublico', 11154: 'constructoras', 11152: 'constructoras', 10740: 'constructoras', 10878: 'industria', 10927: 'industria', 11176: 'industria', 10776: 'industria', 10798: 'bodegas', 10813: 'bodegas', 10771: 'bodegas', 11162: 'bodegas', 10903: 'bodegas', 10744: 'bodegas', 10779: 'software', 10877: 'bodegas', 10914: 'industria', 10804: 'constructoras' };
const SERVICIOS_DE: Record<number, string[]> = { 11146: ['107'], 10737: ['107'], 11158: ['102'], 11166: ['102'], 11173: ['101'], 11179: ['101'], 11174: ['101'], 11145: ['101', '103'], 10728: ['101', '103', '105'], 10881: ['101', '108'], 11141: ['108'], 10817: ['104'], 10778: ['104', '105'], 10792: ['104'], 11154: ['102', '101'], 11152: ['106'], 10740: ['101', '103', '102'], 10878: ['108'], 10927: ['102'], 11176: ['101'], 10776: ['106', '101'], 10798: ['101', '103', '102', '107'], 10813: ['104'], 10771: ['106', '101'], 11162: ['101'], 10903: ['105', '107'], 10744: ['105'], 10779: ['104'], 10877: ['102'], 10914: ['107'], 10804: ['107'] };
const PUBLICADO_DE: Record<number, number> = Object.fromEntries(Object.entries(DESCRIPCION_ORIGEN).map(([pub, orig]) => [orig, Number(pub)]));
const BASE_POR_ID = new Map(CASOS_BASE.map((c) => [c.id, c]));
export const casoDe = (id: number): Caso | null => {
  const r = registros.find((x) => x.id === id); if (!r) return null;
  const base = BASE_POR_ID.get(id);
  const texto = cerrarTexto(r.Descripcion || '', r.Cliente || '');
  if (!texto) return null;
  return { id, publicado: base?.publicado ?? PUBLICADO_DE[id], titulo: base?.titulo || tituloFinal(r, texto), cliente: base?.cliente || clienteDe(r), year: Number((r.Fecha || '').slice(0, 4)), sector: base?.sector || SECTOR_DE[id] || '', servicios: base?.servicios || SERVICIOS_DE[id] || [], texto };
};
export const casosDe = (ids: number[]): Caso[] => ids.map(casoDe).filter((c): c is Caso => Boolean(c));

export const CASOS: Caso[] = CASOS_BASE.map((c) => { const r = registros.find((x) => x.id === c.id); return { ...c, year: Number((r?.Fecha || '').slice(0, 4)), texto: descripcionCompleta(c.id) }; }).filter((c) => c.texto);

/** Cabecera y necesidad operativa de cada sector (de la página de sector en producción) y sus preguntas. */
import { sectorVisualSystem } from '../../data/sectorVisualSystem';
import { sectorFAQs } from '../../data/sectorFAQs';
export const sectorRelato = (slug: string) => {
  const v = sectorVisualSystem[slug];
  const faqs = sectorFAQs[slug] || [];
  return { headline: v?.headline || '', summary: v?.summary || '', proof: v?.proof || '', need: v?.operatingNeed || '', faqs };
};
