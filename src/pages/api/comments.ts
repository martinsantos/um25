import type { APIRoute } from 'astro';
import { addComment, getCommentsByPostSlug } from '../../data/comments';
import { parsePublicCommentInput } from '../../utils/commentValidation';

export const GET: APIRoute = async ({ request }) => {
    const url = new URL(request.url);
    const postSlug = url.searchParams.get('postSlug');

    if (!postSlug) {
        return new Response(JSON.stringify({ error: 'Post slug is required' }), {
            status: 400,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }

    try {
        const comments = await getCommentsByPostSlug(postSlug);
        return new Response(JSON.stringify(comments), {
            status: 200,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Failed to fetch comments' }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }
};

export const POST: APIRoute = async ({ request }) => {
    try {
        let body: Record<string, unknown>;
        try {
            body = await request.json();
        } catch {
            return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
                status: 400,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        }

        const parsed = parsePublicCommentInput(body);

        if (!parsed.ok) {
            return new Response(JSON.stringify({ error: parsed.error }), {
                status: 400,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        }

        const comment = await addComment(parsed.value);

        return new Response(JSON.stringify(comment), {
            status: 201,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Failed to add comment' }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }
};
