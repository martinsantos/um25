#!/usr/bin/env node
/**
 * Build script for GitHub Pages preview deployment.
 * Temporarily disables SSR-only pages (API routes, server endpoints)
 * then builds with static output config.
 */
import { execSync } from 'node:child_process';
import { readdirSync, renameSync, existsSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const PAGES_DIR = join(process.cwd(), 'src/pages');
const renamed = [];

/**
 * Find all .ts files in src/pages that export APIRoute handlers
 * and temporarily rename them with ._preview_disabled suffix
 */
function findAndDisableSSRFiles(dir) {
  if (!existsSync(dir)) return;

  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      // Skip directories starting with _
      if (!entry.name.startsWith('_')) {
        findAndDisableSSRFiles(fullPath);
      }
      continue;
    }

    // Only check .ts files (API routes)
    if (!entry.name.endsWith('.ts')) continue;
    // Skip .css.ts files
    if (entry.name.endsWith('.css.ts')) continue;

    try {
      const content = readFileSync(fullPath, 'utf-8');
      // Check if it's an API route (has APIRoute or prerender = false)
      if (content.includes('APIRoute') || content.includes('prerender = false')) {
        const disabledPath = fullPath + '._preview_disabled';
        renameSync(fullPath, disabledPath);
        renamed.push({ from: disabledPath, to: fullPath });
        const rel = relative(process.cwd(), fullPath);
        console.log(`[preview] Disabled SSR page: ${rel}`);
      }
    } catch (e) {
      // Skip files we can't read
    }
  }
}

findAndDisableSSRFiles(PAGES_DIR);
console.log(`[preview] Disabled ${renamed.length} SSR-only pages`);

try {
  execSync('npx astro build --config astro.config.preview.mjs', {
    stdio: 'inherit',
    env: { ...process.env, PUBLIC_DIRECTUS_URL: '' }
  });
  console.log('[preview] Build completed successfully');
} finally {
  // Restore all renamed files
  for (const { from, to } of renamed) {
    if (existsSync(from)) {
      renameSync(from, to);
    }
  }
  console.log(`[preview] Restored ${renamed.length} SSR pages`);
}
