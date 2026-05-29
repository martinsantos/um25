/**
 * Commercial strict audit — one route/viewport per Chrome process (DESIGN.md gate).
 */
import { spawn } from 'node:child_process';
import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { COMMERCIAL_E2E_LABELS } from './e2e-commercial-labels.mjs';

const commercialRoutes = COMMERCIAL_E2E_LABELS;

const viewports = process.env.VISUAL_AUDIT_E2E_VIEWPORTS
  ? process.env.VISUAL_AUDIT_E2E_VIEWPORTS.split(',').map((v) => v.trim())
  : ['desktop', 'mobile'];

const outDir = process.env.VISUAL_AUDIT_REPORT_DIR || 'docs/audits/umsa-closure-2026-05-29';

async function runChunk(label, viewport) {
  const filter = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new Promise((resolve, reject) => {
    const child = spawn('node', ['scripts/visual-contrast-audit.mjs', '--strict'], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        VISUAL_AUDIT_STRICT: '1',
        VISUAL_AUDIT_BASE_URL: process.env.VISUAL_AUDIT_BASE_URL || 'http://localhost:4321',
        VISUAL_AUDIT_ROUTE_FILTER: filter,
        VISUAL_AUDIT_VIEWPORT_FILTER: `^${viewport}$`,
        VISUAL_AUDIT_CDP_PORT: String(9341 + Math.floor(Math.random() * 40)),
        VISUAL_AUDIT_ROUTE_TIMEOUT_MS: '45000',
        VISUAL_AUDIT_LABEL_ONLY: '1',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stdout += chunk; });
    child.on('close', () => {
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

const allFailures = [];
const allResults = [];

for (const viewport of viewports) {
  for (const label of commercialRoutes) {
    process.stderr.write(`Auditing ${label} @ ${viewport}...\n`);
    const chunk = await runChunk(label, viewport);
    allFailures.push(...chunk.failures);
    allResults.push(...chunk.results);
  }
}

await mkdir(outDir, { recursive: true });
const report = {
  generatedAt: new Date().toISOString(),
  baseUrl: process.env.VISUAL_AUDIT_BASE_URL || 'http://localhost:4321',
  labels: commercialRoutes,
  viewports,
  checked: allResults.length,
  failures: allFailures,
  results: allResults,
};
await writeFile(join(outDir, 'audit-commercial-strict.json'), `${JSON.stringify(report, null, 2)}\n`);

console.log(JSON.stringify({ checked: report.checked, failureCount: allFailures.length, failures: allFailures }, null, 2));
process.exit(allFailures.length ? 1 : 0);
