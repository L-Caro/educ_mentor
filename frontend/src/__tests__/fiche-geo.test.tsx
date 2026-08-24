import { describe, expect, it } from 'vitest';
import { geoFiche } from 'src/modules/geo/geo.fiche';
import type { GeoCarte, GeoQuestion } from 'src/modules/geo/geo.type';

/**
 * Second genre de fiche : la carte de faits. En géographie il n'y a pas de règle —
 * « pourquoi Lima ? » n'a pas de réponse. La fiche montre donc la carte d'identité du
 * sujet, assemblée par le serveur qui seul possède les 211 pays.
 */

const carte = (over: Partial<GeoCarte> = {}): GeoCarte => ({
  kind: 'pays',
  titre: 'Chili',
  drapeau: '🇨🇱',
  lignes: [
    { label: 'Capitale', valeur: 'Santiago' },
    { label: 'Continent', valeur: 'Amérique du Sud' },
    { label: 'Voisins', valeur: 'Pérou, Bolivie, Argentine' },
  ],
  ...over,
});

const q = (over: Partial<GeoQuestion> = {}): GeoQuestion => ({
  type: 'country_to_capital',
  item_key: 'CL_capital',
  prompt: 'Quelle est la capitale du Chili ?',
  display: '🇨🇱',
  display_type: 'flag',
  choices: [],
  answer: 'Santiago',
  answers: null,
  carte: carte(),
  ...over,
});

describe('fiche de géographie', () => {
  it("prend le nom du sujet pour titre, pas la question", () => {
    expect(geoFiche(q())!.titre).toBe('Chili');
  });

  it("n'existe pas quand la question ne porte pas sur un sujet identifiable", () => {
    // « Quels pays parlent espagnol ? » n'a pas de sujet unique : pas de carte, pas de
    // bouton. Mieux vaut rien qu'une fiche arbitraire sur l'un des pays de la liste.
    expect(geoFiche(q({ carte: null }))).toBeNull();
    expect(geoFiche(q({ carte: undefined }))).toBeNull();
  });

  it("n'énonce pas de règle, puisqu'il n'y en a pas", () => {
    const f = geoFiche(q())!;
    expect(f.regle).toBeUndefined();
    expect(f.exemple).toBeDefined();
  });

  it("adapte l'idée au genre de sujet", () => {
    expect(geoFiche(q())!.idee).toContain('carte du pays');
    expect(geoFiche(q({ carte: carte({ kind: 'continent', drapeau: undefined }) }))!.idee)
      .toContain("ce qu'il contient");
  });

  it('reste la même fiche quel que soit le type de question sur ce pays', () => {
    // Rater la capitale ou rater le continent doit montrer la MÊME carte : c'est ce qui
    // fait qu'une fiche lue une fois sert aux questions suivantes.
    const parCapitale = geoFiche(q({ type: 'country_to_capital' }))!;
    const parContinent = geoFiche(q({ type: 'country_to_continent', item_key: 'CL_continent' }))!;
    expect(parCapitale.titre).toBe(parContinent.titre);
    expect(parCapitale.idee).toBe(parContinent.idee);
  });
});
