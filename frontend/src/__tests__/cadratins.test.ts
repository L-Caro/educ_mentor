import { readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { readdirSync, statSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * Le cadratin est proscrit, et la règle existait avant ce test : `frontend/CLAUDE.md`
 * l'interdit dans le texte affiché depuis longtemps, avec une note « nettoyage à faire »
 * pour les commentaires. La note a vécu assez pour que 762 cadratins s'accumulent dans le
 * dépôt. Une règle qu'aucun test ne tient n'est pas une règle.
 *
 * Ce que ça remplace : `:` quand ce qui suit explique ce qui précède, `,` quand c'est une
 * incise ou qu'une conjonction suit, `·` dans les libellés courts.
 *
 * Il reste des cadratins LÉGITIMES, où le caractère est une donnée et non de la
 * ponctuation de prose. Ils sont nommés un par un : une liste explicite oblige à
 * justifier chaque exception, là où un motif à trous en laisserait passer de nouvelles.
 */
const LEGITIMES = new Set([
  // La ponctuation que la dictée rogne aux bords d'un mot.
  'src/modules/dictee/dictee.tokens.ts',
  // Le tiret « rien à afficher » d'un tableau ou d'une liste vide.
  'src/modules/imagier/admin/ImagierWordList.tsx',
  'src/modules/pendu/PenduGame.tsx',
  'src/modules/grammaire/admin/GrammaireNotions.tsx',
  'src/modules/accords/admin/AccordsNotions.tsx',
  // Les tests qui vérifient justement son absence, celui-ci compris.
  'src/__tests__/cadratins.test.ts',
  'src/__tests__/fiche-maths.test.ts',
  'src/__tests__/fiche-pose.test.tsx',
  'src/__tests__/grammaire-fiche.test.tsx',
  'src/__tests__/geometrie-fiche.test.tsx',
  'src/__tests__/cours.test.tsx',
]);

const RACINE = join(__dirname, '..');

function fichiers(dossier: string): string[] {
  return readdirSync(dossier).flatMap((nom) => {
    const chemin = join(dossier, nom);
    if (statSync(chemin).isDirectory()) return fichiers(chemin);
    return /\.(ts|tsx|scss)$/.test(nom) ? [chemin] : [];
  });
}

describe('pas de cadratins', () => {
  it('n’en laisse aucun dans le code, les commentaires compris', () => {
    const fautifs: string[] = [];
    for (const chemin of fichiers(RACINE)) {
      const relatif = `src/${relative(RACINE, chemin)}`.replace(/\\/g, '/');
      if (LEGITIMES.has(relatif)) continue;
      const lignes = readFileSync(chemin, 'utf-8').split('\n');
      lignes.forEach((ligne, i) => {
        if (ligne.includes('—')) fautifs.push(`${relatif}:${i + 1}`);
      });
    }
    expect(fautifs).toEqual([]);
  });
});
