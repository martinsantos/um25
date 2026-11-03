const fs = require('node:fs');
const path = require('node:path');
const snapshot = require('../src/data/snapshots/antecedentes.json');
const {
  isNamedClient,
  addEvidenceBackedService,
  addEvidenceBackedSector,
  correctUnsupportedServices,
  CATALOG_SERVICE_EVIDENCE,
  CATALOG_RELATED_SERVICE_EVIDENCE,
  SECTOR_EVIDENCE,
  catalogImageLabel,
  curateCatalogImage,
} = require('../src/components/proto/catalogEditorial');
const { antecedentesReales } = require('../src/data/antecedentes_completos.js');
const sgiDates = require('../src/data/sgi/fechas.json').fechas;

const rows = new Map((snapshot.data || snapshot).map((row) => [row.id, row]));

describe('evidence-backed catalog enrichments', () => {
  test('every curated service is present verbatim in its source snapshot record', () => {
    for (const [idText, entry] of Object.entries(CATALOG_SERVICE_EVIDENCE)) {
      const source = rows.get(Number(idText));
      expect(source).toBeDefined();
      expect(addEvidenceBackedService(
        Number(idText),
        source.Titulo,
        source.Descripcion,
        [],
      )).toEqual([entry.service]);
    }
    expect(Object.keys(CATALOG_SERVICE_EVIDENCE)).toHaveLength(26);
  });

  test('related legacy service labels match the same documented record and its current snapshot wording', () => {
    const fullSource = new Map(antecedentesReales.map((row) => [row.id, row]));
    for (const [idText, entry] of Object.entries(CATALOG_RELATED_SERVICE_EVIDENCE)) {
      const id = Number(idText);
      const current = rows.get(id);
      const related = fullSource.get(entry.sourceRecordId);
      expect(current).toBeDefined();
      expect(related).toBeDefined();
      expect(`${current.Titulo} ${current.Descripcion}`.toLowerCase()).toContain(entry.evidence.toLowerCase());
      expect(`${related.Titulo} ${related.Descripcion}`.toLowerCase()).toContain(entry.sourceEvidence.toLowerCase());
      if (entry.requiresExactSgiDate) {
        expect(related.Cliente.replace(/[^a-z0-9]/gi, '').toLowerCase())
          .toBe(current.Cliente.replace(/[^a-z0-9]/gi, '').toLowerCase());
        expect(sgiDates[id].inicio).toBe(related.Fecha);
      }
      expect(addEvidenceBackedService(id, current.Titulo, current.Descripcion, [])).toEqual([entry.service]);
    }
    expect(Object.keys(CATALOG_RELATED_SERVICE_EVIDENCE)).toHaveLength(6);
  });

  test('only classifies missing sectors when the source title or description contains the mapped place evidence', () => {
    for (const [idText, entry] of Object.entries(SECTOR_EVIDENCE)) {
      const id = Number(idText);
      const source = rows.get(id);
      expect(source).toBeDefined();
      expect(`${source.Titulo} ${source.Descripcion}`).toContain(entry.evidence);
      expect(addEvidenceBackedSector(id, source.Titulo, source.Descripcion, '')).toBe(entry.sector);
    }
    expect(Object.keys(SECTOR_EVIDENCE)).toHaveLength(0);
    expect(addEvidenceBackedSector(3633, 'Alojamiento y servicios', '', '')).toBe('');
    expect(addEvidenceBackedSector(3633, 'Alojamietno y ss para Guaymallén', '', '')).toBe('');
    expect(addEvidenceBackedSector(3633, 'Alojamietno y ss para Guaymallén', 'Cliente: Municipalidad Guaymallén', 'salud')).toBe('salud');
  });

  test('does not assign a service when the source wording is absent or a code already exists', () => {
    expect(addEvidenceBackedService(3127, 'Tendido de red', '', [])).toEqual([]);
    expect(addEvidenceBackedService(3127, 'Tendido de FO', '', ['105'])).toEqual(['105']);
    expect(addEvidenceBackedService(9001, 'Escuela Eugenio Izsaky', '', [])).toEqual([]);
  });

  test('withholds unsupported service tags without altering the source record', () => {
    const phones = rows.get(3224), disks = rows.get(3334), cctv = rows.get(3221), fire = rows.get(3164);
    expect(correctUnsupportedServices(3224, phones.Cliente, phones.Titulo, ['102', '103', '107'])).toEqual(['103']);
    expect(correctUnsupportedServices(3334, disks.Cliente, disks.Titulo, ['103', '104'])).toEqual([]);
    expect(correctUnsupportedServices(3221, cctv.Cliente, cctv.Titulo, ['103', '102'])).toEqual(['102']);
    expect(correctUnsupportedServices(3164, fire.Cliente, fire.Titulo, ['103', '107'])).toEqual(['107']);
    expect(correctUnsupportedServices(3224, 'Otro cliente', phones.Titulo, ['107'])).toEqual(['107']);
    expect(correctUnsupportedServices(3334, disks.Cliente, disks.Titulo + ' y desarrollo de software', ['104'])).toEqual(['104']);
  });

  test('prefers a reviewed contextual photo for SGI 9002 and preserves the previous school image', () => {
    const image = curateCatalogImage(9002, '/images/editorial/umsa-sector-gobierno.webp');
    expect(image).toMatch(/^\/images\/photography\/[a-f0-9]+\.webp$/);
    expect(fs.existsSync(path.join(__dirname, '..', 'public', image.slice(1)))).toBe(true);
    const school = curateCatalogImage(9001, '/images/editorial/umsa-sector-gobierno.webp');
    expect(school).toBe('/images/editorial/umsa-sector-constructoras.webp');
    expect(fs.existsSync(path.join(__dirname, '..', 'public', school.slice(1)))).toBe(true);
    expect(catalogImageLabel(9001)).toMatch(/Imagen editorial/);
    expect(catalogImageLabel(9002)).toBe('Fotografía de contexto');
  });
});

test('anonymous projects remain distinct from identified-customer statistics', () => {
  expect(isNamedClient('Cliente Confidencial')).toBe(false);
  expect(isNamedClient('  CONFIDENCIAL ')).toBe(false);
  expect(isNamedClient('')).toBe(false);
  expect(isNamedClient('Aeropuertos Argentina 2000')).toBe(true);
});
