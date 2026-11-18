jest.mock('nodemailer', () => ({ createTransport: jest.fn() }));

const { createTransport } = require('nodemailer');
const { POST } = require('../src/pages/api/contact.ts');
const originalEnv = process.env;
const originalResponse = global.Response;

beforeEach(() => {
  process.env = {
    ...originalEnv, SMTP_HOST: 'test.invalid', SMTP_PORT: '465', SMTP_USER: 'test', SMTP_PASS: 'test',
  };
  global.Response = class {
    constructor(body, init) {
      this.body = body;
      this.status = init.status;
    }
    async json() {
      return JSON.parse(this.body);
    }
  };
});

afterEach(() => {
  process.env = originalEnv;
  global.Response = originalResponse;
});

function submission(data) {
  return {
    clientAddress: '192.0.2.5',
    request: {
      headers: { get: key => key === 'content-type' ? 'application/json' : null },
      json: async () => data,
    },
  };
}

function message(text) {
  return submission({ name: 'Prueba', email: 'prueba@example.com', message: text });
}

test.each([null, [], 'texto'])('contact rejects malformed JSON shape %j before mail delivery', async data => {
  expect((await POST(submission(data))).status).toBe(400);
  expect(createTransport).not.toHaveBeenCalled();
});

test('contact coalesces submissions while delivery is in progress', async () => {
  let completeDelivery;
  const delivery = new Promise(resolve => { completeDelivery = resolve; });
  const sendMail = jest.fn().mockReturnValue(delivery);
  createTransport.mockReturnValue({ sendMail });
  const first = POST(message('Mensaje duplicado durante el envío.'));
  const second = POST(message('Mensaje duplicado durante el envío.'));
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
  const sendsBeforeDelivery = sendMail.mock.calls.length;
  completeDelivery();
  const [sent, duplicate] = await Promise.all([first, second]);

  expect(sendsBeforeDelivery).toBe(1);
  expect(sent.status).toBe(200);
  await expect(duplicate.json()).resolves.toMatchObject({ success: true, duplicate: true });
});

test('contact delivers two messages with the same opening and a different ending', async () => {
  const sendMail = jest.fn().mockResolvedValue(undefined);
  createTransport.mockReturnValue({ sendMail });
  const opening = 'Contexto de la consulta. '.repeat(12);
  expect((await POST(message(opening + 'Redes.'))).status).toBe(200);
  expect((await POST(message(opening + 'Energía.'))).status).toBe(200);
  expect(sendMail).toHaveBeenCalledTimes(2);
});

test('contact allows a retry after a failed delivery', async () => {
  const sendMail = jest.fn().mockRejectedValueOnce(new Error('SMTP unavailable')).mockResolvedValueOnce(undefined);
  createTransport.mockReturnValue({ sendMail });
  expect((await POST(message('Reintento después de un fallo.'))).status).toBe(500);
  expect((await POST(message('Reintento después de un fallo.'))).status).toBe(200);
  expect(sendMail).toHaveBeenCalledTimes(2);
});

test('submits to an explicitly configured loopback relay without credentials', async () => {
  Object.assign(process.env, { SMTP_HOST: '127.0.0.1', SMTP_PORT: '25', SMTP_USER: '', SMTP_PASS: '' });
  const sendMail = jest.fn().mockResolvedValue({});
  createTransport.mockReturnValue({ sendMail });
  expect((await POST(message('Prueba del transporte local.'))).status).toBe(200);
  expect(createTransport).toHaveBeenCalledWith({ host: '127.0.0.1', port: 25, ignoreTLS: true });
  expect(sendMail).toHaveBeenCalledTimes(1);
});

test.each([
  ['smtp.example.org', '25', '', ''],
  ['127.0.0.1', '25', 'partial', ''],
  ['127.0.0.1', '', '', ''],
])('rejects incomplete SMTP settings (%s %s)', async (host, port, user, pass) => {
  Object.assign(process.env, { SMTP_HOST: host, SMTP_PORT: port, SMTP_USER: user, SMTP_PASS: pass });
  expect((await POST(message('Configuración incompleta.'))).status).toBe(500);
  expect(createTransport).not.toHaveBeenCalled();
});
