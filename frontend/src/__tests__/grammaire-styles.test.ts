import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Trois invariants de la phrase touchable, vérifiés sur la feuille de style, parce que
 * leur seul symptôme est visuel : invisible au typage, au lint et aux tests de logique.
 *
 * Le plus important est la distinction à trois états après la réponse. Le moteur ne
 * connaît que juste/faux, mais l'enfant a besoin de savoir LAQUELLE des deux erreurs elle
 * a faite : un mot oublié et un mot en trop ne se corrigent pas pareil. Si `--oublie`
 * disparaît, un mot manqué s'affiche comme un mot jamais touché et la correction ne dit
 * plus rien.
 *
 * Même raisonnement que `fiche-styles.test.ts` et `pose-styles.test.ts`.
 */

const SCSS = readFileSync(
  join(__dirname, '../modules/grammaire/grammaire.scss'),
  'utf-8',
);

/** Le corps d'un bloc de premier niveau : `.PhraseCliquable`, `.PhraseMarquee`. */
function section(selecteur: string): string {
  const debut = SCSS.indexOf(`${selecteur} {`);
  expect(debut, `${selecteur} introuvable`).toBeGreaterThan(-1);
  const fin = SCSS.indexOf('\n}', debut);
  return SCSS.slice(debut, fin === -1 ? undefined : fin).replace(
    /\/\/[^\n]*/g,
    '',
  );
}

/** Corps d'une règle imbriquée, cherchée DANS une section donnée : `&__mot` existe dans
 * deux sections, et se tromper de section ferait passer le test pour la mauvaise raison. */
function bloc(dans: string, selecteur: string): string {
  const portee = section(dans);
  const debut = portee.indexOf(`${selecteur} {`);
  expect(debut, `${selecteur} introuvable dans ${dans}`).toBeGreaterThan(-1);
  const fin = portee.indexOf('\n  }', debut);
  return portee.slice(debut, fin === -1 ? undefined : fin);
}

describe('phrase touchable', () => {
  it('distingue les trois états de correction, pas seulement juste et faux', () => {
    for (const etat of ['--juste', '--oublie', '--enTrop']) {
      expect(SCSS).toContain(`&${etat} {`);
    }
  });

  it('ne signale pas « oublié » et « en trop » par la seule couleur', () => {
    // Un daltonisme rouge-vert rendrait les deux états identiques. Chacun porte donc une
    // marque de forme : tirets pour l'oubli, texte barré pour le mot en trop.
    expect(bloc('.PhraseCliquable', '&--oublie')).toContain(
      'border-style: dashed',
    );
    expect(bloc('.PhraseCliquable', '&--enTrop')).toContain('line-through');
  });

  it('donne aux mots une cible tactile utilisable au doigt', () => {
    // Sans hauteur minimale, « Le » fait une cible de deux caractères de large sur une
    // ligne de texte : impossible à viser sur un téléphone.
    expect(bloc('.PhraseCliquable', '&__mot')).toMatch(
      /min-height:\s*2\.75rem/,
    );
  });

  it('aère les lignes : les marques débordent sur un interligne serré', () => {
    expect(section('.PhraseCliquable')).toMatch(/line-height:\s*2/);
    expect(section('.PhraseMarquee')).toMatch(/line-height:\s*2/);
  });
});
