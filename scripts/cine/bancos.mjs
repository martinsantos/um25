#!/usr/bin/env node
/**
 * Escribe los bancos de cada servicio (las partes de su alcance publicado, a escala sobre una
 * base) como SVG independientes en public/cine/iso/banco-servicio-<código>.svg.
 * Los bancos de sectores y proyectos dependen del catálogo y se dibujan al servir la página.
 *
 * Uso: node scripts/cine/bancos.mjs
 */
import { writeFileSync } from 'node:fs';
import { bancoArchivo } from '../../src/lib/iso/banco.mjs';

// Mismo alcance que KIT_DE_SERVICIO en src/components/proto/despiece.ts.
const KITS = {
  101: ['rack', 'switch', 'fibra', 'ap', 'cableado'],
  102: ['camara', 'nvr', 'acceso', 'alarma'],
  103: ['central-ip', 'telefono', 'antena', 'parlante'],
  104: ['pantalla', 'servidor'],
  105: ['maletin', 'puesto', 'disco'],
  106: ['plano', 'pantalla'],
  107: ['central', 'detector', 'pulsador', 'sirena', 'modulo'],
  108: ['tablero', 'ups', 'bateria', 'tierra', 'generador'],
};
for (const [code, keys] of Object.entries(KITS)) {
  const svg = bancoArchivo(keys.map((key) => ({ key })), { label: `Partes del servicio ${code}` });
  writeFileSync(new URL(`../../public/cine/iso/banco-servicio-${code}.svg`, import.meta.url), svg);
  console.log(`banco-servicio-${code}.svg ${svg.length} bytes`);
}
