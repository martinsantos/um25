// These requests exercise publication handlers against an in-memory Directus double.
jest.mock('../src/utils/serverAuth', () => ({ checkBasicAuth: () => true }));
const env = process.env;
const oldFetch = global.fetch;
const oldResponse = global.Response;
const assigned = 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200';
const body = { titulo:'Nota', resumen:'Resumen', contenido:'Contenido' };
beforeEach(() => {
  jest.resetModules();
  process.env = { ...env, DIRECTUS_ADMIN_TOKEN:'test-token', BLOG_API_USER:'test-user', BLOG_API_PASS:'test-password' };
  global.Response = class { constructor(value, init) { this.status = init.status; } };
  global.fetch = jest.fn();
});
afterEach(() => { process.env=env; global.fetch=oldFetch; global.Response=oldResponse; });
const request = (data) => ({ json: async () => data, headers:{ get:() => '' } });
test('POST preserves an explicit cover without requesting another article or a candidate pool', async () => {
  const { POST } = require('../src/pages/api/blog.ts');
  global.fetch.mockResolvedValue({ ok:true, json:async () => ({data:{id:1}}) });
  const response=await POST({ request:request({...body, imagen_portada:assigned}) });
  expect(response.status).toBe(201);
  expect(global.fetch).toHaveBeenCalledTimes(1);
  expect(JSON.parse(global.fetch.mock.calls[0][1].body).imagen_portada).toBe(assigned);
});
test.each([['omitted', {}, undefined], ['explicitly cleared', {imagen_portada:null}, null], ['replaced', {imagen_portada:assigned}, assigned]])('PUT treats an %s cover as an editorial choice', async (_label, change, expected) => {
  const { PUT } = require('../src/pages/api/blog/[slug].ts');
  global.fetch.mockResolvedValueOnce({ok:true,json:async()=>({data:[{id:1,slug:'nota',imagen_portada:'/uploads/a.jpg'}]})})
    .mockResolvedValueOnce({ok:true});
  const response=await PUT({params:{slug:'nota'}, request:request({...body,...change})});
  expect(response.status).toBe(200);
  expect(global.fetch).toHaveBeenCalledTimes(2);
  const patch=JSON.parse(global.fetch.mock.calls[1][1].body);
  if (expected===undefined) expect(patch).not.toHaveProperty('imagen_portada');
  else expect(patch.imagen_portada).toBe(expected);
});
