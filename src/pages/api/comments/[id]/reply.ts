import type { APIRoute } from 'astro';
import { addReply } from '../../../../data/comments';
import { parsePublicCommentInput } from '../../../../utils/commentValidation';

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

        const reply = await addReply(commentId, parsed.value);

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
