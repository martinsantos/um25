#!/usr/bin/env node
import { promises as fs, readFileSync } from 'node:fs';
import path from 'node:path';
import dns from 'node:dns/promises';

const DEFAULT_SITE_URL = 'https://www.ultimamilla.com.ar';
const DEFAULT_MEMORY = '/Users/santosma/.codex/automations/umsa-diaria/memory.md';
const DEFAULT_OUTPUTS = '/Users/santosma/umsa-codex/outputs';

function argValue(name, fallback) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] || fallback : fallback;
}

async function canWrite(target) {
  try {
    await fs.mkdir(target, { recursive: true });
    await fs.access(target, fs.constants.W_OK);
    return true;
  } catch {
    return false;
  }
}

async function canAppendFile(file) {
  try {
    await fs.mkdir(path.dirname(file), { recursive: true });
    const handle = await fs.open(file, 'a');
    await handle.close();
    await fs.access(file, fs.constants.W_OK);
    return true;
  } catch {
    return false;
  }
}

async function statusFor(url, options = {}) {
  try {
    const response = await fetch(url, options);
    return {
      ok: true,
      status: response.status,
      redirected: response.redirected,
      url: response.url,
      wwwAuthenticate: response.headers.get('www-authenticate'),
      location: response.headers.get('location'),
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function basicAuthHeader() {
  const user = process.env.BLOG_API_USER || process.env.UMSA_BLOG_USER;
  const pass = process.env.BLOG_API_PASS || process.env.UMSA_BLOG_PASS;
  if (user && pass) return `Basic ${Buffer.from(`${user}:${pass}`).toString('base64')}`;

  const skillPaths = [
    process.env.UMSA_BLOG_SKILL_PATH,
    path.join(process.cwd(), '.agents', 'skills', 'umsa-diaria', 'SKILL.md'),
    '/Users/santosma/umsa-codex/.agents/skills/umsa-diaria/SKILL.md',
  ].filter(Boolean);

  for (const skillPath of skillPaths) {
    try {
      const skill = readFileSync(skillPath, 'utf8');
      const match = skill.match(/Authorization:\s*(Basic\s+[A-Za-z0-9+/=]+)/);
      if (match?.[1]) return match[1];
    } catch {
      // Missing local skill is fine; the explicit env vars are the preferred path.
    }
  }

  return null;
}

async function fileExists(file) {
  try {
    await fs.access(file);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const siteUrl = argValue('--site-url', DEFAULT_SITE_URL).replace(/\/$/, '');
  const outputsDir = argValue('--outputs-dir', process.env.UMSA_OUTPUTS_DIR || DEFAULT_OUTPUTS);
  const memoryFile = argValue('--memory-file', process.env.UMSA_MEMORY_FILE || DEFAULT_MEMORY);
  const runDir = argValue('--run-dir', path.join(process.cwd(), 'outputs', `umsa-diaria-${new Date().toISOString().slice(0, 10)}`));

  const host = new URL(siteUrl).hostname;
  let dnsResult;
  try {
    const lookup = await dns.lookup(host);
    dnsResult = { ok: true, host, address: lookup.address };
  } catch (error) {
    dnsResult = { ok: false, host, error: error instanceof Error ? error.message : String(error) };
  }

  const canonicalUrl = new URL(siteUrl);
  const apexSiteUrl = canonicalUrl.hostname.startsWith('www.')
    ? siteUrl.replace('://www.', '://')
    : siteUrl;

  const canonicalGet = await statusFor(`${siteUrl}/api/blog`, { method: 'GET', redirect: 'manual' });
  const apexHead = await statusFor(`${apexSiteUrl}/api/blog`, {
    method: 'HEAD',
    redirect: 'manual',
  });
  const unauthorizedPost = await statusFor(`${siteUrl}/api/blog`, {
    method: 'POST',
    redirect: 'manual',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
  });
  const authHeader = basicAuthHeader();
  const authenticatedContractPost = authHeader
    ? await statusFor(`${siteUrl}/api/blog`, {
        method: 'POST',
        redirect: 'manual',
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/json',
        },
        body: '{}',
      })
    : { ok: false, error: 'missing blog credentials' };

  const checks = {
    dns: dnsResult.ok,
    canonicalGet: canonicalGet.status === 200,
    canonicalHostIsWww: canonicalUrl.hostname.startsWith('www.'),
    apexRedirectsToCanonical:
      apexSiteUrl === siteUrl ||
      ([301, 302, 307, 308].includes(apexHead.status) &&
        typeof apexHead.location === 'string' &&
        apexHead.location.startsWith(siteUrl)),
    unauthorizedPostIsProtected:
      unauthorizedPost.status === 401 && unauthorizedPost.wwwAuthenticate?.includes('Blog API'),
    outputsWritable: await canWrite(outputsDir),
    localRunDirWritable: await canWrite(runDir),
    memoryWritable: await canAppendFile(memoryFile),
    hasBlogCredentials: Boolean(authHeader),
    credentialsAcceptedWithoutPublishing: authenticatedContractPost.status === 400,
    hasReplayScript: await fileExists(path.join(runDir, 'replay_post.sh')),
    hasPayloads: await fileExists(path.join(runDir, 'payloads_pendientes.json')),
  };

  const requiredForReplay = [
    'dns',
    'canonicalGet',
    'canonicalHostIsWww',
    'unauthorizedPostIsProtected',
    'outputsWritable',
    'memoryWritable',
    'hasBlogCredentials',
    'credentialsAcceptedWithoutPublishing',
  ];

  const missing = requiredForReplay.filter((key) => !checks[key]);
  const readyForReplay = missing.length === 0;

  const result = {
    ok: readyForReplay,
    status: readyForReplay ? 'ready_for_umsa_replay' : 'preflight_incomplete',
    siteUrl,
    outputsDir,
    memoryFile,
    runDir,
    checks,
    missing,
    details: {
      dns: dnsResult,
      canonicalGet,
      apexHead,
      unauthorizedPost,
      authenticatedContractPost,
    },
  };

  try {
    await fs.mkdir(outputsDir, { recursive: true });
    await fs.writeFile(
      path.join(outputsDir, 'preflight-ultimo.json'),
      `${JSON.stringify({ ...result, checkedAt: new Date().toISOString() }, null, 2)}\n`,
      'utf8'
    );
  } catch {
    // In read-only sandboxes stdout is the only available diagnostic channel.
  }

  console.log(JSON.stringify(result, null, 2));
  process.exit(readyForReplay ? 0 : 2);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : error);
  process.exit(1);
});
