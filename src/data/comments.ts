import { promises as fs } from 'fs';
import path from 'path';

export interface Comment {
    id: string;
    postSlug: string;
    author: string;
    email: string;
    content: string;
    createdAt: string;
    replies?: Comment[];
    isApproved?: boolean;
}

const COMMENTS_FILE = path.join(process.cwd(), 'src/data/comments.json');

// Asegurarse de que el archivo existe
async function ensureCommentsFile() {
    try {
        await fs.access(COMMENTS_FILE);
    } catch {
        await fs.writeFile(COMMENTS_FILE, JSON.stringify([], null, 2));
    }
}

// Cargar comentarios
export async function loadComments(): Promise<Comment[]> {
    await ensureCommentsFile();
    const content = await fs.readFile(COMMENTS_FILE, 'utf-8');
    return JSON.parse(content);
}

// Guardar comentarios
async function saveComments(comments: Comment[]): Promise<void> {
    await fs.writeFile(COMMENTS_FILE, JSON.stringify(comments, null, 2));
}

// Obtener comentarios por slug del post
export async function getCommentsByPostSlug(postSlug: string): Promise<Comment[]> {
    const comments = await loadComments();
    return comments
        .filter(comment => comment.postSlug === postSlug && comment.isApproved)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

// Añadir un nuevo comentario
export async function addComment(comment: Omit<Comment, 'id' | 'createdAt' | 'isApproved'>): Promise<Comment> {
    const comments = await loadComments();
    
    const newComment: Comment = {
        ...comment,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        isApproved: false // Los comentarios requieren aprobación
    };

    comments.push(newComment);
    await saveComments(comments);
    
    return newComment;
}

// Aprobar un comentario
export async function approveComment(commentId: string): Promise<void> {
    const comments = await loadComments();
    const commentIndex = comments.findIndex(c => c.id === commentId);
    
    if (commentIndex !== -1) {
        comments[commentIndex].isApproved = true;
        await saveComments(comments);
    }
}

// Eliminar un comentario
export async function deleteComment(commentId: string): Promise<void> {
    const comments = await loadComments();
    const filteredComments = comments.filter(c => c.id !== commentId);
    await saveComments(filteredComments);
}

// Añadir una respuesta a un comentario
export async function addReply(
    parentCommentId: string,
    reply: Omit<Comment, 'id' | 'createdAt' | 'isApproved'>
): Promise<Comment | null> {
    const comments = await loadComments();
    const parentComment = comments.find(c => c.id === parentCommentId);
    
    if (!parentComment) return null;

    const newReply: Comment = {
        ...reply,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        isApproved: false
    };

    if (!parentComment.replies) {
        parentComment.replies = [];
    }
    
    parentComment.replies.push(newReply);
    await saveComments(comments);
    
    return newReply;
}
