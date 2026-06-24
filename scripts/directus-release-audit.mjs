#!/usr/bin/env node

const DEFAULT_BASE_URL = 'https://www.ultimamilla.com.ar';
const QUERY_FIXTURE = 'mendoza';

function argValue(name, fallback) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] || fallback : fallback;
}

function assert(condition, message, failures) {
  if (!condition) failures.push(message);
}

async function fetchJson(url, failures, options = {}) {
  try {
    const response = await fetch(url, { redirect: 'follow', ...options });
    assert(response.ok, `${url} returned ${response.status}`, failures);
    if (!response.ok) return null;
    return response.json();
  } catch (error) {
    failures.push(`${url} fetch failed: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

function isCanonicalUrl(value, baseUrl) {
  return typeof value === 'string' && value.startsWith(baseUrl);
}

async function main() {
  const baseUrl = argValue('--base-url', DEFAULT_BASE_URL).replace(/\/$/, '');
  const failures = [];

  const health = await fetchJson(new URL('/api/monitoring/health', baseUrl).toString(), failures);
  const articles = await fetchJson(new URL('/api/get-articles', baseUrl).toString(), failures);
  const cliRealOnly = await fetchJson(new URL('/api/cli/query-real-only', baseUrl).toString(), failures, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ query: QUERY_FIXTURE }),
  });
  const cliDirectus = await fetchJson(new URL('/api/cli/query-directus', baseUrl).toString(), failures, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ query: QUERY_FIXTURE }),
  });

  if (!health || !articles || !cliRealOnly || !cliDirectus) {
    console.error(JSON.stringify({ ok: false, baseUrl, failures }, null, 2));
    process.exit(1);
  }

  assert(health.success === true, 'health endpoint did not return success=true', failures);
  assert(health.status === 'healthy', `health endpoint status expected healthy but got ${health.status}`, failures);
  assert(health.services?.astro === 'online', `health endpoint astro expected online but got ${health.services?.astro}`, failures);
  assert(health.services?.directus === 'online', `health endpoint directus expected online but got ${health.services?.directus}`, failures);

  assert(articles.success === true, 'get-articles did not return success=true', failures);
  assert(Array.isArray(articles.data), 'get-articles data is not an array', failures);
  assert((articles.data?.length ?? 0) > 0, 'get-articles returned no articles', failures);
  assert(typeof articles.data?.[0]?.slug === 'string' && articles.data[0].slug.length > 0, 'first article is missing slug', failures);
  assert(typeof articles.data?.[0]?.titulo === 'string' && articles.data[0].titulo.length > 0, 'first article is missing titulo', failures);

  assert(Array.isArray(cliRealOnly.results), 'cli/query-real-only results is not an array', failures);
  assert((cliRealOnly.results?.length ?? 0) > 0, 'cli/query-real-only returned no results for mendoza', failures);
  assert(cliRealOnly.meta?.source === 'directus_real_data_only', `cli/query-real-only meta.source expected directus_real_data_only but got ${cliRealOnly.meta?.source}`, failures);
  assert(cliRealOnly.results.every((result) => isCanonicalUrl(result.url, baseUrl)), 'cli/query-real-only returned non-canonical URLs', failures);

  assert(Array.isArray(cliDirectus.results), 'cli/query-directus results is not an array', failures);
  assert((cliDirectus.results?.length ?? 0) > 0, 'cli/query-directus returned no results for mendoza', failures);
  assert(cliDirectus.meta?.source === 'directus_real_data', `cli/query-directus meta.source expected directus_real_data but got ${cliDirectus.meta?.source}`, failures);
  assert((cliDirectus.total_found ?? 0) > 0, `cli/query-directus total_found expected > 0 but got ${cliDirectus.total_found}`, failures);
  assert((cliDirectus.total_servicios ?? 0) > 0 || (cliDirectus.total_antecedentes ?? 0) > 0, 'cli/query-directus returned no servicio/antecedente counts', failures);
  assert(cliDirectus.results.every((result) => isCanonicalUrl(result.url, baseUrl)), 'cli/query-directus returned non-canonical URLs', failures);

  if (failures.length > 0) {
    console.error(JSON.stringify({ ok: false, baseUrl, failures }, null, 2));
    process.exit(1);
  }

  console.log(JSON.stringify({
    ok: true,
    baseUrl,
    query: QUERY_FIXTURE,
    summaries: {
      articles: articles.data.length,
      cliRealOnly: cliRealOnly.results.length,
      cliDirectus: cliDirectus.results.length,
    },
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : error);
  process.exit(1);
});
