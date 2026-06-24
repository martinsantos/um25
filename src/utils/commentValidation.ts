export interface PublicCommentInput {
  author: string;
  email: string;
  content: string;
  postSlug: string;
}

const COMMENT_LIMITS = {
  author: 80,
  email: 160,
  content: 1600,
  postSlug: 140,
};

function cleanText(value: unknown, maxLength: number): string {
  return String(value ?? '').trim().slice(0, maxLength);
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidSlug(value: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(value);
}

export function parsePublicCommentInput(body: Record<string, unknown>): {
  ok: true;
  value: PublicCommentInput;
} | {
  ok: false;
  error: string;
} {
  const rawAuthor = String(body.author ?? '');
  const rawEmail = String(body.email ?? '');
  const rawContent = String(body.content ?? '');
  const rawPostSlug = String(body.postSlug ?? '');

  const value: PublicCommentInput = {
    author: cleanText(rawAuthor, COMMENT_LIMITS.author),
    email: cleanText(rawEmail, COMMENT_LIMITS.email).toLowerCase(),
    content: cleanText(rawContent, COMMENT_LIMITS.content),
    postSlug: cleanText(rawPostSlug, COMMENT_LIMITS.postSlug),
  };

  if (!value.author || !value.email || !value.content || !value.postSlug) {
    return { ok: false, error: 'Missing required fields' };
  }

  if (
    rawAuthor.trim().length > COMMENT_LIMITS.author ||
    rawEmail.trim().length > COMMENT_LIMITS.email ||
    rawContent.trim().length > COMMENT_LIMITS.content ||
    rawPostSlug.trim().length > COMMENT_LIMITS.postSlug
  ) {
    return { ok: false, error: 'Field length exceeded' };
  }

  if (!isValidEmail(value.email)) {
    return { ok: false, error: 'Invalid email' };
  }

  if (!isValidSlug(value.postSlug)) {
    return { ok: false, error: 'Invalid post slug' };
  }

  return { ok: true, value };
}
