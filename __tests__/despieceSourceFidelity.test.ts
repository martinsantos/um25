import { despieceDe } from '../src/components/proto/despiece';

describe('equipment labels follow the recorded scope', () => {
  test.each([['DVR', 'Grabador DVR'], ['NVR', 'Grabador NVR'], ['VMS', 'Gestión de video (VMS)']])('preserves %s rather than relabeling it as another technology', (source, label) => {
    const part = despieceDe('CCTV', `1 ${source} de 16 canales`, ['102']).partes.find(p => p.key === 'nvr');
    expect(part).toMatchObject({ label, qty: 1 });
  });
  test('boilerplate does not add consulting to an AP installation', () => {
    const result = despieceDe('Provisión de AP', 'Solución implementada por el equipo de ingeniería de Última Milla.', ['101']);
    expect(result.partes.some(p => p.key === 'ap')).toBe(true);
    expect(result.partes.some(p => p.code === '106')).toBe(false);
  });
  test('an explicit engineering scope remains visible', () => {
    expect(despieceDe('Ingeniería de red', 'Proyecto ejecutivo y relevamiento.', ['106']).partes.some(p => p.code === '106')).toBe(true);
  });
  test('a generic SDI does not claim that every service-kit component was installed', () => {
    expect(despieceDe('SDI', '', ['107']).origen).toBe('servicio');
    const recorded = despieceDe('Sistema de detección de incendios', '3 centrales de incendio', ['107']);
    expect(recorded.origen).toBe('registro');
    expect(recorded.partes).toEqual([{ key: 'central', code: '107', label: 'Central de detección', qty: 3 }]);
  });
  test.each([['Portero IP', 'Portero IP'], ['Intercomunicador', 'Intercomunicador'], ['Teléfono', 'Teléfono'], ['Teléfono IP', 'Teléfono IP']])('does not change the technology of %s', (source, label) => {
    expect(despieceDe(source, '', ['103']).partes.find(p => p.key === 'telefono')?.label).toBe(label);
  });
});
