#!/usr/bin/env node
/**
 * Optimiza las isometrías de /cine/iso sin cambiar lo que se ve ni los ganchos que usan
 * el CSS y el JS (clases sp-*, atributos data-project-*, ids de título y descripción).
 *
 * - Los atributos de presentación repetidos en todos los hijos de un grupo suben al grupo.
 * - Los valores por defecto (fill-opacity="1", stroke-opacity="1") se quitan.
 * - Las coordenadas se redondean a una decimal (la caja es de 1200 unidades).
 * - Se quitan saltos de línea y espacios entre etiquetas.
 *
 * Uso: node scripts/cine/optimizar-iso.mjs [--check] archivo.svg [...]
 * Con --check no escribe: informa el tamaño que tendría cada archivo.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const SHAPES = new Set(['polygon', 'path', 'ellipse', 'circle', 'rect', 'line', 'polyline']);
// Atributos heredables que vale la pena subir al grupo, con su valor por defecto.
const HEREDABLES = {
  fill: 'black',
  'fill-opacity': '1',
  stroke: 'none',
  'stroke-opacity': '1',
  'stroke-width': '1',
  'stroke-linejoin': 'miter',
  'stroke-linecap': 'butt',
};
const NUMERICOS = new Set(['points', 'd', 'cx', 'cy', 'r', 'rx', 'ry', 'x', 'y', 'x1', 'y1', 'x2', 'y2', 'width', 'height']);

const DECIMALES = Number(process.env.ISO_DECIMALES ?? 1);
const redondear = (valor) => valor.replace(/-?\d*\.\d+/g, (n) => {
  const f = 10 ** DECIMALES;
  const r = Math.round(Number(n) * f) / f;
  return String(r).replace(/^(-?)0\./, '$1.');
});

/** Árbol mínimo: { tag, attrs, children, text } a partir del XML regular que produce el generador. */
function parse(xml) {
  const root = { tag: '#root', attrs: {}, children: [] };
  const stack = [root];
  const re = /<\?[^?]*\?>|<!--[\s\S]*?-->|<\/([a-zA-Z][\w:-]*)\s*>|<([a-zA-Z][\w:-]*)((?:\s+[\w:-]+="[^"]*")*)\s*(\/?)>|([^<]+)/g;
  let m;
  while ((m = re.exec(xml))) {
    const [token, close, open, attrsRaw, selfClose, text] = m;
    if (token.startsWith('<?') || token.startsWith('<!--')) continue;
    if (close) { stack.pop(); continue; }
    if (open) {
      const attrs = {};
      for (const a of attrsRaw.matchAll(/([\w:-]+)="([^"]*)"/g)) attrs[a[1]] = a[2];
      const node = { tag: open, attrs, children: [] };
      stack[stack.length - 1].children.push(node);
      if (!selfClose) stack.push(node);
      continue;
    }
    if (text && text.trim()) stack[stack.length - 1].children.push({ tag: '#text', text });
  }
  return root;
}

function optimizar(node) {
  if (node.tag === '#text') return;
  for (const [k, v] of Object.entries(node.attrs)) {
    if (NUMERICOS.has(k)) node.attrs[k] = redondear(v);
    if ((k === 'fill-opacity' || k === 'stroke-opacity') && Number(v) === 1) delete node.attrs[k];
  }
  node.children.forEach(optimizar);
  const hijos = node.children.filter((c) => c.tag !== '#text');
  if (node.tag === 'g' && hijos.length >= 3 && hijos.every((c) => SHAPES.has(c.tag))) {
    for (const [attr, porDefecto] of Object.entries(HEREDABLES)) {
      if (attr in node.attrs) continue;
      const cuenta = new Map();
      for (const c of hijos) { const v = c.attrs[attr] ?? porDefecto; cuenta.set(v, (cuenta.get(v) || 0) + 1); }
      const [valor, n] = [...cuenta.entries()].sort((a, b) => b[1] - a[1])[0];
      if (valor === porDefecto || n * 2 <= hijos.length) continue;
      node.attrs[attr] = valor;
      for (const c of hijos) {
        const propio = c.attrs[attr] ?? porDefecto;
        if (propio === valor) delete c.attrs[attr];
        else c.attrs[attr] = propio;
      }
    }
  }
}

function serializar(node) {
  if (node.tag === '#text') return node.text.trim();
  if (node.tag === '#root') return node.children.map(serializar).join('');
  const attrs = Object.entries(node.attrs).map(([k, v]) => ` ${k}="${v}"`).join('');
  if (!node.children.length) return `<${node.tag}${attrs}/>`;
  return `<${node.tag}${attrs}>${node.children.map(serializar).join('')}</${node.tag}>`;
}

export function optimizarSvg(xml) {
  const tree = parse(xml);
  optimizar(tree);
  return serializar(tree) + '\n';
}

const args = process.argv.slice(2);
const check = args.includes('--check');
for (const file of args.filter((a) => !a.startsWith('--'))) {
  const antes = readFileSync(file, 'utf8');
  const despues = optimizarSvg(antes);
  console.log(`${file}: ${antes.length} → ${despues.length} bytes (${Math.round((1 - despues.length / antes.length) * 100)}% menos)`);
  if (!check) writeFileSync(file, despues);
}
