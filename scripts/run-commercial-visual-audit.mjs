/**
 * Commercial strict audit — one route/viewport per Chrome process (DESIGN.md gate).
 */
import { spawn } from 'node:child_process';
import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { COMMERCIAL_E2E_LABELS } from './e2e-commercial-labels.mjs';

const BASE_URL = process.env.VISUAL_AUDIT_BASE_URL || 'http://localhost:4321';
const IS_LOCAL_BASE = /^https?:\/\/(?:localhost|127\.0\.0\.1|\[::1\])(?::\d+)?(?:\/|$)/.test(BASE_URL);
const replicaEnvDefaults = {
  ...(IS_LOCAL_BASE && process.env.UMSA_LOCAL_REPLICA == null ? { UMSA_LOCAL_REPLICA: '1' } : {}),
  ...(IS_LOCAL_BASE && process.env.UMSA_REPLICA_IDENTICAL == null ? { UMSA_REPLICA_IDENTICAL: '1' } : {}),
};
const LABEL_FILTER = process.env.VISUAL_AUDIT_E2E_LABEL_FILTER
  ? new RegExp(process.env.VISUAL_AUDIT_E2E_LABEL_FILTER)
  : null;
const commercialRoutes = LABEL_FILTER
  ? COMMERCIAL_E2E_LABELS.filter((label) => LABEL_FILTER.test(label))
  : COMMERCIAL_E2E_LABELS;
const MAX_CHUNK_ATTEMPTS = Number(process.env.VISUAL_AUDIT_CHUNK_ATTEMPTS || 3);
const CHUNK_TIMEOUT_MS = Number(process.env.VISUAL_AUDIT_CHUNK_TIMEOUT_MS || 180000);
const ROUTES_PER_BATCH = Number(process.env.VISUAL_AUDIT_ROUTES_PER_BATCH || 6);
const CDP_PORT_BASE = Number(process.env.VISUAL_AUDIT_CDP_PORT_BASE || 9341);

const viewports = process.env.VISUAL_AUDIT_E2E_VIEWPORTS
  ? process.env.VISUAL_AUDIT_E2E_VIEWPORTS.split(',').map((v) => v.trim())
  : ['desktop', 'mobile'];

const outDir = process.env.VISUAL_AUDIT_REPORT_DIR || 'docs/audits/umsa-closure-2026-05-29';

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const buildRouteLabelFilter = (labels) => labels.map(escapeRegExp).join('|');

function isTransientAuditFailure(chunk) {
  const failures = chunk?.failures || [];
  if (!failures.length) return false;

  return failures.some((failure) => (
    /CDP timeout/i.test(failure) ||
    /Route audit timeout/i.test(failure) ||
    /Chrome CDP did not start/i.test(failure) ||
    /audit evaluation failed.*(?:Page\.navigate|Emulation\.setUserAgentOverride|CDP timeout|Route audit timeout)/i.test(failure) ||
    /chunk timeout after/i.test(failure) ||
    /page appears too empty/i.test(failure) ||
    /no JSON output/i.test(failure)
  ));
}

async function runViewport(viewport, labels) {
  const routeLabelFilter = buildRouteLabelFilter(labels);
  return new Promise((resolve, reject) => {
    const child = spawn('node', ['scripts/visual-contrast-audit.mjs', '--strict'], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        ...replicaEnvDefaults,
        VISUAL_AUDIT_STRICT: '1',
        VISUAL_AUDIT_BASE_URL: BASE_URL,
        VISUAL_AUDIT_ROUTE_FILTER: routeLabelFilter,
        VISUAL_AUDIT_VIEWPORT_FILTER: `^${viewport}$`,
        VISUAL_AUDIT_CDP_PORT: String(CDP_PORT_BASE + Math.floor(Math.random() * 1000)),
        VISUAL_AUDIT_CDP_TIMEOUT_MS: process.env.VISUAL_AUDIT_CDP_TIMEOUT_MS || '60000',
        VISUAL_AUDIT_ROUTE_TIMEOUT_MS: process.env.VISUAL_AUDIT_ROUTE_TIMEOUT_MS || '120000',
        VISUAL_AUDIT_LABEL_ONLY: '1',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGKILL');
    }, CHUNK_TIMEOUT_MS * Math.max(1, labels.length / ROUTES_PER_BATCH));

    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stdout += chunk; });
    child.on('close', (code, signal) => {
      clearTimeout(timer);
      if (timedOut) {
        resolve({
          label: 'commercial batch',
          viewport,
          failures: [`commercial batch/${viewport}: timeout`],
          results: []
        });
        return;
      }
      try {
        const jsonStart = stdout.indexOf('{');
        const payload = jsonStart >= 0
          ? JSON.parse(stdout.slice(jsonStart))
          : {
              failures: [`commercial batch/${viewport}: no JSON output (code ${code ?? 'n/a'}, signal ${signal ?? 'n/a'})`],
              results: [],
            };
        resolve({ label: 'commercial batch', viewport, failures: payload.failures || [], results: payload.results || [] });
      } catch (error) {
        reject(new Error(`commercial batch/${viewport}: ${error.message}\n${stdout.slice(-400)}`));
      }
    });
  });
}

async function runViewportWithRetry(viewport, labels) {
  let lastChunk = null;
  let lastError = null;

  for (let attempt = 1; attempt <= MAX_CHUNK_ATTEMPTS; attempt += 1) {
    try {
      const chunk = await runViewport(viewport, labels);
      lastChunk = chunk;
      if (!isTransientAuditFailure(chunk) || attempt === MAX_CHUNK_ATTEMPTS) {
        return chunk;
      }
      process.stderr.write(`Retrying commercial batch (${labels.length} routes) @ ${viewport} after transient audit failure (${attempt}/${MAX_CHUNK_ATTEMPTS})...\n`);
    } catch (error) {
      lastError = error;
      if (attempt === MAX_CHUNK_ATTEMPTS) throw error;
      process.stderr.write(`Retrying commercial batch @ ${viewport} after audit runner error (${attempt}/${MAX_CHUNK_ATTEMPTS})...\n`);
    }
  }

  if (lastChunk) return lastChunk;
  throw lastError || new Error(`commercial batch/${viewport}: audit retry exhausted`);
}

async function runChunk(label, viewport) {
  const filter = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new Promise((resolve, reject) => {
    const child = spawn('node', ['scripts/visual-contrast-audit.mjs', '--strict'], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        ...replicaEnvDefaults,
        VISUAL_AUDIT_STRICT: '1',
        VISUAL_AUDIT_BASE_URL: BASE_URL,
        VISUAL_AUDIT_ROUTE_FILTER: filter,
        VISUAL_AUDIT_VIEWPORT_FILTER: `^${viewport}$`,
        VISUAL_AUDIT_CDP_PORT: String(CDP_PORT_BASE + Math.floor(Math.random() * 1000)),
        VISUAL_AUDIT_CDP_TIMEOUT_MS: process.env.VISUAL_AUDIT_CDP_TIMEOUT_MS || '60000',
        VISUAL_AUDIT_ROUTE_TIMEOUT_MS: process.env.VISUAL_AUDIT_ROUTE_TIMEOUT_MS || '120000',
        VISUAL_AUDIT_LABEL_ONLY: '1',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGKILL');
    }, CHUNK_TIMEOUT_MS);

    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stdout += chunk; });
    child.on('close', () => {
      clearTimeout(timer);
      if (timedOut) {
        resolve({
          label,
          viewport,
          failures: [`${label}/${viewport}: chunk timeout after ${CHUNK_TIMEOUT_MS}ms`],
          results: []
        });
        return;
      }
      try {
        const jsonStart = stdout.indexOf('{');
        const payload = jsonStart >= 0 ? JSON.parse(stdout.slice(jsonStart)) : { failures: [`${label}/${viewport}: no JSON output`], results: [] };
        resolve({ label, viewport, failures: payload.failures || [], results: payload.results || [] });
      } catch (error) {
        reject(new Error(`${label}/${viewport}: ${error.message}\n${stdout.slice(-400)}`));
      }
    });
  });
}

async function runChunkWithRetry(label, viewport) {
  let lastChunk = null;
  let lastError = null;

  for (let attempt = 1; attempt <= MAX_CHUNK_ATTEMPTS; attempt += 1) {
    try {
      const chunk = await runChunk(label, viewport);
      lastChunk = chunk;
      if (!isTransientAuditFailure(chunk) || attempt === MAX_CHUNK_ATTEMPTS) {
        return chunk;
      }
      process.stderr.write(`Retrying ${label} @ ${viewport} after transient navigation audit failure (${attempt}/${MAX_CHUNK_ATTEMPTS})...\n`);
    } catch (error) {
      lastError = error;
      if (attempt === MAX_CHUNK_ATTEMPTS) throw error;
      process.stderr.write(`Retrying ${label} @ ${viewport} after audit runner error (${attempt}/${MAX_CHUNK_ATTEMPTS})...\n`);
    }
  }

  if (lastChunk) return lastChunk;
  throw lastError || new Error(`${label}/${viewport}: audit retry exhausted`);
}

const allFailures = [];
const allResults = [];

if (!commercialRoutes.length) {
  console.error('No commercial routes matched VISUAL_AUDIT_E2E_LABEL_FILTER.');
  process.exit(1);
}

for (const viewport of viewports) {
  for (let index = 0; index < commercialRoutes.length; index += ROUTES_PER_BATCH) {
    const labels = commercialRoutes.slice(index, index + ROUTES_PER_BATCH);
    process.stderr.write(`Auditing commercial batch ${Math.floor(index / ROUTES_PER_BATCH) + 1} @ ${viewport} (${labels.length} routes)...\n`);
    const chunk = await runViewportWithRetry(viewport, labels);
    allFailures.push(...chunk.failures);
    allResults.push(...chunk.results);
  }
}

await mkdir(outDir, { recursive: true });
const report = {
  generatedAt: new Date().toISOString(),
  baseUrl: BASE_URL,
  labels: commercialRoutes,
  viewports,
  checked: allResults.length,
  failures: allFailures,
  results: allResults,
};
await writeFile(join(outDir, 'audit-commercial-strict.json'), `${JSON.stringify(report, null, 2)}\n`);

console.log(JSON.stringify({ checked: report.checked, failureCount: allFailures.length, failures: allFailures }, null, 2));
process.exit(allFailures.length ? 1 : 0);
