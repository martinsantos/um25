import { spawn } from 'node:child_process';
import { once } from 'node:events';

// Exercise the built SSR artifact, with no CMS credentials or production writes.
const port = process.env.SEO_CHECK_PORT || '4399';
const base = `http://127.0.0.1:${port}`;
const env = { ...process.env, HOST: '127.0.0.1', PORT: port, NODE_ENV: 'production', UMSA_PREVIEW: '0', UMSA_LOCAL_REPLICA: '0', UMSA_USE_PUBLIC_BLOG_FALLBACK: '0', UMSA_BLOG_MOCKS: '0', DIRECTUS_INTERNAL_URL: 'http://127.0.0.1:9', PUBLIC_DIRECTUS_URL: 'http://127.0.0.1:9', DIRECTUS_STATIC_TOKEN: '', PUBLIC_DIRECTUS_TOKEN: '', DIRECTUS_ADMIN_TOKEN: '' };
const server = spawn(process.execPath, [process.env.SEO_SERVER_ENTRY || 'dist/server/entry.mjs'], { env, stdio: ['ignore', 'ignore', 'pipe'] });
let serverErrors = '';
server.stderr.on('data', chunk => { serverErrors = (serverErrors + chunk).slice(-8000); });
try {
  let ready = false;
  for (let attempt = 0; attempt < 60; attempt++) {
    if (server.exitCode !== null) throw new Error(`SSR exited: ${serverErrors}`);
    try { if ((await fetch(`${base}/robots.txt`, { signal: AbortSignal.timeout(1000) })).ok) { ready = true; break; } } catch { /* wait for startup */ }
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  if (!ready) throw new Error(`SSR did not become ready: ${serverErrors}`);
  const audit = spawn(process.execPath, ['scripts/seo-audit.mjs', '--base-url', base], { env, stdio: 'inherit' });
  const [code] = await once(audit, 'exit');
  process.exitCode = code === 0 ? 0 : 1;
} catch (error) { console.error(error); process.exitCode = 1; }
finally { server.kill('SIGTERM'); }
