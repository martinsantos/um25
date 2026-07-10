const fs = require('fs');
const path = require('path');

describe('Production runtime configuration contracts', () => {
  test('GitHub workflows opt JavaScript actions into Node 24 before runner deprecation', () => {
    const workflowsDir = path.join(process.cwd(), '.github/workflows');
    const workflowFiles = fs.readdirSync(workflowsDir)
      .filter((file) => file.endsWith('.yml') || file.endsWith('.yaml'));

    const workflowsUsingJavascriptActions = workflowFiles
      .map((file) => ({
        file,
        source: fs.readFileSync(path.join(workflowsDir, file), 'utf8')
      }))
      .filter(({ source }) => source.includes('uses: actions/'));

    expect(workflowsUsingJavascriptActions.length).toBeGreaterThan(0);
    for (const { file, source } of workflowsUsingJavascriptActions) {
      expect(source).toContain('FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: true');
    }
  });

  test('GitHub workflows use official actions releases that target Node 24', () => {
    const workflowsDir = path.join(process.cwd(), '.github/workflows');
    const allWorkflows = fs.readdirSync(workflowsDir)
      .filter((file) => file.endsWith('.yml') || file.endsWith('.yaml'))
      .map((file) => fs.readFileSync(path.join(workflowsDir, file), 'utf8'))
      .join('\n');

    expect(allWorkflows).not.toContain('actions/checkout@v4');
    expect(allWorkflows).not.toContain('actions/setup-node@v4');
    expect(allWorkflows).not.toContain('actions/upload-artifact@v4');
    expect(allWorkflows).not.toContain('actions/download-artifact@v4');
    expect(allWorkflows).not.toContain('actions/github-script@v7');
    expect(allWorkflows).toContain('actions/checkout@v6');
    expect(allWorkflows).toContain('actions/setup-node@v6');
    expect(allWorkflows).toContain('actions/upload-artifact@v7');
    expect(allWorkflows).toContain('actions/download-artifact@v8');
    expect(allWorkflows).toContain('actions/github-script@v8');
  });

  test('GitHub workflows use a Node 24-compatible SSH agent action', () => {
    const workflowsDir = path.join(process.cwd(), '.github/workflows');
    const allWorkflows = fs.readdirSync(workflowsDir)
      .filter((file) => file.endsWith('.yml') || file.endsWith('.yaml'))
      .map((file) => fs.readFileSync(path.join(workflowsDir, file), 'utf8'))
      .join('\n');

    expect(allWorkflows).not.toContain('webfactory/ssh-agent@v0.9.0');
    expect(allWorkflows).not.toContain('webfactory/ssh-agent@v0.9.1');
    expect(allWorkflows).toContain('webfactory/ssh-agent@v0.10.0');
  });

  test('Directus token resolution prefers PM2 runtime env over build-time public tokens', () => {
    const source = fs.readFileSync(path.join(process.cwd(), 'src/config/runtime.ts'), 'utf8');
    const fn = source.match(/export function getDirectusToken\(\): string \{([\s\S]*?)\n\}/)?.[1] || '';

    expect(fn).toContain("processEnv('DIRECTUS_ADMIN_TOKEN')");
    expect(fn.indexOf("processEnv('DIRECTUS_STATIC_TOKEN')")).toBeLessThan(fn.indexOf("import.meta.env?.['DIRECTUS_STATIC_TOKEN']"));
    expect(fn.indexOf("processEnv('PUBLIC_DIRECTUS_TOKEN')")).toBeLessThan(fn.indexOf("import.meta.env?.['PUBLIC_DIRECTUS_TOKEN']"));
    expect(fn.indexOf("processEnv('DIRECTUS_ADMIN_TOKEN')")).toBeLessThan(fn.indexOf("import.meta.env?.['DIRECTUS_ADMIN_TOKEN']"));
  });

  test('blog mocks can be enabled explicitly for local visual review', () => {
    const source = fs.readFileSync(path.join(process.cwd(), 'src/config/runtime.ts'), 'utf8');
    const fn = source.match(/export function allowMockBlogFallback\(\): boolean \{([\s\S]*?)\n\}/)?.[1] || '';

    expect(fn).toContain("processEnv('UMSA_BLOG_MOCKS')");
    expect(fn).toContain("import.meta.env?.DEV && !isLocalProdReplica()");
  });

  test('production smoke test validates current theme content and Directus-backed collections', () => {
    const workflow = fs.readFileSync(path.join(process.cwd(), '.github/workflows/production-deploy.yml'), 'utf8');

    expect(workflow).toContain('HOMEPAGE=$(curl -sL https://www.ultimamilla.com.ar)');
    expect(workflow).toContain('BLOG=$(curl -sL https://www.ultimamilla.com.ar/blog)');
    expect(workflow).toContain('ANTECEDENTES=$(curl -sL https://www.ultimamilla.com.ar/antecedentes)');
    expect(workflow).toContain('grep -Eq');
    expect(workflow).toContain('Homepage canonical points to www domain');
    expect(workflow).toContain('BLOG_LINKS=');
    expect(workflow).toContain('ANTE_LINKS=');
    expect(workflow).not.toContain('hero-image');
    expect(workflow).not.toContain('TOTAL_IMGS=$((DIRECTUS_IMGS + LOCAL_IMGS))');
  });

  test('production deploy runs SEO, GEO scoring and release contract audits against www', () => {
    const workflow = fs.readFileSync(path.join(process.cwd(), '.github/workflows/production-deploy.yml'), 'utf8');

    expect(workflow).toContain('SEO and GEO release audit');
    expect(workflow).toContain('GEO scoring release audit');
    expect(workflow).toContain('UMCLI release contract audit');
    expect(workflow).toContain('Directus integration release audit');
    expect(workflow).toContain('node scripts/seo-audit.mjs --base-url https://www.ultimamilla.com.ar');
    expect(workflow).toContain('npm run geo:score -- --base-url https://www.ultimamilla.com.ar --min-score 90 --json');
    expect(workflow).toContain('node scripts/umcli-contract-audit.mjs --base-url https://www.ultimamilla.com.ar');
    expect(workflow).toContain('node scripts/directus-release-audit.mjs --base-url https://www.ultimamilla.com.ar');
  });

  test('production health check matches the live www canonical redirect policy', () => {
    const workflow = fs.readFileSync(path.join(process.cwd(), '.github/workflows/production-deploy.yml'), 'utf8');

    expect(workflow).toContain('url: https://www.ultimamilla.com.ar');
    expect(workflow).toContain('https://ultimamilla.com.ar/');
    expect(workflow).toContain('https://www.ultimamilla.com.ar/');
    expect(workflow).toContain('Canonical health check passed: www serves 200 and apex redirects to www');
    expect(workflow).not.toContain('apex serves 200 and www redirects to apex');
  });

  test('production deploy installs a complete runtime package tree before PM2 restart', () => {
    const workflow = fs.readFileSync(path.join(process.cwd(), '.github/workflows/production-deploy.yml'), 'utf8');

    expect(workflow).not.toContain('npm ci --production');
    expect(workflow).toContain('npm install --include=dev --prefer-offline --no-audit --progress=false');
    expect(workflow).toContain('command_timeout: 20m');
    expect(workflow).toContain('npm ls @directus/sdk @sentry/astro zod piccolore astro @astrojs/node --depth=0');
    expect(workflow).toContain("import('piccolore')");
    expect(workflow).toContain("import('@directus/sdk')");
    expect(workflow).toContain("import('zod')");
    expect(workflow).toContain('runtime imports ok');
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
    expect(workflow).toContain('pm2 restart astro-ultimamilla --update-env');
  });
});
