import { mkdir, writeFile } from 'node:fs/promises';
import sharp from 'sharp';
import { scrapeCatalog } from './catalog.ts';
import { scrapeSet } from './scrapeSet.ts';
import { fetchBinary } from './lib/http.ts';
import { normalize } from './lib/slug.ts';

const OUT_DIR = new URL('../out/samples/', import.meta.url);
const CROP_RATIOS = [0, 0.15, 0.18, 0.22];

/** Un set par thème (le premier), pour un échantillon large. */
async function pickSampleCards() {
  const themes = await scrapeCatalog();
  const picks: { theme: string; set: string; en: string; url: string }[] = [];

  for (const theme of themes) {
    const firstSet = theme.sets[0];
    const cards = (await scrapeSet(firstSet)).filter((card) => !card.isTitleCard);
    for (const card of cards.slice(0, 2)) {
      picks.push({ theme: theme.slug, set: firstSet.slug, en: card.en, url: card.imageUrl });
    }
  }
  return picks;
}

const picks = await pickSampleCards();
await mkdir(OUT_DIR, { recursive: true });
console.log(`${picks.length} images échantillon`);

for (const pick of picks) {
  const result = await fetchBinary(pick.url);
  if (!result.ok || !result.bytes) {
    console.warn(`  skip ${pick.en} (HTTP ${result.status})`);
    continue;
  }

  const base = `${pick.theme}__${normalize(pick.en)}`;
  const image = sharp(result.bytes);
  const { width = 0, height = 0 } = await image.metadata();

  for (const ratio of CROP_RATIOS) {
    const keptHeight = Math.round(height * (1 - ratio));
    const pipeline =
      ratio === 0
        ? sharp(result.bytes)
        : sharp(result.bytes).extract({ left: 0, top: 0, width, height: keptHeight });
    const suffix = ratio === 0 ? 'raw' : `crop${Math.round(ratio * 100)}`;
    await pipeline
      .resize({ width: 512, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toFile(new URL(`${base}__${suffix}.webp`, OUT_DIR).pathname);
  }
  console.log(`  ${pick.en} (${width}x${height})`);
}

console.log(`\n→ ${OUT_DIR.pathname}`);
