#!/usr/bin/env node
/**
 * Verify local PNG recovery candidates and produce a review tarball outside
 * the repository. This script is intentionally offline; it only reads the
 * manifest, image map and local files.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import sharp from 'sharp';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const manifestRelative = 'docs/propuesta/directus-assets-recuperacion-20261101.json';
const mapRelative = 'src/data/image-local-map.json';
const manifestPath = path.join(repoRoot, manifestRelative);
const imageMapPath = path.join(repoRoot, mapRelative);

function fail(message) {
  throw new Error(message);
}

function inside(child, parent) {
  const relative = path.relative(parent, child);
  return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative));
}

function sha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

async function validateAsset(asset, imageMap) {
  const required = ['id', 'service', 'filenameDisk', 'filenameDownload', 'path', 'publicPath',
    'bytes', 'sha256', 'mime', 'width', 'height', 'directusMetadata'];
  for (const key of required) {
    if (!(key in asset)) fail(`${asset.id ?? 'asset'}: missing manifest field ${key}`);
  }
  if (asset.mime !== 'image/png') fail(`${asset.id}: candidate MIME must be image/png`);
  if (asset.directusMetadata.mime !== 'image/jpeg' || !asset.filenameDownload.endsWith('.jpg')) {
    fail(`${asset.id}: expected recorded Directus JPEG metadata and .jpg download name`);
  }
  if (asset.filenameDisk !== `${asset.id}.jpg`) fail(`${asset.id}: unexpected Directus disk filename`);

  const relative = path.normalize(asset.path);
  if (path.isAbsolute(relative) || relative.startsWith(`..${path.sep}`) || relative === '..') {
    fail(`${asset.id}: source path must be repository-relative`);
  }
  const source = path.resolve(repoRoot, relative);
  const publicRoot = fs.realpathSync(path.join(repoRoot, 'public'));
  const realSource = fs.realpathSync(source);
  if (!inside(realSource, publicRoot) || !fs.statSync(realSource).isFile()) {
    fail(`${asset.id}: candidate must be a regular file under public/`);
  }
  const expectedPublicPath = `/${path.posix.relative('public', asset.path.split(path.sep).join('/'))}`;
  if (asset.publicPath !== expectedPublicPath) fail(`${asset.id}: publicPath does not match source path`);
  if (imageMap[asset.id] !== asset.publicPath) fail(`${asset.id}: image-local-map.json points elsewhere`);

  const bytes = fs.readFileSync(realSource);
  const digest = sha256(bytes);
  if (bytes.byteLength !== asset.bytes || bytes.byteLength !== asset.directusMetadata.bytes) {
    fail(`${asset.id}: source byte count differs from manifest or live metadata`);
  }
  if (digest !== asset.sha256) fail(`${asset.id}: SHA-256 mismatch`);
  if (asset.width !== asset.directusMetadata.width || asset.height !== asset.directusMetadata.height) {
    fail(`${asset.id}: dimensions differ from live metadata`);
  }

  const decoded = await sharp(bytes, { failOn: 'error' }).raw().toBuffer({ resolveWithObject: true });
  if (decoded.info.format !== 'raw' || decoded.info.width !== asset.width || decoded.info.height !== asset.height) {
    fail(`${asset.id}: PNG decode dimensions or format mismatch`);
  }
  const metadata = await sharp(bytes, { failOn: 'error' }).metadata();
  if (metadata.format !== 'png' || metadata.width !== asset.width || metadata.height !== asset.height) {
    fail(`${asset.id}: actual content is not the recorded PNG`);
  }
  return { asset, source: realSource, bytes };
}

function parseBundlePath(argv) {
  const index = argv.indexOf('--bundle');
  if (index === -1 || !argv[index + 1]) fail('usage: node scripts/ops/validate_directus_asset_recovery.mjs --bundle /tmp/output.tar.gz');
  return path.resolve(argv[index + 1]);
}

function runTar(args) {
  const result = spawnSync('tar', args, { encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 });
  if (result.error) fail(`could not run tar: ${result.error.message}`);
  if (result.status !== 0) fail(`tar failed: ${(result.stderr || result.stdout).trim()}`);
  return result.stdout;
}

async function main() {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const imageMap = JSON.parse(fs.readFileSync(imageMapPath, 'utf8'));
  if (!Array.isArray(manifest.assets) || manifest.assets.length !== 8) fail('manifest must contain exactly eight assets');
  const ids = manifest.assets.map(({ id }) => id);
  if (new Set(ids).size !== 8) fail('manifest contains duplicate asset IDs');

  const verified = [];
  for (const asset of manifest.assets) verified.push(await validateAsset(asset, imageMap));

  const bundlePath = parseBundlePath(process.argv.slice(2));
  if (inside(bundlePath, repoRoot)) fail('bundle output must be outside the repository');
  if (fs.existsSync(bundlePath)) fail('bundle output already exists; choose a new path');
  fs.mkdirSync(path.dirname(bundlePath), { recursive: true });

  const members = [manifestRelative, ...manifest.assets.map(({ path: assetPath }) => assetPath)];
  let created = false;
  try {
    runTar(['-czf', bundlePath, '-C', repoRoot, ...members]);
    created = true;

    const listing = runTar(['-tzf', bundlePath]).trim().split('\n').filter(Boolean).sort();
    if (JSON.stringify(listing) !== JSON.stringify([...members].sort())) fail('bundle member list differs from manifest');

    for (const { asset } of verified) {
      const output = spawnSync('tar', ['-xOzf', bundlePath, asset.path], { encoding: null, maxBuffer: asset.bytes + 1024 });
      if (output.error || output.status !== 0) fail(`could not read ${asset.path} back from bundle`);
      if (output.stdout.byteLength !== asset.bytes || sha256(output.stdout) !== asset.sha256) {
        fail(`${asset.id}: bundled bytes do not match source hash`);
      }
      const decoded = await sharp(output.stdout, { failOn: 'error' }).raw().toBuffer({ resolveWithObject: true });
      if (decoded.info.width !== asset.width || decoded.info.height !== asset.height) {
        fail(`${asset.id}: bundled PNG does not decode to the expected dimensions`);
      }
    }
  } catch (error) {
    if (created) fs.rmSync(bundlePath, { force: true });
    throw error;
  }

  console.log(`Verified ${verified.length} local PNG candidates, hashes, decode, and image-map links.`);
  console.log(`Bundle: ${bundlePath} (${fs.statSync(bundlePath).size} bytes)`);
  console.log('No Directus request, credentials, or server writes were used.');
  console.log('Source hashes identify local PNGs; no hash comparison to the missing Directus bytes is possible.');
}

main().catch((error) => {
  console.error(`ERROR: ${error.message}`);
  process.exitCode = 1;
});
