#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const productos = JSON.parse(readFileSync(join(ROOT, 'src/data/snapshots/productos.json'), 'utf8'));
const servicios = JSON.parse(readFileSync(join(ROOT, 'src/data/snapshots/servicios.json'), 'utf8'));
const hero = JSON.parse(readFileSync(join(ROOT, 'src/data/snapshots/hero.json'), 'utf8'));

const serviceNames = {101:'infraestructura',102:'seguridad',103:'telecomunicaciones',104:'software',105:'soporte',106:'consultoria',107:'incendios',108:'electricos'};
const serviceNums = {101:1,102:2,103:3,104:4,105:5,106:6,107:7,108:8};

const map = {};

// Map product UUIDs to local images
for (const p of productos.data) {
  const sId = p.servicio_id;
  const sNum = serviceNums[sId];
  const orden = (p.orden || 0) + 1;
  const uuid = typeof p.imagen === 'string' ? p.imagen : (p.imagen?.id || '');
  if (uuid && sNum) {
    map[uuid] = `/images/services/productos/${serviceNames[sId]}/${sNum}.${orden}.png`;
  }
}

// Map service main image UUIDs
for (const s of servicios.data) {
  if (s.Imagen && serviceNames[s.id]) {
    map[s.Imagen] = `/images/services/productos/${serviceNames[s.id]}/${serviceNums[s.id]}.png`;
  }
}

// Map hero UUIDs (same as service images)
for (const h of hero.data) {
  if (h.imagen && !map[h.imagen]) {
    map[h.imagen] = '/images/default-background.svg';
  }
}

const outPath = join(ROOT, 'src/data/image-local-map.json');
writeFileSync(outPath, JSON.stringify(map));
console.log(`Written ${Object.keys(map).length} mappings to src/data/image-local-map.json`);
