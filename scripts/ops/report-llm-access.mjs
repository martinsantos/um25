#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

const DEFAULT_PATTERN = '/var/log/nginx/ultimamilla-llm-access.log*';
const LLM_REFERRERS = [
  'chatgpt.com',
  'claude.ai',
  'perplexity.ai',
  'copilot.microsoft.com',
  'gemini.google.com',
  'poe.com',
  'you.com',
];

function expandPattern(pattern) {
  if (!pattern.includes('*')) {
    return fs.existsSync(pattern) ? [pattern] : [];
  }

  const directory = path.dirname(pattern);
  const base = path.basename(pattern);
  const [prefix, suffix = ''] = base.split('*');

  if (!fs.existsSync(directory)) {
    return [];
  }

  return fs.readdirSync(directory)
    .filter((file) => file.startsWith(prefix) && file.endsWith(suffix))
    .map((file) => path.join(directory, file))
    .sort();
}

function readLogFile(filePath) {
  const buffer = fs.readFileSync(filePath);
  if (filePath.endsWith('.gz')) {
    return zlib.gunzipSync(buffer).toString('utf8');
  }
  return buffer.toString('utf8');
}

function addCount(map, key) {
  if (!key) {
    return;
  }
  map.set(key, (map.get(key) || 0) + 1);
}

function sortedEntries(map) {
  return [...map.entries()].sort((left, right) => {
    if (right[1] !== left[1]) {
      return right[1] - left[1];
    }
    return left[0].localeCompare(right[0]);
  });
}

function detectReferrer(record) {
  if (record.llm_referer) {
    return record.llm_referer;
  }

  const referer = record.http_referer || '';
  const match = LLM_REFERRERS.find((domain) => referer.includes(domain));
  return match || '';
}

function printSection(title, entries, limit = 20) {
  console.log(title);
  if (entries.length === 0) {
    console.log('none 0');
    console.log('');
    return;
  }

  entries.slice(0, limit).forEach(([key, count]) => {
    console.log(`${key} ${count}`);
  });
  console.log('');
}

const inputPatterns = process.argv.slice(2);
const patterns = inputPatterns.length > 0
  ? inputPatterns
  : (process.env.LOG_GLOB ? process.env.LOG_GLOB.split(/\s+/).filter(Boolean) : [DEFAULT_PATTERN]);
const files = [...new Set(patterns.flatMap(expandPattern))];

const byBot = new Map();
const byPath = new Map();
const geoResources = new Map();
const referrals = new Map();
let total = 0;
let invalid = 0;

for (const filePath of files) {
  const lines = readLogFile(filePath).split(/\r?\n/).filter(Boolean);

  for (const line of lines) {
    let record;
    try {
      record = JSON.parse(line);
    } catch {
      invalid += 1;
      continue;
    }

    total += 1;
    addCount(byBot, record.llm_bot || 'llm-referral');
    addCount(byPath, record.uri || record.path || record.request_uri);

    const uri = record.uri || '';
    if (uri === '/llms.txt' || uri === '/llms-full.txt' || uri.startsWith('/geo/') || uri === '/sitemap-geo.xml') {
      addCount(geoResources, uri);
    }

    addCount(referrals, detectReferrer(record));
  }
}

console.log(`Files ${files.length}`);
console.log(`Requests ${total}`);
console.log(`Invalid lines ${invalid}`);
console.log('');
printSection('LLM bot requests by bot', sortedEntries(byBot));
printSection('LLM bot requests by path', sortedEntries(byPath));
printSection('GEO resource requests', sortedEntries(geoResources));
printSection('LLM referral requests', sortedEntries(referrals));
