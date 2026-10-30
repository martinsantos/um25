#!/usr/bin/env node
/**
 * Optimiza las isometrías de /cine/iso sin cambiar lo que se ve ni los ganchos que usan
 * el CSS y el JS (clases sp-*, atributos data-project-*, ids de título y descripción).
 *
 * - Los atributos de presentación repetidos en todos los hijos de un grupo suben al grupo.
 * - Los valores por defecto (fill-opacity="1", stroke-opacity="1") se quitan.
 * - Las coordenadas se redondean a una decimal (la caja es de 1200 unidades; en pantalla
 *   el dibujo nunca supera esa medida, así que el redondeo queda por debajo del píxel).
 * - Los atributos que llevan casi todas las figuras (vector-effect, stroke-linejoin,
 *   stroke-linecap) pasan a una regla <style> del propio SVG, bajo la clase de su raíz; las
 *   pocas figuras que no lo tenían reciben el valor por defecto de forma explícita.
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
// Atributos que, cuando los lleva casi toda figura, pasan a una regla <style> del SVG.
const A_ESTILO = Object.fromEntries(Object.entries({ 'vector-effect': 'none', 'stroke-linejoin': 'miter', 'stroke-linecap': 'butt' }).filter(([k]) => !process.env.ISO_ESTILO || process.env.ISO_ESTILO.split(',').includes(k)));
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

function optimizar(node, heredados = new Set()) {
  if (node.tag === '#text') return;
  for (const [k, v] of Object.entries(node.attrs)) {
    if (NUMERICOS.has(k)) node.attrs[k] = redondear(v);
    // Un valor por defecto explícito sólo sobra si ningún ancestro declara ese atributo.
    if ((k === 'fill-opacity' || k === 'stroke-opacity') && Number(v) === 1 && !heredados.has(k)) delete node.attrs[k];
  }
  const propios = new Set(heredados);
  if (node.tag === 'g') for (const k of Object.keys(node.attrs)) if (k in HEREDABLES) propios.add(k);
  node.children.forEach((c) => optimizar(c, propios));
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

const figuras = (node, out = []) => { if (SHAPES.has(node.tag)) out.push(node); node.children?.forEach((c) => figuras(c, out)); return out; };
const grupos = (node, out = []) => { if (node.tag === 'g') out.push(node); node.children?.forEach((c) => grupos(c, out)); return out; };

/** Los atributos que llevan ≥ 70 % de las figuras pasan a una regla <style>; el resto los declara explícitos. */
function aEstilo(svg) {
  const clase = (svg.attrs.class || '').split(/\s+/)[0];
  if (!clase) return;
  const todas = figuras(svg);
  const reglas = [];
  for (const [attr, porDefecto] of Object.entries(A_ESTILO)) {
    const cuenta = new Map();
    // El valor efectivo de cada figura: el propio, o el del grupo más cercano que lo declare, o el default.
    const efectivo = (fig, cadena) => fig.attrs[attr] ?? [...cadena].reverse().find((g) => attr in g.attrs)?.attrs[attr] ?? porDefecto;
    const recorrer = (node, cadena, visitar) => { node.children?.forEach((c) => { if (SHAPES.has(c.tag)) visitar(c, cadena); else if (c.tag === 'g') recorrer(c, [...cadena, c], visitar); }); };
    recorrer(svg, [], (fig, cadena) => { const v = efectivo(fig, cadena); cuenta.set(v, (cuenta.get(v) || 0) + 1); });
    const [valor, n] = [...cuenta.entries()].sort((a, b) => b[1] - a[1])[0] || [];
    if (!valor || valor === porDefecto || n < todas.length * 0.7) continue;
    recorrer(svg, [], (fig, cadena) => {
      const v = efectivo(fig, cadena);
      delete fig.attrs[attr];
      // Una regla CSS pesa más que un atributo de presentación: la minoría lo declara en style="".
      if (v !== valor) fig.attrs.style = `${fig.attrs.style ? fig.attrs.style.replace(/;?$/, ';') : ''}${attr}:${v}`;
    });
    for (const g of grupos(svg)) delete g.attrs[attr];
    reglas.push(`.${clase} :is(${[...SHAPES].join(',')}){${attr}:${valor}}`);
  }
  if (!reglas.length) return;
  const style = { tag: 'style', attrs: {}, children: [{ tag: '#text', text: reglas.join('') }] };
  const i = svg.children.findIndex((c) => c.tag !== 'title' && c.tag !== 'desc');
  svg.children.splice(Math.max(0, i), 0, style);
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
  const svg = tree.children.find((c) => c.tag === 'svg');
  if (svg && !svg.children.some((c) => c.tag === 'style')) aEstilo(svg);
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
