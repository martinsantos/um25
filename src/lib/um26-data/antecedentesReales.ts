import antecedentesSnapshot from '../../data/snapshots/antecedentes.json';
import { generateSlug } from '../../utils/slugUtils.js';
import type { Antecedente, AntecedenteStatus, SectorSlug, ServiceCode } from './types';

/**
 * Catálogo real de antecedentes (snapshot de Directus, 518 proyectos) con la forma que
 * usa el listado UM26. Sector y servicios se derivan del área y del texto de cada
 * proyecto; no se agrega ningún dato que no esté en el registro.
 */
type Registro = {
  id: number;
  Titulo?: string;
  Cliente?: string;
  Descripcion?: string;
  Area?: string;
  Fecha?: string;
};

const registros = (Array.isArray(antecedentesSnapshot)
  ? antecedentesSnapshot
  : (antecedentesSnapshot as { data?: Registro[] }).data || []) as Registro[];

const sinTildes = (valor: string) => valor.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const texto = (valor: unknown) => String(valor ?? '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

// Palabras del título y la descripción que ubican el sector del proyecto (por orden de prioridad).
const SECTOR_POR_TEXTO: [SectorSlug, RegExp][] = [
  ['aeropuertos', /\b(aeropuerto|aeroportuari|aerolinea|terminal aerea|pista)\b/],
  ['bodegas', /\b(bodega|vitivinicol|vinedo|enolog)/],
  ['mineria', /\b(miner|mina|yacimiento)/],
  ['salud', /\b(hospital|clinica|sanatorio|salud|medic|fuesmen)/],
  ['gobierno', /\b(gobierno|municipal|ministerio|provincia de|secretaria|poder judicial|legislatura)/],
  ['constructoras', /\b(constructora|construcciones|edificio|consorcio|obra)\b/],
  ['industria', /\b(industria|planta|fabrica|frigorific|agricola|logistic)/],
  ['software', /\b(software|sistema de gestion|aplicacion|desarrollo web|erp)\b/],
  ['seguridad-electronica', /\b(cctv|camara|videovigilancia|alarma|control de acceso|intrusion)/],
];

const SECTOR_POR_AREA: Record<string, SectorSlug> = {
  'Aeropuertos & Telecomunicaciones': 'aeropuertos',
  'Salud & Sector Salud': 'salud',
  'Infraestructura Hospitalaria': 'salud',
  'Gobierno & Sector Público': 'gobierno',
  'Industria & Bodegas': 'industria',
  'Soluciones Tecnológicas': 'software',
  'Video Vigilancia & Seguridad': 'seguridad-electronica',
  'Seguridad Electrónica & SDI': 'seguridad-electronica',
  'Detección de Incendios & Seguridad': 'seguridad-electronica',
  'Conectividad & Redes': 'constructoras',
  'Infraestructura de Data Center': 'industria',
  'Servicios Corporativos': 'software',
};

const SERVICIO_POR_TEXTO: [ServiceCode, RegExp][] = [
  [101, /\b(cableado|fibra|red(es)? de datos|switch|rack|patch|wifi|access point|radioenlace)/],
  [102, /\b(cctv|camara|videovigilancia|control de acceso|alarma|intrusion|seguridad electronica)/],
  [103, /\b(telefon|central telef|voip|radio|telecomunicacion|enlace|antena|intercomunicador|amplificador)/],
  [104, /\b(software|sistema|aplicacion|desarrollo|plataforma|digitalizacion)\b/],
  [105, /\b(soporte|mantenimiento|mesa de ayuda|servicio tecnico|abono)/],
  [106, /\b(consultor|auditoria|relevamiento|ingenieria|proyecto ejecutivo)/],
  [107, /\b(incendio|deteccion|detector|sdi|humo|sirena|pulsador)/],
  [108, /\b(electric|ups|tablero|energia|puesta a tierra|grupo electrogeno)/],
];

const SERVICIO_POR_AREA: Record<string, ServiceCode> = {
  'Conectividad & Redes': 101,
  'Video Vigilancia & Seguridad': 102,
  'Seguridad Electrónica & SDI': 102,
  'Aeropuertos & Telecomunicaciones': 103,
  'Soluciones Tecnológicas': 104,
  'Servicios Corporativos': 105,
  'Detección de Incendios & Seguridad': 107,
  'Infraestructura de Data Center': 108,
};

function sectorDe(registro: Registro, contenido: string): SectorSlug {
  const porTexto = SECTOR_POR_TEXTO.find(([, regla]) => regla.test(contenido));
  return porTexto?.[0] ?? SECTOR_POR_AREA[texto(registro.Area)] ?? 'software';
}

function serviciosDe(registro: Registro, contenido: string): ServiceCode[] {
  const codigos = new Set<ServiceCode>();
  const porArea = SERVICIO_POR_AREA[texto(registro.Area)];
  if (porArea) codigos.add(porArea);
  for (const [codigo, regla] of SERVICIO_POR_TEXTO) if (regla.test(contenido)) codigos.add(codigo);
  if (!codigos.size) codigos.add(104);
  return [...codigos].slice(0, 3);
}

function estadoDe(contenido: string): AntecedenteStatus {
  return /\bmantenimiento\b/.test(contenido) ? 'mantenimiento' : 'verificado';
}

export function mapearAntecedentes(fuente: Registro[]): Antecedente[] {
  return fuente
  .filter((registro) => registro && registro.id && texto(registro.Titulo))
  .map((registro) => {
    const titulo = texto(registro.Titulo);
    const descripcion = texto(registro.Descripcion);
    const contenido = sinTildes(`${titulo} ${texto(registro.Cliente)} ${descripcion}`);
    const fecha = texto(registro.Fecha);
    const [anio, mes] = fecha.split('-').map(Number);
    const sector = sectorDe(registro, contenido);
    return {
      id: Number(registro.id),
      title: titulo,
      slug: generateSlug(titulo),
      client: texto(registro.Cliente) || 'Cliente confidencial',
      sectorSlug: sector,
      serviceCodes: serviciosDe(registro, contenido),
      year: anio || 0,
      month: mes || 1,
      location: '',
      scope: [],
      status: estadoDe(contenido),
      image: '',
      summary: descripcion,
      tags: [],
    };
  });
}

/** Copia del catálogo (snapshot): respaldo cuando Directus no responde. */
export const ANTECEDENTES_REALES: Antecedente[] = mapearAntecedentes(registros);
