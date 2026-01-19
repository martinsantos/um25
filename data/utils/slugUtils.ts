// ...existing imports or code...
export function generateSlug(text: string): string {
  return text
    .normalize('NFD')                              // split diacritics
    .replace(/[\u0300-\u036f]/g, "")                 // remove diacritic marks
    .toLowerCase()                                  
    .trim()
    .replace(/[^a-z0-9]+/g, '-')                    // replace spaces/invalid chars with hyphen
    .replace(/^-+|-+$/g, '');                        // trim hyphens on both ends
}
