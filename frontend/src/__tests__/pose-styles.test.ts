import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Le barré du cassage, vérifié sur la feuille de style.
 *
 * Pourquoi tester du CSS ici : la figure de la fiche est posée sur la réglure du cahier,
 * et sa hauteur doit rester un multiple exact de l'interligne. Tout ce qui ajoute des
 * pixels à un chiffre (une bordure, une hauteur, une ligne de soulignement) décale la
 * figure ET tout le texte qui la suit. Le symptôme n'est visible qu'à l'écran, et aucun
 * typage ne l'attrape. Trois régressions de ce genre ont déjà eu lieu sur cette fiche.
 */

const SCSS = readFileSync(join(__dirname, '../modules/pose/pose.scss'), 'utf-8');
/** La feuille sans ses commentaires : ils citent les déclarations qu'on interdit. */
const DECLARATIONS = SCSS.replace(/\/\/[^\n]*/g, '');

/** Corps d'une règle CSS, commentaires retirés. */
function bloc(selecteur: string): string {
  const debut = SCSS.indexOf(`${selecteur} {`);
  expect(debut, `${selecteur} introuvable`).toBeGreaterThan(-1);
  const fin = SCSS.indexOf('\n}', debut);
  return SCSS.slice(debut, fin).replace(/\/\/[^\n]*/g, '');
}

describe('chiffre barré du cassage', () => {
  const cibles = ['.PoseFigure__digit--barre', '.PoseGrid__digit--barre'];

  it('dessine la barre sans rien ajouter à la mise en page', () => {
    // `border`, `height` ou `text-decoration` sortiraient la figure de la réglure.
    for (const cible of cibles) {
      const regle = bloc(cible);
      expect(regle, cible).toContain('@include barre(');
      expect(regle, cible).not.toContain('border');
      expect(regle, cible).not.toContain('height');
      expect(regle, cible).not.toContain('text-decoration');
    }
  });

  it('trace la barre en dégradé, pas en soulignement', () => {
    // `line-through` est fin, horizontal et centré sur la ligne de base : ça ne
    // ressemble pas à un trait de crayon, et ça se confond avec le trait de l'opération.
    const mixin = bloc('@mixin barre($couleur, $epaisseur)');
    expect(mixin).toContain('linear-gradient');
    expect(mixin).toContain('no-repeat');
    expect(DECLARATIONS).not.toContain('line-through');
  });

  it('garde la barre franche et n’efface que le chiffre', () => {
    // Une opacité posée sur le bloc entier affadirait aussi la barre.
    for (const cible of cibles) {
      expect(bloc(cible), cible).toContain('color-mix');
      expect(bloc(cible), cible).not.toContain('opacity');
    }
  });

  it('ne laisse pas les barres se rejoindre en une rayure continue', () => {
    // Le fond couvre le chiffre, pas la gouttière entre les colonnes.
    expect(bloc('@mixin barre($couleur, $epaisseur)')).toMatch(/background-size:\s*\d+%/);
  });
});
