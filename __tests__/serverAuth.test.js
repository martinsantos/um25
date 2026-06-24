const {
  checkBasicAuth,
  requestHasSecret,
  secretMatches,
} = require('../src/utils/serverAuth');

function requestWithHeaders(headers = {}) {
  const normalized = new Map(
    Object.entries(headers).map(([key, value]) => [key.toLowerCase(), String(value)]),
  );

  return {
    headers: {
      get(name) {
        return normalized.get(String(name).toLowerCase()) || null;
      },
    },
  };
}

describe('server auth helpers', () => {
  test('compares shared secrets without accepting missing values', () => {
    expect(secretMatches('same-secret', 'same-secret')).toBe(true);
    expect(secretMatches('same-secret', 'other-secret')).toBe(false);
    expect(secretMatches('', 'same-secret')).toBe(false);
    expect(secretMatches('same-secret', '')).toBe(false);
  });

  test('accepts bearer or explicit shared-secret headers', () => {
    expect(
      requestHasSecret(
        requestWithHeaders({ Authorization: 'Bearer moderation-secret' }),
        'moderation-secret',
        ['x-comment-admin-secret'],
      ),
    ).toBe(true);

    expect(
      requestHasSecret(
        requestWithHeaders({ 'x-comment-admin-secret': 'moderation-secret' }),
        'moderation-secret',
        ['x-comment-admin-secret'],
      ),
    ).toBe(true);
  });

  test('malformed basic auth fails closed instead of throwing', () => {
    const request = requestWithHeaders({ Authorization: 'Basic not-valid-for-this-api' });

    expect(() => checkBasicAuth(request, 'user', 'pass')).not.toThrow();
    expect(checkBasicAuth(request, 'user', 'pass')).toBe(false);
  });

  test('valid basic auth is accepted', () => {
    const token = Buffer.from('user:pass').toString('base64');
    const request = requestWithHeaders({ Authorization: `Basic ${token}` });

    expect(checkBasicAuth(request, 'user', 'pass')).toBe(true);
  });
});
