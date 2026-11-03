import { CASOS_DESTACADOS } from '../src/data/propuesta/casos-destacados';
import { antecedentesReales } from '../src/data/antecedentes_completos.js';
import snapshot from '../src/data/snapshots/antecedentes.json';
import type { Parte } from '../src/components/proto/despiece';

const byCase = new Map(CASOS_DESTACADOS.map((item) => [item.id, item]));
const byOrigin = new Map(antecedentesReales.map((item) => [item.id, item]));
const caseFor = (id: number) => {
  const item = byCase.get(id);
  if (!item) throw new Error(`Caso curado ${id} ausente`);
  return item;
};
const sourceFor = (id: number) => {
  const item = byOrigin.get(id);
  if (!item) throw new Error(`Fuente completa ${id} ausente`);
  return `${item.Titulo || ''} ${item.Descripcion || ''}`;
};
const part = (id: number, label: RegExp): Parte => {
  const item = caseFor(id).parts.find((candidate) => label.test(candidate.label));
  if (!item) throw new Error(`Parte ${label} ausente en ${id}`);
  return item;
};

describe('parts curados con cantidades respaldadas', () => {
  test('3126 limita el despiece a las tres familias y cantidades que enumera la fuente', () => {
    const source = sourceFor(11146);
    expect(source).toMatch(/Notifier NFS-320-SP - Cantidad 3 unidades/);
    expect(source).toMatch(/NC-NCM-SF - Cantidad 3 unidades/);
    expect(source).toMatch(/FSP-951 base B501 - Cantidad 3 unidades/);

    const parts = caseFor(3126).parts;
    expect(parts.map(({ key }) => key).sort()).toEqual(['central', 'detector', 'modulo']);
    expect(parts.map(({ qty }) => qty)).toEqual([3, 3, 3]);
    expect(parts.some(({ label }) => /pulsador|sirena|m[oó]dulos de supervisi[oó]n|mantenimiento/i.test(label))).toBe(false);
  });

  test('3144 preserves separate data, telephony, rack and fiber counts without counting fiber links', () => {
    const source = sourceFor(11145);
    expect(source).toMatch(/43 cuarenta y tres puestos simple Cat\.6 LSZH para datos/);
    expect(source).toMatch(/18 dieciocho puestos simples Cat\.6 LSZH para telefon[ií]a/);
    expect(source).toMatch(/4 cuatro racks murales de 9U/);
    expect(source).toMatch(/Tendido de 4 fibras monomodo/);

    const item = caseFor(3144);
    expect(part(3144, /Puestos de datos/).qty).toBe(43);
    expect(part(3144, /Puestos de telefon[ií]a/).qty).toBe(18);
    expect(part(3144, /Racks murales/)).toMatchObject({ qty: 4, label: 'Racks murales de 9U' });
    expect(part(3144, /Fibras monomodo/).qty).toBe(4);
    expect(item.parts.some(({ label }) => /enlaces de fibra/i.test(label))).toBe(false);
  });

  test('3119 distinguishes eight boards from cabinet capacities', () => {
    expect(sourceFor(11141)).toMatch(/Armado de 8 tableros eléctricos iguales.*gabinetes IP65 de 120 bocas.*gabinetes secundarios de 10 bocas/s);
    const boards = part(3119, /^Tablero eléctrico$/);
    const principal = part(3119, /principal IP65/);
    const secondary = part(3119, /secundario/);
    expect(boards.qty).toBe(8);
    expect(principal.qty).toBeUndefined();
    expect(principal.label).toContain('120 bocas');
    expect(secondary.qty).toBeUndefined();
    expect(secondary.label).toContain('10 bocas');
    expect(caseFor(3119).evidence.find(({ value }) => value === '120')?.label).toMatch(/capacidad/);
    expect(caseFor(3119).evidence.find(({ value }) => value === '10')?.label).toMatch(/capacidad/);
  });

  test('3588 keeps the source equipment and quantities, including DVR rather than NVR', () => {
    const source = sourceFor(11154);
    for (const fact of ['1 un frente de Portero IP', '31 treinta un Estaciones de interior', '4 cuatro Switch PoE', '1 DVR de 16 canales', '13 trece cámaras analógicas']) {
      expect(source).toContain(fact);
    }
    expect(part(3588, /Frente de portero IP/).qty).toBe(1);
    expect(part(3588, /Estaciones interiores/).qty).toBe(31);
    expect(part(3588, /Cámaras analógicas/).qty).toBe(13);
    expect(part(3588, /Switches PoE/).qty).toBe(4);
    expect(part(3588, /DVR de 16 canales/)).toMatchObject({ key: 'nvr', qty: 1 });
    expect(part(3588, /^UPS$/).qty).toBeUndefined();
  });

  test('3102 distinguishes its two rack models and counts', () => {
    const source = sourceFor(11173);
    expect(source).toMatch(/1 un racks de 40U de 1000 mm 4 cuatro racks murales de 15U de 500/);
    expect(part(3102, /Rack de piso/)).toMatchObject({ qty: 1, label: 'Rack de piso · 40U · 1000 mm' });
    expect(part(3102, /Racks murales/)).toMatchObject({ qty: 4, label: 'Racks murales · 15U · 500 mm' });
    expect(part(3102, /Puestos simples/).qty).toBe(45);
    expect(part(3102, /Puestos dobles/).qty).toBe(25);
  });

  test('3099 does not present AP positions or fiber strands as installed unit counts', () => {
    const source = sourceFor(11176);
    expect(source).toMatch(/16 puestos de datos categoría 6 6 estándar 10 para AP/);
    expect(source).toMatch(/fibra óptica monomodo de 12 hilos entre racks/);
    expect(part(3099, /Puestos de datos/).qty).toBe(16);
    expect(caseFor(3099).parts.some(({ key }) => key === 'ap')).toBe(false);
    expect(part(3099, /12 hilos/).qty).toBeUndefined();
    expect(part(3099, /Rack mural de 12U/).qty).toBeUndefined();
  });

  test('3085 keeps the rack count open and describes electrical boards as named in the public record', () => {
    expect(sourceFor(11179)).toMatch(/56 cincuenta y seis puestos simples.*29 veintinueve puestos dobles/s);
    expect(sourceFor(11179)).toMatch(/2 cuatro racks murales de 15U/);
    expect(sourceFor(11179)).not.toMatch(/tableros eléctricos/i);
    expect(part(3085, /Racks murales/).qty).toBeUndefined();
    expect(snapshot.data.find(item => item.id === 3085)?.Titulo).toMatch(/tableros/i);
    expect(part(3085, /^Tableros eléctricos$/).qty).toBeUndefined();
    expect(caseFor(3085).scope).toContain('Tableros eléctricos.');
    expect(caseFor(3085).scope.join(' ')).not.toMatch(/instalaci[oó]n de tableros/i);
    expect(caseFor(3085).introduction).not.toMatch(/se instalaron|se instaló|instalación de tableros/i);
  });

  test('3640 keeps both 150 m cable runs as labels, not quantity 150', () => {
    const source = sourceFor(10927);
    expect(source).toMatch(/colocación de 5 cámaras/);
    expect(source).toMatch(/150mts de utp cat 6 interior/);
    expect(part(3640, /Cámaras de seguridad/).qty).toBe(5);
    const runs = caseFor(3640).parts.filter(({ label }) => /150 m UTP Cat\. 6 interior/.test(label));
    expect(runs).toHaveLength(2);
    expect(runs.map(({ qty }) => qty)).toEqual([undefined, undefined]);
  });

  test('3103, 3104, 3140 and 3116 do not invent equipment quantities', () => {
    expect(sourceFor(11174)).toMatch(/33 treinta y tres puestos simples.*1 un rack mural de 15U/s);
    expect(part(3103, /Puestos simples/).qty).toBe(33);
    expect(part(3103, /Rack mural de 15U/).qty).toBe(1);
    expect(sourceFor(11158)).toMatch(/un Sistema de Video C[aá]maras de Seguridad/);
    expect(sourceFor(11162)).toMatch(/Cableado de datos y provisión y configuración de Access Point/);
    for (const id of [3104, 3140, 3116]) {
      expect(caseFor(id).parts.every(({ qty }) => qty === undefined)).toBe(true);
    }
  });

  test('all twelve curated cases have a non-empty explicit equipment list', () => {
    expect(CASOS_DESTACADOS).toHaveLength(12);
    expect(CASOS_DESTACADOS.every(({ parts }) => parts.length > 0)).toBe(true);
  });
});
