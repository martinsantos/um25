const fs = require('fs');
const path = require('path');

describe('Directus blog contracts', () => {
  test('UMCLI blog helper keeps Directus posts visible, canonical and newest-first', () => {
    const source = fs.readFileSync(path.join(process.cwd(), 'src/lib/directus.ts'), 'utf8');

    expect(source).toContain("import { visibleBlogStatusDirectusFilter } from '../utils/blogPublishing'");
    expect(source).toContain("import { diversifyBlogPostCovers } from '../utils/blogCoverDiversity.js'");
    expect(source).toContain("import { isCanonicalBlogSlug } from '../data/seoRedirects'");
    expect(source).toContain("filter: visibleBlogStatusDirectusFilter()");
    expect(source).toContain("sort: ['-fecha_publicacion']");
    expect(source).toContain('isCanonicalBlogSlug(post.slug)');
    expect(source).toContain('diversifyBlogPostCovers(visibleCanonicalPosts)');
    expect(source).toContain('blogSortTime(b.fecha_publicacion) - blogSortTime(a.fecha_publicacion)');
  });
});
