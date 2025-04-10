interface FAQItem {
    question: string;
    answer: string;
}

interface HowToStep {
    name: string;
    text: string;
    image?: string;
}

export function generateFAQSchema(faqs: FAQItem[]) {
    return {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqs.map(faq => ({
            '@type': 'Question',
            name: faq.question,
            acceptedAnswer: {
                '@type': 'Answer',
                text: faq.answer
            }
        }))
    };
}

export function generateHowToSchema(title: string, description: string, steps: HowToStep[]) {
    return {
        '@context': 'https://schema.org',
        '@type': 'HowTo',
        name: title,
        description: description,
        step: steps.map((step, index) => ({
            '@type': 'HowToStep',
            position: index + 1,
            name: step.name,
            text: step.text,
            ...(step.image && {
                image: {
                    '@type': 'ImageObject',
                    url: step.image
                }
            })
        }))
    };
}

export function generateArticleSchema(post: any, url: URL) {
    return {
        '@context': 'https://schema.org',
        '@type': 'TechArticle',
        headline: post.title,
        description: post.description || post.excerpt,
        image: post.image ? new URL(post.image, url.origin).toString() : undefined,
        datePublished: post.date,
        dateModified: post.updateDate || post.date,
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
        },
        keywords: post.categories?.join(', '),
        wordCount: post.content?.split(/\s+/).length || 0,
        articleSection: post.categories?.[0] || 'Tecnología',
        inLanguage: 'es',
        technicalAudience: 'Profesionales IT, Desarrolladores, Administradores de Sistemas'
    };
}

export function generateServiceSchema(service: any, url: URL) {
    return {
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: service.title,
        description: service.description,
        provider: {
            '@type': 'Organization',
            name: 'Última Milla',
            url: url.origin,
            logo: {
                '@type': 'ImageObject',
                url: new URL('/images/logo.png', url.origin).toString()
            }
        },
        areaServed: 'Argentina',
        category: service.category || 'Servicios IT',
        ...(service.image && {
            image: {
                '@type': 'ImageObject',
                url: new URL(service.image, url.origin).toString()
            }
        })
    };
}
