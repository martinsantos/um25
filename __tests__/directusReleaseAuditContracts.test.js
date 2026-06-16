const fs = require('fs');
const path = require('path');

describe('Directus release audit contracts', () => {
  test('production Directus audit validates health, articles and CLI search endpoints', () => {
    const source = fs.readFileSync(path.join(process.cwd(), 'scripts/directus-release-audit.mjs'), 'utf8');

    expect(source).toContain('/api/monitoring/health');
    expect(source).toContain('/api/get-articles');
    expect(source).toContain('/api/cli/query-real-only');
    expect(source).toContain('/api/cli/query-directus');
    expect(source).toContain('directus_real_data_only');
    expect(source).toContain('directus_real_data');
    expect(source).toContain("QUERY_FIXTURE = 'mendoza'");
    expect(source).toContain("health.services?.directus === 'online'");
    expect(source).toContain("health.services?.astro === 'online'");
    expect(source).toContain('articles.data?.[0]?.slug');
    expect(source).toContain('articles.data?.[0]?.titulo');
    expect(source).toContain('cliDirectus.total_found');
    expect(source).toContain('isCanonicalUrl(result.url, baseUrl)');
  });
});
