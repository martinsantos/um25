#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import readline from 'node:readline';

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    args[key] = next && !next.startsWith('--') ? next : true;
    if (args[key] !== true) i += 1;
  }
  return args;
}

function requiredArg(args, key) {
  const value = args[key];
  if (!value || value === true) throw new Error(`Missing required --${key}`);
  return String(value);
}

function codexHome() {
  return process.env.CODEX_HOME || path.join(os.homedir(), '.codex');
}

function walkJsonl(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkJsonl(full, out);
    else if (entry.isFile() && entry.name.endsWith('.jsonl')) out.push(full);
  }
  return out;
}

function recentSessionFiles() {
  const sessionsDir = path.join(codexHome(), 'sessions');
  const files = walkJsonl(sessionsDir);
  if (files.length === 0) throw new Error(`No session JSONL files under ${sessionsDir}`);
  return files
    .map((file) => ({ file, mtimeMs: fs.statSync(file).mtimeMs }))
    .sort((a, b) => b.mtimeMs - a.mtimeMs)
    .map(({ file }) => file);
}

function latestSessionFile() {
  return recentSessionFiles()[0];
}

function imagePayload(item) {
  const payload = item?.payload;
  if (!payload) return null;
  if (payload.type !== 'image_generation_call' && payload.type !== 'image_generation_end') return null;
  if (typeof payload.result !== 'string' || !payload.result.startsWith('iVBOR')) return null;
  return payload;
}

async function extract({ session, contains, out }) {
  const stream = fs.createReadStream(session, { encoding: 'utf8' });
  const rows = readline.createInterface({ input: stream, crlfDelay: Infinity });
  let selected = null;
  let index = 0;

  for await (const line of rows) {
    index += 1;
    if (!line.trim()) continue;

    let item;
    try {
      item = JSON.parse(line);
    } catch {
      continue;
    }

    const payload = imagePayload(item);
    if (!payload) continue;
    const haystack = [
      payload.id,
      payload.call_id,
      payload.revised_prompt,
    ].filter(Boolean).join('\n');
    if (contains && !haystack.includes(contains)) continue;
    selected = { row: { index }, payload };
  }

  if (!selected) {
    throw new Error(`No image_generation result found in ${session}${contains ? ` containing ${JSON.stringify(contains)}` : ''}`);
  }

  fs.mkdirSync(path.dirname(out), { recursive: true });
  const bytes = Buffer.from(selected.payload.result, 'base64');
  fs.writeFileSync(out, bytes);
  return {
    session,
    line: selected.row.index,
    source: selected.payload.id || selected.payload.call_id,
    status: selected.payload.status,
    out,
    bytes: fs.statSync(out).size,
  };
}

const args = parseArgs(process.argv.slice(2));
const session = args.session ? String(args.session) : latestSessionFile();
const out = requiredArg(args, 'out');
const contains = args.contains && args.contains !== true ? String(args.contains) : '';
let result;
let lastError;
const sessions = args.session ? [session] : recentSessionFiles().slice(0, 12);
for (const candidate of sessions) {
  try {
    result = await extract({ session: candidate, contains, out });
    break;
  } catch (error) {
    lastError = error;
  }
}
if (!result) throw lastError;
console.log(JSON.stringify(result, null, 2));
