import { load } from 'cheerio';
import { fetchText } from './lib/http.ts';
import { normalize } from './lib/slug.ts';
import type { FlashcardSet, ScrapedCard } from './types.ts';

const THUMB_URL = /^(\S+)/;

// Le site a des homoglyphes cyrilliques dans certains libellés ("сar seat", "high сhair").
const CYRILLIC_LOOKALIKES: Record<string, string> = {
  а: 'a', с: 'c', е: 'e', о: 'o', р: 'p', х: 'x', у: 'y', к: 'k', н: 'h', В: 'B', С: 'C',
};

function sanitizeText(raw: string): string {
  return raw
    .replace(/[асеорхукнВС]/g, (char) => CYRILLIC_LOOKALIKES[char] ?? char)
    .replace(/[’‘]/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/** Parse une page de set : chaque `<li itemprop="image">` = une carte. */
export async function scrapeSet(set: FlashcardSet): Promise<ScrapedCard[]> {
  const $ = load(await fetchText(set.url));
  const setSlugNormalized = normalize(set.slug);
  const setNameNormalized = normalize(set.name);

  const cards: ScrapedCard[] = [];

  $('li[itemprop="image"]').each((_, li) => {
    const item = $(li);
    const imageUrl = item.attr('data-src');
    if (!imageUrl) return;

    const button = item.find('button.report-btn');
    const en = sanitizeText(button.attr('data-text') ?? item.find('a.show').attr('title') ?? '');
    if (!en) return;

    const enNormalized = normalize(en);
    const rawThumb = item.find('img.gallery-thumb').attr('data-srcset') ?? '';
    const thumbUrl = THUMB_URL.exec(rawThumb)?.[1] ?? null;

    cards.push({
      imgid: button.attr('data-imgid') ?? enNormalized,
      en,
      imageUrl,
      thumbUrl,
      // La carte-titre porte le nom du set (ex. "Farm animals" dans farm-animals).
      isTitleCard: enNormalized === setSlugNormalized || enNormalized === setNameNormalized,
    });
  });

  return cards;
}

if (import.meta.main) {
  const testSet: FlashcardSet = {
    slug: 'farm-animals',
    name: 'Farm animals',
    announcedCount: 16,
    url: 'https://kids-flashcards.com/en/free-printable/farm-animals-flashcards-in-english',
  };
  const cards = await scrapeSet(testSet);
  console.log(`${cards.length} cartes (${cards.filter((card) => card.isTitleCard).length} carte-titre)`);
  for (const card of cards) {
    console.log(`  ${card.isTitleCard ? '[titre] ' : ''}${card.en}, ${card.imageUrl}`);
  }
}
