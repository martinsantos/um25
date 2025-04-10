export interface BlogPost {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    image: string;
    category: string;
    categories?: string[];
    date: string;
    author: string;
    authorRole: string;
    authorImage: string;
    tags: string[];
    readTime: number;
}

export interface BlogCategory {
    name: string;
    slug: string;
    count: number;
}

export interface BlogSearchResult {
    posts: BlogPost[];
    totalResults: number;
    currentPage: number;
    totalPages: number;
}

export interface BlogFilters {
    category?: string;
    tag?: string;
    searchQuery?: string;
    page?: number;
    limit?: number;
} 