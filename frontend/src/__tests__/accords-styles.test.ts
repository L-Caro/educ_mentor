import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Un invariant de mise en page dont le seul symptôme est visuel, donc invisible au typage,
 * au lint et aux tests de logique.
 *
 * Les segments `avant` et `apres` d'une question portent des espaces SIGNIFICATIFS :
 * « Les filles ⬚ dans le jardin. » Sans `white-space: pre-wrap`, HTML replie ces espaces
 * et le trou se colle au mot voisin — « ⬚pomme » au lieu de « ⬚ pomme ». La question
 * reste jouable, la réponse reste juste, et l'énoncé devient illisible.
 *
 * Même raisonnement que `fiche-styles.test.ts`, `pose-styles.test.ts` et
 * `grammaire-styles.test.ts`.
 */

const SCSS = readFileSync(
  join(__dirname, '../modules/accords/accords.scss'),
  'utf-8',
);

function section(selecteur: string): string {
  const debut = SCSS.indexOf(`${selecteur} {`);
  expect(debut, `${selecteur} introuvable`).toBeGreaterThan(-1);
  const fin = SCSS.indexOf('\n}', debut);
  return SCSS.slice(debut, fin === -1 ? undefined : fin).replace(
    /\/\/[^\n]*/g,
    '',
  );
}

describe('énoncé d’accord', () => {
  it('préserve les espaces des segments, des deux côtés du trou', () => {
    expect(section('.AccordsPrompt')).toMatch(/white-space:\s*pre-wrap/);
    expect(section('.AccordsExemple')).toMatch(/white-space:\s*pre-wrap/);
  });

  it('aère la ligne : le trou et l’indice débordent sur un interligne serré', () => {
    expect(section('.AccordsPrompt')).toMatch(/line-height:\s*2/);
  });

  it('distingue le trou du reste de l’énoncé par la couleur ET la graisse', () => {
    // Un trou qui ne se voit pas oblige à relire la phrase pour trouver où répondre.
    const prompt = section('.AccordsPrompt');
    const trou = prompt.slice(prompt.indexOf('&__trou {'));
    expect(trou).toMatch(/color:\s*var\(--color-primary\)/);
    expect(trou).toMatch(/font-weight:\s*700/);
  });

  it('met la réponse en évidence dans l’exemple de la fiche', () => {
    const exemple = section('.AccordsExemple');
    const reponse = exemple.slice(exemple.indexOf('&__reponse {'));
    expect(reponse).toMatch(/background:\s*color-mix/);
    expect(reponse).toMatch(/font-weight:\s*700/);
  });
});
