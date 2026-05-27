import { readFileSync } from 'node:fs';
import { relative } from 'node:path';
import { execFileSync } from 'node:child_process';

const root = process.cwd();

const files = execFileSync('rg', [
  '--files',
  'src',
  '-g',
  '*.astro',
  '-g',
  '*.css',
  '-g',
  '*.ts',
], { cwd: root, encoding: 'utf8' })
  .trim()
  .split('\n')
  .filter(Boolean);

const labOrLegacy = [
  /^src\/pages\/(admin|banners|pretext-demo|estilo)\//,
  /^src\/pages\/(banners|pretext-demo|estilo|plantilla-arca)\.astro$/,
  /^src\/styles\/(modern-css|antecedentes|global|banner-overlays|sectors-mobile)\.css$/,
  /^src\/utils\/pretextFx\.ts$/,
  /^src\/pages\/casos\//,
];

const commercialExemptions = [
  {
    pattern: /sizes="[^"]*100vw/,
    reason: 'responsive image sizes descriptor',
  },
  {
    pattern: /scaleX\(/,
    reason: 'horizontal rule animation',
  },
];

const rules = [
  {
    id: 'no-100vw-layout',
    severity: 'error',
    pattern: /\b(?:width|max-width|min-width):\s*(?:calc\([^;]*100vw[^;]*\)|100vw)\b/,
    message: 'Evitar 100vw en layout comercial: suele generar overflow por scrollbar. Usar 100%, svw o contenedor.',
  },
  {
    id: 'no-transition-all',
    severity: 'error',
    pattern: /transition:\s*all\b/,
    message: 'Evitar transition: all. Declarar propiedades concretas para no animar layout accidentalmente.',
  },
  {
    id: 'no-hover-zoom',
    severity: 'error',
    pattern: /(?:(?:hover|focus)[^{]*\{[^}]*transform:\s*scale\(|transform:\s*scale\([^;]+;\s*[^}]*\})/s,
    message: 'Evitar zoom/scale en UI comercial. El sistema UMSA pide imagenes estables y sin hover efectista.',
  },
  {
    id: 'no-title-overweight',
    severity: 'error',
    pattern: /font-weight:\s*(?:8\d{2}|9\d{2}|760)\b/,
    message: 'No usar pesos visibles sobre 700. Titulares editoriales maximo 600, enfasis maximo 700.',
  },
  {
    id: 'no-small-visible-px',
    severity: 'error',
    pattern: /font-size:\s*(?:10|11|12|13|14|15)px\b/,
    message: 'No usar texto visible menor a 16px en superficies comerciales.',
  },
  {
    id: 'no-off-brand-red',
    severity: 'error',
    pattern: /#(?:ef4444|ff0000|cc0000|e11d48|f87171)\b/i,
    message: 'Rojo de marca canonico: #DC2626. No introducir rojos alternativos.',
  },
  {
    id: 'no-blue-legacy-link',
    severity: 'error',
    pattern: /#007BFF\b/i,
    message: 'Azul heredado fuera de sistema visual. Usar tokens UMSA.',
  },
  {
    id: 'shadow-review',
    severity: 'warning',
    pattern: /box-shadow:\s*0\s+(?:[2-9]|\d{2,})px\b/,
    message: 'Revisar sombra visible. En UMSA 2026 la separacion debe venir de espacio, linea fina o contraste.',
  },
];

const isLabOrLegacy = (file) => labOrLegacy.some((rule) => rule.test(file));
const isExempt = (line) => commercialExemptions.some(({ pattern }) => pattern.test(line));

const findings = [];

for (const file of files) {
  const content = readFileSync(file, 'utf8');
  const lines = content.split(/\r?\n/);
  const scope = isLabOrLegacy(file) ? 'lab-or-legacy' : 'commercial';

  lines.forEach((line, index) => {
    if (scope === 'commercial' && isExempt(line)) return;

    for (const rule of rules) {
      if (rule.pattern.test(line)) {
        findings.push({
          scope,
          severity: scope === 'commercial' ? rule.severity : 'warning',
          rule: rule.id,
          file,
          line: index + 1,
          message: rule.message,
          excerpt: line.trim(),
        });
      }
    }
  });
}

const commercialErrors = findings.filter((finding) => (
  finding.scope === 'commercial' && finding.severity === 'error'
));

const summary = {
  checkedFiles: files.length,
  findings: findings.length,
  commercialErrors: commercialErrors.length,
  warnings: findings.length - commercialErrors.length,
};

console.log(JSON.stringify({ summary, findings }, null, 2));

if (commercialErrors.length > 0) {
  process.exitCode = 1;
}
