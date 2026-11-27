import type { Story } from '../src/components/proto/isoData';
import { journeyContext } from '../src/data/propuesta/recorrido';
import { caseJourney, contactPanelReturn } from '../src/lib/caseJourney';

jest.mock('../src/components/proto/isoData', () => ({}));

describe('returning from a contextual enquiry', () => {
  test('lands on the selected prestation, respecting its published alias', () => {
    const params = new URLSearchParams({
      desde: 'prestacion',
      sistema: '108',
      grupo: 'Distribución y puesta a tierra',
    });
    const target = contactPanelReturn('/servicios/108', params);
    const destination = new URL(target!.href, 'https://example.invalid');
    expect(destination.searchParams.get('prestacion')).toBe('Distribución y puesta a tierra');
    expect(destination.hash).toBe('#tableros-de-informatica');
  });

  test('uses the published section for a service group without a curated destination', () => {
    const params = new URLSearchParams({ desde: 'prestacion', sistema: '108', grupo: 'Otro alcance' });
    expect(contactPanelReturn('/servicios/108', params)?.href).toBe(
      '/servicios/108?prestacion=Otro+alcance#provision',
    );
  });

  test('lands at the selected industry task or at the systems section when the task is unavailable', () => {
    const params = new URLSearchParams({ desde: 'sistema', sector: 'industria', sistema: '103' });
    expect(contactPanelReturn('/sectores/industria', params)?.href).toBe(
      '/sectores/industria?sistema=103#enlace-de-planta',
    );
    params.set('sistema', '106');
    expect(contactPanelReturn('/sectores/industria', params)?.href).toBe(
      '/sectores/industria?sistema=106#integracion',
    );
  });
});

describe('returning to a technical sector from an actual project', () => {
  const accessCase: Story = {
    id: 3104, slug: 'control-de-acceso', href: '/antecedentes/3104/control-de-acceso',
    client: 'Aeropuertos Argentina 2000', title: 'Control de acceso para pañol y taller',
    year: 2024, month: 1, sector: 'Aeropuertos', sectorSlug: 'aeropuertos',
    serviceCodes: ['102'], services: ['Seguridad electrónica'], image: '',
    summary: 'Instalación de control de acceso para el pañol y el taller.', status: 'published',
  };

  test('returns to the gallery or the provision section and retains the contact context', () => {
    const origin = new URLSearchParams({
      desde: 'sector', sector: 'seguridad-electronica', sistema: '102', via: 'obras',
    });
    const result = caseJourney(accessCase, origin, [accessCase]);
    expect(result?.href).toBe('/seguridad-electronica#casos-sector');
    expect(result?.contact.get('via')).toBe('obras');
    expect(journeyContext(result!.contact)?.subject).toBe('Seguridad electrónica');

    origin.delete('via');
    expect(caseJourney(accessCase, origin, [accessCase])?.href).toBe('/seguridad-electronica#provision');
    expect(caseJourney({ ...accessCase, serviceCodes: ['101'] }, origin, [])).toBeUndefined();
  });
});
