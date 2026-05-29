/**
 * Suite E2E visual UMSA — strict comercial + heurística + defectos + contratos Jest.
 * Requiere: npm run dev -- --port 4321
 */
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const OUT_DIR = process.env.E2E_VISUAL_OUT_DIR || 'docs/audits/e2e-visual-latest';
const BASE = process.env.VISUAL_AUDIT_BASE_URL || 'http://localhost:4321';

function run(command, args, env = {}) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd: process.cwd(),
      env: { ...process.env, ...env },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (c) => { stdout += c; });
    child.stderr.on('data', (c) => { stderr += c; });
    child.on('close', (code) => resolve({ code, stdout, stderr }));
  });
}

async function checkDev() {
  try {
    const res = await fetch(`${BASE}/`);
    return res.ok;
  } catch {
    return false;
  }
}

const summary = {
  generatedAt: new Date().toISOString(),
  baseUrl: BASE,
  layers: {},
};

await mkdir(OUT_DIR, { recursive: true });

if (!(await checkDev())) {
  console.error(`Dev server no responde en ${BASE}. Ejecutá: npm run dev -- --port 4321`);
  process.exit(1);
}

// 1) Strict comercial aislado (DESIGN.md compuerta principal)
process.stderr.write('\n=== Capa 1: audit:visual:commercial (strict) ===\n');
const commercial = await run('node', ['scripts/run-commercial-visual-audit.mjs'], {
  VISUAL_AUDIT_BASE_URL: BASE,
  VISUAL_AUDIT_REPORT_DIR: join(OUT_DIR, 'strict-commercial'),
});
let commercialJson = { failureCount: -1, failures: ['parse error'] };
try {
  const start = commercial.stdout.indexOf('{');
  commercialJson = start >= 0 ? JSON.parse(commercial.stdout.slice(start)) : commercialJson;
} catch { /* keep */ }
summary.layers.commercialStrict = {
  exitCode: commercial.code,
  ...commercialJson,
};

// 2) Heurística (fill-black, emoji, markdown, bordes producto)
process.stderr.write('\n=== Capa 2: heuristic-visual-scan ===\n');
const heuristic = await run('node', ['scripts/heuristic-visual-scan.mjs'], {
  VISUAL_AUDIT_BASE_URL: BASE,
  HEURISTIC_OUT: join(OUT_DIR, 'heuristic-matrix.json'),
});
let heuristicRows = [];
try {
  heuristicRows = JSON.parse(heuristic.stdout);
} catch { /* */ }
const heuristicDefects = heuristicRows.filter((r) => r.status === 'DEFECTO');
summary.layers.heuristic = {
  exitCode: heuristic.code,
  total: heuristicRows.length,
  defectos: heuristicDefects.length,
  mejorables: heuristicRows.filter((r) => r.status === 'MEJORABLE').length,
  failures: heuristicDefects.map((r) => `${r.path}: ${r.defects?.join(', ')}`),
};

// 3) Defect scan complementario
process.stderr.write('\n=== Capa 3: e2e-defect-scan ===\n');
const defect = await run('node', ['scripts/e2e-defect-scan.mjs'], {
  VISUAL_AUDIT_BASE_URL: BASE,
});
let defectRows = [];
try {
  defectRows = JSON.parse(defect.stdout);
} catch { /* */ }
const defectFails = defectRows.filter((r) => r.status === 'DEFECTO');
summary.layers.defectScan = {
  exitCode: defect.code,
  total: defectRows.length,
  defectos: defectFails.length,
  failures: defectFails.map((r) => `${r.path}: ${r.defects?.join(', ')}`),
};

// 4) Contratos CSS hub (Jest)
process.stderr.write('\n=== Capa 4: visualInformationHubContracts (jest) ===\n');
const jest = await run('npx', ['jest', '--config=jest.config.cjs', '__tests__/visualInformationHubContracts.test.js', '--runInBand'], {});
summary.layers.jestContracts = {
  exitCode: jest.code,
  ok: jest.code === 0,
};

await writeFile(join(OUT_DIR, 'e2e-visual-suite-summary.json'), `${JSON.stringify(summary, null, 2)}\n`);

const totalFailures =
  (summary.layers.commercialStrict.failureCount || 0) +
  summary.layers.heuristic.defectos +
  summary.layers.defectScan.defectos +
  (summary.layers.jestContracts.ok ? 0 : 1);

console.log(JSON.stringify({
  outDir: OUT_DIR,
  totalFailures,
  summary: {
    commercialStrict: summary.layers.commercialStrict.failureCount,
    heuristicDefectos: summary.layers.heuristic.defectos,
    defectScanDefectos: summary.layers.defectScan.defectos,
    jestContracts: summary.layers.jestContracts.ok,
  },
  failures: [
    ...(summary.layers.commercialStrict.failures || []),
    ...summary.layers.heuristic.failures,
    ...summary.layers.defectScan.failures,
  ],
}, null, 2));

process.exit(totalFailures > 0 ? 1 : 0);
