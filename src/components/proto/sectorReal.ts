/**
 * Sector real de cada antecedente (2026-10-30). "Seguridad Electrónica" y "Software" son
 * clasificaciones del catálogo que ya existen como servicios (102 y 104); no son lugares.
 * Los proyectos que el catálogo deja en esas dos clasificaciones toman el sector de los
 * demás trabajos del mismo cliente (el más frecuente) o el que indica el nombre del cliente
 * cuando es un organismo público. Si nada lo ubica, quedan sin sector y siguen visibles
 * por servicio y por año.
 */
export const CLASIFICACIONES_DE_SERVICIO = new Set(['seguridad-electronica', 'software']);

const PUBLICO = /\b(afip|administracion federal|direccion provincial|direccion general|vialidad|irrigacion|camara de (senadores|diputados)|palacio policial|policia|municipalidad|ministerio|gobierno|provincia de|poder judicial|legislatura|estadio malvinas|secretaria|registro civil)/;

const llano = (valor: string) => valor.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();

type Fila = { client: string; sector: string };

/** Devuelve una función que resuelve el sector real (cliente, sector del catálogo) → sector. */
export function resolverSector(catalogo: Fila[]): (client: string, sector: string) => string {
  const porCliente = new Map<string, Map<string, number>>();
  for (const c of catalogo) {
    if (CLASIFICACIONES_DE_SERVICIO.has(c.sector)) continue;
    const k = llano(c.client);
    const cuenta = porCliente.get(k) || new Map<string, number>();
    cuenta.set(c.sector, (cuenta.get(c.sector) || 0) + 1);
    porCliente.set(k, cuenta);
  }
  return (client, sector) => {
    if (!CLASIFICACIONES_DE_SERVICIO.has(sector)) return sector;
    const cuenta = porCliente.get(llano(client));
    if (cuenta) return [...cuenta.entries()].sort((a, b) => b[1] - a[1])[0][0];
    if (PUBLICO.test(llano(client))) return 'gobierno';
    return '';
  };
}
