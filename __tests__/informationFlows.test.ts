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

describe('approved case diagrams', () => {
  it.each([3065, 3066, 3069, 3072, 3126, 3144, 3099, 3588, 3102, 3119, 3085, 3116, 3103, 3104, 3140, 3640, 3205, 3410, 3117, 3259, 3336])('uses the approved case-specific diagram for %i', (id) => {
    expect(flowForCase({ id, title: 'Trabajo registrado', summary: '', serviceCodes: [] }, scope)).toBe('caso-' + id);
  });
  it('uses service-specific flows while preserving generic case diagrams', () => {
    for (const [code, key] of [['101', 'servicio-101'], ['103', 'servicio-103'], ['102', 'cctv'], ['107', 'incendios'], ['108', 'energia']]) {
      expect(flowForService(code)).toBe(key);
    }
    expect(flowForCase({ id: 9999, title: 'Cableado', summary: '', serviceCodes: ['101'] }, scope)).toBe('redes');
    expect(flowForCase({ id: 3070, title: 'Instalación de cámaras', summary: '', serviceCodes: ['102'] }, scope)).toBe('cctv');
  });
});

describe('reviewed records with misleading diagrams', () => {
  it.each([[3151, "Servicio de conectividad para Evento Empretón"], [3153, "Provisión de Módulo de Relé"], [3596, "Insumo de informática"], [3642, "Presupuesto de trabajo en sistema de detección de incendios"], [3644, "Cotización tendido FO · aeropuerto de Mendoza"], [3646, "Cotización de cámaras y cableado"], [3651, "Presupuesto para revisión de cámaras"], [3653, "Presupuesto para trabajos en sistema de detección de incendios"], [3659, "Presupuesto por adicionales para un edificio"]])('withholds the diagram for case %i only while the reviewed title matches', (id, title) => {
    expect(flowForCase({ id, title, summary: '', serviceCodes: ['102'] }, scope)).toBeUndefined();
    expect(flowForCase({ id, title: 'Instalación de cámaras de CCTV', summary: '', serviceCodes: ['102'] }, scope)).toBe('cctv');
  });
});
