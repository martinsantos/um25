const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const source = (file) => fs.readFileSync(path.join(repoRoot, file), 'utf8');

describe('Blog editorial GEO scoring contracts', () => {
  test('publishes a dedicated blog editorial scoring command', () => {
    const pkg = JSON.parse(source('package.json'));

    expect(pkg.scripts['blog:score']).toBe('node scripts/blog-editorial-score.mjs');
  });

  test('scores freshness, cover integrity, cover diversity, metadata and governance', () => {
    const scorer = source('scripts/blog-editorial-score.mjs');

    expect(scorer).toContain('BLOG_SCORE_WEIGHTS');
    expect(scorer).toContain('freshnessAlignment: 25');
    expect(scorer).toContain('coverIntegrity: 25');
    expect(scorer).toContain('coverDiversity: 20');
    expect(scorer).toContain('metadataStructuredData: 20');
    expect(scorer).toContain('editorialGovernance: 10');
    expect(scorer).toContain('runBlogEditorialScore');
    expect(scorer).toContain('imageDuplicateEvidence');
    expect(scorer).toContain('Top 10 posts do not repeat cover images');
    expect(scorer).toContain('UMCLI 50-post corpus');
    expect(scorer).toContain('--strict-diversity');
    expect(scorer).toContain('No external runtime dependency');
  });

  test('production deploy runs blog editorial scoring as a release gate', () => {
    const workflow = source('.github/workflows/production-deploy.yml');

    expect(workflow).toContain('Blog editorial GEO score audit');
    expect(workflow).toContain('npm run blog:score -- --base-url https://www.ultimamilla.com.ar --min-score 80 --json');
  });

  test('public GEO score UI exposes the blog editorial score', () => {
    const scorePage = source('src/pages/geo/score.astro');

    expect(scorePage).toContain("from '../../../scripts/blog-editorial-score.mjs'");
    expect(scorePage).toContain('runBlogEditorialScore');
    expect(scorePage).toContain('BLOG_SCORE_WEIGHTS');
    expect(scorePage).toContain('BLOG_SCORE_REFERENCE');
    expect(scorePage).toContain('blogScoreGate = 80');
    expect(scorePage).toContain('Blog editorial / GEO');
    expect(scorePage).toContain('Fallas editoriales del blog');
  });
});
