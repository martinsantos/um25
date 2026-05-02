import { timingSafeEqual } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import type { APIRoute } from 'astro';

const DEFAULT_LOCAL_SKILL_PATH = '/Users/santosma/umsa-codex/.agents/skills/umsa-diaria/SKILL.md';
const MAX_SKILL_BYTES = 256 * 1024;

const SKILL_USER =
  process.env['BLOG_SKILL_USER'] ??
  import.meta.env['BLOG_SKILL_USER'] ??
  process.env['BLOG_API_USER'] ??
  import.meta.env['BLOG_API_USER'];

const SKILL_PASS =
  process.env['BLOG_SKILL_PASS'] ??
  import.meta.env['BLOG_SKILL_PASS'] ??
  process.env['BLOG_API_PASS'] ??
  import.meta.env['BLOG_API_PASS'];

const SKILL_PATH =
  process.env['BLOG_SKILL_PATH'] ??
  import.meta.env['BLOG_SKILL_PATH'] ??
  DEFAULT_LOCAL_SKILL_PATH;

const SKILL_MARKDOWN =
  process.env['BLOG_SKILL_MARKDOWN'] ??
  import.meta.env['BLOG_SKILL_MARKDOWN'];

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

function unauthorized(): Response {
  return new Response('Unauthorized', {
    status: 401,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'WWW-Authenticate': 'Basic realm="UMSA Blog Skill"',
      'Cache-Control': 'private, no-store, max-age=0',
      'X-Robots-Tag': 'noindex, nofollow, noarchive, nosnippet',
    },
  });
}

function checkAuth(request: Request): boolean {
  if (!SKILL_USER || !SKILL_PASS) return false;

  const auth = request.headers.get('Authorization') || '';
  if (!auth.startsWith('Basic ')) return false;

  let decoded = '';
  try {
    decoded = Buffer.from(auth.slice(6), 'base64').toString('utf8');
  } catch {
    return false;
  }

  const separator = decoded.indexOf(':');
  if (separator < 0) return false;

  const user = decoded.slice(0, separator);
  const pass = decoded.slice(separator + 1);

  return safeEqual(user, SKILL_USER) && safeEqual(pass, SKILL_PASS);
}

async function loadSkillMarkdown(): Promise<string> {
  if (SKILL_MARKDOWN) return SKILL_MARKDOWN;

  const content = await readFile(SKILL_PATH, 'utf8');
  if (Buffer.byteLength(content, 'utf8') > MAX_SKILL_BYTES) {
    throw new Error('Configured blog skill file is too large');
  }
  return content;
}

export const GET: APIRoute = async ({ request }) => {
  if (!checkAuth(request)) return unauthorized();

  try {
    const markdown = await loadSkillMarkdown();
    return new Response(markdown, {
      status: 200,
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Content-Disposition': 'inline; filename="blogskill.md"',
        'Cache-Control': 'private, no-store, max-age=0',
        'X-Robots-Tag': 'noindex, nofollow, noarchive, nosnippet',
      },
    });
  } catch {
    return new Response('Blog skill is not configured', {
      status: 503,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'private, no-store, max-age=0',
        'X-Robots-Tag': 'noindex, nofollow, noarchive, nosnippet',
      },
    });
  }
};
