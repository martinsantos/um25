import { onRequest } from '../src/middleware';

const originalEnv = process.env;
beforeEach(() => { process.env = { ...originalEnv }; });
afterEach(() => { process.env = originalEnv; });
const setup = (path) => {
  const response = { headers: new Map(), status: 200 };
  const context = { url: new URL(path, 'http://localhost:4381'), request: { method: 'GET' }, redirect: jest.fn(() => response) };
  const next = jest.fn().mockResolvedValue(response);
  return { response, context, next };
};

test.each(['/', '/software', '/blog/una-nota', '/certificaciones', '/servicios/101/redes'])('preview protects %s from indexing, including legacy routes', async (path) => {
  process.env.UMSA_PREVIEW = '1';
  const { context, next } = setup(path);
  const result = await onRequest(context, next);
  expect(result.headers.get('X-Robots-Tag')).toBe('noindex, nofollow');
});

test('legacy routing and indexing are unchanged with preview disabled', async () => {
  process.env.UMSA_PREVIEW = '0';
  const { context, next, response } = setup('/software');
  expect(await onRequest(context, next)).toBe(response);
  expect(next).toHaveBeenCalledWith();
  expect(response.headers.has('X-Robots-Tag')).toBe(false);
});

test('public rewrite retains query parameters and still executes once', async () => {
  process.env.UMSA_PREVIEW = '0';
  const { context, next } = setup('/antecedentes?servicio=101');
  await onRequest(context, next);
  expect(next).toHaveBeenCalledTimes(1);
  expect(next.mock.calls[0][0].pathname).toBe('/propuesta/antecedentes');
  expect(next.mock.calls[0][0].search).toBe('?servicio=101');
});
