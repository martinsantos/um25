// src/data/blog.ts
export function getAllPosts(): BlogPost[] {
    return getAllBlogPosts();
}

export function getAllBlogPosts(): BlogPost[] {
    // implementación de la función
    return blogPosts;
}

export interface BlogPost {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    content: string;
}

export const blogPosts: BlogPost[] = [
    {
        id: "post-1",
        title: "Primer Post",
        slug: "primer-post",
        excerpt: "Este es un resumen del primer post.",
        content: "Contenido completo del primer post."
    },
    // Agrega más posts según sea necesario
];

export function getBlogPostBySlug(slug: string): BlogPost | undefined {
    const post = blogPosts.find(post => post.slug === slug);
    if (!post) {
        console.warn(`Post with slug "${slug}" not found.`);
        return undefined; // Manejo de caso donde no se encuentra el post
    }
    return post;
}

