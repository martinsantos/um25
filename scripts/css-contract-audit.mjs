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
  /^src\/components\/arca\//,
  /^src\/components\/(ServicesList|FeaturedAntecedentes|ProjectCard)\.astro$/,
  /^src\/pages\/(admin|banners|pretext-demo|estilo)\//,
  /^src\/pages\/(banners|pretext-demo|estilo|plantilla-arca)\.astro$/,
  /^src\/pages\/antecedentes\/_?\[slug\]\.astro$/,
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
    pattern: /(?:transition:\s*all\b|\btransition-all\b)/,
    message: 'Evitar transition: all. Declarar propiedades concretas para no animar layout accidentalmente.',
  },
  {
    id: 'no-hover-zoom',
    severity: 'error',
    pattern: /(?:(?:hover|focus)[^{]*\{[^}]*transform:\s*scale\(|\bhover:scale-\[|\bhover:-translate-|\bgroup-hover:scale-)/s,
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
    pattern: /(?:box-shadow:\s*0\s+(?:[2-9]|\d{2,})px\b|\bshadow-(?:sm|md|lg|xl|2xl)\b|\bhover:shadow-(?:sm|md|lg|xl|2xl)\b)/,
    message: 'Revisar sombra visible. En UMSA 2026 la separacion debe venir de espacio, linea fina o contraste.',
  },
  {
    id: 'rounded-card-review',
    severity: 'warning',
    pattern: /\brounded-(?:xl|2xl|3xl|full)\b/,
    message: 'Revisar radios grandes. En UMSA 2026 los modulos comerciales deben ser editoriales, no cards SaaS.',
  },
];

const blockRules = [
  {
    id: 'no-click-surface-hover-shadow',
    severity: 'error',
    selector: /\.um-click-surface[^{]*(?::hover|:focus-visible)/,
    body: /box-shadow\s*:\s*(?!none\b)[^;}]+/i,
    message: '.um-click-surface no debe imponer caja/sombra en hover o focus. Es contrato funcional; el feedback visual vive en cada componente.',
  },
  {
    id: 'no-service-surface-hover-shadow',
    severity: 'error',
    selector: /\.(?:um-service-unit|service-dossier-item)[^{]*(?::hover|:focus-visible)/,
    body: /box-shadow\s*:\s*(?!none\b)[^;}]+/i,
    message: 'Las superficies de servicios no deben usar caja/sombra en hover. Usar fondo suave y acento local consistente.',
  },
  {
    id: 'no-hover-elevation-shadow',
    severity: 'error',
    selector: /(?::hover|:focus-visible|:has\([^)]*(?:hover|focus-visible)[^)]*\))/,
    body: /box-shadow\s*:\s*(?!none\b)(?:0\s+(?:[2-9]|\d{2,})px|[^;}]*rgba\(17,\s*24,\s*39)/i,
    message: 'No usar sombra de elevacion en hover/focus de superficies comerciales. Usar fondo suave, borde o color.',
  },
  {
    id: 'no-hover-lift',
    severity: 'error',
    selector: /(?::hover|:focus-visible|:has\([^)]*(?:hover|focus-visible)[^)]*\))/,
    body: /transform\s*:\s*translateY\(\s*-\d/i,
    message: 'No desplazar superficies comerciales hacia arriba en hover/focus. Mantener layout estable.',
  },
  {
    id: 'no-filter-hover-underline',
    severity: 'error',
    selector: /\.(?:ante-dossier__sector-links|sector-editorial__market-links|sector-atlas-exec-ledger__filters-links)[^{]*(?:a:hover|a:focus-visible)/,
    body: /(?:text-decoration-color\s*:\s*currentColor|opacity\s*:\s*1)/i,
    message: 'Los rails de filtros reservan el subrayado para el estado activo. Hover/focus debe cambiar color o fondo, no dibujar otra linea.',
  },
];

const isLabOrLegacy = (file) => labOrLegacy.some((rule) => rule.test(file));
const isExempt = (line) => commercialExemptions.some(({ pattern }) => pattern.test(line));
const lineForOffset = (content, offset) => content.slice(0, offset).split(/\r?\n/).length;

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

  for (const match of content.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const selector = match[1].trim();
    const body = match[2].trim();

    for (const rule of blockRules) {
      if (!rule.selector.test(selector) || !rule.body.test(body)) continue;

      findings.push({
        scope,
        severity: scope === 'commercial' ? rule.severity : 'warning',
        rule: rule.id,
        file,
        line: lineForOffset(content, match.index),
        message: rule.message,
        excerpt: `${selector} { ${body.replace(/\s+/g, ' ').slice(0, 180)} }`,
      });
    }
  }
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
