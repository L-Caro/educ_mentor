import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Invariants de mise en page de l'accueil, vérifiés sur la feuille de style : leur seul
 * symptôme est visuel, donc invisible au typage, au lint et aux tests de logique.
 *
 * Même raisonnement que `fiche-styles.test.ts` et `grammaire-styles.test.ts`.
 */

const SCSS = readFileSync(
  join(__dirname, '../assets/styles/_layout/_homeLayout.scss'),
  'utf-8',
);
const COURS = readFileSync(join(__dirname, '../cours/cours.scss'), 'utf-8');
const RESET = readFileSync(
  join(__dirname, '../assets/styles/_base/_reset.scss'),
  'utf-8',
);

function bloc(selecteur: string, source = SCSS): string {
  const debut = source.indexOf(`${selecteur} {`);
  expect(debut, `${selecteur} introuvable`).toBeGreaterThan(-1);
  const fin = source.indexOf('\n\t}', debut);
  return source.slice(debut, fin === -1 ? undefined : fin);
}

describe('accueil', () => {
  it('n’a plus de filtre exclusif : les sections l’ont remplacé', () => {
    // L'ancien filtre cachait tout le reste. Le laisser à côté des sections donnerait
    // deux mécanismes concurrents pour le même besoin.
    expect(SCSS).not.toContain('&__filterBtn');
    expect(SCSS).not.toContain('&__filters');
  });

  it('donne au bouton « Au hasard » et au lien Cours la même cible tactile', () => {
    // Ils sont côte à côte dans la même rangée : deux hauteurs différentes se voient.
    expect(bloc('&__hasard')).toMatch(/min-height:\s*2\.75rem/);
    expect(bloc('.HomeLayout__cours', COURS)).toMatch(/min-height:\s*2\.75rem/);
  });

  it('laisse le conteneur porter l’espacement de la rangée d’actions', () => {
    // Une marge sur le lien Cours le désalignait verticalement de son voisin.
    expect(bloc('.HomeLayout__cours', COURS)).not.toMatch(/margin-bottom/);
    expect(bloc('&__actions')).toMatch(/gap:/);
  });

  it('rend l’en-tête de section assez grand pour être touché', () => {
    expect(bloc('&__sectionBtn')).toMatch(/min-height:\s*2\.75rem/);
  });

  it('réserve une largeur fixe au chevron', () => {
    // Le chevron change de glyphe (▸ / ▾) plutôt que de tourner : sans largeur fixe, le
    // titre se décalerait horizontalement à chaque pliage.
    expect(bloc('&__chevron')).toMatch(/width:\s*1ch/);
  });

  it('fait tenir l’attribut `hidden` contre le display de la grille', () => {
    // `[hidden] { display: none }` vient de la feuille du NAVIGATEUR, et toute règle
    // d'auteur posant un `display` la bat — l'origine auteur l'emporte sur l'origine
    // navigateur, quelle que soit la spécificité. Sans cette règle, une section repliée
    // par `hidden={vrai}` reste affichée : le chevron passe à « replié » et les tuiles
    // ne bougent pas. C'est arrivé, et ce test ne le voyait pas — il vérifiait la
    // grille, jamais le pliage.
    expect(RESET).toMatch(/\[hidden\]\s*\{[^}]*display\s*:\s*none\s*!important/);
  });

  it('replie bien par `hidden`, et non par démontage du sous-arbre', () => {
    // Démonter perdrait l'état des tuiles et provoquerait un re-rendu complet à chaque
    // pliage. Le corollaire est la règle ci-dessus : sans elle, `hidden` ne fait rien.
    const accueil = readFileSync(
      join(__dirname, '../components/layout/HomeLayout.tsx'),
      'utf-8',
    );
    expect(accueil).toMatch(/hidden=\{repliee\}/);
  });

  it('garde la grille responsive dans chaque section', () => {
    // La grille est désormais rendue une fois par section : la perdre en chemin donnerait
    // des tuiles empilées sur une colonne.
    const grille = bloc('&__grid');
    expect(grille).toMatch(/grid-template-columns:\s*repeat\(4/);
    expect(grille).toContain('sm-lt');
  });
});
