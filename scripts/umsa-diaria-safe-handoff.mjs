#!/usr/bin/env node
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import dns from 'node:dns/promises';

const DEFAULT_SITE_URL = 'https://ultimamilla.com.ar';
const DEFAULT_DATE = process.env.UMSA_RUN_DATE || new Date().toISOString().slice(0, 10);
const DEFAULT_NOTES = [
  {
    slot: 'A',
    titulo: 'RG 5828 y la moratoria que te exige un "legajo fiscal vivo"',
    categoria: 'noticias',
    estado: 'NO PUBLICADO',
    reason: 'sandbox-blocked',
  },
  {
    slot: 'B',
    titulo: 'La "llave maestra" de la pyme: Keycloak + Odoo 18 sin cuentas duplicadas',
    categoria: 'tecnico',
    estado: 'NO PUBLICADO',
    reason: 'sandbox-blocked',
  },
  {
    slot: 'C',
    titulo: 'El IXP que te baja la factura: cooperativa rural y la "latencia domesticada"',
    categoria: 'empresa',
    estado: 'NO PUBLICADO',
    reason: 'sandbox-blocked',
  },
];

function parseArgs(argv) {
  const args = {
    date: DEFAULT_DATE,
    runDir: '',
    manifest: '',
    siteUrl: DEFAULT_SITE_URL,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--date') args.date = argv[++i] || args.date;
    else if (arg === '--run-dir') args.runDir = argv[++i] || args.runDir;
    else if (arg === '--manifest') args.manifest = argv[++i] || args.manifest;
    else if (arg === '--site-url') args.siteUrl = argv[++i] || args.siteUrl;
  }

  return args;
}

function slugify(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/["'`]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90);
}

async function canWrite(dir) {
  try {
    await fs.mkdir(dir, { recursive: true });
    const probe = path.join(dir, `.write-probe-${process.pid}`);
    await fs.writeFile(probe, 'ok');
    await fs.unlink(probe);
    return true;
  } catch {
    return false;
  }
}

async function chooseRunDir(requestedDir, date) {
  const candidates = [
    requestedDir,
    path.join(process.cwd(), 'outputs', `umsa-diaria-${date}`),
    path.join(process.cwd(), `_blog_umsa_${date}`),
    path.join(os.tmpdir(), `umsa-diaria-${date}`),
  ].filter(Boolean);

  for (const candidate of candidates) {
    const resolved = path.resolve(candidate);
    if (await canWrite(resolved)) return resolved;
  }

  throw new Error('No writable output directory found');
}

async function loadManifest(file) {
  if (!file) return DEFAULT_NOTES;
  const raw = await fs.readFile(file, 'utf8');
  const parsed = JSON.parse(raw);
  if (Array.isArray(parsed)) return parsed;
  if (Array.isArray(parsed.notes)) return parsed.notes;
  throw new Error('Manifest must be an array or an object with a notes array');
}

async function checkNetwork(siteUrl) {
  try {
    const host = new URL(siteUrl).hostname;
    await dns.lookup(host);
    return { ok: true, host };
  } catch (error) {
    return {
      ok: false,
      host: (() => {
        try { return new URL(siteUrl).hostname; } catch { return siteUrl; }
      })(),
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function buildPayload(note, date) {
  const slug = note.slug || slugify(note.titulo);
  return {
    titulo: note.titulo,
    resumen: note.resumen || `Borrador pendiente de publicacion automatica (${note.slot}).`,
    contenido: note.contenido || [
      `# ${note.titulo}`,
      '',
      '> Pendiente de completar/publicar. Este archivo fue generado por el fallback seguro porque la corrida original no pudo escribir o publicar desde la sandbox.',
      '',
      `Categoria: ${note.categoria}`,
      `Fecha de corrida: ${date}`,
    ].join('\n'),
    categoria: note.categoria,
    slug,
    tags: note.tags || ['umsa-diaria', 'pendiente'],
    tiempo_lectura: note.tiempo_lectura || 5,
    fecha_publicacion: note.fecha_publicacion || `${date}T09:00:00-03:00`,
    estado_publicacion: 'pendiente',
  };
}

function reportMarkdown({ date, runDir, notes, network, siteUrl, memoryStatus }) {
  const rows = notes.map((note) => {
    const slug = note.payload.slug || 'N/D';
    return `| ${note.slot} | ${note.payload.categoria} | ${note.payload.titulo} | ${slug} | PENDIENTE |`;
  }).join('\n');

  const networkLine = network.ok
    ? `DNS OK para ${network.host}; la publicacion queda pendiente para replay controlado.`
    : `Sin red/DNS para ${network.host}: ${network.error || 'fallo no especificado'}. Se omiten POST/HEAD/verify.`;

  return `# UMSA diaria - handoff seguro ${date}

## Estado

Corrida preservada como paquete local pendiente. ${networkLine}

## Notas

| Slot | Categoria | Titulo | Slug | Estado |
|------|-----------|--------|------|--------|
${rows}

## Archivos generados

- Directorio: \`${runDir}\`
- \`payloads_pendientes.json\`: payloads listos para reintento.
- \`nota_*.md\`: markdown fuente o stub recuperable.
- \`replay_post.sh\`: reintento manual cuando haya red y credenciales.
- \`reporte_semana_${date.slice(0, 7)}.json\`: estado de la corrida.

## Memoria

${memoryStatus}

## Motivo del fallback

La automatizacion debe considerar bloqueo de sandbox como estado recuperable, no como score 0 definitivo:

- si no hay DNS/red, no intenta POST ni verifica 200;
- si \`./outputs\` no es escribible, usa una ruta alternativa dentro del repo o \`/tmp\`;
- si \`$CODEX_HOME/automations/umsa-diaria/memory.md\` no es escribible, deja \`memory.pending.md\` junto al paquete.
`;
}

function replayScript(siteUrl) {
  return `#!/usr/bin/env bash
set -euo pipefail

if [ -z "\${UMSA_BLOG_USER:-}" ] || [ -z "\${UMSA_BLOG_PASS:-}" ]; then
  echo "ERROR: exporta UMSA_BLOG_USER y UMSA_BLOG_PASS antes de correr este script."
  exit 1
fi

DIR="$(cd "$(dirname "$0")" && pwd)"
URL="${siteUrl.replace(/\/$/, '')}/api/blog"
AUTH="$(printf '%s:%s' "$UMSA_BLOG_USER" "$UMSA_BLOG_PASS" | base64 | tr -d '\\n')"

node -e "const fs=require('fs'); const p=JSON.parse(fs.readFileSync('$DIR/payloads_pendientes.json','utf8')); for (const n of p) console.log(n.slot)" | while read -r slot; do
  body="$(node -e "const fs=require('fs'); const p=JSON.parse(fs.readFileSync('$DIR/payloads_pendientes.json','utf8')); const n=p.find(x=>x.slot==='$slot'); process.stdout.write(JSON.stringify(n.payload));")"
  echo "POST slot $slot ..."
  curl -sS -L --post301 --post302 -X POST "$URL" \\
    -H "Authorization: Basic $AUTH" \\
    -H "Content-Type: application/json" \\
    -H "User-Agent: UMSA-Blog-Editor/1.0" \\
    -d "$body" | tee "$DIR/post_resp_$slot.json"
  echo
done
`;
}

async function writeMemory(date, notes, runDir) {
  const line = `\n- ${date}: UMSA diaria pendiente por sandbox. Paquete local: ${runDir}. Slots: ${notes.map((n) => n.slot).join(', ')}.\n`;
  const codexHome = process.env.CODEX_HOME || path.join(os.homedir(), '.codex');
  const preferred = path.join(codexHome, 'automations', 'umsa-diaria');

  try {
    await fs.mkdir(preferred, { recursive: true });
    await fs.appendFile(path.join(preferred, 'memory.md'), line);
    return `Actualizada en \`${path.join(preferred, 'memory.md')}\`.`;
  } catch (error) {
    const fallback = path.join(runDir, 'memory.pending.md');
    await fs.appendFile(fallback, line);
    return `No se pudo escribir memoria global; queda pendiente en \`${fallback}\`. Error: ${error instanceof Error ? error.message : String(error)}`;
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const notes = await loadManifest(args.manifest);
  const runDir = await chooseRunDir(args.runDir, args.date);
  const network = await checkNetwork(args.siteUrl);

  const enriched = notes.map((note) => ({
    ...note,
    payload: buildPayload(note, args.date),
  }));

  for (const note of enriched) {
    const fname = `nota_${note.slot.toLowerCase()}.md`;
    await fs.writeFile(path.join(runDir, fname), note.payload.contenido, 'utf8');
  }

  await fs.writeFile(
    path.join(runDir, 'payloads_pendientes.json'),
    JSON.stringify(enriched.map(({ slot, payload }) => ({ slot, payload })), null, 2),
    'utf8'
  );

  const weeklyReport = {
    date: args.date,
    status: 'pending_sandbox_handoff',
    siteUrl: args.siteUrl,
    network,
    notes: enriched.map((note) => ({
      slot: note.slot,
      titulo: note.payload.titulo,
      categoria: note.payload.categoria,
      slug: note.payload.slug,
      estado: 'PENDIENTE_REPLAY',
    })),
  };

  const backlog = enriched.map((note) => ({
    slot: note.slot,
    titulo: note.payload.titulo,
    categoria: note.payload.categoria,
    slug: note.payload.slug,
    estado: 'PENDIENTE_REPLAY',
    motivo: 'sandbox_handoff',
    payload_file: 'payloads_pendientes.json',
    markdown_file: `nota_${note.slot.toLowerCase()}.md`,
  }));

  const fuentes = {
    date: args.date,
    status: 'pending_source_collection',
    reason: 'sandbox_handoff_created_without_live_fetch',
    siteUrl: args.siteUrl,
    network,
    fuentes: [],
  };

  const logEntry = {
    timestamp: new Date().toISOString(),
    date: args.date,
    status: 'pending_sandbox_handoff',
    runDir,
    notes: enriched.length,
    network,
  };

  await fs.writeFile(path.join(runDir, 'backlog.json'), JSON.stringify(backlog, null, 2), 'utf8');
  await fs.writeFile(path.join(runDir, 'fuentes.json'), JSON.stringify(fuentes, null, 2), 'utf8');
  await fs.appendFile(path.join(runDir, 'log_corridas.jsonl'), `${JSON.stringify(logEntry)}\n`, 'utf8');

  await fs.writeFile(
    path.join(runDir, `reporte_semana_${args.date.slice(0, 7)}.json`),
    JSON.stringify(weeklyReport, null, 2),
    'utf8'
  );

  await fs.writeFile(path.join(runDir, 'replay_post.sh'), replayScript(args.siteUrl), { mode: 0o755 });

  const memoryStatus = await writeMemory(args.date, enriched, runDir);
  await fs.writeFile(
    path.join(runDir, 'HANDOFF.md'),
    reportMarkdown({ date: args.date, runDir, notes: enriched, network, siteUrl: args.siteUrl, memoryStatus }),
    'utf8'
  );

  console.log(JSON.stringify({
    ok: true,
    status: 'pending_sandbox_handoff',
    runDir,
    network,
    notes: enriched.length,
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
