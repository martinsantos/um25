interface BlogPosting {
    '@context': string;
    '@type': string;
    headline: string;
    description: string;
    image: string;
    datePublished: string;
    dateModified: string;
    author: {
        '@type': string;
        name: string;
        url: string;
    };
    publisher: {
        '@type': string;
        name: string;
        logo: {
            '@type': string;
            url: string;
        };
    };
    mainEntityOfPage: {
        '@type': string;
        '@id': string;
    };
}

export function generateBlogPostSchema(post: any, url: URL): BlogPosting {
    return {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: post.title,
        description: post.description || post.excerpt,
        image: new URL(post.image, url.origin).toString(),
        datePublished: post.publishDate,
        dateModified: post.updateDate || post.publishDate,
        author: {
            '@type': 'Person',
            name: post.author || 'Última Milla',
            url: url.origin
        },
        publisher: {
            '@type': 'Organization',
            name: 'Última Milla',
            logo: {
                '@type': 'ImageObject',
                url: new URL('/images/logo.png', url.origin).toString()
            }
        },
        mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': url.toString()
        }
    };
}

export function generateBreadcrumbSchema(items: Array<{name: string, url: string}>) {
    return {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: items.map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: item.name,
            item: item.url
        }))
    };
}

export function generateWebSiteSchema(url: URL) {
    return {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'Última Milla',
        url: url.origin,
        potentialAction: {
            '@type': 'SearchAction',
            target: `${url.origin}/blog?search={search_term_string}`,
            'query-input': 'required name=search_term_string'
        }
    };
}
