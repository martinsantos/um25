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

  test('production smoke test accepts deployed local service visuals', () => {
    const workflow = fs.readFileSync(path.join(process.cwd(), '.github/workflows/production-deploy.yml'), 'utf8');

    expect(workflow).toContain('LOCAL_IMGS=');
    expect(workflow).toContain('src="/images/services/[^"]*"');
    expect(workflow).toContain('TOTAL_IMGS=$((DIRECTUS_IMGS + LOCAL_IMGS))');
  });

  test('contact API resolves SMTP settings from runtime-safe environment sources', () => {
    const source = fs.readFileSync(path.join(process.cwd(), 'src/pages/api/contact.ts'), 'utf8');

    expect(source).toContain('process.env[name]');
    expect(source).toContain("envValue('SMTP_HOST')");
    expect(source).toContain("envValue('SMTP_PORT')");
    expect(source).toContain("envValue('SMTP_USER')");
    expect(source).toContain("envValue('SMTP_PASS')");
  });

  test('production restart passes SMTP secrets to PM2 contact form runtime', () => {
    const workflow = fs.readFileSync(path.join(process.cwd(), '.github/workflows/production-deploy.yml'), 'utf8');

    expect(workflow).toContain('SMTP_HOST: ${{ secrets.SMTP_HOST }}');
    expect(workflow).toContain('SMTP_PORT: ${{ secrets.SMTP_PORT }}');
    expect(workflow).toContain('SMTP_USER: ${{ secrets.SMTP_USER }}');
    expect(workflow).toContain('SMTP_PASS: ${{ secrets.SMTP_PASS }}');
    expect(workflow).toContain("export SMTP_HOST='${{ secrets.SMTP_HOST }}'");
    expect(workflow).toContain("export SMTP_PORT='${{ secrets.SMTP_PORT }}'");
    expect(workflow).toContain("export SMTP_USER='${{ secrets.SMTP_USER }}'");
    expect(workflow).toContain("export SMTP_PASS='${{ secrets.SMTP_PASS }}'");
    expect(workflow).toContain('pm2 startOrRestart ecosystem.config.cjs --only astro-ultimamilla --update-env');
  });
});
