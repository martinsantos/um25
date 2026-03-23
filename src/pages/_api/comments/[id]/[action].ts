import type { APIRoute } from 'astro';
import { approveComment, deleteComment } from '../../../../data/comments';

export const POST: APIRoute = async ({ params }) => {
    const { id, action } = params;

    if (!id || !action) {
        return new Response(JSON.stringify({ error: 'Missing parameters' }), {
            status: 400,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }

    try {
        switch (action) {
            case 'approve':
                await approveComment(id);
                break;
            case 'delete':
                await deleteComment(id);
                break;
            default:
                return new Response(JSON.stringify({ error: 'Invalid action' }), {
                    status: 400,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
        }

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Operation failed' }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }
};
