import { copyFile, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { normalize } from './lib/slug.ts';

const FLASHCARDS = new URL('../out/flashcards.json', import.meta.url);
const CATEGORY_MAP = new URL('../category-map.json', import.meta.url);
const WORD_OVERRIDES = new URL('../word-overrides.json', import.meta.url);
const IMAGES_SRC = new URL('../out/images/', import.meta.url);
const DICT_OUT = new URL('../out/dictionnaire_thematique.json', import.meta.url);
const COLLISIONS_OUT = new URL('../out/imagier-collisions.md', import.meta.url);
const IMAGES_OUT = new URL('../out/imagier-images/', import.meta.url);

interface Flashcards {
  themes: { slug: string; sets: { slug: string }[] }[];
  words: { en: string; fr: string; frSource: string; imageFile: string | null; sets: string[] }[];
}

interface MapEntry {
  key: string;
  label: string;
  icon?: string;
}

interface CategoryMap {
  themes: Record<string, MapEntry>;
  sets: Record<string, MapEntry>;
}

interface Collision {
  fr: string;
  kept: string;
  dropped: string;
  /** Même mot EN ET même catégorie : simple doublon inter-sets, sans perte de sens. */
  redundant: boolean;
}

const flashcards = JSON.parse(await readFile(FLASHCARDS, 'utf8')) as Flashcards;
const map = JSON.parse(await readFile(CATEGORY_MAP, 'utf8')) as CategoryMap;
const wordOverrides = JSON.parse(await readFile(WORD_OVERRIDES, 'utf8')) as Record<string, unknown>;

/** Traduction spécifique à une catégorie (mot EN polysémique selon le thème). */
function categoryOverride(category: string, en: string): string | null {
  const forCategory = wordOverrides[category];
  if (typeof forCategory !== 'object' || forCategory === null) return null;
  const value = (forCategory as Record<string, string>)[en.toLowerCase()];
  return typeof value === 'string' ? value : null;
}

const themeBySet = new Map<string, string>();
for (const theme of flashcards.themes) {
  for (const set of theme.sets) themeBySet.set(set.slug, theme.slug);
}

// Le catalogue doit être entièrement mappé avant de commencer.
const unmapped: string[] = [];
for (const theme of flashcards.themes) {
  if (!map.themes[theme.slug]) unmapped.push(`thème ${theme.slug}`);
  for (const set of theme.sets) {
    if (!map.sets[set.slug]) unmapped.push(`set ${set.slug}`);
  }
}
if (unmapped.length > 0) {
  throw new Error(`category-map.json incomplet :\n  ${unmapped.join('\n  ')}`);
}

const dictionary: Record<string, Record<string, Record<string, string>>> = {};
const imageCopies: { from: string; to: string }[] = [];
const frSlugOwner = new Map<string, { en: string; category: string }>();
const collisions: Collision[] = [];
const perCategory = new Map<string, number>();

for (const word of flashcards.words) {
  const themeSlug = themeBySet.get(word.sets[0])!;
  const category = map.themes[themeSlug].key;
  const subcategory = map.sets[word.sets[0]].key;
  const fr = categoryOverride(category, word.en) ?? word.fr;
  const frSlug = normalize(fr);

  const owner = frSlugOwner.get(frSlug);
  if (owner) {
    const oneIsVerb = (owner.category === 'verbes') !== (category === 'verbes');
    collisions.push({
      fr,
      kept: `${owner.en} (${owner.category})`,
      dropped: `${word.en} (${category})`,
      redundant: owner.en.toLowerCase() === word.en.toLowerCase() && !oneIsVerb,
    });
    continue;
  }
  frSlugOwner.set(frSlug, { en: word.en, category });

  dictionary[category] ??= {};
  dictionary[category][subcategory] ??= {};
  dictionary[category][subcategory][fr] = word.en;
  perCategory.set(category, (perCategory.get(category) ?? 0) + 1);

  if (word.imageFile) {
    imageCopies.push({
      from: new URL(word.imageFile, IMAGES_SRC).pathname,
      to: new URL(`${category}/${frSlug}.webp`, IMAGES_OUT).pathname,
    });
  }
}

await writeFile(DICT_OUT, JSON.stringify({ dictionnaire_thematique: dictionary }, null, 2));

await rm(IMAGES_OUT, { recursive: true, force: true });
const madeDirs = new Set<string>();
for (const copy of imageCopies) {
  const dir = copy.to.slice(0, copy.to.lastIndexOf('/'));
  if (!madeDirs.has(dir)) {
    await mkdir(dir, { recursive: true });
    madeDirs.add(dir);
  }
  await copyFile(copy.from, copy.to);
}

await writeCollisionsReport(collisions);

const total = [...perCategory.values()].reduce((sum, count) => sum + count, 0);
const realLoss = collisions.filter((collision) => !collision.redundant).length;
console.log(`→ out/dictionnaire_thematique.json  (${total} mots, 18 catégories)`);
console.log(`→ out/imagier-images/  (${imageCopies.length} images)`);
console.log(`→ out/imagier-collisions.md  (${collisions.length} slugs FR en double, dont ${realLoss} à trancher)`);

async function writeCollisionsReport(all: Collision[]): Promise<void> {
  const distinct = all.filter((collision) => !collision.redundant);
  const sameConcept = all.filter((collision) => collision.redundant);
  const lines: string[] = [];

  lines.push('# Collisions de slug FR à l\'import imagier', '');
  lines.push('`slug = normalize(fr)` est unique côté educ_mentor. Quand deux mots EN donnent le même slug FR,');
  lines.push('**la première occurrence est importée, la seconde ignorée**.', '');

  lines.push(`## Concepts distincts perdus (${distinct.length}) : à trancher`, '');
  lines.push('Un sens différent disparaît. Pour garder les deux : leur donner une traduction FR distincte dans `translations.overrides.json`.', '');
  lines.push('| slug FR | importé | ignoré |', '|---|---|---|');
  for (const collision of distinct) {
    lines.push(`| ${collision.fr} | ${collision.kept} | ${collision.dropped} |`);
  }
  lines.push('');

  lines.push(`## Doublons inter-sets (${sameConcept.length}), sans perte`, '');
  lines.push('Même mot EN, même catégorie : la carte apparaît dans deux sets, une seule suffit.', '');
  lines.push('| slug FR | mot | catégorie |', '|---|---|---|');
  for (const collision of sameConcept) {
    lines.push(`| ${collision.fr} | ${collision.kept.split(' (')[0]} | ${collision.kept.match(/\(([^)]+)\)/)?.[1] ?? ''} |`);
  }
  lines.push('');

  await writeFile(COLLISIONS_OUT, lines.join('\n'));
}
