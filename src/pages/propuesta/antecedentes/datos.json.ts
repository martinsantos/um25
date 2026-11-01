/**
 * Los proyectos como datos (2026-10-31), para el muro: el HTML sirve las primeras 48 fichas y el
 * resto llega por acá cuando se filtra o se pide más. Sólo lo que ya muestra cada ficha del muro:
 * cliente, título, sector, servicios, año, foto (sin el prefijo común) y tipo de lugar. Mismo
 * orden que el muro.
 */
import type { APIRoute } from 'astro';
import { loadStories, thumbOf, isoSrc, SITE_OF, type IsoSite } from '../../../components/proto/isoData';

export const prerender = false;

const PREFIJO = '/images/antecedentes/generated/';

export const GET: APIRoute = async () => {
  const { stories } = await loadStories();
  const sitios: Record<string, string> = {};
  const fichas = stories.map((c) => {
    const sitio: IsoSite = SITE_OF[c.sectorSlug] || 'building';
    sitios[sitio] = isoSrc(sitio);
    return { id: c.id, slug: c.slug, cliente: c.client, titulo: c.title, sector: c.sector, sectorSlug: c.sectorSlug, servicios: c.serviceCodes.join(' '), anio: c.year || 0, foto: c.image ? thumbOf(c.image).replace(PREFIJO, '') : '', sitio };
  });
  return new Response(JSON.stringify({ prefijo: PREFIJO, sitios, fichas }), { headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'public, max-age=600', 'x-robots-tag': 'noindex' } });
};
