import { writeFile } from 'node:fs/promises';
import type { OutputTheme, Stats, UniqueWord } from './main.ts';

export interface ReportData {
  stats: Stats;
  themesOut: OutputTheme[];
  uniqueWords: UniqueWord[];
  missing: string[];
  enSlugToImgids: Map<string, Set<string>>;
  frToEnSlugs: Map<string, Set<string>>;
}

export async function writeReport(destination: URL, data: ReportData): Promise<void> {
  const { stats } = data;
  const lines: string[] = [];

  lines.push('# Extraction kids-flashcards.com : rapport', '');
  lines.push(`Généré le ${new Date().toISOString().slice(0, 10)}.`, '');

  lines.push('## Totaux', '');
  lines.push(`- ${stats.themes} thèmes, ${stats.sets} sets`);
  lines.push(`- ${stats.cardsScraped} cartes-mots scrapées (${stats.titleCardsSkipped} cartes-titre ignorées)`);
  lines.push(`- ${stats.uniqueWords} mots uniques (dédup par image), dont ${stats.duplicateWords} présents dans plusieurs sets`);
  lines.push(`- Images : ${stats.images.ok} OK, ${stats.images.notFound} introuvables (404)`);
  lines.push(
    `- Traductions FR : ${stats.translations.dictionary} depuis dictionary.json, ` +
      `${stats.translations.override} depuis overrides, ${stats.translations.missing} manquantes`,
  );
  lines.push('');

  // Le nombre annoncé par le site inclut la carte-titre.
  const countMismatches = data.themesOut
    .flatMap((theme) => theme.sets.map((set) => ({ theme: theme.slug, ...set })))
    .filter((set) => set.scrapedCount + set.titleCardSkipped !== set.announcedCount);
  lines.push('## Écarts nombre annoncé vs scrapé', '');
  lines.push('_(annoncé = mots + carte-titre)_', '');
  if (countMismatches.length === 0) {
    lines.push('Aucun.', '');
  } else {
    lines.push('| set | annoncé | mots scrapés | carte-titre |', '|---|---|---|---|');
    for (const set of countMismatches) {
      lines.push(`| ${set.theme}/${set.slug} | ${set.announcedCount} | ${set.scrapedCount} | ${set.titleCardSkipped} |`);
    }
    lines.push('');
  }

  lines.push('## Traductions manquantes', '');
  lines.push('À compléter dans `translations.overrides.json`, puis relancer `npm run scrape`.', '');
  if (data.missing.length === 0) {
    lines.push('Aucune.', '');
  } else {
    lines.push('```json');
    lines.push('{');
    lines.push(data.missing.map((en) => `  ${JSON.stringify(en)}: ""`).join(',\n'));
    lines.push('}');
    lines.push('```', '');
  }

  const themeBySetSlug = new Map<string, string>();
  for (const theme of data.themesOut) {
    for (const set of theme.sets) themeBySetSlug.set(set.slug, theme.name);
  }

  lines.push('## Traductions qui écrasent `dictionary.json` : à valider en priorité', '');
  lines.push('Un override remplace volontairement la traduction du dictionnaire existant.', '');
  const overriding = data.uniqueWords.filter((word) => word.overriddenFromDictionary !== null);
  if (overriding.length === 0) {
    lines.push('Aucune.', '');
  } else {
    lines.push('| EN | dictionnaire | override |', '|---|---|---|');
    const seen = new Set<string>();
    for (const word of [...overriding].sort((left, right) => left.en.localeCompare(right.en))) {
      if (seen.has(word.en)) continue;
      seen.add(word.en);
      lines.push(`| ${word.en} | ${word.overriddenFromDictionary} | ${word.fr} |`);
    }
    lines.push('');
  }

  lines.push('## Traductions inventées (source `override`) : à relire', '');
  lines.push('Traductions que je propose faute de correspondance dans `dictionary.json`. Groupées par thème.', '');
  const overrides = data.uniqueWords.filter(
    (word) => word.frSource === 'override' && word.overriddenFromDictionary === null,
  );
  if (overrides.length === 0) {
    lines.push('Aucune.', '');
  } else {
    const byTheme = new Map<string, UniqueWord[]>();
    for (const word of overrides) {
      const themeName = themeBySetSlug.get(word.sets[0]) ?? '(?)';
      if (!byTheme.has(themeName)) byTheme.set(themeName, []);
      byTheme.get(themeName)!.push(word);
    }
    for (const [themeName, words] of [...byTheme.entries()].sort()) {
      lines.push(`### ${themeName}`, '');
      lines.push('| EN | FR proposé |', '|---|---|');
      const seen = new Set<string>();
      for (const word of [...words].sort((left, right) => left.en.localeCompare(right.en))) {
        if (seen.has(word.en)) continue;
        seen.add(word.en);
        lines.push(`| ${word.en} | ${word.fr} |`);
      }
      lines.push('');
    }
  }

  lines.push('## Traductions à relire (plusieurs candidats FR dans le dictionnaire)', '');
  lines.push('Le mot EN existe déjà dans `dictionary.json` avec plusieurs traductions FR ; la première a été retenue.', '');
  const seenEn = new Set<string>();
  const withAlternatives = data.uniqueWords.filter((word) => {
    if (word.dictionaryAlternatives.length === 0 || seenEn.has(word.en)) return false;
    seenEn.add(word.en);
    return true;
  });
  if (withAlternatives.length === 0) {
    lines.push('Aucune.', '');
  } else {
    lines.push('| EN | FR retenu | autres candidats |', '|---|---|---|');
    for (const word of [...withAlternatives].sort((left, right) => left.en.localeCompare(right.en))) {
      lines.push(`| ${word.en} | ${word.fr} | ${word.dictionaryAlternatives.join(', ')} |`);
    }
    lines.push('');
  }

  lines.push('## Collisions de concept (même mot EN, images différentes)', '');
  const enCollisions = [...data.enSlugToImgids.entries()].filter(([, imgids]) => imgids.size > 1);
  if (enCollisions.length === 0) {
    lines.push('Aucune.', '');
  } else {
    lines.push('Le fichier image du second reçoit un suffixe `-<imgid>`.', '');
    lines.push('| mot EN | imgids |', '|---|---|');
    for (const [enSlug, imgids] of enCollisions) {
      lines.push(`| ${enSlug} | ${[...imgids].join(', ')} |`);
    }
    lines.push('');
  }

  lines.push('## Collisions de slug FR (même traduction pour plusieurs mots EN)', '');
  lines.push("À l'import educ_mentor, `slug = normalize(fr)` est unique : le second serait ignoré.", '');
  const frCollisions = [...data.frToEnSlugs.entries()].filter(([, enSlugs]) => enSlugs.size > 1);
  if (frCollisions.length === 0) {
    lines.push('Aucune.', '');
  } else {
    lines.push('| FR | mots EN |', '|---|---|');
    for (const [fr, enSlugs] of frCollisions) {
      lines.push(`| ${fr} | ${[...enSlugs].join(', ')} |`);
    }
    lines.push('');
  }

  lines.push('## Mots présents dans plusieurs sets', '');
  const duplicates = data.uniqueWords
    .filter((word) => word.sets.length > 1)
    .sort((left, right) => right.sets.length - left.sets.length);
  if (duplicates.length === 0) {
    lines.push('Aucun.', '');
  } else {
    lines.push('| EN | sets |', '|---|---|');
    for (const word of duplicates) {
      lines.push(`| ${word.en} | ${word.sets.join(', ')} |`);
    }
    lines.push('');
  }

  await writeFile(destination, lines.join('\n'));
}
