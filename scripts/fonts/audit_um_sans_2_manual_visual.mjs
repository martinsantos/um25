#!/usr/bin/env node

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import opentypeModule from 'opentype.js';
import sharp from 'sharp';

const opentype = opentypeModule.default ?? opentypeModule;
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const OTF = path.join(ROOT, 'type/um-sans-2/build/UMSans2ManualAlpha7-DisplayBold.otf');
const OUTPUT = path.join(ROOT, 'type/um-sans-2/build/visual-gate-report.json');
const WEB_OUTPUT = path.join(ROOT, 'public/fonts/um-sans-2-manual-alpha/visual-gate-report.json');

export const RASTER_SIZES = [16, 20, 24, 30, 32, 48, 72];
export const CONTROL_STRINGS = [
  'eeee cece rere',
  'referencia eficiente',
  'Fibra certificada, operación continua.',
];

// These fingerprints are intentionally updated only after direct human
// review. A changed outline, advance or fallback therefore blocks the proof.
export const APPROVED_CONTROL_RASTER_SHA256 = {
  16: 'bdaa07834b640528c84658445c6a334775a758639faf0c3d62970796af8d1b74',
  20: 'c80f1110eb37a4a67bfd06010fe56d00dd09781901fab7856e1539b3f730cac9',
  24: 'a8b8754fdcf1d119f0fb46f430c39ec52bc4f7b49dc8faeabaf61190d380ca51',
  30: 'ad5eab9e21fb01e0e8ba07d7bb04f3a5ca177970fe59df798c2a7b09434b852a',
  32: '9eee02d0ed8c4d56df42c4554dc40b8cd17b3d1eda45fb59241db8e247750559',
  48: 'a3d9c40be933c97d4d6e0f645b6912703dfcb80f2cbe6319c5ecb22ff8e561f5',
  72: '5db4b3e9188c6ac2b448087703e729dd2bd5682ccf49d6f4d8d48d9199f8a923',
};

export const APPROVED_RASTER_REVIEW = {
  reviewedOn: '2026-07-29',
  desktopViewport: '1280x720',
  mobileViewports: ['432x661', '390x900', '360x740'],
  evidence: [
    'type/um-sans-2/proofs/reviews/alpha7-browser-proof-desktop.png',
    'type/um-sans-2/proofs/reviews/alpha7-browser-proof-mobile-432.png',
    'type/um-sans-2/proofs/reviews/alpha7-browser-proof-mobile-390.png',
    'type/um-sans-2/proofs/reviews/alpha7-browser-proof-mobile-360.png',
  ],
};

function fail(message, failures) {
  failures.push(message);
}

function svgForPath(pathData, box) {
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${box.width}" height="${box.height}" viewBox="${box.x} ${box.y} ${box.width} ${box.height}">`
    + `<rect x="${box.x}" y="${box.y}" width="${box.width}" height="${box.height}" fill="#fff"/>`
    + `<path d="${pathData}" fill="#000"/></svg>`,
  );
}

async function rasterize(font, text, size) {
  const proofPath = font.getPath(text, 0, 0, size, { kerning: false });
  const bounds = proofPath.getBoundingBox();
  const padding = Math.max(2, Math.ceil(size * 0.2));
  const x = Math.floor(bounds.x1) - padding;
  const y = Math.floor(bounds.y1) - padding;
  const width = Math.max(1, Math.ceil(bounds.x2) - x + padding);
  const height = Math.max(1, Math.ceil(bounds.y2) - y + padding);
  const { data, info } = await sharp(svgForPath(proofPath.toPathData(3), { x, y, width, height }))
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height };
}

function binaryRaster({ data, width, height }) {
  const ink = Uint8Array.from(data, (value) => (value < 192 ? 1 : 0));
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (!ink[y * width + x]) continue;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }
  if (maxX < 0) return { pixels: new Uint8Array(), width: 0, height: 0 };
  const cropWidth = maxX - minX + 1;
  const cropHeight = maxY - minY + 1;
  const pixels = new Uint8Array(cropWidth * cropHeight);
  for (let y = 0; y < cropHeight; y += 1) {
    for (let x = 0; x < cropWidth; x += 1) {
      pixels[y * cropWidth + x] = ink[(y + minY) * width + x + minX];
    }
  }
  return { pixels, width: cropWidth, height: cropHeight };
}

function componentAreas(pixels, width, height, target, eightWay = false) {
  const visited = new Uint8Array(pixels.length);
  const components = [];
  const directions = eightWay
    ? [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]]
    : [[0, -1], [-1, 0], [1, 0], [0, 1]];
  for (let start = 0; start < pixels.length; start += 1) {
    if (visited[start] || pixels[start] !== target) continue;
    const queue = [start];
    visited[start] = 1;
    let area = 0;
    let touchesEdge = false;
    for (let cursor = 0; cursor < queue.length; cursor += 1) {
      const index = queue[cursor];
      const x = index % width;
      const y = Math.floor(index / width);
      area += 1;
      if (x === 0 || y === 0 || x === width - 1 || y === height - 1) touchesEdge = true;
      for (const [dx, dy] of directions) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
        const next = ny * width + nx;
        if (!visited[next] && pixels[next] === target) {
          visited[next] = 1;
          queue.push(next);
        }
      }
    }
    components.push({ area, touchesEdge });
  }
  return components;
}

function apertureRows(pixels, width, height) {
  let openRows = 0;
  let maximumRightOpening = 0;
  const firstRow = Math.floor(height * 0.5);
  const lastRow = Math.ceil(height * 0.8);
  for (let y = firstRow; y < lastRow; y += 1) {
    let rightOpening = 0;
    for (let x = width - 1; x >= 0 && pixels[y * width + x] === 0; x -= 1) {
      rightOpening += 1;
    }
    maximumRightOpening = Math.max(maximumRightOpening, rightOpening);
    if (rightOpening >= Math.ceil(width * 0.2)) openRows += 1;
  }
  return { openRows, maximumRightOpening };
}

function rasterHash(rasters) {
  const hash = crypto.createHash('sha256');
  for (const raster of rasters) {
    const binary = binaryRaster(raster);
    hash.update(`${binary.width}x${binary.height}:`);
    hash.update(binary.pixels);
  }
  return hash.digest('hex');
}

export async function auditVisual() {
  const failures = [];
  if (!fs.existsSync(OTF)) {
    fail('Compiled Alpha 7 OTF is missing', failures);
  }
  const font = fs.existsSync(OTF) ? opentype.loadSync(OTF) : null;
  const sizes = [];

  if (font) {
    for (const character of [...new Set(CONTROL_STRINGS.join(''))]) {
      if (character !== ' ' && font.charToGlyphIndex(character) === 0) {
        fail(`Control character is missing: ${JSON.stringify(character)}`, failures);
      }
    }

    for (const size of RASTER_SIZES) {
      const eRaster = binaryRaster(await rasterize(font, 'e', size));
      const inkComponents = componentAreas(eRaster.pixels, eRaster.width, eRaster.height, 1, true);
      const whiteComponents = componentAreas(eRaster.pixels, eRaster.width, eRaster.height, 0);
      const counterAreas = whiteComponents.filter((component) => !component.touchesEdge).map((component) => component.area);
      const aperture = apertureRows(eRaster.pixels, eRaster.width, eRaster.height);
      const controls = await Promise.all(CONTROL_STRINGS.map((text) => rasterize(font, text, size)));
      const controlRasterSha256 = rasterHash(controls);
      const approvedSha256 = APPROVED_CONTROL_RASTER_SHA256[size];

      if (inkComponents.length !== 1) fail(`e splits into ${inkComponents.length} ink components at ${size}px`, failures);
      if (counterAreas.length !== 1 || counterAreas[0] < Math.max(1, Math.floor(size / 12))) {
        fail(`e counter collapses at ${size}px: ${counterAreas.join(', ') || 'none'}`, failures);
      }
      if (aperture.openRows < 1) {
        fail(`e aperture is too narrow at ${size}px: ${aperture.openRows} open raster rows`, failures);
      }
      if (!approvedSha256) fail(`No human-approved raster baseline exists at ${size}px`, failures);
      else if (controlRasterSha256 !== approvedSha256) fail(`Visual regression at ${size}px`, failures);

      sizes.push({
        size,
        inkComponents: inkComponents.length,
        counterAreas,
        apertureOpenRows: aperture.openRows,
        apertureMaximumRightOpening: aperture.maximumRightOpening,
        controlRasterSha256,
        approvedSha256: approvedSha256 ?? null,
      });
    }
  }

  const result = {
    status: failures.length ? 'FAIL' : 'PASS',
    version: '0.800',
    family: 'UM Sans 2 Manual Alpha 7',
    productionUse: false,
    baselineReview: Object.keys(APPROVED_CONTROL_RASTER_SHA256).length === RASTER_SIZES.length
      ? 'human-reviewed-and-locked'
      : 'pending-human-review',
    approvedRasterReview: APPROVED_RASTER_REVIEW,
    rasterSizes: RASTER_SIZES,
    controlStrings: CONTROL_STRINGS,
    sizes,
    failures,
  };
  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
  fs.mkdirSync(path.dirname(WEB_OUTPUT), { recursive: true });
  fs.writeFileSync(OUTPUT, `${JSON.stringify(result, null, 2)}\n`);
  fs.writeFileSync(WEB_OUTPUT, `${JSON.stringify(result, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  if (failures.length) process.exitCode = 1;
  return result;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) await auditVisual();
