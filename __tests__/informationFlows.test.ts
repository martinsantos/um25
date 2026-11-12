import { flowForCase, flowForService } from '../src/data/informationFlows';
import type { Despiece } from '../src/components/proto/despiece';

const scope: Despiece = { partes: [], origen: 'registro' };

describe('reviewed case information flows', () => {
  it('omits a flow for provision-only case 3300', () => {
    expect(flowForCase({ id: 3300, title: 'Provisión para telecomunicaciones', summary: '', serviceCodes: ['103'] }, scope)).toBeUndefined();
  });
  it('uses the hosting flow for case 3083 despite the maintenance wording', () => {
    expect(flowForCase({ id: 3083, title: 'Mantenimiento de hosting', summary: '', serviceCodes: ['105', '104'] }, scope)).toBe('software');
  });
  it('preserves the documented radio link flow for other cases', () => {
    expect(flowForCase({ id: 3268, title: 'Radioenlace', summary: '', serviceCodes: ['103'] }, scope)).toBe('telecom');
  });
  it('keeps service mappings and the fallback for records without a linked service', () => {
    expect(flowForService('105')).toBe('servicio-105');
    expect(flowForCase({ title: 'Mantenimiento', summary: '', serviceCodes: ['105'] }, scope)).toBe('soporte');
    expect(flowForService('106')).toBe('servicio-106');
    expect(flowForCase({ title: 'Auditoría', summary: '', serviceCodes: ['106'] }, scope)).toBe('ingenieria');
    expect(flowForCase({ id: 1234, title: 'Archivo', summary: '', serviceCodes: [] }, scope)).toBe('registro');
  });
});

describe('approved second case-media batch', () => {
  it.each([3065, 3066, 3069, 3072, 3126, 3144])('uses the approved case-specific diagram for %i', (id) => {
    expect(flowForCase({ id, title: 'Trabajo registrado', summary: '', serviceCodes: [] }, scope)).toBe('caso-' + id);
  });
  it('does not replace service diagrams or an unrelated case with the same subject', () => {
    for (const [code, key] of [['101', 'redes'], ['102', 'cctv'], ['107', 'incendios'], ['108', 'energia']]) {
      expect(flowForService(code)).toBe(key);
    }
    expect(flowForCase({ id: 3070, title: 'Instalación de cámaras', summary: '', serviceCodes: ['102'] }, scope)).toBe('cctv');
  });
});
