import type { APIRoute } from 'astro';
import { approveComment, deleteComment } from '../../../../data/comments';
import { requestHasSecret } from '../../../../utils/serverAuth';

function getModerationSecret(): string {
    return (
        process.env.COMMENTS_ADMIN_SECRET ??
        import.meta.env.COMMENTS_ADMIN_SECRET ??
        process.env.COMMENT_MODERATION_SECRET ??
        import.meta.env.COMMENT_MODERATION_SECRET ??
        ''
    );
}

function jsonResponse(body: Record<string, unknown>, status: number): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: {
            'Content-Type': 'application/json'
        }
    });
}

export const POST: APIRoute = async ({ request, params }) => {
    const { id, action } = params;
    const moderationSecret = getModerationSecret();

    if (!moderationSecret) {
        return jsonResponse({ error: 'Comment moderation not configured' }, 503);
    }

    if (!requestHasSecret(request, moderationSecret, ['x-comment-admin-secret'])) {
        return jsonResponse({ error: 'Unauthorized' }, 401);
    }

    if (!id || !action) {
        return jsonResponse({ error: 'Missing parameters' }, 400);
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
                return jsonResponse({ error: 'Invalid action' }, 400);
        }

        return jsonResponse({ success: true }, 200);
    } catch (error) {
        return jsonResponse({ error: 'Operation failed' }, 500);
    }
};
