import type { ServicioV4 } from '../types/directus-v4';

function firstDefined<T>(...values: Array<T | undefined | null>): T | undefined {
  return values.find((value) => value !== undefined && value !== null);
}

export function normalizeServicioRecord(servicio: any): ServicioV4 {
  const subtitulo = firstDefined(servicio?.subtitulo, servicio?.Subtitulo);
  const stats = firstDefined(servicio?.stats, servicio?.Stats);
  const porQueElegirnos = firstDefined(
    servicio?.por_que_elegirnos,
    servicio?.PorQueElegirnos,
  );
  const area = firstDefined(servicio?.area, servicio?.Area);
  const cliente = firstDefined(servicio?.cliente, servicio?.Cliente);
  const slug = firstDefined(servicio?.slug, servicio?.Slug);
  const productos = firstDefined(servicio?.productos, servicio?.Productos) || [];

  return {
    ...servicio,
    subtitulo,
    stats,
    por_que_elegirnos: porQueElegirnos,
    area,
    cliente,
    slug,
    productos,
    Subtitulo: firstDefined(servicio?.Subtitulo, subtitulo),
    Stats: firstDefined(servicio?.Stats, stats),
    PorQueElegirnos: firstDefined(servicio?.PorQueElegirnos, porQueElegirnos),
    Area: firstDefined(servicio?.Area, area),
    Cliente: firstDefined(servicio?.Cliente, cliente),
    Productos: firstDefined(servicio?.Productos, productos),
  } as ServicioV4;
}
