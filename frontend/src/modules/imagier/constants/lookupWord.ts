import dict from './dictionary.json';

export interface DictMatch {
  en: string;
  category: string;
  subcategory: string;
}

// Build flat lookup map at module load: fr_normalized → { en, category, subcategory }
const LOOKUP = new Map<string, DictMatch>();

const root = (dict as { dictionnaire_thematique: Record<string, Record<string, Record<string, string>>> })
  .dictionnaire_thematique;

for (const [category, subcats] of Object.entries(root)) {
  for (const [subcategory, words] of Object.entries(subcats)) {
    for (const [fr, en] of Object.entries(words)) {
      LOOKUP.set(fr.toLowerCase().trim(), { en, category, subcategory });
    }
  }
}

/** Cherche un mot français dans le dictionnaire thématique. */
export function lookupWord(fr: string): DictMatch | null {
  return LOOKUP.get(fr.toLowerCase().trim()) ?? null;
}

/** Extrait le mot français depuis un nom de fichier image. */
export function filenameToFr(filename: string): string {
  return filename
    .replace(/\.[^.]+$/, '') // retire l'extension
    .replace(/[-_]/g, ' ')   // remplace - et _ par espace
    .trim()
    .toLowerCase();
}
