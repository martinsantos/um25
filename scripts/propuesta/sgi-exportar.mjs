/**
 * Trae de SGI (sgi.ultimamilla.com.ar) la lista de proyectos. El volcado completo queda en .sgi/
 * (fuera de git: es información interna). Al repo, que es público, va sólo lo que el sitio ya
 * publica: fecha de inicio, fecha de cierre y estado de cada proyecto con ficha web, por su id
 * web (src/data/sgi/fechas.json). Sin títulos, sin clientes, sin importes. La credencial va por
 * variables de entorno (SGI_USER, SGI_PASS) y no se escribe en ningún lado.
 *
 *   SGI_USER=… SGI_PASS=… node scripts/propuesta/sgi-exportar.mjs
 */
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';

const BASE = 'https://sgi.ultimamilla.com.ar';
const user = process.env.SGI_USER, pass = process.env.SGI_PASS;
if (!user || !pass) { console.error('Faltan SGI_USER y SGI_PASS.'); process.exit(1); }

let cookies = '';
const jar = (res) => { const set = res.headers.getSetCookie?.() || []; for (const c of set) { const [kv] = c.split(';'); const [k] = kv.split('='); cookies = cookies.split('; ').filter((x) => x && !x.startsWith(k + '=')).concat(kv).join('; '); } };
const get = async (path, opts = {}) => { const r = await fetch(BASE + path, { ...opts, headers: { cookie: cookies, ...(opts.headers || {}) }, redirect: 'manual' }); jar(r); return r; };

const login = await get('/auth/login');
const html = await login.text();
const csrf = (html.match(/name="_csrf" value="([a-f0-9]+)"/) || [])[1];
if (!csrf) throw new Error('No se encontró el token del formulario de acceso.');
const body = new URLSearchParams({ _csrf: csrf, email: user, password: pass });
const post = await get('/auth/login', { method: 'POST', body, headers: { 'content-type': 'application/x-www-form-urlencoded', referer: BASE + '/auth/login' } });
if (post.status !== 302 || !(post.headers.get('location') || '').includes('dashboard')) throw new Error(`El acceso a SGI fue rechazado (HTTP ${post.status}).`);

const csv = await (await get('/api/proyectos/exportar')).text();
const lineas = csv.replace(/^﻿/, '').split(/\r?\n/).filter(Boolean);
const parse = (l) => { const out = []; let cur = '', q = false; for (const ch of l) { if (ch === '"') q = !q; else if (ch === ',' && !q) { out.push(cur); cur = ''; } else cur += ch; } out.push(cur); return out; };
const cab = parse(lineas[0]);
const col = (n) => cab.indexOf(n);
const fecha = (s) => (s || '').slice(0, 10) || null;
const proyectos = lineas.slice(1).map(parse).map((r) => ({
  id: r[col('ID')], titulo: r[col('Descripcion')].trim(), cliente: r[col('Cliente')].trim(), estado: r[col('Estado')],
  inicio: fecha(r[col('Fecha inicio')]), cierre: fecha(r[col('Fecha cierre')]), certificados: Number(r[col('Certificados')] || 0),
})).filter((p) => p.id);
mkdirSync('.sgi', { recursive: true });
writeFileSync('.sgi/proyectos.json', JSON.stringify({ fecha: new Date().toISOString().slice(0, 10), total: proyectos.length, proyectos }, null, 1) + '\n');
// Cruce con el catálogo web por el id de SGI que guarda cada antecedente (original_id).
const catalogo = JSON.parse(readFileSync('src/data/snapshots/antecedentes.json', 'utf8'));
const filas = catalogo.data || catalogo;
const porSgi = new Map(proyectos.map((p) => [p.id, p]));
const estadoDe = (e) => (/progreso|curso/i.test(e) ? 'en-curso' : /pendiente/i.test(e) ? 'pendiente' : 'finalizado');
const fechas = {};
let conFicha = 0;
for (const r of filas) { const p = porSgi.get(String(r.original_id || '')); if (!p) continue; conFicha++; fechas[r.id] = { inicio: p.inicio, cierre: p.cierre, estado: estadoDe(p.estado) }; }
mkdirSync('src/data/sgi', { recursive: true });
writeFileSync('src/data/sgi/fechas.json', JSON.stringify({ origen: 'SGI', fecha: new Date().toISOString().slice(0, 10), sgiTotal: proyectos.length, conFichaWeb: conFicha, sinFichaWeb: proyectos.length - conFicha, fichasSinSgi: filas.length - conFicha, fechas }, null, 1) + '\n');
console.log(`SGI: ${proyectos.length} proyectos; ${conFicha} con ficha web. Volcado completo en .sgi/ (fuera de git); fechas y estado en src/data/sgi/fechas.json.`);
