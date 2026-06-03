#!/usr/bin/env node
/**
 * Compara HTTP status producción vs localhost (réplica).
 * No compara HTML byte-a-byte; detecta 404/500 divergentes.
 */
import { E2E_DEFECT_PATHS } from './e2e-commercial-labels.mjs';

const PROD = process.env.REPLICA_PROD_URL || 'https://www.ultimamilla.com.ar';
const LOCAL = process.env.REPLICA_LOCAL_URL || 'http://localhost:4321';
const paths = process.argv.length > 2 ? process.argv.slice(2) : E2E_DEFECT_PATHS;

let mismatches = 0;
let checked = 0;

async function statusFor(base, path) {
  try {
    const res = await fetch(new URL(path, base).toString(), { redirect: 'follow' });
    return res.status;
  } catch {
    return 0;
  }
}

console.log(`Paridad HTTP\n  Prod:  ${PROD}\n  Local: ${LOCAL}\n`);

for (const path of paths) {
  const [prodStatus, localStatus] = await Promise.all([
    statusFor(PROD, path),
    statusFor(LOCAL, path),
  ]);
  checked += 1;
  const ok = prodStatus === localStatus && prodStatus >= 200 && prodStatus < 400;
  const icon = ok ? '✅' : '❌';
  console.log(`${icon} ${path} — prod:${prodStatus} local:${localStatus}`);
  if (!ok) mismatches += 1;
}

console.log(`\n${checked} rutas — ${mismatches} divergencia(s)`);
if (mismatches > 0) process.exit(1);
