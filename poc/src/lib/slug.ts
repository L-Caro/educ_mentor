const COMBINING_MARKS = /[̀-ͯ]/g;

/** Même normalisation que le backend educ_mentor (imagier-import.service.ts). */
export function normalize(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(COMBINING_MARKS, '') // retire les accents
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}
