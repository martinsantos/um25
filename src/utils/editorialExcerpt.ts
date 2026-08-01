const stripExcerptMarkup = (value: unknown): string => String(value || '')
  .replace(/<[^>]+>/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

/**
 * Builds a compact excerpt from complete sentences whenever the source allows it.
 * This avoids UI summaries ending in a clipped fragment while still bounding
 * unusually long CMS copy at a word boundary.
 */
export function excerptEditorialSentences(
  value: unknown,
  maxLength: number,
  maxSentences = 3,
): string {
  const plain = stripExcerptMarkup(value)
    .replace(/([.!?])\1+/g, '$1')
    .replace(/\s+([,.;:!?])/g, '$1')
    .trim();

  if (!plain || maxLength <= 0 || maxSentences <= 0) return '';

  const sentences = plain.match(/[^.!?]+(?:[.!?]+|$)/g) || [plain];
  let excerpt = '';
  let sentenceCount = 0;

  for (const rawSentence of sentences) {
    const sentence = rawSentence.replace(/\s+/g, ' ').trim();
    if (!sentence) continue;

    const candidate = excerpt ? `${excerpt} ${sentence}` : sentence;
    if (candidate.length > maxLength) break;

    excerpt = candidate;
    sentenceCount += 1;
    if (sentenceCount >= maxSentences) break;
  }

  if (excerpt) return excerpt;

  const clipped = plain.slice(0, maxLength + 1);
  const wordBoundary = clipped.lastIndexOf(' ');
  const safeCut = wordBoundary > Math.floor(maxLength * 0.6)
    ? clipped.slice(0, wordBoundary)
    : plain.slice(0, maxLength);
  return `${safeCut.trimEnd()}…`;
}
