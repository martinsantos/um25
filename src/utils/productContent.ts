import {
  sanitizeEditorialText,
  stripBannedLedgerPhrases,
  renderEditorialBody,
  productAnchorId,
  sanitizeProductTitle,
} from './editorialContent';

export { renderEditorialBody as renderProductDescription, productAnchorId, sanitizeProductTitle };

export function sanitizeProductText(value: unknown): string {
  return stripBannedLedgerPhrases(value);
}

export function sanitizeFeatureText(value: unknown): string {
  return stripBannedLedgerPhrases(value);
}
