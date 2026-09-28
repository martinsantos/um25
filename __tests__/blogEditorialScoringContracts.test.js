const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const source = (file) => fs.readFileSync(path.join(repoRoot, file), 'utf8');

describe('Blog editorial GEO scoring contracts', () => {
  test('publishes a dedicated blog editorial scoring command', () => {
    const pkg = JSON.parse(source('package.json'));

    expect(pkg.scripts['blog:score']).toBe('node scripts/blog-editorial-score.mjs');
    expect(pkg.scripts['blog:covers:diversify']).toBe('node scripts/blog-cover-diversity-backfill.mjs');
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

  test('blog cover diversity is enforced across public surfaces and publishing API', () => {
    expect(source('src/pages/api/blog.ts')).toContain('selectDiverseBlogCover');
    expect(source('src/pages/api/blog.ts')).toContain('diversifyBlogPostCovers(data.data)');
    expect(source('src/pages/api/blog/[slug].ts')).toContain('selectDiverseBlogCover');
    expect(source('src/utils/getBlogData.ts')).toContain('fetchDirectusBlogCoverCorpus');
    expect(source('src/utils/getBlogData.ts')).toContain('diversifyBlogPostCovers(contextPosts)');
    // Rediseño 2026-09: el sitemap del blog delega en fetchBlogSitemapEntries
    // (misma fuente que el blog renderizado), que diversifica portadas tanto con
    // Directus como en el fallback estático.
    const blogData = source('src/utils/getBlogData.ts');
    const sitemapEntries = blogData.slice(blogData.indexOf('export async function fetchBlogSitemapEntries'));
    expect(source('src/pages/sitemap-blog.xml.ts')).toContain('(await fetchBlogSitemapEntries()) as BlogPost[];');
    expect(sitemapEntries).toContain('if (posts.length > 0) return diversifyBlogPostCovers(posts) as BlogSitemapEntry[];');
    expect(sitemapEntries).toContain('return diversifyBlogPostCovers(UM26_FALLBACK_POSTS');
    expect(source('scripts/blog-cover-diversity-backfill.mjs')).toContain('--apply');
  });

  test('single posts preserve the editorial reading scale on desktop and mobile', () => {
    // Rediseño 2026-09: el cuerpo del artículo es .prose sobre fondo oscuro.
    // Se exige la misma escala de lectura: >= 17px en móvil, 18px en escritorio,
    // interlineado amplio y medida de línea acotada.
    const post = source('src/pages/blog/[slug].astro');
    const proseBlock = (post.match(/\n  \.prose \{([^}]*)\}/) || [])[1] || '';
    const mobileBlock = (post.match(/@media \(max-width: 680px\) \{([\s\S]*?)\n  \}/) || [])[1] || '';

    expect(proseBlock).toContain('font-size: 1.125rem;');
    expect(Number((proseBlock.match(/line-height:\s*([0-9.]+);/) || [])[1])).toBeGreaterThanOrEqual(1.6);
    expect(mobileBlock).toContain('.prose { font-size: 1.0625rem; }');
    expect(post).toMatch(/\.bp-layout \{[^}]*minmax\(0, 68ch\)/);
    expect(post).not.toContain('font-size: clamp(1.02rem, 1.08vw, 1.12rem);');
  });
});
