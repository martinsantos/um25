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
    expect(flowForService('105')).toBe('soporte');
    expect(flowForService('106')).toBe('ingenieria');
    expect(flowForCase({ id: 1234, title: 'Archivo', summary: '', serviceCodes: [] }, scope)).toBe('registro');
  });
});
