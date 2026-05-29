#!/usr/bin/env node
/**
 * Gate réplica: preflight + paridad HTTP + audit E2E visual (hybrid, sin ?skin=white).
 */
import { spawn } from 'node:child_process';

function run(cmd, args, env = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      stdio: 'inherit',
      env: { ...process.env, UMSA_LOCAL_REPLICA: '1', ...env },
      shell: false,
    });
    child.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exit ${code}`))));
  });
}

console.log('=== Réplica gate (localhost = prod + tema hybrid) ===\n');

await run('node', ['scripts/replica-preflight.mjs']);
await run('node', ['scripts/replica-parity-check.mjs']);
await run('npm', ['run', 'audit:e2e:visual'], {
  VISUAL_AUDIT_BASE_URL: process.env.VISUAL_AUDIT_BASE_URL || 'http://localhost:4321',
});

console.log('\n✅ Réplica inapelable para pasar a producción (gate local OK)');
