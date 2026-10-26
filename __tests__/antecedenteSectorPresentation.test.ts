import {
  ANTECEDENTE_SECTOR_LABELS,
  getAntecedenteSectorLabel,
} from '../src/utils/antecedenteSectorPresentation';

describe('antecedente sector presentation', () => {
  it('uses one public label for each canonical sector slug', () => {
    expect(Object.keys(ANTECEDENTE_SECTOR_LABELS)).toEqual([
      'aeropuertos',
      'bodegas',
      'constructoras',
      'gobierno',
      'industria',
      'mineria',
      'salud',
      'seguridad-electronica',
      'software',
    ]);
    expect(getAntecedenteSectorLabel('seguridad-electronica')).toBe('Seguridad electrónica');
  });

  it('does not infer a sector from a raw Area value or an unknown slug', () => {
    expect(getAntecedenteSectorLabel('Aeropuertos & Telecomunicaciones')).toBeNull();
    expect(getAntecedenteSectorLabel('unknown-sector')).toBeNull();
    expect(getAntecedenteSectorLabel(undefined)).toBeNull();
  });
});
