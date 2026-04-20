/**
 * Auth helper para /estilo — verifica tokens de Directus.
 * Soporta Bearer header (servicios/agentes) y cookie de sesión (browser).
 */

const DIRECTUS_URL = process.env.PUBLIC_DIRECTUS_URL || 'http://localhost:8055';
const COOKIE_NAME = 'estilo_session';

export interface AuthResult {
  ok: boolean;
  user?: { email: string; role: string };
  error?: string;
}

/** Verifica un access_token de Directus contra /users/me */
export async function verifyDirectusToken(token: string): Promise<AuthResult> {
  try {
    const res = await fetch(`${DIRECTUS_URL}/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return { ok: false, error: 'Token inválido' };
    const data = await res.json();
    return { ok: true, user: { email: data.data?.email, role: data.data?.role } };
  } catch {
    return { ok: false, error: 'Directus no disponible' };
  }
}

/** Login con email/password — retorna el access_token de Directus */
export async function loginDirectus(
  email: string,
  password: string
): Promise<{ ok: boolean; token?: string; error?: string }> {
  try {
    const res = await fetch(`${DIRECTUS_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, error: data.errors?.[0]?.message || 'Credenciales inválidas' };
    return { ok: true, token: data.data?.access_token };
  } catch {
    return { ok: false, error: 'Directus no disponible' };
  }
}

/**
 * Extrae y verifica el token desde la request:
 * 1. Authorization: Bearer <token>  (servicios/agentes)
 * 2. Cookie estilo_session=<token>  (browser)
 */
export async function authenticate(request: Request): Promise<AuthResult & { token?: string; source?: 'bearer' | 'cookie' }> {
  // 1. Bearer header
  const authHeader = request.headers.get('Authorization') || '';
  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    const result = await verifyDirectusToken(token);
    return { ...result, token, source: 'bearer' };
  }

  // 2. Cookie de sesión (browser)
  const cookieHeader = request.headers.get('Cookie') || '';
  const match = cookieHeader.match(new RegExp(`(?:^|;)\\s*${COOKIE_NAME}=([^;]+)`));
  if (match) {
    const token = decodeURIComponent(match[1]);
    const result = await verifyDirectusToken(token);
    return { ...result, token, source: 'cookie' };
  }

  return { ok: false, error: 'Sin autenticación' };
}

/** Construye la cookie de sesión (httpOnly, SameSite=Strict, 8h) */
export function sessionCookie(token: string): string {
  const maxAge = 8 * 60 * 60; // 8 horas
  return `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/estilo; HttpOnly; SameSite=Strict; Max-Age=${maxAge}`;
}

/** Cookie para borrar la sesión */
export function clearCookie(): string {
  return `${COOKIE_NAME}=; Path=/estilo; HttpOnly; Max-Age=0`;
}

export { COOKIE_NAME };
