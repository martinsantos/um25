import type { APIRoute } from 'astro';
import { addReply } from '../../../../data/comments';

export const POST: APIRoute = async ({ request, params }) => {
    try {
        const commentId = params.id;
        if (!commentId) {
            return new Response(JSON.stringify({ error: 'Comment ID is required' }), {
                status: 400,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        }

        const body = await request.json();
        
        // Validación básica
        if (!body.author || !body.email || !body.content || !body.postSlug) {
            return new Response(JSON.stringify({ error: 'Missing required fields' }), {
                status: 400,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        }

        const reply = await addReply(commentId, {
            author: body.author,
            email: body.email,
            content: body.content,
            postSlug: body.postSlug
        });

        if (!reply) {
            return new Response(JSON.stringify({ error: 'Parent comment not found' }), {
                status: 404,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        }

        return new Response(JSON.stringify(reply), {
            status: 201,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Failed to add reply' }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }
};
