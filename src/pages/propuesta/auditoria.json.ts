/**
 * Auditoría de los antecedentes tal como los sirve la propuesta (2026-10-31): cada ficha con sus
 * señales de incompletitud (título corto, en mayúsculas o cortado; descripción corta o igual al
 * título; sin fecha, sector, servicio o foto propia; sin equipos en el registro; título repetido
 * en el cliente). La lee el control visual, que escribe el informe y elige la muestra de fichas.
 * No indexable.
 */
import type { APIRoute } from 'astro';
import { loadStories, SGI_RESUMEN } from '../../components/proto/isoData';
import { despieceDe } from '../../components/proto/despiece';

export const prerender = false;

export const GET: APIRoute = async () => {
  const { stories, total } = await loadStories();
  const filas = stories.map((s) => {
    const { partes, origen } = despieceDe(s.title, s.summary, s.serviceCodes);
    const flags: string[] = [];
    const t = (s.title || '').trim(), d = (s.summary || '').trim();
    if (t.length < 8) flags.push('titulo-corto');
    if (/^[^a-z]{12,}$/.test(t)) flags.push('titulo-mayusculas');
    if (/(\.\.\.|…)$/.test(t)) flags.push('titulo-cortado');
    if (d.length < 60) flags.push('descripcion-corta');
    if (d && d.toLowerCase() === t.toLowerCase()) flags.push('descripcion-igual-titulo');
    if (!s.year) flags.push('sin-fecha');
    if (!s.sectorSlug) flags.push('sin-sector');
    if (!s.serviceCodes.length) flags.push('sin-servicio');
    if (!s.image || !s.image.startsWith('/images/antecedentes/')) flags.push('sin-foto-propia');
    if (origen === 'servicio') flags.push('sin-equipos-en-registro');
    return { id: s.id, href: s.href, client: s.client, title: t, year: s.year, sector: s.sectorSlug, services: s.serviceCodes, partes: partes.length, resumen: d.slice(0, 110), flags };
  });
  const dup = new Map<string, number>();
  filas.forEach((f) => { const k = `${f.client}|${f.title}`.toLowerCase(); dup.set(k, (dup.get(k) || 0) + 1); });
  filas.forEach((f) => { if ((dup.get(`${f.client}|${f.title}`.toLowerCase()) || 0) > 1) f.flags.push('titulo-repetido-en-cliente'); });
  const resumen: Record<string, number> = {};
  filas.forEach((f) => f.flags.forEach((x) => { resumen[x] = (resumen[x] || 0) + 1; }));
  return new Response(JSON.stringify({ total, fichas: filas.length, resumen, filas, sgi: SGI_RESUMEN }), { headers: { 'content-type': 'application/json; charset=utf-8', 'x-robots-tag': 'noindex' } });
};
