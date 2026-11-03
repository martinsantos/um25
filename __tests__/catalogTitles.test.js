import { desambiguarTitulos, fechaDeTitulo } from '../src/components/proto/titulos';

test('keeps a meaningful title when a duplicate summary only repeats the client and date', () => {
  const items = [
    { client: 'Cela S.A.', title: 'Mantenimiento Crítico de Sistemas de Detección', summary: 'Cela SA - Junio 2025 para Cela SA', year: 2025, month: 6 },
    { client: 'Cela S.A.', title: 'Mantenimiento Crítico de Sistemas de Detección', summary: 'Cela SA - Febrero 2025 para Cela SA', year: 2025, month: 2 },
  ];
  expect(desambiguarTitulos(items).map(item => item.title)).toEqual([
    'Mantenimiento Crítico de Sistemas de Detección · junio 2025',
    'Mantenimiento Crítico de Sistemas de Detección · febrero 2025',
  ]);
});

test('retains the month written in the source title when SGI has a different start month', () => {
  const items = [
    { client: 'Cela S.A.', title: 'Mantenimiento de detección', summary: '', year: 2025, month: 5, sourceTitleDate: fechaDeTitulo('Mantenimiento - Cela SA - Junio 2025') },
    { client: 'Cela S.A.', title: 'Mantenimiento de detección', summary: '', year: 2025, month: 1, sourceTitleDate: fechaDeTitulo('Mantenimiento - Cela SA - Febrero de 2025') },
  ];
  expect(desambiguarTitulos(items).map(item => item.title)).toEqual([
    'Mantenimiento de detección · junio 2025',
    'Mantenimiento de detección · febrero 2025',
  ]);
});
