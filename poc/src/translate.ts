import { readFile } from 'node:fs/promises';
import { normalize } from './lib/slug.ts';

const DICTIONARY_PATH = new URL(
  '../../frontend/src/modules/imagier/constants/dictionary.json',
  import.meta.url,
);
const OVERRIDES_PATH = new URL('../translations.overrides.json', import.meta.url);

interface DictionaryFile {
  dictionnaire_thematique: Record<string, Record<string, Record<string, string>>>;
}

export interface TranslationResult {
  fr: string | null;
  source: 'dictionary' | 'override' | 'missing';
  /** Traduction du dictionnaire écrasée par un override (pour relecture). */
  overriddenFromDictionary: string | null;
  /** Autres mots FR que le dictionnaire associe au même mot EN (pour relecture). */
  dictionaryAlternatives: string[];
}

export interface Translator {
  translate: (en: string) => TranslationResult;
  /** Mots EN sans traduction, à compléter dans translations.overrides.json. */
  missing: string[];
}

async function loadOverrides(): Promise<Record<string, string>> {
  let raw: string;
  try {
    raw = await readFile(OVERRIDES_PATH, 'utf8');
  } catch {
    return {}; // fichier absent = pas d'overrides, OK
  }
  // Un JSON malformé doit crasher, pas passer inaperçu (sinon tout repasse "missing").
  const parsed = JSON.parse(raw) as Record<string, string>;
  return Object.fromEntries(
    Object.entries(parsed)
      .filter(([, fr]) => fr.trim().length > 0)
      .map(([en, fr]) => [normalize(en), fr.trim()]),
  );
}

export async function buildTranslator(): Promise<Translator> {
  const dictionary = JSON.parse(await readFile(DICTIONARY_PATH, 'utf8')) as DictionaryFile;
  const overrides = await loadOverrides();

  // normalize(en) -> mots FR du dictionnaire (dans l'ordre de lecture)
  const enToFr = new Map<string, string[]>();
  for (const subcats of Object.values(dictionary.dictionnaire_thematique)) {
    for (const words of Object.values(subcats)) {
      for (const [fr, en] of Object.entries(words)) {
        const key = normalize(en);
        const list = enToFr.get(key) ?? [];
        if (!list.includes(fr)) list.push(fr);
        enToFr.set(key, list);
      }
    }
  }

  const missing = new Set<string>();

  function translate(en: string): TranslationResult {
    const key = normalize(en);
    const fromDict = enToFr.get(key) ?? [];
    const fromOverride = overrides[key];

    // L'override prime : c'est le fichier de corrections manuelles.
    if (fromOverride) {
      return {
        fr: fromOverride,
        source: 'override',
        overriddenFromDictionary: fromDict[0] && fromDict[0] !== fromOverride ? fromDict[0] : null,
        dictionaryAlternatives: [],
      };
    }

    if (fromDict.length > 0) {
      return {
        fr: fromDict[0],
        source: 'dictionary',
        overriddenFromDictionary: null,
        dictionaryAlternatives: fromDict.slice(1),
      };
    }

    missing.add(en);
    return { fr: null, source: 'missing', overriddenFromDictionary: null, dictionaryAlternatives: [] };
  }

  return {
    translate,
    get missing() {
      return [...missing].sort();
    },
  };
}
