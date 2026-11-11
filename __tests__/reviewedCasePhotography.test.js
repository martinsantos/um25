const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const manifest = require('../src/data/photography-manifest.json');
const existing = require('../src/data/antecedentes-generated-image-map.json');
const { approvedCaseImages } = require('../src/data/approvedImageAssets');
const { casePhotograph } = require('../src/data/photography');
const { getAntecedenteThumb } = require('../src/lib/um26-data/images');
const { curateCatalogImage, catalogImageLabel } = require('../src/components/proto/catalogEditorial');

test('reviewed photographs are distinct, attributed and associated explicitly to their case', () => {
  const ids = Object.keys(manifest.cases);
  expect(ids.length).toBeGreaterThan(0);
  const selected = ids.map(id => {
    const photo = manifest.photos[manifest.cases[id]];
    expect(photo.visualReview).toBe('accepted');
    expect(photo.source).toMatch(/^https:\/\//);
    expect(photo.author).toBeTruthy();
    expect(photo.license).toBeTruthy();
    expect(manifest.assignments[id].justification).toBeTruthy();
    expect(curateCatalogImage(Number(id), '/previous.webp')).toBe(photo.src);
    expect(catalogImageLabel(Number(id))).toBe('Fotografía de contexto');
    return photo;
  });
  expect(new Set(selected.map(p => p.sha1)).size).toBe(ids.length);
  expect(new Set(selected.map(p => p.sha256)).size).toBe(ids.length);
});

test('every selected photograph and both responsive variants exist, with verified bytes', () => {
  for (const key of Object.values(manifest.cases)) {
    const photo = manifest.photos[key];
    const full = path.join(__dirname, '..', 'public', photo.src);
    for (const suffix of ['', '-480', '-960']) {
      expect(fs.existsSync(full.replace(/\.webp$/, `${suffix}.webp`))).toBe(true);
    }
    expect(crypto.createHash('sha256').update(fs.readFileSync(full)).digest('hex')).toBe(photo.webpSha256);
  }
});

test('unreviewed cases retain their previous case-specific image', () => {
  const untouched = Object.keys(existing).find(id => !manifest.cases[id] && !approvedCaseImages[Number(id)]);
  expect(untouched).toBeTruthy();
  expect(casePhotograph(untouched)).toBe('');
  expect(getAntecedenteThumb(untouched)).toBe(existing[untouched]);
  expect(curateCatalogImage(Number(untouched), existing[untouched])).toBe(existing[untouched]);
});
