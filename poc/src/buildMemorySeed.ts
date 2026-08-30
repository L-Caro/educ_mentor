/**
 * Outil ponctuel : fige le contenu du module memory (76 animaux + leurs images IA actuelles)
 * AVANT le remplacement du contenu imagier (ticket 5). À lancer une seule fois, base actuelle
 * en place. Produit :
 *   - backend/src/modules/memory/memory-card.seed.json   (versionné)
 *   - backend/src/modules/memory/seed-images/<slug>.webp  (versionné, 512 px)
 */
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import Database from 'better-sqlite3';
import sharp from 'sharp';
import { normalize } from './lib/slug.ts';

const DB = new URL('../../data/educmentor.db', import.meta.url).pathname;
const IMAGIER_DIRS = [
  new URL('../../data/images/imagier/animaux/', import.meta.url).pathname,
  new URL('../../data/images/imagier/Animaux/', import.meta.url).pathname,
];
const SEED_JSON = new URL('../../backend/src/modules/memory/memory-card.seed.json', import.meta.url).pathname;
const SEED_IMAGES = new URL('../../backend/src/modules/memory/seed-images/', import.meta.url);

interface Row {
  fr: string;
  en: string;
  image_filename: string | null;
}

const db = new Database(DB, { readonly: true });
const rows = db
  .prepare("SELECT fr, en, image_filename FROM imagier_words WHERE category = 'animaux' ORDER BY fr")
  .all() as Row[];

await rm(SEED_IMAGES, { recursive: true, force: true });
await mkdir(SEED_IMAGES, { recursive: true });

const seed: { id: string; fr: string; en: string; image: string }[] = [];
const missing: string[] = [];

for (const row of rows) {
  const slug = normalize(row.fr);
  const sourcePath = row.image_filename
    ? IMAGIER_DIRS.map((dir) => dir + row.image_filename).find((candidate) => existsSync(candidate))
    : undefined;

  if (!sourcePath) {
    missing.push(`${row.fr} (${row.image_filename ?? 'pas de fichier'})`);
    seed.push({ id: slug, fr: row.fr, en: row.en, image: '' });
    continue;
  }

  const outName = `${slug}.webp`;
  await sharp(sourcePath)
    .resize({ width: 512, withoutEnlargement: true })
    .webp({ quality: 82 })
    .toFile(new URL(outName, SEED_IMAGES).pathname);

  seed.push({ id: slug, fr: row.fr, en: row.en, image: outName });
}

await writeFile(SEED_JSON, `${JSON.stringify(seed, null, 2)}\n`);

console.log(`${seed.length} cartes → memory-card.seed.json`);
console.log(`${seed.filter((card) => card.image).length} images → seed-images/`);
if (missing.length > 0) {
  console.log(`\n${missing.length} sans image (à compléter à la main) :`);
  for (const line of missing) console.log(`  ${line}`);
}
