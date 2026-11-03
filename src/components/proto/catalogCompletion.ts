export type CompletionSource = {
  client: string;
  title: string;
  summary: string;
  year: number;
};

export type CompletionEntry = {
  id: number;
  match: CompletionSource;
  title?: string;
  summary?: string;
  sector?: string;
  services?: string[];
  sources: Array<{ field: string; file: string; recordId: number; quote: string }>;
};

const ALLOWED_SERVICES = new Set(['101', '102', '103', '104', '105', '106', '107', '108']);
const ALLOWED_SECTORS = new Set([
  '',
  'aeropuertos',
  'bodegas',
  'constructoras',
  'gobiernosectorpublico',
  'industria',
  'mineria',
  'salud',
]);
const MUTABLE_FIELDS = ['title', 'summary', 'sector', 'services'] as const;

/**
 * Normalize whitespace while preserving all other text and HTML entities.
 * HTML whitespace entities count as spacing, but content entities are not decoded.
 */
function normalizeWhitespace(value: string): string {
  return value
    .replace(/&nbsp;|&#0*160;|&#x0*a0;/gi, ' ')
    .replace(/&tab;|&#0*9;|&#x0*9;/gi, ' ')
    .replace(/&newline;|&#0*(?:10|13);|&#x0*(?:a|d);/gi, ' ')
    .replace(/[\s\u00a0]+/g, ' ')
    .trim();
}

function isPlainText(value: unknown): value is string {
  return typeof value === 'string' && !/<\s*\/?\s*[a-z][^>]*>/i.test(value);
}

function isNamedClient(value: string): boolean {
  const normalized = normalizeWhitespace(value).toLocaleLowerCase('es');
  return normalized.length > 0 && !/^(?:cliente\s+confidencial|cliente\s+reservad[oa]?|reservad[oa]?|sin\s*cliente)$/.test(normalized);
}

function isConfidentialClient(value: string): boolean {
  return normalizeWhitespace(value).toLocaleLowerCase('es') === 'cliente confidencial';
}

function sameMatch(left: CompletionSource, right: CompletionSource): boolean {
  return (
    Number.isInteger(left.year) &&
    Number.isInteger(right.year) &&
    isPlainText(left.client) &&
    isPlainText(left.title) &&
    isPlainText(left.summary) &&
    isPlainText(right.client) &&
    isPlainText(right.title) &&
    isPlainText(right.summary) &&
    normalizeWhitespace(left.client) === normalizeWhitespace(right.client) &&
    normalizeWhitespace(left.title) === normalizeWhitespace(right.title) &&
    normalizeWhitespace(left.summary) === normalizeWhitespace(right.summary) &&
    left.year === right.year
  );
}

function hasRequiredSources(entry: CompletionEntry): boolean {
  if (!Array.isArray(entry.sources) || entry.sources.length === 0) return false;

  for (const source of entry.sources) {
    if (
      !source ||
      typeof source.field !== 'string' ||
      !normalizeWhitespace(source.field) ||
      typeof source.file !== 'string' ||
      !normalizeWhitespace(source.file) ||
      !Number.isInteger(source.recordId) ||
      !isPlainText(source.quote) ||
      !normalizeWhitespace(source.quote)
    ) {
      return false;
    }
  }

  for (const field of MUTABLE_FIELDS) {
    if (!Object.prototype.hasOwnProperty.call(entry, field)) continue;
    if (!entry.sources.some((source) => source.field === field && normalizeWhitespace(source.quote))) {
      return false;
    }
  }

  return true;
}

function hasCurrentRecordAnonymousEvidence(
  id: number,
  current: CompletionSource,
  entry: CompletionEntry,
): boolean {
  const currentTexts = [normalizeWhitespace(current.title), normalizeWhitespace(current.summary)];
  return entry.sources.every((source) => {
    const quote = normalizeWhitespace(source.quote);
    return source.recordId === id && currentTexts.some((text) => text.includes(quote));
  });
}

function validMutableFields(entry: CompletionEntry): boolean {
  if (Object.prototype.hasOwnProperty.call(entry, 'title') && !isPlainText(entry.title)) return false;
  if (Object.prototype.hasOwnProperty.call(entry, 'summary') && !isPlainText(entry.summary)) return false;
  if (Object.prototype.hasOwnProperty.call(entry, 'sector')) {
    if (typeof entry.sector !== 'string' || !ALLOWED_SECTORS.has(entry.sector)) return false;
  }
  if (Object.prototype.hasOwnProperty.call(entry, 'services')) {
    if (!Array.isArray(entry.services) || !entry.services.every((service) => ALLOWED_SERVICES.has(service))) {
      return false;
    }
  }
  return true;
}

/** Return a documented completion only when the current record still exactly matches its evidence key. */
export function documentedCompletion(
  id: number,
  current: CompletionSource,
  entries: readonly CompletionEntry[],
): CompletionEntry | undefined {
  if (!Number.isInteger(id) || !current || !Array.isArray(entries)) return undefined;

  const entry = entries.find((candidate) => candidate?.id === id);
  if (!entry || entry.id !== id || !entry.match || !sameMatch(current, entry.match)) return undefined;
  if (!validMutableFields(entry) || !hasRequiredSources(entry)) return undefined;

  const confidentialClient = isConfidentialClient(current.client) && isConfidentialClient(entry.match.client);
  if (confidentialClient) {
    if (!hasCurrentRecordAnonymousEvidence(id, current, entry)) return undefined;
  } else if (!isNamedClient(current.client) || !isNamedClient(entry.match.client)) {
    return undefined;
  }

  return entry;
}
