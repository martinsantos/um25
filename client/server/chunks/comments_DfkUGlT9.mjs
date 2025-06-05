import { promises } from 'fs';
import path from 'path';

const COMMENTS_FILE = path.join(process.cwd(), "src/data/comments.json");
async function ensureCommentsFile() {
  try {
    await promises.access(COMMENTS_FILE);
  } catch {
    await promises.writeFile(COMMENTS_FILE, JSON.stringify([], null, 2));
  }
}
async function loadComments() {
  await ensureCommentsFile();
  const content = await promises.readFile(COMMENTS_FILE, "utf-8");
  return JSON.parse(content);
}
async function saveComments(comments) {
  await promises.writeFile(COMMENTS_FILE, JSON.stringify(comments, null, 2));
}
async function getCommentsByPostSlug(postSlug) {
  const comments = await loadComments();
  return comments.filter((comment) => comment.postSlug === postSlug && comment.isApproved).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
async function addComment(comment) {
  const comments = await loadComments();
  const newComment = {
    ...comment,
    id: crypto.randomUUID(),
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    isApproved: false
    // Los comentarios requieren aprobación
  };
  comments.push(newComment);
  await saveComments(comments);
  return newComment;
}
async function approveComment(commentId) {
  const comments = await loadComments();
  const commentIndex = comments.findIndex((c) => c.id === commentId);
  if (commentIndex !== -1) {
    comments[commentIndex].isApproved = true;
    await saveComments(comments);
  }
}
async function deleteComment(commentId) {
  const comments = await loadComments();
  const filteredComments = comments.filter((c) => c.id !== commentId);
  await saveComments(filteredComments);
}
async function addReply(parentCommentId, reply) {
  const comments = await loadComments();
  const parentComment = comments.find((c) => c.id === parentCommentId);
  if (!parentComment) return null;
  const newReply = {
    ...reply,
    id: crypto.randomUUID(),
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    isApproved: false
  };
  if (!parentComment.replies) {
    parentComment.replies = [];
  }
  parentComment.replies.push(newReply);
  await saveComments(comments);
  return newReply;
}

export { addReply as a, approveComment as b, addComment as c, deleteComment as d, getCommentsByPostSlug as g, loadComments as l };
