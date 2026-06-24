import { timingSafeEqual } from 'node:crypto';

function normalizeSecret(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

export function secretMatches(candidate: unknown, expected: unknown): boolean {
  const candidateValue = normalizeSecret(candidate);
  const expectedValue = normalizeSecret(expected);
  if (!candidateValue || !expectedValue) return false;

  const candidateBuffer = Buffer.from(candidateValue);
  const expectedBuffer = Buffer.from(expectedValue);
  return candidateBuffer.length === expectedBuffer.length && timingSafeEqual(candidateBuffer, expectedBuffer);
}

export function bearerTokenFromRequest(request: Request): string {
  const auth = request.headers.get('Authorization') || '';
  return auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
}

export function requestHasSecret(request: Request, expectedSecret: string, headerNames: string[] = []): boolean {
  if (!expectedSecret) return false;

  if (secretMatches(bearerTokenFromRequest(request), expectedSecret)) return true;

  return headerNames.some((headerName) => secretMatches(request.headers.get(headerName), expectedSecret));
}

export function checkBasicAuth(request: Request, expectedUser: unknown, expectedPass: unknown): boolean {
  const userValue = normalizeSecret(expectedUser);
  const passValue = normalizeSecret(expectedPass);
  if (!userValue || !passValue) return false;

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

  const providedUser = decoded.slice(0, separator);
  const providedPass = decoded.slice(separator + 1);

  return secretMatches(providedUser, userValue) && secretMatches(providedPass, passValue);
}
