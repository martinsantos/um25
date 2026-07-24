#!/usr/bin/env node

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import opentypeModule from 'opentype.js';

const opentype = opentypeModule.default ?? opentypeModule;
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const SOURCE_SCRIPT = path.join(ROOT, 'scripts/fonts/bootstrap_um_sans_2_manual_alpha.py');
const UFO = path.join(ROOT, 'type/um-sans-2/sources/UMSans2Display-Bold.ufo');
const BUILD = path.join(ROOT, 'type/um-sans-2/build');
const WEB = path.join(ROOT, 'public/fonts/um-sans-2-manual-alpha');
const OTF_NAME = 'UMSans2ManualAlpha6-DisplayBold.otf';
const VERSION = '0.700';
const KAPPA = 0.5522847498;

const SPECS = [
  ['.notdef', 660, null, 'notdef'],
  ['space', 290, 0x20, null],
  ['H', 700, 0x48, 'H'],
  ['F', 690, 0x46, 'F'],
  ['O', 740, 0x4f, 'O'],
  ['o', 624, 0x6f, 'o'],
  ['a', 606, 0x61, 'a'],
  ['b', 636, 0x62, 'b'],
  ['c', 584, 0x63, 'c'],
  ['d', 610, 0x64, 'd'],
  ['e', 616, 0x65, 'e'],
  ['f', 472, 0x66, 'f'],
  ['i', 252, 0x69, 'i'],
  ['l', 252, 0x6c, 'l'],
  ['n', 632, 0x6e, 'n'],
  ['p', 636, 0x70, 'p'],
  ['r', 492, 0x72, 'r'],
  ['s', 584, 0x73, 's'],
  ['t', 498, 0x74, 't'],
  ['u', 632, 0x75, 'u'],
  ['period', 250, 0x2e, 'period'],
  ['comma', 250, 0x2c, 'comma'],
  ['acutecomb', 0, 0x301, 'acute'],
];

function extractFunction(source, name) {
  const marker = `def draw_${name}(pen):`;
  const start = source.indexOf(marker);
  if (start < 0) throw new Error(`Missing manual outline function: ${marker}`);
  const bodyStart = start + marker.length;
  const next = source.indexOf('\ndef ', bodyStart);
  return source.slice(bodyStart, next < 0 ? source.length : next);
}

function point(value) {
  return value.split(',').map((item) => Number(item.trim()));
}

function recorder() {
  const contours = [];
  let current = null;
  return {
    contours,
    moveTo([x, y]) {
      if (current?.length) contours.push(current);
      current = [{ type: 'M', x, y }];
    },
    lineTo([x, y]) {
      current.push({ type: 'L', x, y });
    },
    curveTo([x1, y1], [x2, y2], [x, y]) {
      current.push({ type: 'C', x1, y1, x2, y2, x, y });
    },
    closePath() {
      current.push({ type: 'Z' });
      contours.push(current);
      current = null;
    },
    finish() {
      if (current?.length) contours.push(current);
      current = null;
      return contours;
    },
  };
}

function drawRect(pen, values) {
  const reverse = values.includes('reverse=True');
  const [x0, y0, x1, y1] = values.replace(/,?\s*reverse=True/, '').split(',').map(Number);
  const points = [[x0, y0], [x0, y1], [x1, y1], [x1, y0]];
  if (reverse) points.reverse();
  pen.moveTo(points[0]);
  points.slice(1).forEach((item) => pen.lineTo(item));
  pen.closePath();
}

function drawPolygon(pen, values, reverse) {
  const points = [...values.matchAll(/\((-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)\)/g)]
    .map((match) => [Number(match[1]), Number(match[2])]);
  if (reverse) points.reverse();
  pen.moveTo(points[0]);
  points.slice(1).forEach((item) => pen.lineTo(item));
  pen.closePath();
}

function drawOval(pen, values) {
  const reverse = values.includes('reverse=True');
  const [x0, y0, x1, y1] = values.replace(/,?\s*reverse=True/, '').split(',').map(Number);
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;
  const rx = (x1 - x0) / 2;
  const ry = (y1 - y0) / 2;
  pen.moveTo([cx, y1]);
  if (reverse) {
    pen.curveTo([cx - KAPPA * rx, y1], [x0, cy + KAPPA * ry], [x0, cy]);
    pen.curveTo([x0, cy - KAPPA * ry], [cx - KAPPA * rx, y0], [cx, y0]);
    pen.curveTo([cx + KAPPA * rx, y0], [x1, cy - KAPPA * ry], [x1, cy]);
    pen.curveTo([x1, cy + KAPPA * ry], [cx + KAPPA * rx, y1], [cx, y1]);
  } else {
    pen.curveTo([cx + KAPPA * rx, y1], [x1, cy + KAPPA * ry], [x1, cy]);
    pen.curveTo([x1, cy - KAPPA * ry], [cx + KAPPA * rx, y0], [cx, y0]);
    pen.curveTo([cx - KAPPA * rx, y0], [x0, cy - KAPPA * ry], [x0, cy]);
    pen.curveTo([x0, cy + KAPPA * ry], [cx - KAPPA * rx, y1], [cx, y1]);
  }
  pen.closePath();
}

function parseOutline(source, name) {
  const body = extractFunction(source, name);
  const pen = recorder();
  const token = /(rect|oval)\(pen,\s*([^)]+)\)|polygon\(pen,\s*(\[[\s\S]*?\])(?:,\s*reverse=(True|False))?\)|pen\.(moveTo|lineTo)\(\(([^)]+)\)\)|pen\.curveTo\(\(([^)]+)\),\s*\(([^)]+)\),\s*\(([^)]+)\)\)|pen\.closePath\(\)/g;
  let match;
  while ((match = token.exec(body))) {
    if (match[1] === 'rect') drawRect(pen, match[2]);
    else if (match[1] === 'oval') drawOval(pen, match[2]);
    else if (match[3]) drawPolygon(pen, match[3], match[4] === 'True');
    else if (match[5] === 'moveTo') pen.moveTo(point(match[6]));
    else if (match[5] === 'lineTo') pen.lineTo(point(match[6]));
    else if (match[7]) pen.curveTo(point(match[7]), point(match[8]), point(match[9]));
    else pen.closePath();
  }
  return pen.finish();
}

function cloneContours(contours) {
  return contours.map((contour) => contour.map((command) => ({ ...command })));
}

export function buildGlyphDefinitions() {
  const source = fs.readFileSync(SOURCE_SCRIPT, 'utf8');
  const definitions = SPECS.map(([name, advanceWidth, unicode, drawName]) => ({
    name,
    advanceWidth,
    unicode,
    contours: drawName ? parseOutline(source, drawName) : [],
  }));
  const o = definitions.find((glyph) => glyph.name === 'o');
  const acute = definitions.find((glyph) => glyph.name === 'acutecomb');
  definitions.push({
    name: 'oacute',
    advanceWidth: 624,
    unicode: 0xf3,
    contours: [...cloneContours(o.contours), ...cloneContours(acute.contours)],
  });
  return definitions;
}

function toOpenTypePath(contours) {
  const result = new opentype.Path();
  for (const contour of contours) {
    for (const command of contour) {
      if (command.type === 'M') result.moveTo(command.x, command.y);
      else if (command.type === 'L') result.lineTo(command.x, command.y);
      else if (command.type === 'C') result.curveTo(command.x1, command.y1, command.x2, command.y2, command.x, command.y);
      else result.close();
    }
  }
  return result;
}

function bounds(contours) {
  const coordinates = contours.flatMap((contour) => contour.flatMap((command) => {
    if (command.type === 'M' || command.type === 'L') return [[command.x, command.y]];
    if (command.type === 'C') return [[command.x1, command.y1], [command.x2, command.y2], [command.x, command.y]];
    return [];
  }));
  if (!coordinates.length) return [0, 0, 0, 0];
  const xs = coordinates.map(([x]) => x);
  const ys = coordinates.map(([, y]) => y);
  return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
}

function cubicAt(p0, p1, p2, p3, t) {
  const mt = 1 - t;
  return mt ** 3 * p0 + 3 * mt ** 2 * t * p1 + 3 * mt * t ** 2 * p2 + t ** 3 * p3;
}

function contourArea(contour) {
  const points = [];
  let cursor = null;
  for (const command of contour) {
    if (command.type === 'M') {
      cursor = [command.x, command.y];
      points.push(cursor);
    } else if (command.type === 'L') {
      cursor = [command.x, command.y];
      points.push(cursor);
    } else if (command.type === 'C') {
      const [x0, y0] = cursor;
      for (let step = 1; step <= 16; step += 1) {
        const t = step / 16;
        points.push([
          cubicAt(x0, command.x1, command.x2, command.x, t),
          cubicAt(y0, command.y1, command.y2, command.y, t),
        ]);
      }
      cursor = [command.x, command.y];
    }
  }
  return points.reduce((sum, [x, y], index) => {
    const [nextX, nextY] = points[(index + 1) % points.length];
    return sum + x * nextY - nextX * y;
  }, 0) / 2;
}

function xmlEscape(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}

function plistDocument(content) {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">\n<plist version="1.0">\n${content}\n</plist>\n`;
}

function plistValue(value, indent = '  ') {
  if (Array.isArray(value)) return `<array>\n${value.map((item) => `${indent}${plistValue(item, `${indent}  `)}`).join('\n')}\n${indent.slice(2)}</array>`;
  if (typeof value === 'number') return `<integer>${value}</integer>`;
  return `<string>${xmlEscape(value)}</string>`;
}

function plistDict(entries) {
  return plistDocument(`<dict>\n${entries.map(([key, value]) => `  <key>${xmlEscape(key)}</key>\n  ${plistValue(value, '    ')}`).join('\n')}\n</dict>`);
}

function glyphFileName(name) {
  if (name === '.notdef') return 'notdef.glif';
  if (/^[A-Z]$/.test(name)) return `${name}_.glif`;
  return `${name}.glif`;
}

function glifFor(glyph) {
  const unicode = glyph.unicode == null ? '' : `\n  <unicode hex="${glyph.unicode.toString(16).toUpperCase().padStart(4, '0')}"/>`;
  const contours = glyph.contours.map((contour) => {
    const points = contour.flatMap((command) => {
      if (command.type === 'M' || command.type === 'L') return [`      <point x="${command.x}" y="${command.y}" type="line"/>`];
      if (command.type === 'C') return [
        `      <point x="${command.x1}" y="${command.y1}"/>`,
        `      <point x="${command.x2}" y="${command.y2}"/>`,
        `      <point x="${command.x}" y="${command.y}" type="curve"/>`,
      ];
      return [];
    }).join('\n');
    return `    <contour>\n${points}\n    </contour>`;
  }).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<glyph name="${xmlEscape(glyph.name)}" format="2">\n  <advance width="${glyph.advanceWidth}"/>${unicode}\n  <outline>${contours ? `\n${contours}\n  ` : ''}</outline>\n</glyph>\n`;
}

function writeUfo(definitions) {
  fs.rmSync(UFO, { recursive: true, force: true });
  const glyphDir = path.join(UFO, 'glyphs');
  fs.mkdirSync(glyphDir, { recursive: true });
  fs.writeFileSync(path.join(UFO, 'metainfo.plist'), plistDict([['creator', 'com.ultimamilla.umsans2'], ['formatVersion', 3]]));
  fs.writeFileSync(path.join(UFO, 'layercontents.plist'), plistDocument('<array>\n  <array>\n    <string>public.default</string>\n    <string>glyphs</string>\n  </array>\n</array>'));
  fs.writeFileSync(path.join(UFO, 'fontinfo.plist'), plistDict([
    ['familyName', 'UM Sans 2 Manual'], ['styleName', 'Display Bold Alpha 6'],
    ['unitsPerEm', 1000], ['ascender', 780], ['descender', -220],
    ['capHeight', 720], ['xHeight', 540], ['openTypeOS2WeightClass', 700],
    ['openTypeOS2WidthClass', 5], ['versionMajor', 0], ['versionMinor', 600],
    ['note', 'Independent manual Alpha 6 control redraw. Not approved for production or distribution.'],
  ]));
  fs.writeFileSync(path.join(UFO, 'lib.plist'), plistDict([['public.glyphOrder', definitions.map((glyph) => glyph.name)]]));
  fs.writeFileSync(path.join(UFO, 'features.fea'), 'languagesystem DFLT dflt;\nlanguagesystem latn dflt;\n');
  const contents = [];
  for (const glyph of definitions) {
    const fileName = glyphFileName(glyph.name);
    contents.push([glyph.name, fileName]);
    fs.writeFileSync(path.join(glyphDir, fileName), glifFor(glyph));
  }
  fs.writeFileSync(path.join(glyphDir, 'contents.plist'), plistDict(contents));
}

function sha256(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

export function compile() {
  const definitions = buildGlyphDefinitions();
  writeUfo(definitions);
  const glyphs = definitions.map((glyph) => new opentype.Glyph({
    name: glyph.name,
    unicode: glyph.unicode ?? undefined,
    advanceWidth: glyph.advanceWidth,
    path: toOpenTypePath(glyph.contours),
  }));
  const font = new opentype.Font({
    familyName: 'UM Sans 2 Manual Alpha 6',
    styleName: 'Display Bold',
    designer: 'ULTIMA MILLA S.A. Type Development',
    designerURL: 'https://www.ultimamilla.com.ar',
    manufacturer: 'ULTIMA MILLA S.A.',
    version: `Version ${VERSION}`,
    unitsPerEm: 1000,
    ascender: 780,
    descender: -220,
    glyphs,
  });
  if (font.tables.os2) {
    font.tables.os2.usWeightClass = 700;
    font.tables.os2.usWidthClass = 5;
    font.tables.os2.sxHeight = 540;
    font.tables.os2.sCapHeight = 720;
  }
  fs.mkdirSync(BUILD, { recursive: true });
  fs.mkdirSync(WEB, { recursive: true });
  const buildOtf = path.join(BUILD, OTF_NAME);
  const webOtf = path.join(WEB, OTF_NAME);
  const buffer = Buffer.from(font.toArrayBuffer());
  fs.writeFileSync(buildOtf, buffer);
  fs.copyFileSync(buildOtf, webOtf);

  const metrics = Object.fromEntries(definitions.map((glyph) => {
    const [xMin, , xMax] = bounds(glyph.contours);
    return [glyph.name, {
      advanceWidth: glyph.advanceWidth,
      leftSidebearing: xMin,
      rightSidebearing: glyph.advanceWidth - xMax,
      contourAreas: glyph.contours.map((contour) => Math.round(contourArea(contour))),
    }];
  }));
  const report = {
    family: 'UM Sans 2 Manual Alpha 6',
    version: VERSION,
    status: 'manual-alpha-6-quarantined',
    generatedAt: new Date().toISOString(),
    source: path.relative(ROOT, UFO),
    outlineOrigin: 'hand-authored UMSA coordinates parsed from the manual master; no imported outlines',
    glyphCount: definitions.length,
    unicodeCount: definitions.filter((glyph) => glyph.unicode != null).length,
    approvedUse: 'noindex specimen only',
    productionUse: false,
    kerningPairs: 0,
    metrics,
    files: [buildOtf, webOtf].map((filePath) => ({ path: path.relative(ROOT, filePath), sha256: sha256(filePath) })),
  };
  fs.writeFileSync(path.join(BUILD, 'build-report.json'), `${JSON.stringify(report, null, 2)}\n`);
  fs.writeFileSync(path.join(WEB, 'build-report.json'), `${JSON.stringify(report, null, 2)}\n`);
  fs.writeFileSync(path.join(WEB, 'DO-NOT-SHIP.md'), '# UM Sans 2 Manual Alpha 6\n\nInternal noindex proof only. Alpha 1 through Alpha 5 were rejected as release candidates after visual review. Do not register globally, package or deploy to production.\n');
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  return report;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) compile();
