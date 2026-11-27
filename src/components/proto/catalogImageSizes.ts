export const shortCaseImageSizes = '(max-width: 600px) clamp(76px, 25vw, 130px), clamp(130px, 17vw, 240px)';

/** Match the archive card layouts used before and after client-side filtering. */
export function catalogImageSizes(highlights: boolean, first: boolean, short: boolean) {
  if (highlights && first) return '(max-width: 600px) calc(100vw - 40px), (max-width: 900px) 54vw, min(43vw, 820px)';
  if (short) return shortCaseImageSizes;
  const mobile = highlights ? '29vw' : 'clamp(76px, 25vw, 130px)';
  return `(max-width: 600px) ${mobile}, (max-width: 900px) 46vw, min(24vw, 340px)`;
}
