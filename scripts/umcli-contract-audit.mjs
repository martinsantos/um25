#!/usr/bin/env node

const DEFAULT_BASE_URL = 'https://www.ultimamilla.com.ar';

function argValue(name, fallback) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] || fallback : fallback;
}

function assert(condition, message, failures) {
  if (!condition) failures.push(message);
}

async function fetchJson(url, failures) {
  try {
    const response = await fetch(url, { redirect: 'follow' });
    assert(response.ok, `${url} returned ${response.status}`, failures);
    if (!response.ok) return null;
    return response.json();
  } catch (error) {
    failures.push(`${url} fetch failed: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

function hasLegacyAliases(record, fields) {
  if (!record || typeof record !== 'object') return false;
  return fields.every((field) => typeof record[field] === 'string' && record[field].length > 0);
}

async function main() {
  const baseUrl = argValue('--base-url', DEFAULT_BASE_URL).replace(/\/$/, '');
  const failures = [];

  const umcli = await fetchJson(new URL('/api/umcli.json', baseUrl).toString(), failures);
  const imageEvidence = await fetchJson(new URL('/geo/image-evidence.json', baseUrl).toString(), failures);

  if (!umcli || !imageEvidence) {
    console.error(JSON.stringify({ ok: false, baseUrl, failures }, null, 2));
    process.exit(1);
  }

  const stats = umcli?.data?.estadisticas ?? {};
  const servicios = umcli?.data?.servicios ?? [];
  const antecedentes = umcli?.data?.antecedentes ?? [];
  const blogPosts = umcli?.data?.blog_posts ?? umcli?.data?.blogPosts ?? [];
  const expectedAntecedentes = imageEvidence?.coverage?.totalAntecedentes;

  assert(umcli.success === true, '/api/umcli.json did not return success=true', failures);
  assert(Number.isInteger(stats.totalServicios) && stats.totalServicios > 0, 'umcli totalServicios must be a positive integer', failures);
  assert(Number.isInteger(stats.totalAntecedentes) && stats.totalAntecedentes > 0, 'umcli totalAntecedentes must be a positive integer', failures);
  assert(Number.isInteger(stats.totalCasosExito) && stats.totalCasosExito > 0, 'umcli totalCasosExito must be a positive integer', failures);
  assert(Number.isInteger(stats.totalBlogPosts) && stats.totalBlogPosts > 0, 'umcli totalBlogPosts must be a positive integer', failures);
  assert(servicios.length === stats.totalServicios, `umcli servicios length ${servicios.length} does not match totalServicios ${stats.totalServicios}`, failures);
  assert(antecedentes.length === stats.totalAntecedentes, `umcli antecedentes length ${antecedentes.length} does not match totalAntecedentes ${stats.totalAntecedentes}`, failures);
  assert(Array.isArray(umcli?.data?.blog_posts) || Array.isArray(umcli?.data?.blogPosts), 'umcli is missing blog_posts/blogPosts array', failures);
  assert(blogPosts.length === stats.totalBlogPosts, `umcli blogPosts length ${blogPosts.length} does not match totalBlogPosts ${stats.totalBlogPosts}`, failures);
  assert(stats.totalAntecedentes === expectedAntecedentes, `umcli totalAntecedentes ${stats.totalAntecedentes} does not match GEO image-evidence totalAntecedentes ${expectedAntecedentes}`, failures);
  assert(stats.totalCasosExito === expectedAntecedentes, `umcli totalCasosExito ${stats.totalCasosExito} does not match GEO image-evidence totalAntecedentes ${expectedAntecedentes}`, failures);
  assert(hasLegacyAliases(servicios[0], ['titulo', 'nombre', 'descripcion', 'area']), 'first UMCLI service is missing legacy aliases titulo/nombre/descripcion/area', failures);
  assert(hasLegacyAliases(antecedentes[0], ['titulo', 'nombre', 'resumen', 'fecha_publicacion', 'cliente', 'area']), 'first UMCLI antecedente is missing legacy aliases titulo/nombre/resumen/fecha_publicacion/cliente/area', failures);

  if (failures.length > 0) {
    console.error(JSON.stringify({ ok: false, baseUrl, failures }, null, 2));
    process.exit(1);
  }

  console.log(JSON.stringify({
    ok: true,
    baseUrl,
    totals: {
      totalServicios: stats.totalServicios,
      totalAntecedentes: stats.totalAntecedentes,
      totalCasosExito: stats.totalCasosExito,
      totalBlogPosts: stats.totalBlogPosts,
    },
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : error);
  process.exit(1);
});
