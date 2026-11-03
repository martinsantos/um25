const { protectPublicCase, protectSnapshotCase, PROTECTED_CASE_TITLE, PROTECTED_CASE_SLUG } = require('../src/utils/publicCasePrivacy');
const {
  antecedenteTitle, antecedenteDescription, antecedenteUrl, cliRecordMatchesQuery,
  filterPublicCliAntecedentes,
} = require('../src/utils/cliDirectus');
const { getTopClienteNames, getTopClienteRecords } = require('../src/utils/verifiedProof');
const snapshot = require('../src/data/snapshots/antecedentes.json');
const confidential = require('../src/data/propuesta/confidential-snapshot-ids.json');

describe('privacidad del catálogo público', () => {
  const input = {
    id: 3568,
    Cliente: 'Cliente Confidencial',
    Titulo: 'Sirenas de Empresa Ejemplo',
    Descripcion: 'Proyecto para Empresa Ejemplo',
    client: 'Empresa Ejemplo',
    slug: '3568/sirenas-de-empresa-ejemplo',
  };

  test('oculta textos y enlaces antiguos en listado, detalle y CLI', () => {
    const protectedItem = protectPublicCase(input);
    expect(protectedItem.Titulo).toBe(PROTECTED_CASE_TITLE);
    expect(protectedItem.Descripcion).toBe(PROTECTED_CASE_TITLE + '.');
    expect(JSON.stringify(protectedItem)).not.toContain('Empresa Ejemplo');
    expect(antecedenteTitle(input)).toBe(PROTECTED_CASE_TITLE);
    expect(antecedenteDescription(input)).toBe(PROTECTED_CASE_TITLE + '.');
    expect(antecedenteUrl(input)).toContain('/3568/' + PROTECTED_CASE_SLUG);
    expect(cliRecordMatchesQuery(input, 'Empresa Ejemplo')).toBe(false);
    expect(filterPublicCliAntecedentes([input], 'Empresa Ejemplo')).toEqual([]);
    expect(filterPublicCliAntecedentes([input], 'sirenas')).toEqual([protectedItem]);
  });

  test('protege consultas parciales, sin modificar otros registros ni cambios explícitos del cliente', () => {
    expect(protectPublicCase({ id: 3568, Titulo: 'Texto anterior' }).Titulo).toBe(PROTECTED_CASE_TITLE);
    expect(protectPublicCase({ id: 1234, Titulo: 'Otro caso' }).Titulo).toBe('Otro caso');
    const named = { ...input, Cliente: 'Cliente ya público' };
    expect(protectPublicCase(named)).toBe(named);
  });

  test('protege direcciones e instalaciones en otras fichas confidenciales', () => {
    const namedFacility = { id: 3632, Cliente: 'Cliente Confidencial', Titulo: 'Hospital Ejemplo', Descripcion: 'Instalación en Hospital Ejemplo', slug: 'hospital-ejemplo' };
    const safe = protectPublicCase(namedFacility);
    expect(safe.Titulo).toBe('Vinculación con helipuerto');
    expect(JSON.stringify(safe)).not.toContain('Ejemplo');
    expect(filterPublicCliAntecedentes([namedFacility], 'Hospital Ejemplo')).toEqual([]);
    expect(filterPublicCliAntecedentes([namedFacility], 'helipuerto')).toEqual([safe]);
  });

  test('ante un título confidencial y un cliente nombrado aplica el criterio restrictivo', () => {
    const conflicted = { id: 3532, Cliente: 'Institución Ejemplo', Titulo: 'Cliente Confidencial', Descripcion: 'Obra para Institución Ejemplo' };
    const safe = protectPublicCase(conflicted);
    expect(safe.Cliente).toBe('Cliente Confidencial');
    expect(safe.Titulo).toBe('Sistema de corrientes débiles para ampliación hospitalaria');
    expect(JSON.stringify(safe)).not.toContain('Institución Ejemplo');
  });

  test('el respaldo conserva como confidenciales las fichas verificadas', () => {
    const byId = new Map(snapshot.data.map((item) => [Number(item.id), item]));
    expect(confidential.ids).toHaveLength(128);
    for (const id of confidential.ids) {
      expect(byId.get(id)?.Cliente).toBe('Cliente Confidencial');
    }
    expect(byId.get(3568).Titulo).toBe(PROTECTED_CASE_TITLE);
    expect(byId.get(3568).Descripcion).toBe(PROTECTED_CASE_TITLE + '.');
  });

  test('regenerar el respaldo con permisos amplios conserva la revisión confidencial', () => {
    const reviewed = { id: 5000, Cliente: 'Cliente Confidencial', Titulo: 'Trabajo técnico', Descripcion: 'Trabajo técnico.' };
    const incoming = { ...reviewed, Cliente: 'Empresa Ejemplo', Titulo: 'Trabajo para Empresa Ejemplo' };
    const protectedItem = protectSnapshotCase(incoming, new Map([[5000, reviewed]]), new Set([5000]));
    expect(protectedItem).toEqual(reviewed);
    expect(() => protectSnapshotCase(incoming, new Map(), new Set([5000]))).toThrow();
  });

  test('los rótulos confidenciales no se presentan como nombres de clientes destacados', () => {
    expect(getTopClienteNames(518).some((name) => /confidencial|reservad[oa]/i.test(name))).toBe(false);
    expect(getTopClienteRecords(518).some(({ name }) => /confidencial|reservad[oa]/i.test(name))).toBe(false);
  });
});
