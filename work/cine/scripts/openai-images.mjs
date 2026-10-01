#!/usr/bin/env node
// Flujo de imágenes IA para el rediseño UMSA (OpenAI Images API).
// Lee las fichas de work/cine/image-briefs.json, genera o edita cada imagen y la deja
// en work/cine/ai/<id>.png + manifest.json para REVISIÓN. Nunca escribe en public/:
// lo aprobado se copia a mano. Sin clave no hace nada salvo --dry.
//
//   node work/cine/scripts/openai-images.mjs --dry                 # ver fichas y costo estimado
//   OPENAI_API_KEY=… node work/cine/scripts/openai-images.mjs --only sector-bodegas,textura-hormigon
//   OPENAI_IMAGE_MODEL=gpt-image-2 (por defecto) · OPENAI_IMAGE_QUALITY=high|medium|low
//
// Reglas (ver DIRECCION-IMAGENES-IA.md): nada de antecedentes inventados, nada de
// marcas/logos de terceros, nada de texto dentro de la imagen, siempre "imagen ilustrativa".
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');

const OUT = join(ROOT, 'work/cine/ai');
const args = process.argv.slice(2);
const dry = args.includes('--dry');
const BRIEFS = args.includes('--briefs') ? resolve(ROOT, args[args.indexOf('--briefs') + 1]) : join(ROOT, 'work/cine/image-briefs.json');
const onlyArg = args.find((a) => a.startsWith('--only=')) || (args.includes('--only') ? `--only=${args[args.indexOf('--only') + 1] || ''}` : '');
const only = onlyArg.slice(7).split(',').filter(Boolean);
const model = process.env.OPENAI_IMAGE_MODEL || 'gpt-image-2';
const quality = process.env.OPENAI_IMAGE_QUALITY || 'high';
// --n 4: cuatro variantes por ficha en una carpeta de lote + ZIP (para elegir).
const nArg = args.includes('--n') ? Number(args[args.indexOf('--n') + 1]) : 1;
const N = Math.max(1, Math.min(10, nArg || 1));
// Estimación orientativa por imagen (USD) para gpt-image-2 (sept. 2026); verificar precios vigentes.
const COST = { low: { '1024x1024': .006, other: .005 }, medium: { '1024x1024': .053, other: .041 }, high: { '1024x1024': .211, other: .165 } };

const { style, briefs } = JSON.parse(await readFile(BRIEFS, 'utf8'));
const selected = briefs.filter((b) => !only.length || only.includes(b.id));
// Con «look» y «variants» (image-briefs-sitio.json) cada opción lleva su propio encuadre.
const promptOf = (b, k = 0) => [b.prompt, b.look && `Estética: ${b.look}`, b.variants && `Encuadre: ${b.variants[k % b.variants.length]}`,
  style.always, b.avoid ? `Avoid: ${b.avoid}. ${style.never}` : `Avoid: ${style.never}`].filter(Boolean).join('\n\n');

if (dry || !process.env.OPENAI_API_KEY) {
  let total = 0;
  for (const b of selected) {
    const c = N * COST[quality][b.size === '1024x1024' ? '1024x1024' : 'other'];
    total += c;
    console.log(`\n■ ${b.id} · ${b.use || b.group} · ${b.size} · ${b.mode || 'generate'}${b.reference ? ` · ref ${b.reference}` : ''} · ~US$${c.toFixed(3)}\n${promptOf(b)}`);
  }
  console.log(`\n${selected.length} fichas × ${N} variante(s) · modelo ${model} · calidad ${quality} · estimado ~US$${total.toFixed(2)}`);
  if (!process.env.OPENAI_API_KEY) console.log('Falta OPENAI_API_KEY en el entorno: no se envió nada.');
  process.exit(0);
}

const LOTE = N > 1 ? join(OUT, `lote-${new Date().toISOString().slice(0, 16).replace(/[:T]/g, '')}`) : OUT;
await mkdir(LOTE, { recursive: true });
const manifestPath = join(OUT, 'manifest.json');
const manifest = existsSync(manifestPath) ? JSON.parse(await readFile(manifestPath, 'utf8')) : {};
const headers = { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` };

for (const b of selected) {
  const prompt = promptOf(b);
  let res = null;
  if (b.mode === 'edit') {
    // Edición: sólo realce (luz, color, limpieza) de una foto REAL propia; nunca agregar equipos ni personas.
    const form = new FormData();
    form.append('model', model);
    form.append('prompt', prompt);
    form.append('size', b.size);
    form.append('quality', quality);
    const file = join(ROOT, b.reference);
    form.append('image[]', new Blob([await readFile(file)], { type: 'image/png' }), basename(file));
    res = await fetch('https://api.openai.com/v1/images/edits', { method: 'POST', headers, body: form });
  } else {
    // Con encuadres propios, una llamada por opción; si no, n variantes del mismo prompt.
    const calls = b.variants && N > 1 ? [...Array(N).keys()].map((k) => ({ prompt: promptOf(b, k), n: 1 })) : [{ prompt, n: N }];
    const data = [];
    for (const c of calls) {
      const r = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, prompt: c.prompt, size: b.size, quality, n: c.n }),
      });
      const j = await r.json();
      if (!r.ok) { res = { ok: false, error: j }; break; }
      data.push(...(j.data || []));
    }
    res = res || { ok: true, data };
  }
  const json = res.json ? await res.json() : res;
  if (!res.ok) { console.error(`✗ ${b.id}: ${json?.error?.error?.message || json?.error?.message || res.status || 'error'}`); continue; }
  const files = [];
  for (const [k, item] of (json.data || []).entries()) {
    const f = join(LOTE, N > 1 ? `${b.id}-v${k + 1}.png` : `${b.id}.png`);
    await writeFile(f, Buffer.from(item.b64_json, 'base64'));
    files.push(f);
  }
  manifest[b.id] = { files: files.map((f) => f.replace(`${ROOT}/`, '')), use: b.use || b.group, model, quality, size: b.size, mode: b.mode || 'generate',
    prompt, date: new Date().toISOString(), status: 'para revisar', label: 'Imagen ilustrativa generada con IA' };
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`✓ ${b.id} → ${files.length} archivo(s)`);
}
if (N > 1) {
  const { execFileSync } = await import('node:child_process');
  execFileSync('zip', ['-qr', `${LOTE}.zip`, '.'], { cwd: LOTE });
  console.log(`ZIP: ${LOTE}.zip`);
}
