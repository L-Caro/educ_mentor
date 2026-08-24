import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Deux invariants de mise en page de la fiche, vérifiés sur la feuille de style.
 *
 * Pourquoi tester du CSS : `Fiche.regle` accepte plusieurs lignes, et l'encart ne les empile
 * que grâce à `flex-direction: column`. Une modification qui perd cette déclaration laisse
 * un `display: flex` qui met les lignes EN RANG, avec un défilement horizontal — c'est
 * exactement ce qui est arrivé, et rien ne l'avait signalé : ni le typage, ni le lint, ni
 * les tests de contenu. Le symptôme n'est visible qu'à l'écran.
 */

const SCSS = readFileSync(
  join(__dirname, '../assets/styles/_components/_fiche.scss'),
  'utf-8',
);

/** Corps d'une règle CSS, commentaires retirés. */
function bloc(selecteur: string): string {
  const debut = SCSS.indexOf(`${selecteur} {`);
  expect(debut, `${selecteur} introuvable`).toBeGreaterThan(-1);
  const fin = SCSS.indexOf('\n}', debut);
  return SCSS.slice(debut, fin).replace(/\/\/[^\n]*/g, '');
}

describe('mise en page de la fiche', () => {
  it("empile les lignes de la règle au lieu de les mettre en rang", () => {
    const regle = bloc('.Fiche__regle');
    expect(regle).toContain('display: flex');
    expect(regle).toContain('flex-direction: column');
  });

  it("laisse le texte de la règle passer à la ligne", () => {
    // L'encart calculait sa hauteur sur le nombre d'ÉLÉMENTS et interdisait le retour à
    // la ligne. Ça tenait pour des formes courtes (« je suis · tu es ») ; les phrases de
    // geste des fiches de cours le faisaient défiler horizontalement, et une phrase
    // coupée hors de l'écran ne se lit jamais.
    const regle = bloc('.Fiche__regle');
    expect(regle).not.toContain('nowrap');
    expect(regle).not.toContain('overflow-x');
    // `line-height` contient « height: » : on cible la déclaration seule.
    expect(regle).not.toMatch(/[\s;{]height:/);
  });

  it("garde l'encart sur un nombre entier d'interlignes", () => {
    // Chaque ligne rendue vaut un interligne ; il ne reste qu'à ce que le rembourrage
    // vertical en soit un multiple, sinon tout le texte qui suit sort de la réglure.
    const regle = bloc('.Fiche__regle');
    expect(regle).toContain('line-height: var(--fiche-line)');
    expect(regle).toMatch(/padding:\s*calc\(var\(--fiche-line\)\s*\/\s*2\)/);
  });

  it('garde la feuille claire dans les deux thèmes', () => {
    // Les illustrations du corpus ont une encre foncée sur fond transparent : une feuille
    // qui suivrait le thème sombre les rendrait invisibles.
    const fiche = bloc('.Fiche');
    expect(fiche).toContain('--fiche-paper: #FCFBF8');
    expect(SCSS).not.toContain('prefers-color-scheme');
    expect(SCSS).not.toContain('data-theme');
  });

  it('ne laisse aucun élément dilater sa boîte de ligne', () => {
    // Un glyphe plus grand (l'emblème d'une carte d'identité) sans interligne explicite
    // dilate la boîte de ligne et décale tout ce qui suit hors de la réglure.
    const embleme = bloc('.CarteIdentite__embleme');
    expect(embleme).toContain('font-size');
    expect(embleme).toContain('line-height: var(--fiche-line)');
  });

  it('espace les enfants de l’exemple d’un interligne ENTIER', () => {
    // Un demi-pas décale tout ce qui suit dès qu'il y a deux enfants.
    const exemple = bloc('.Fiche__exemple');
    expect(exemple).toContain('gap: var(--fiche-line)');
    expect(exemple).not.toContain('/ 2');
  });

  it("détache la carte d'identité de la page sans casser la grille", () => {
    const carte = bloc('.CarteIdentite');
    // Une carte posée sur le cahier : fond propre, contour, coins arrondis.
    expect(carte).toContain('background: #fff');
    expect(carte).toContain('box-shadow');
    // Contour en ombre et non en bordure : une bordure ajouterait deux pixels et sortirait
    // la carte de la grille. Et le rembourrage vertical vaut un interligne entier.
    expect(carte).not.toMatch(/\bborder:\s/);
    expect(carte).toContain('padding: var(--fiche-line)');
  });

  it('laisse un blanc entre le trait de marge et le texte', () => {
    const feuille = bloc('.Fiche__sheet');
    expect(bloc('.Fiche')).toContain('--fiche-margin-gap');
    // Le trait est posé sur --fiche-margin-x, le texte commence après le blanc.
    expect(feuille).toContain('var(--fiche-margin-x) 0');
  });
});
