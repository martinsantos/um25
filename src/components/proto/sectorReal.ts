/**
 * Sector real de cada antecedente (2026-10-30). "Seguridad Electrónica" y "Software" son
 * clasificaciones del catálogo que ya existen como servicios (102 y 104); no son lugares.
 * Los proyectos que el catálogo deja en esas dos clasificaciones se ubican, en este orden:
 * 1. por los demás trabajos del mismo cliente (el sector más frecuente);
 * 2. por el nombre del cliente cuando es un organismo público;
 * 3. por lo que dice el propio registro del lugar (galpón, planta, edificio, oficinas…).
 * Si nada lo ubica, el proyecto queda sin sector y sigue visible por servicio y por año.
 */
export const CLASIFICACIONES_DE_SERVICIO = new Set(['seguridad-electronica', 'software']);

const PUBLICO = /\b(afip|administracion federal|direccion provincial|direccion general|vialidad|irrigacion|camara de (senadores|diputados)|palacio policial|policia|municipalidad|ministerio|gobierno|provincia de|poder judicial|legislatura|estadio malvinas|secretaria|registro civil|iscamen|coprosamen)/;

// Lo que el registro dice del lugar donde se trabajó.
const LUGAR: [string, RegExp][] = [
  ['salud', /\b(hospital|clinica|sanatorio|centro de salud|laboratorio de analisis)\b/],
  ['industria', /\b(galpon(es)?|planta|fabrica|laboratorio|deposito|frigorific|nave industrial|silos)\b/],
  ['constructoras', /\b(edificio|edifico|duplex|torre|consorcio|fideicomiso|oficinas?|local comercial|obra|vivienda(s)?|barrio)\b/],
  ['gobierno', /\b(escuela|universidad|evento|estadio|club)\b/],
];

const llano = (valor: string) => valor.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

type Fila = { client: string; sector: string };

/** Devuelve una función que resuelve el sector real (cliente, sector del catálogo, texto) → sector. */
export function resolverSector(catalogo: Fila[]): (client: string, sector: string, texto?: string) => string {
  const porCliente = new Map<string, Map<string, number>>();
  for (const c of catalogo) {
    if (CLASIFICACIONES_DE_SERVICIO.has(c.sector)) continue;
    const k = llano(c.client);
    const cuenta = porCliente.get(k) || new Map<string, number>();
    cuenta.set(c.sector, (cuenta.get(c.sector) || 0) + 1);
    porCliente.set(k, cuenta);
  }
  return (client, sector, texto = '') => {
    if (!CLASIFICACIONES_DE_SERVICIO.has(sector)) return sector;
    const cuenta = porCliente.get(llano(client));
    if (cuenta) return [...cuenta.entries()].sort((a, b) => b[1] - a[1])[0][0];
    const nombre = llano(client);
    if (PUBLICO.test(nombre)) return 'gobierno';
    const dicho = llano(`${client} ${texto}`);
    const lugar = LUGAR.find(([, re]) => re.test(dicho));
    return lugar ? lugar[0] : '';
  };
}
