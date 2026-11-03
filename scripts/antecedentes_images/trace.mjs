#!/usr/bin/env node
// Inventario verificable. No reconstruye prompts ni atribuye originales perdidos.
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';

const root = process.cwd();
const publicRoot = path.resolve(root, 'public');
const map = JSON.parse(fs.readFileSync(path.join(root, 'src/data/antecedentes-generated-image-map.json'), 'utf8'));
const photoFile = path.join(root, 'src/data/photography-manifest.json');
const photos = fs.existsSync(photoFile) ? JSON.parse(fs.readFileSync(photoFile, 'utf8')) : { cases: {}, photos: {} };
const issues = [];
const hash = (file) => createHash('sha256').update(fs.readFileSync(file)).digest('hex');
function publicFile(url) {
  if (typeof url !== 'string' || !url.startsWith('/images/') || url.includes('..')) return null;
  const file = path.resolve(publicRoot, `.${url}`);
  return file.startsWith(`${publicRoot}${path.sep}`) ? file : null;
}
function asset(url) {
  const file = publicFile(url);
  if (!file || !fs.existsSync(file) || !fs.statSync(file).isFile()) return { url, exists:false, sha256:null, bytes:0 };
  return { url, exists:true, sha256:hash(file), bytes:fs.statSync(file).size };
}
const rows = [];
for (const [id, url] of Object.entries(map).sort((a,b) => Number(a[0])-Number(b[0]))) {
  const sizes = ['', '-960', '-480'].map((suffix) => asset(url.replace(/\.webp$/, `${suffix}.webp`)));
  if (!/\.webp$/.test(url) || sizes.some((x) => !x.exists)) issues.push({ id, error:'Faltan variantes públicas o la ruta es inválida' });
  const revisionFile = path.join(root, 'work/antecedentes-images/revisiones', id, 'registro.json');
  const rawFile = path.join(root, 'work/antecedentes-images/revisiones', id, 'original.png');
  let revision = { status:'no_recuperada', record:null, raw:null, promptRecorded:false, errors:[] };
  if (fs.existsSync(revisionFile)) {
    try {
      const record = JSON.parse(fs.readFileSync(revisionFile, 'utf8'));
      const errors = [];
      if (String(record.id) !== id) errors.push('ID de registro incorrecto');
      if (!record.prompt || !record.generador || !record.revision) errors.push('Faltan datos de generación o revisión');
      if (!fs.existsSync(rawFile) || hash(rawFile) !== record.sha256_original) errors.push('Crudo ausente o SHA distinto');
      for (const item of sizes) {
        const declared = record.archivos?.find((x) => x.path === item.url);
        if (!declared || !item.exists || declared.sha256 !== item.sha256) errors.push(`No coincide el archivo ${item.url}`);
      }
      revision = { status:errors.length ? 'inconsistente' : 'verificada', record:path.relative(root,revisionFile), raw:fs.existsSync(rawFile) ? path.relative(root,rawFile) : null, promptRecorded:Boolean(record.prompt), errors };
      if (errors.length) issues.push({ id, error:'Revisión inconsistente', details:errors });
    } catch (error) {
      revision = { status:'inconsistente', record:path.relative(root,revisionFile), raw:null, promptRecorded:false, errors:[String(error.message)] };
      issues.push({ id, error:'Registro de revisión ilegible', details:[String(error.message)] });
    }
  }
  const legacyRecord = path.join(root, 'work/antecedentes-images/historicos-recuperados', id, 'evidencia.json');
  const legacyRaw = path.join(root, 'work/antecedentes-images/historicos-recuperados', id, 'original.png');
  let historical = { status:'no_recuperado', raw:null, promptRecorded:false, active:false };
  if (fs.existsSync(legacyRecord)) {
    try {
      const evidence = JSON.parse(fs.readFileSync(legacyRecord, 'utf8'));
      const historicAsset = asset(evidence.imagen_historica);
      const valid = String(evidence.id) === id && fs.existsSync(legacyRaw) && hash(legacyRaw) === evidence.sha256_original
        && historicAsset.exists && historicAsset.sha256 === evidence.sha256_imagen_historica;
      historical = { status:valid ? 'verificado' : 'inconsistente', raw:fs.existsSync(legacyRaw) ? path.relative(root,legacyRaw) : null, promptRecorded:Boolean(evidence.prompt), active:evidence.imagen_historica === url };
      if (!valid) issues.push({ id, error:'Original histórico o imagen asociada inconsistente' });
    } catch (error) {
      historical = { status:'inconsistente', raw:null, promptRecorded:false, active:false };
      issues.push({ id, error:'Evidencia histórica ilegible', details:[String(error.message)] });
    }
  }
  let activePhoto = null;
  const photoId = photos.cases?.[id];
  if (photoId) {
    const data = photos.photos?.[photoId];
    const file = asset(data?.src);
    const valid = Boolean(data && data.source && data.author && data.license && data.licenseUrl && file.exists && data.webpSha256 === file.sha256);
    activePhoto = { id:photoId, url:data?.src || null, source:data?.source || null, author:data?.author || null, license:data?.license || null, licenseUrl:data?.licenseUrl || null, sha256:file.sha256, verified:valid };
    if (!valid) issues.push({ id, error:'Fotografía o documentación de licencia inconsistente' });
  }
  rows.push({ id, active:activePhoto ? 'fotografia' : 'imagen_generada', activePhoto, generated:sizes, revision, historical });
}
const duplicatePaths = Object.entries(map).reduce((memo,[id,url]) => { (memo[url] ||= []).push(id); return memo; }, {});
for (const [url,ids] of Object.entries(duplicatePaths)) if (ids.length > 1) issues.push({ ids, error:'Ruta de imagen duplicada', url });
const activeHashes = {};
for (const row of rows) {
  const digest = row.activePhoto ? row.activePhoto.sha256 : row.generated[0].sha256;
  if (digest) (activeHashes[digest] ||= []).push(row.id);
}
for (const [sha256,ids] of Object.entries(activeHashes)) if (ids.length > 1) issues.push({ ids, error:'Imagen activa idéntica en varias fichas', sha256 });
const summary = {
  total:rows.length,
  activePhotos:rows.filter((x) => x.activePhoto).length,
  activeGenerated:rows.filter((x) => !x.activePhoto).length,
  generatedRevisionsVerified:rows.filter((x) => x.revision.status === 'verificada').length,
  historicalRawVerified:rows.filter((x) => x.historical.status === 'verificado').length,
  activeHistoricalRawVerified:rows.filter((x) => !x.activePhoto && x.historical.status === 'verificado' && x.historical.active).length,
  generatedProvenanceNotRecovered:rows.filter((x) => x.revision.status === 'no_recuperada').length,
  activeGeneratedProvenanceNotRecovered:rows.filter((x) => !x.activePhoto && x.revision.status === 'no_recuperada').length,
  generatedRevisionsInconsistent:rows.filter((x) => x.revision.status === 'inconsistente').length,
  errors:issues.length,
};
console.log(JSON.stringify({ summary, issues, rows }, null, 2));
if (issues.length || (process.argv.includes('--strict') && summary.generatedProvenanceNotRecovered)) process.exitCode = 1;
