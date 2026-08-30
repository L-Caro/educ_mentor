import { mkdir, writeFile } from 'node:fs/promises';
import { scrapeCatalog } from './catalog.ts';
import { scrapeSet } from './scrapeSet.ts';
import { buildTranslator, type TranslationResult } from './translate.ts';
import { downloadCropped } from './images.ts';
import { pooled } from './lib/http.ts';
import { normalize } from './lib/slug.ts';
import { writeReport, type ReportData } from './report.ts';
import type { ScrapedCard } from './types.ts';

const OUT_DIR = new URL('../out/', import.meta.url);
const IMAGES_DIR = new URL('../out/images/', import.meta.url);

const SET_CONCURRENCY = 4;
const SET_SPACING_MS = 200;
const IMAGE_CONCURRENCY = 5;
const IMAGE_SPACING_MS = 150;

export interface OutputCard {
  imgid: string;
  en: string;
  fr: string | null;
  frSource: TranslationResult['source'];
  imageUrl: string;
  imageFile: string | null;
}

export interface OutputSet {
  slug: string;
  name: string;
  announcedCount: number;
  scrapedCount: number;
  titleCardSkipped: number;
  cards: OutputCard[];
}

export interface OutputTheme {
  slug: string;
  name: string;
  announcedCount: number;
  sets: OutputSet[];
}

export interface UniqueWord {
  imgid: string;
  en: string;
  fr: string | null;
  frSource: TranslationResult['source'];
  overriddenFromDictionary: string | null;
  dictionaryAlternatives: string[];
  imageUrl: string;
  imageFile: string | null;
  sets: string[];
}

interface ScrapedSet {
  theme: string;
  setSlug: string;
  cards: ScrapedCard[];
}

async function main(): Promise<void> {
  console.log('1/5  catalogue…');
  const themes = await scrapeCatalog();
  let flatSets = themes.flatMap((theme) => theme.sets.map((set) => ({ theme: theme.slug, set })));

  // SCRAPE_LIMIT=3 → n'exécute que les 3 premiers sets (mise au point).
  const limit = Number(process.env.SCRAPE_LIMIT ?? 0);
  if (limit > 0) flatSets = flatSets.slice(0, limit);
  console.log(`     ${themes.length} thèmes, ${flatSets.length} sets${limit > 0 ? ' (limité)' : ''}`);

  console.log('2/5  scraping des sets…');
  const scraped: ScrapedSet[] = await pooled(flatSets, SET_CONCURRENCY, SET_SPACING_MS, async ({ theme, set }) => {
    const cards = await scrapeSet(set);
    process.stdout.write('.');
    return { theme, setSlug: set.slug, cards };
  });
  process.stdout.write('\n');

  console.log('3/5  traduction (réconciliation dictionary.json)…');
  const translator = await buildTranslator();
  const translationByEn = new Map<string, TranslationResult>();
  const translateOnce = (en: string): TranslationResult => {
    const cached = translationByEn.get(en);
    if (cached) return cached;
    const result = translator.translate(en);
    translationByEn.set(en, result);
    return result;
  };

  // Dédup par imgid : une image partagée entre plusieurs sets = un seul téléchargement.
  const uniqueByImgid = new Map<string, UniqueWord>();
  const enSlugToImgids = new Map<string, Set<string>>();
  const frToEnSlugs = new Map<string, Set<string>>();

  for (const { cards, setSlug } of scraped) {
    for (const card of cards) {
      if (card.isTitleCard) continue;
      const translation = translateOnce(card.en);
      const enSlug = normalize(card.en);

      if (!enSlugToImgids.has(enSlug)) enSlugToImgids.set(enSlug, new Set());
      enSlugToImgids.get(enSlug)!.add(card.imgid);
      if (translation.fr) {
        if (!frToEnSlugs.has(translation.fr)) frToEnSlugs.set(translation.fr, new Set());
        frToEnSlugs.get(translation.fr)!.add(enSlug);
      }

      const existing = uniqueByImgid.get(card.imgid);
      if (existing) {
        if (!existing.sets.includes(setSlug)) existing.sets.push(setSlug);
        continue;
      }
      uniqueByImgid.set(card.imgid, {
        imgid: card.imgid,
        en: card.en,
        fr: translation.fr,
        frSource: translation.source,
        overriddenFromDictionary: translation.overriddenFromDictionary,
        dictionaryAlternatives: translation.dictionaryAlternatives,
        imageUrl: card.imageUrl,
        imageFile: null,
        sets: [setSlug],
      });
    }
  }
  const uniqueWords = [...uniqueByImgid.values()];
  console.log(`     ${uniqueWords.length} mots uniques ; ${translator.missing.length} sans traduction`);

  console.log('4/5  images (téléchargement + rognage 18%)…');
  const usedFilenames = new Set<string>();
  await pooled(uniqueWords, IMAGE_CONCURRENCY, IMAGE_SPACING_MS, async (word) => {
    let basename = normalize(word.en);
    if (usedFilenames.has(basename)) basename = `${basename}-${word.imgid}`;
    usedFilenames.add(basename);

    const outcome = await downloadCropped(word.imageUrl, IMAGES_DIR, basename);
    word.imageFile = outcome.file;
    const marks = { ok: '.', cached: '=', 'not-found': '?', error: '!' } as const;
    process.stdout.write(marks[outcome.status]);
  });
  process.stdout.write('\n');

  console.log('5/5  écriture des sorties…');
  const imageFileByImgid = new Map(uniqueWords.map((word) => [word.imgid, word.imageFile]));

  const themesOut: OutputTheme[] = themes.map((theme) => ({
    slug: theme.slug,
    name: theme.name,
    announcedCount: theme.announcedCount,
    sets: theme.sets.map((set): OutputSet => {
      const cards = scraped.find((entry) => entry.setSlug === set.slug)?.cards ?? [];
      const wordCards = cards.filter((card) => !card.isTitleCard);
      return {
        slug: set.slug,
        name: set.name,
        announcedCount: set.announcedCount,
        scrapedCount: wordCards.length,
        titleCardSkipped: cards.length - wordCards.length,
        cards: wordCards.map((card): OutputCard => {
          const translation = translateOnce(card.en);
          return {
            imgid: card.imgid,
            en: card.en,
            fr: translation.fr,
            frSource: translation.source,
            imageUrl: card.imageUrl,
            imageFile: imageFileByImgid.get(card.imgid) ?? null,
          };
        }),
      };
    }),
  }));

  const stats = buildStats(themesOut, uniqueWords, scraped);

  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(
    new URL('flashcards.json', OUT_DIR),
    JSON.stringify(
      {
        source: 'kids-flashcards.com/en',
        extractedAt: new Date().toISOString().slice(0, 10),
        cropRatio: 0.18,
        stats,
        themes: themesOut,
        words: [...uniqueWords]
          .sort((left, right) => left.en.localeCompare(right.en))
          .map((word) => ({
            imgid: word.imgid,
            en: word.en,
            fr: word.fr,
            frSource: word.frSource,
            imageFile: word.imageFile,
            imageUrl: word.imageUrl,
            sets: word.sets,
          })),
      },
      null,
      2,
    ),
  );

  const reportData: ReportData = {
    stats,
    themesOut,
    uniqueWords,
    missing: translator.missing,
    enSlugToImgids,
    frToEnSlugs,
  };
  await writeReport(new URL('report.md', OUT_DIR), reportData);

  console.log(`\n✓ out/flashcards.json  ·  out/report.md  ·  out/images/ (${stats.images.ok} fichiers)`);
}

export interface Stats {
  themes: number;
  sets: number;
  cardsScraped: number;
  titleCardsSkipped: number;
  uniqueWords: number;
  duplicateWords: number;
  images: { ok: number; notFound: number };
  translations: { dictionary: number; override: number; missing: number };
}

function buildStats(themesOut: OutputTheme[], uniqueWords: UniqueWord[], scraped: ScrapedSet[]): Stats {
  const countCards = (predicate: (card: ScrapedCard) => boolean): number =>
    scraped.reduce((total, entry) => total + entry.cards.filter(predicate).length, 0);

  return {
    themes: themesOut.length,
    sets: themesOut.reduce((total, theme) => total + theme.sets.length, 0),
    cardsScraped: countCards((card) => !card.isTitleCard),
    titleCardsSkipped: countCards((card) => card.isTitleCard),
    uniqueWords: uniqueWords.length,
    duplicateWords: uniqueWords.filter((word) => word.sets.length > 1).length,
    images: {
      ok: uniqueWords.filter((word) => word.imageFile !== null).length,
      notFound: uniqueWords.filter((word) => word.imageFile === null).length,
    },
    translations: {
      dictionary: uniqueWords.filter((word) => word.frSource === 'dictionary').length,
      override: uniqueWords.filter((word) => word.frSource === 'override').length,
      missing: uniqueWords.filter((word) => word.frSource === 'missing').length,
    },
  };
}

await main();
