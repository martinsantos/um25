import { shellLocale, shellRoutes, shellSectorCopy, shellServiceCopy } from '../src/config/i18nShell';

describe('English shell locale', () => {
  it('keeps English primary destinations on English routes and falls back to Spanish for unavailable pages', () => {
    expect(shellRoutes('en')).toMatchObject({ home: '/en/', services: '/en/services', contact: '/en/contacto' });
    expect(shellRoutes('en').sectors).toBe('/sectores');
    expect(shellLocale('/en/').alternate).toBe('/');
    expect(shellLocale('/en/services').alternate).toBe('/servicios');
    expect(shellLocale('/en/').t.destinationLabel('Industries')).toBe('Industries (ES)');
    expect(shellLocale('/').t.destinationLabel('Sectores')).toBe('Sectores');
  });

  it('translates mega-menu service and sector labels while preserving Spanish shell copy', () => {
    expect(shellServiceCopy('en', '101', 'Redes', 'texto')).toEqual({
      name: 'Networks', text: 'Certified structured cabling and fiber optics.',
    });
    expect(shellSectorCopy('en', 'aeropuertos', 'Aeropuertos', 'texto')).toEqual({
      name: 'Airports', text: '24/7 perimeter CCTV',
    });
    expect(shellServiceCopy('es', '101', 'Redes', 'Cableado')).toEqual({ name: 'Redes', text: 'Cableado' });
    expect(shellSectorCopy('es', 'aeropuertos', 'Aeropuertos', 'CCTV')).toEqual({ name: 'Aeropuertos', text: 'CCTV' });
  });
});
