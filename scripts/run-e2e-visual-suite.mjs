/**
 * Suite E2E visual UMSA — strict comercial + heurística + defectos + contratos Jest.
 * Requiere: npm run dev -- --port 4321
 */
import { spawn } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const OUT_DIR = process.env.E2E_VISUAL_OUT_DIR || 'docs/audits/e2e-visual-latest';
const BASE = process.env.VISUAL_AUDIT_BASE_URL || 'http://localhost:4321';
const REPLICA_ENV = {
  UMSA_LOCAL_REPLICA: process.env.UMSA_LOCAL_REPLICA || '1',
  UMSA_REPLICA_IDENTICAL: process.env.UMSA_REPLICA_IDENTICAL || '1',
};

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

function isTransientCdpFailure(result) {
  const output = `${result?.stdout || ''}\n${result?.stderr || ''}`;
  return /CDP timeout|CDP not ready|Page\.navigate|Emulation\.setDeviceMetricsOverride/i.test(output);
}

async function runWithRetry(command, args, env = {}, options = {}) {
  const attempts = Number(options.attempts || 3);
  let lastResult = null;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    lastResult = await run(command, args, env);
    if (lastResult.code === 0) return lastResult;
    if (!isTransientCdpFailure(lastResult) || attempt === attempts) return lastResult;
    process.stderr.write(`Retrying ${args.join(' ')} after transient CDP failure (${attempt}/${attempts})...\n`);
  }

  return lastResult;
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

async function readJsonFile(path, fallback) {
  try {
    return JSON.parse(await readFile(path, 'utf8'));
  } catch {
    return fallback;
  }
}

if (!(await checkDev())) {
  console.error(`Dev server no responde en ${BASE}. Ejecutá: npm run dev -- --port 4321`);
  process.exit(1);
}

// 1) Strict comercial aislado (DESIGN.md compuerta principal)
process.stderr.write('\n=== Capa 1: audit:visual:commercial (strict) ===\n');
const commercial = await run('node', ['scripts/run-commercial-visual-audit.mjs'], {
  VISUAL_AUDIT_BASE_URL: BASE,
  VISUAL_AUDIT_REPORT_DIR: join(OUT_DIR, 'strict-commercial'),
  ...REPLICA_ENV,
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
const heuristicOut = join(OUT_DIR, 'heuristic-matrix.json');
const heuristic = await run('node', ['scripts/heuristic-visual-scan.mjs'], {
  VISUAL_AUDIT_BASE_URL: BASE,
  HEURISTIC_OUT: heuristicOut,
});
const heuristicRows = await readJsonFile(heuristicOut, []);
const heuristicDefects = heuristicRows.filter((r) => r.status === 'DEFECTO');
summary.layers.heuristic = {
  exitCode: heuristic.code,
  total: heuristicRows.length,
  defectos: heuristicDefects.length,
  mejorables: heuristicRows.filter((r) => r.status === 'MEJORABLE').length,
  failures: [
    ...heuristicDefects.map((r) => `${r.path}: ${r.defects?.join(', ')}`),
    ...(heuristic.code !== 0 && heuristicDefects.length === 0
      ? [`heuristic-visual-scan exit ${heuristic.code}: ${heuristic.stderr || 'sin stderr'}`]
      : []),
    ...(heuristicRows.length === 0
      ? ['heuristic-visual-scan no produjo filas auditables']
      : []),
  ],
};

// 3) Layout detalle antecedente (miniatura servicio, proporción tipográfica)
process.stderr.write('\n=== Capa 3: antecedente-detail-layout-audit ===\n');
const caseLayout = await run('node', ['scripts/antecedente-detail-layout-audit.mjs'], {
  VISUAL_AUDIT_BASE_URL: BASE,
  ANTECEDENTE_LAYOUT_REPORT: join(OUT_DIR, 'antecedente-detail-layout.json'),
  ...REPLICA_ENV,
});
let caseLayoutJson = { failureCount: -1, failures: ['parse error'] };
try {
  const start = caseLayout.stdout.lastIndexOf('{');
  caseLayoutJson = start >= 0 ? JSON.parse(caseLayout.stdout.slice(start)) : caseLayoutJson;
} catch { /* keep */ }
if (caseLayout.code !== 0 && caseLayoutJson.failureCount === -1) {
  caseLayoutJson = { failureCount: 1, failures: [`antecedente-detail-layout exit ${caseLayout.code}`] };
}
summary.layers.antecedenteDetailLayout = {
  exitCode: caseLayout.code,
  failureCount: caseLayoutJson.failureCount ?? -1,
  failures: caseLayoutJson.failures || [],
};

// 4) Defect scan complementario
process.stderr.write('\n=== Capa 4: e2e-defect-scan ===\n');
const defect = await runWithRetry('node', ['scripts/e2e-defect-scan.mjs'], {
  VISUAL_AUDIT_BASE_URL: BASE,
});
let defectRows = [];
let defectParseOk = true;
try {
  defectRows = JSON.parse(defect.stdout);
} catch {
  defectParseOk = false;
}
const defectFails = defectRows.filter((r) => r.status === 'DEFECTO');
summary.layers.defectScan = {
  exitCode: defect.code,
  total: defectRows.length,
  defectos: defectFails.length,
  failures: [
    ...defectFails.map((r) => `${r.path}: ${r.defects?.join(', ')}`),
    ...(!defectParseOk ? [`e2e-defect-scan no emitió JSON parseable: ${defect.stderr || 'sin stderr'}`] : []),
    ...(defect.code !== 0 && defectFails.length === 0
      ? [`e2e-defect-scan exit ${defect.code}: ${defect.stderr || 'sin stderr'}`]
      : []),
  ],
};

// 5) Contratos CSS hub (Jest)
process.stderr.write('\n=== Capa 5: visualInformationHubContracts (jest) ===\n');
const jest = await run('npx', ['jest', '--config=jest.config.cjs', '__tests__/visualInformationHubContracts.test.js', '--runInBand'], {});
summary.layers.jestContracts = {
  exitCode: jest.code,
  ok: jest.code === 0,
};

await writeFile(join(OUT_DIR, 'e2e-visual-suite-summary.json'), `${JSON.stringify(summary, null, 2)}\n`);

const layoutFailures =
  summary.layers.antecedenteDetailLayout.failureCount > 0
    ? summary.layers.antecedenteDetailLayout.failureCount
    : summary.layers.antecedenteDetailLayout.exitCode !== 0
      ? 1
      : 0;
const totalFailures =
  (summary.layers.commercialStrict.failureCount || 0) +
  summary.layers.heuristic.failures.length +
  layoutFailures +
  summary.layers.defectScan.failures.length +
  (summary.layers.jestContracts.ok ? 0 : 1);

console.log(JSON.stringify({
  outDir: OUT_DIR,
  totalFailures,
  summary: {
    commercialStrict: summary.layers.commercialStrict.failureCount,
    heuristicDefectos: summary.layers.heuristic.defectos,
    antecedenteDetailLayout: summary.layers.antecedenteDetailLayout.failureCount,
    defectScanDefectos: summary.layers.defectScan.defectos,
    jestContracts: summary.layers.jestContracts.ok,
  },
  failures: [
    ...(summary.layers.commercialStrict.failures || []),
    ...summary.layers.heuristic.failures,
    ...(summary.layers.antecedenteDetailLayout.failures || []),
    ...summary.layers.defectScan.failures,
  ],
}, null, 2));

process.exit(totalFailures > 0 ? 1 : 0);
