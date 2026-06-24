#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT = 'work/antecedentes-images';

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    args[key] = next && !next.startsWith('--') ? next : true;
    if (args[key] !== true) i += 1;
  }
  return args;
}

function requiredArg(args, key) {
  const value = args[key];
  if (!value || value === true) {
    throw new Error(`Missing required --${key}`);
  }
  return String(value);
}

function field(block, label) {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = block.match(new RegExp(`^${escaped}:\\s*(.+)$`, 'm'));
  return match ? match[1].trim() : '';
}

function cleanSentence(value) {
  return String(value || '').trim().replace(/[.;\s]+$/g, '');
}

function normalizePrompt(block) {
  const id = field(block, 'ID antecedente');
  const filename = field(block, 'Nombre esperado al descargar');
  const cliente = cleanSentence(field(block, 'Cliente'));
  const sector = cleanSentence(field(block, 'Sector / area'));
  const titulo = cleanSentence(field(block, 'Titulo'));
  const descripcion = cleanSentence(field(block, 'Descripcion'));
  const concepto = cleanSentence(field(block, 'Concepto visual unico'));
  const escena = cleanSentence(field(block, 'Escena concreta'));
  const composicion = cleanSentence(field(block, 'Composicion obligatoria'));
  const priorizar = cleanSentence(field(block, 'Elementos a priorizar'));
  const evitar = cleanSentence(field(block, 'Evitar en esta imagen'));

  return {
    id,
    filename,
    prompt: [
      'Use case: photorealistic-natural',
      'Asset type: ULTIMA MILLA website antecedente thumbnail, horizontal 16:10 documentary technical evidence image',
      `Primary request: create ONE realistic documentary photo for antecedente ID ${id}, not a collage.`,
      `Client/sector: ${cliente} / ${sector}.`,
      `Title: ${titulo}.`,
      `Description: ${descripcion}.`,
      `Unique visual concept: ${concepto}.`,
      `Scene/backdrop: ${escena}.`,
      `Composition/framing: ${composicion}`,
      `Subject priorities: ${priorizar}.`,
      'Style/medium: photorealistic documentary technical photography, sober Argentine industrial/institutional environment, believable materials and small real-world imperfections.',
      'Lighting/mood: neutral natural or LED work lighting, technical, quiet, credible, not glossy marketing.',
      'Color palette: UMSA sober palette: white, black, gray, subtle cable/equipment colors; no dominant red except real device/tool accents if unavoidable.',
      `Avoid: ${evitar}; no readable text anywhere; no logos; no watermark; no invented brand marks; no recognizable faces; no UI screens with legible content.`,
    ].join('\n'),
  };
}

function parsePromptFile(lote) {
  const promptFile = path.join(ROOT, 'lotes', lote, 'prompt_chatgpt.md');
  const text = fs.readFileSync(promptFile, 'utf8');
  return text
    .split(/^----\s*$/m)
    .slice(1)
    .map((block) => block.trim())
    .filter(Boolean)
    .map(normalizePrompt)
    .filter((item) => item.id && item.filename);
}

function writeBatch(lote, items) {
  const outDir = path.join(ROOT, 'batches');
  fs.mkdirSync(outDir, { recursive: true });

  const jsonlPath = path.join(outDir, `${lote}-prompts.jsonl`);
  const mdPath = path.join(outDir, `${lote}-prompts.md`);

  const jsonl = items.map((item) => {
    const filename = item.filename.replace(/\.(png|jpg|jpeg|webp)$/i, '.png');
    const base = filename.replace(/\.(png|jpg|jpeg|webp)$/i, '');
    return JSON.stringify({
      id: item.id,
      lote,
      expected_filename: filename,
      raw_target: path.join(ROOT, 'generadas_crudas', lote, filename),
      processed_webp_target: path.join(ROOT, 'salida_web', lote, `${base}.webp`),
      public_webp_target: path.join('public/images/antecedentes/generated', lote, `${base}.webp`),
      prompt: item.prompt,
    });
  }).join('\n') + '\n';

  const markdown = [
    `# ${lote} prompts v2`,
    '',
    `Total: ${items.length}`,
    '',
    ...items.flatMap((item, index) => [
      `## ${String(index + 1).padStart(2, '0')} / ${item.id}`,
      '',
      `Archivo esperado: \`${item.filename.replace(/\.(png|jpg|jpeg|webp)$/i, '.png')}\``,
      '',
      '```text',
      item.prompt,
      '```',
      '',
    ]),
  ].join('\n');

  fs.writeFileSync(jsonlPath, jsonl, 'utf8');
  fs.writeFileSync(mdPath, markdown, 'utf8');

  return { jsonlPath, mdPath };
}

const args = parseArgs(process.argv.slice(2));
const lote = requiredArg(args, 'lote');
const items = parsePromptFile(lote);
const outputs = writeBatch(lote, items);

console.log(JSON.stringify({ lote, prompts: items.length, ...outputs }, null, 2));
