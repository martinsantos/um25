import { spawn, spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';

const baseUrl = process.env.UMSA_BASE_URL || 'http://127.0.0.1:4331';
const chromeBin = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const port = 9571 + Math.floor(Math.random() * 300);
const profile = `/tmp/um-contact-modal-profile-${port}`;
const outDir = '/private/tmp/um-contact-modal-shots';
mkdirSync(outDir, { recursive: true });

function cleanup() {
  spawnSync('pkill', ['-f', profile], { stdio: 'ignore' });
}

cleanup();
const chrome = spawn(chromeBin, [
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${profile}`,
  '--headless=new',
  '--disable-gpu',
  '--no-first-run',
  '--no-default-browser-check',
  'about:blank',
], { stdio: 'ignore' });

process.on('exit', cleanup);
process.on('SIGINT', () => {
  cleanup();
  process.exit(130);
});

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function targets() {
  for (let i = 0; i < 120; i += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json/list`);
      if (response.ok) {
        const list = await response.json();
        const page = list.find((target) => target.type === 'page');
        if (page) return page;
      }
    } catch {
      // Chrome is still booting.
    }
    await sleep(100);
  }
  throw new Error('Chrome CDP was not ready');
}

let commandId = 0;
function cdp(ws, method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++commandId;
    const timer = setTimeout(() => reject(new Error(`CDP timeout: ${method}`)), 20000);
    const onMessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.id !== id) return;
      clearTimeout(timer);
      ws.removeEventListener('message', onMessage);
      if (message.error) reject(new Error(JSON.stringify(message.error)));
      else resolve(message.result);
    };
    ws.addEventListener('message', onMessage);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

async function evalOnPage(ws, expression) {
  const { result } = await cdp(ws, 'Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (result.subtype === 'error') throw new Error(result.description || 'Runtime error');
  return result.value;
}

async function navigate(ws, path, viewport) {
  await cdp(ws, 'Emulation.setDeviceMetricsOverride', viewport);
  await cdp(ws, 'Page.navigate', { url: new URL(path, baseUrl).toString() });
  await sleep(900);
}

async function screenshot(ws, name) {
  const shot = await cdp(ws, 'Page.captureScreenshot', {
    format: 'png',
    fromSurface: true,
    captureBeyondViewport: false,
  });
  const file = `${outDir}/${name}.png`;
  writeFileSync(file, Buffer.from(shot.data, 'base64'));
  return file;
}

const target = await targets();
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve) => ws.addEventListener('open', resolve, { once: true }));
await cdp(ws, 'Page.enable');
await cdp(ws, 'Runtime.enable');
await cdp(ws, 'DOM.enable');

const checks = [];

await navigate(ws, '/', { width: 1360, height: 900, deviceScaleFactor: 1, mobile: false });
await evalOnPage(ws, `document.querySelector('a[href="/contacto"]')?.click()`);
await sleep(400);
checks.push(await evalOnPage(ws, `(() => {
  const modal = document.querySelector('[data-contact-modal]');
  const title = document.querySelector('[data-contact-context-title]')?.textContent;
  const fields = Array.from(document.querySelectorAll('#umContactModalForm input[name], #umContactModalForm textarea[name]')).map((el) => el.name);
  const visible = Array.from(document.querySelectorAll('#umContactModalForm input[name], #umContactModalForm textarea[name]'))
    .filter((el) => getComputedStyle(el).visibility !== 'hidden' && el.type !== 'hidden' && el.offsetParent !== null)
    .map((el) => el.name);
  const dialog = document.querySelector('.um-contact-dialog')?.getBoundingClientRect();
  return {
    step: 'home-open',
    open: modal && modal.hidden === false,
    title,
    fields,
    visible,
    activeName: document.activeElement?.getAttribute('name'),
    dialog: dialog ? { width: Math.round(dialog.width), height: Math.round(dialog.height), top: Math.round(dialog.top), left: Math.round(dialog.left) } : null,
    overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth
  };
})()`));
const desktopShot = await screenshot(ws, 'desktop-home-modal');
await evalOnPage(ws, `document.querySelector('[data-contact-mode="guided"]')?.click()`);
await sleep(180);
await evalOnPage(ws, `document.querySelector('[data-contact-prompt]')?.click()`);
await sleep(180);
checks.push(await evalOnPage(ws, `(() => {
  const message = document.querySelector('#umContactModalForm textarea[name="message"]')?.value || '';
  const guides = document.querySelector('[data-contact-guides]');
  return {
    step: 'guided-autofill',
    guidesVisible: guides ? guides.hidden === false : false,
    message,
    selected: Boolean(document.querySelector('[data-contact-prompt][aria-pressed="true"]')),
    hasTemplateToken: message.includes('{context}'),
    hasEmptyPrompt: /:\\s*$/.test(message)
  };
})()`));
const guidedShot = await screenshot(ws, 'desktop-home-modal-guided');

await evalOnPage(ws, `document.querySelector('[data-contact-close]')?.click()`);
await sleep(200);

await navigate(ws, '/', { width: 1366, height: 768, deviceScaleFactor: 1, mobile: false });
await evalOnPage(ws, `document.querySelector('a[href="/contacto"]')?.click()`);
await sleep(350);
await evalOnPage(ws, `document.querySelector('[data-contact-mode="guided"]')?.click()`);
await sleep(120);
await evalOnPage(ws, `document.querySelectorAll('[data-contact-prompt]')[1]?.click()`);
await sleep(180);
checks.push(await evalOnPage(ws, `(() => {
  const dialog = document.querySelector('.um-contact-dialog')?.getBoundingClientRect();
  const main = document.querySelector('.um-contact-dialog__main');
  const submit = document.querySelector('.um-contact-submit')?.getBoundingClientRect();
  const message = document.querySelector('#umContactModalForm textarea[name="message"]')?.value || '';
  return {
    step: 'desktop-compact-guided',
    viewport: { width: window.innerWidth, height: window.innerHeight },
    dialog: dialog ? { width: Math.round(dialog.width), height: Math.round(dialog.height), top: Math.round(dialog.top), bottom: Math.round(dialog.bottom) } : null,
    submit: submit ? { top: Math.round(submit.top), bottom: Math.round(submit.bottom) } : null,
    main: main ? { clientHeight: main.clientHeight, scrollHeight: main.scrollHeight } : null,
    message,
    dialogFits: Boolean(dialog && dialog.top >= 8 && dialog.bottom <= window.innerHeight - 8),
    submitVisible: Boolean(submit && submit.top >= 0 && submit.bottom <= window.innerHeight - 8),
    overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    hasTemplateToken: message.includes('{context}'),
    hasEmptyPrompt: /:\\s*$/.test(message)
  };
})()`));
const compactShot = await screenshot(ws, 'desktop-compact-guided');
await evalOnPage(ws, `document.querySelector('[data-contact-close]')?.click()`);
await sleep(200);

await navigate(ws, '/cctvai/', { width: 1360, height: 900, deviceScaleFactor: 1, mobile: false });
await evalOnPage(ws, `document.querySelector('a[href="/contacto"]')?.click()`);
await sleep(400);
checks.push(await evalOnPage(ws, `(() => ({
  step: 'cctvai-context',
  title: document.querySelector('[data-contact-context-title]')?.textContent,
  detail: document.querySelector('[data-contact-context-detail]')?.textContent,
  modeGuided: document.querySelector('[data-contact-mode="guided"]')?.classList.contains('is-active'),
  originIntent: document.querySelector('#umContactModalForm input[name="originIntent"]')?.value,
  originPath: document.querySelector('#umContactModalForm input[name="originPath"]')?.value
}))()`));

await navigate(ws, '/servicios', { width: 390, height: 820, deviceScaleFactor: 2, mobile: true });
await evalOnPage(ws, `document.querySelector('a[href="/contacto"]')?.click()`);
await sleep(400);
checks.push(await evalOnPage(ws, `(() => {
  const dialog = document.querySelector('.um-contact-dialog')?.getBoundingClientRect();
  return {
    step: 'mobile-open',
    open: document.querySelector('[data-contact-modal]')?.hidden === false,
    dialog: dialog ? { width: Math.round(dialog.width), height: Math.round(dialog.height), top: Math.round(dialog.top), left: Math.round(dialog.left) } : null,
    viewport: { width: window.innerWidth, height: window.innerHeight },
    overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    visibleFields: Array.from(document.querySelectorAll('#umContactModalForm input[name], #umContactModalForm textarea[name]'))
      .filter((el) => getComputedStyle(el).visibility !== 'hidden' && el.type !== 'hidden' && el.offsetParent !== null)
      .map((el) => el.name)
  };
})()`));
const mobileShot = await screenshot(ws, 'mobile-services-modal');

await navigate(ws, '/servicios', { width: 390, height: 667, deviceScaleFactor: 2, mobile: true });
await evalOnPage(ws, `document.querySelector('a[href="/contacto"]')?.click()`);
await sleep(350);
await evalOnPage(ws, `document.querySelector('[data-contact-mode="guided"]')?.click()`);
await sleep(120);
await evalOnPage(ws, `document.querySelectorAll('[data-contact-prompt]')[1]?.click()`);
await sleep(120);
await evalOnPage(ws, `(() => {
  const main = document.querySelector('.um-contact-dialog__main');
  if (main) main.scrollTop = main.scrollHeight;
})()`);
await sleep(120);
checks.push(await evalOnPage(ws, `(() => {
  const dialog = document.querySelector('.um-contact-dialog')?.getBoundingClientRect();
  const main = document.querySelector('.um-contact-dialog__main');
  const close = document.querySelector('.um-contact-close')?.getBoundingClientRect();
  const submit = document.querySelector('.um-contact-submit')?.getBoundingClientRect();
  const message = document.querySelector('#umContactModalForm textarea[name="message"]')?.value || '';
  return {
    step: 'mobile-compact-guided-scroll',
    open: document.querySelector('[data-contact-modal]')?.hidden === false,
    viewport: { width: window.innerWidth, height: window.innerHeight },
    dialog: dialog ? { width: Math.round(dialog.width), height: Math.round(dialog.height), top: Math.round(dialog.top), bottom: Math.round(dialog.bottom) } : null,
    main: main ? { clientHeight: main.clientHeight, scrollHeight: main.scrollHeight, scrollTop: Math.round(main.scrollTop) } : null,
    close: close ? { top: Math.round(close.top), right: Math.round(close.right) } : null,
    submit: submit ? { top: Math.round(submit.top), bottom: Math.round(submit.bottom) } : null,
    message,
    dialogFits: Boolean(dialog && dialog.top >= 0 && dialog.bottom <= window.innerHeight),
    submitReachable: Boolean(submit && submit.top >= 0 && submit.bottom <= window.innerHeight),
    closeVisible: Boolean(close && close.top >= 0 && close.right <= window.innerWidth),
    overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    hasTemplateToken: message.includes('{context}'),
    hasEmptyPrompt: /:\\s*$/.test(message)
  };
})()`));
const mobileCompactShot = await screenshot(ws, 'mobile-compact-guided-scrolled');

await navigate(ws, '/contacto', { width: 1360, height: 900, deviceScaleFactor: 1, mobile: false });
checks.push(await evalOnPage(ws, `(() => ({
  step: 'contact-page',
  pageForm: Boolean(document.querySelector('#contactForm')),
  modalPresent: Boolean(document.querySelector('#umContactModalForm')),
  canonicalTitle: document.title,
  overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth
}))()`));

ws.close();
chrome.kill();
cleanup();

const failed = checks.filter((check) => {
  if (check.step === 'home-open') return !check.open || check.overflowX || JSON.stringify(check.visible) !== JSON.stringify(['name', 'email', 'company', 'message']);
  if (check.step === 'cctvai-context') return check.originPath !== '/cctvai/' || check.originIntent !== 'cctvai' || !check.modeGuided;
  if (check.step === 'guided-autofill') return !check.guidesVisible || !check.selected || check.message.length < 20 || check.hasTemplateToken || check.hasEmptyPrompt;
  if (check.step === 'desktop-compact-guided') return check.overflowX || !check.dialogFits || !check.submitVisible || check.hasTemplateToken || check.hasEmptyPrompt;
  if (check.step === 'mobile-open') return !check.open || check.overflowX || !check.dialog || check.dialog.width > check.viewport.width;
  if (check.step === 'mobile-compact-guided-scroll') return !check.open || check.overflowX || !check.dialogFits || !check.submitReachable || !check.closeVisible || check.hasTemplateToken || check.hasEmptyPrompt;
  if (check.step === 'contact-page') return !check.pageForm || !check.modalPresent || check.overflowX;
  return true;
});

console.log(JSON.stringify({ ok: failed.length === 0, checks, screenshots: { desktopShot, guidedShot, compactShot, mobileShot, mobileCompactShot } }, null, 2));
if (failed.length > 0) process.exit(1);
