import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import sharp from 'sharp';

const root = new URL('../', import.meta.url);
const sprite = await readFile(new URL('public/cine/iso/partes.svg', root), 'utf8');
const catalog = JSON.parse(await readFile(new URL('src/data/information-flows.json', root), 'utf8'));
const output = new URL('src/assets/flow-diagrams/', root);
const symbol = new Map([...sprite.matchAll(/<symbol id="p-([^"]+)" viewBox="([^"]+)">([\s\S]*?)<\/symbol>/g)]
  .map(([, key, box, body]) => [key, { box, body }]));
const styles = (sprite.match(/<style>([\s\S]*?)<\/style>/)?.[1] ?? '')
  .replace(/var\(--p-[\w-]+,([^)]+)\)/g, '$1');
const centers = [640 / 6, 320, 640 * 5 / 6];
const rail = 120;
const paper = '#e2e7e6';
const red = '#dc2626';
const fps = 20;
const frames = 60;

function board(nodes, signal) {
  const [start, middle, end] = centers;
  const background = '<rect width="640" height="142" fill="' + paper + '"/>';
  const connectors = centers.map(x => '<path d="M' + x + ' 96V' + rail + '" stroke="#8d9799" fill="none"/>').join('');
  const railBase = '<path d="M' + start + ' ' + rail + 'H' + end + '" fill="none" stroke="#737e81" stroke-width="2"/>';
  const arrows = [(start + middle) / 2, (middle + end) / 2]
    .map(x => '<path d="M' + (x - 3) + ' ' + (rail - 4) + 'l4 4-4 4" fill="none" stroke="#667376" stroke-width="1.5"/>')
    .join('');
  const signalLine = signal === null ? '' :
    '<path d="M' + start + ' ' + rail + 'H' + signal + '" stroke="' + red + '" stroke-width="3" stroke-linecap="round"/>' +
    '<circle cx="' + signal + '" cy="' + rail + '" r="4.2" fill="' + red + '"/>';
  const equipment = nodes.map(([, key], index) => {
    const x = centers[index];
    const entry = symbol.get(key);
    if (!entry) throw new Error('Missing existing equipment symbol: ' + key);
    const reached = signal !== null && signal >= x - .2;
    return '<rect x="' + (x - 52) + '" y="8" width="104" height="88" rx="2" fill="#f2f4f3" stroke="' +
      (reached ? '#c77c79' : '#b2bcbd') + '"/>' +
      '<svg x="' + (x - 44) + '" y="10" width="88" height="84" viewBox="' + entry.box + '">' + entry.body + '</svg>' +
      '<circle cx="' + x + '" cy="' + rail + '" r="5.2" fill="' + (reached ? red : '#f7f9f8') +
      '" stroke="' + (reached ? red : '#667376') + '" stroke-width="1.5"/>';
  }).join('');
  return '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="142" viewBox="0 0 640 142"><style>' +
    styles + '</style>' + background + connectors + railBase + arrows + signalLine + equipment + '</svg>';
}

function position(frame) {
  if (frame < 7) return null;
  if (frame <= 24) return centers[0] + (centers[1] - centers[0]) * (frame - 7) / 17;
  if (frame < 29) return centers[1];
  if (frame <= 46) return centers[1] + (centers[2] - centers[1]) * (frame - 29) / 17;
  return centers[2];
}

const frameDir = await mkdtemp(join(tmpdir(), 'umsa-gif-'));
try {
  for (const [key, flow] of Object.entries(catalog)) {
    if (process.argv.length > 2 && !process.argv.slice(2).includes(key)) continue;
    if (flow.nodes.length !== 3) throw new Error('A flow must have exactly three steps: ' + key);
    const still = board(flow.nodes, null);
    await writeFile(new URL(key + '.svg', output), still + '\n');
    for (let n = 0; n < frames; n++) {
      const svg = n < 7 ? still : board(flow.nodes, position(n));
      await sharp(Buffer.from(svg)).png().toFile(join(frameDir, 'frame-' + String(n).padStart(3, '0') + '.png'));
    }
    const destination = new URL(key + '.gif', output);
    const encode = spawnSync('ffmpeg', [
      '-v', 'error', '-y', '-framerate', String(fps), '-i', join(frameDir, 'frame-%03d.png'),
      '-filter_complex_threads', '1',
      '-filter_complex', '[0:v]split[clip][sample];[sample]palettegen=max_colors=72[palette];[clip][palette]paletteuse=dither=none:diff_mode=rectangle',
      '-loop', '-1', decodeURIComponent(destination.pathname),
    ], { encoding: 'utf8' });
    if (encode.status !== 0) throw new Error(encode.stderr || 'FFmpeg is required to render the GIF.');
    const size = (await readFile(destination)).byteLength;
    if (size > 65_536) throw new Error('GIF exceeds the 64 KiB budget: ' + key);
    console.log(key + ' ' + size + ' B');
  }
} finally {
  await rm(frameDir, { recursive: true, force: true });
}
