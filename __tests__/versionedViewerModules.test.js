import fs from 'fs';
import path from 'path';

// The lazy experience imports React from its entry point. Mixing the published
// entry with a versioned experience creates two React runtimes (invalid hooks).
describe('versioned 3D module cycles', () => {
  test.each([
    ['hospital-3d', 'hospital-20261026.js', 'HospitalExperience-20261026.js', ['hospital']],
    ['sector-3d', 'SectorPublic-20261026.js', 'SectorExperience-20261026.js', ['bodega', 'aeropuerto']],
  ])('%s lazy experience shares its entry runtime', (directory, entry, experience, pages) => {
    const base = path.join(process.cwd(), 'public', directory);
    const entryCode = fs.readFileSync(path.join(base, 'assets', entry), 'utf8');
    const experienceCode = fs.readFileSync(path.join(base, 'assets', experience), 'utf8');
    expect(entryCode).toContain(`import("./${experience}")`);
    expect(experienceCode).toContain(`from"./${entry}"`);
    for (const page of pages) {
      expect(fs.readFileSync(path.join(base, '20261026', `${page}.html`), 'utf8'))
        .toContain(`src="/${directory}/assets/${entry}"`);
    }
  });
});
