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

  test('scoped production deploy reuses the verified runtime package tree', () => {
    const workflow = fs.readFileSync(path.join(process.cwd(), '.github/workflows/production-deploy.yml'), 'utf8');
    const scopedDeploy = fs.readFileSync(path.join(process.cwd(), 'scripts/ops/deploy-scoped-dist.sh'), 'utf8');

    expect(workflow).not.toContain('npm ci --production');
    expect(workflow).toContain('Install audit dependencies on runner');
    expect(workflow).toContain('run: npm ci');
    expect(workflow).not.toContain('npm install --include=dev --prefer-offline --no-audit --progress=false');
    expect(workflow).toContain('Stage build outside live site');
    expect(workflow).toContain('Restore previous runtime after failed checks');
    expect(scopedDeploy).toContain('node incoming-dist/server/entry.mjs');
    expect(scopedDeploy).toContain('ln -s "$app/node_modules" "$release/node_modules"');
    expect(scopedDeploy).toContain('mv "$current" "$previous"');
    expect(scopedDeploy).toContain('sha256sum -c "$release/protected.before.sha256"');
  });

  test('contact API resolves SMTP settings from runtime-safe environment sources', () => {
    const source = fs.readFileSync(path.join(process.cwd(), 'src/pages/api/contact.ts'), 'utf8');

    expect(source).toContain('process.env[name]');
    expect(source).toContain("envValue('SMTP_HOST')");
    expect(source).toContain("envValue('SMTP_PORT')");
    expect(source).toContain("envValue('SMTP_USER')");
    expect(source).toContain("envValue('SMTP_PASS')");
  });

  test('scoped production restart preserves existing PM2 contact credentials', () => {
    const workflow = fs.readFileSync(path.join(process.cwd(), '.github/workflows/production-deploy.yml'), 'utf8');
    const scopedDeploy = fs.readFileSync(path.join(process.cwd(), 'scripts/ops/deploy-scoped-dist.sh'), 'utf8');

    expect(scopedDeploy).toContain('pm2 restart astro-ultimamilla');
    expect(scopedDeploy).not.toContain('--update-env');
    expect(workflow).not.toContain('pm2 restart astro-ultimamilla --update-env');
    expect(workflow).not.toContain('SMTP_PASS: ${{ secrets.SMTP_PASS }}');
  });

  test('production runtime does not commit blog credentials', () => {
    const ecosystem = fs.readFileSync(path.join(process.cwd(), 'ecosystem.config.cjs'), 'utf8');

    expect(ecosystem).not.toContain('admin@umbot.com.ar');
    expect(ecosystem).not.toContain('UmbotAdmin2025!');
    expect(ecosystem).toContain("process.env[key]");
  });

  test('production deploy waits for the local Astro origin before edge checks', () => {
    const workflow = fs.readFileSync(path.join(process.cwd(), '.github/workflows/production-deploy.yml'), 'utf8');

    expect(workflow).toContain('name: Health check origin');
    expect(workflow).toContain('name: Health check edge');
    expect(workflow).toContain('uses: appleboy/ssh-action@v1.2.0');
    expect(workflow).toContain('http://127.0.0.1:4321/health');
    expect(workflow).toContain('Origin health passed on attempt');
    expect(workflow).toContain('Origin health did not recover within 60 seconds');
  });

  test('scoped production deployment leaves other PM2 processes untouched', () => {
    const workflow = fs.readFileSync(path.join(process.cwd(), '.github/workflows/production-deploy.yml'), 'utf8');
    const cleanup = fs.readFileSync(path.join(process.cwd(), 'scripts/ops/cleanup-stale-pm2-app.sh'), 'utf8');
    const legacyDeploy = fs.readFileSync(path.join(process.cwd(), 'scripts/deploy-server.sh'), 'utf8');
    const scopedDeploy = fs.readFileSync(path.join(process.cwd(), 'scripts/ops/deploy-scoped-dist.sh'), 'utf8');

    expect(workflow).not.toContain('name: Remove stale PM2 process alias');
    expect(scopedDeploy).toContain('pm2 restart astro-ultimamilla');
    expect(scopedDeploy).not.toContain('pm2 del');
    expect(cleanup).toContain('pm2 describe astro-app');
    expect(cleanup).toContain('pm2 del astro-app');
    expect(cleanup).not.toContain('pm2 del astro-ultimamilla');
    expect(legacyDeploy).toContain('Manual production deployment is disabled');
    expect(legacyDeploy).not.toContain('git pull origin main');
    expect(legacyDeploy).not.toContain('pm2 restart astro-app');
  });
});
