import { load } from 'cheerio';
import { fetchText } from './lib/http.ts';
import type { FlashcardSet, Theme } from './types.ts';

const CATALOG_URL = 'https://kids-flashcards.com/en/flashcards-in-english';
const ORIGIN = 'https://kids-flashcards.com';

const SET_HREF = /\/en\/free-printable\/(.+)-flashcards-in-english$/;
const THEME_HREF = /\/en\/flashcards-in-english\/([a-z0-9-]+)$/;
const SET_LABEL = /^(\d+)\s+(.*?)\s+flashcards$/i;

/** Parse la page catalogue : 18 thèmes, chacun avec ses sous-sets. */
export async function scrapeCatalog(): Promise<Theme[]> {
  const $ = load(await fetchText(CATALOG_URL));
  const themes: Theme[] = [];

  $('ul.collapsible.expandable > li').each((_, li) => {
    const block = $(li);
    const blockText = block.text().replace(/\s+/g, ' ');

    const themeLink = block.find('a[href*="/en/flashcards-in-english/"]').first();
    const themeSlug = THEME_HREF.exec(themeLink.attr('href') ?? '')?.[1];
    if (!themeSlug) return;

    const themeName =
      /^(.*?)\s+-\s+English flash cards/.exec(blockText)?.[1].trim() ?? themeSlug.replace(/-/g, ' ');
    const announcedCount = Number(/(\d+) picture cards are available/.exec(blockText)?.[1] ?? 0);

    const sets: FlashcardSet[] = [];
    const seen = new Set<string>();
    block.find('a[href*="/en/free-printable/"]').each((__, anchor) => {
      const href = $(anchor).attr('href') ?? '';
      const setSlug = SET_HREF.exec(href)?.[1];
      if (!setSlug || seen.has(setSlug)) return;
      seen.add(setSlug);

      const labelMatch = SET_LABEL.exec($(anchor).text().replace(/\s+/g, ' ').trim());
      sets.push({
        slug: setSlug,
        name: labelMatch?.[2] ?? setSlug.replace(/-/g, ' '),
        announcedCount: Number(labelMatch?.[1] ?? 0),
        url: href.startsWith('http') ? href : ORIGIN + href,
      });
    });

    if (sets.length > 0) {
      themes.push({ slug: themeSlug, name: themeName, announcedCount, sets });
    }
  });

  return themes;
}

if (import.meta.main) {
  const themes = await scrapeCatalog();
  const setCount = themes.reduce((total, theme) => total + theme.sets.length, 0);
  console.log(`${themes.length} thèmes, ${setCount} sets`);
  for (const theme of themes) {
    console.log(`\n${theme.name} (${theme.slug}) : ${theme.announcedCount} cartes annoncées`);
    for (const set of theme.sets) {
      console.log(`  - ${set.name} [${set.slug}] : ${set.announcedCount}`);
    }
  }
}
