const fs = require('fs');
const path = require('path');

describe('Production runtime configuration contracts', () => {
  test('Directus token resolution prefers PM2 runtime env over build-time public tokens', () => {
    const source = fs.readFileSync(path.join(process.cwd(), 'src/config/runtime.ts'), 'utf8');
    const fn = source.match(/export function getDirectusToken\(\): string \{([\s\S]*?)\n\}/)?.[1] || '';

    expect(fn).toContain("processEnv('DIRECTUS_ADMIN_TOKEN')");
    expect(fn.indexOf("processEnv('DIRECTUS_STATIC_TOKEN')")).toBeLessThan(fn.indexOf('import.meta.env?.DIRECTUS_STATIC_TOKEN'));
    expect(fn.indexOf("processEnv('PUBLIC_DIRECTUS_TOKEN')")).toBeLessThan(fn.indexOf('import.meta.env?.PUBLIC_DIRECTUS_TOKEN'));
    expect(fn.indexOf("processEnv('DIRECTUS_ADMIN_TOKEN')")).toBeLessThan(fn.indexOf('import.meta.env?.DIRECTUS_ADMIN_TOKEN'));
  });

  test('production smoke test accepts White Dossier upload-backed visuals', () => {
    const workflow = fs.readFileSync(path.join(process.cwd(), '.github/workflows/production-deploy.yml'), 'utf8');

    expect(workflow).toContain('UPLOAD_IMGS=');
    expect(workflow).toContain('/uploads/(antecedentes|hero)/');
    expect(workflow).toContain('um-home-hero|um-hero-media|/uploads/hero/');
  });
});
