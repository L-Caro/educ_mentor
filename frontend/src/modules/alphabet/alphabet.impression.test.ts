import { describe, expect, it } from 'vitest';
import { alphabetImpression } from './alphabet.impression';

const corrige = (cle: string) => {
  const exercice = alphabetImpression.exercices.find((e) => e.cle === cle);
  if (!exercice) throw new Error(`exercice inconnu : ${cle}`);
  return exercice.reponse;
};

describe('corrigé de l’ordre alphabétique', () => {
  it('rend la liste rangée pour « ranger »', () => {
    expect(
      corrige('ranger')({
        mots: ['giocoso', 'giaour', 'gilbert'],
        reponse: ['giaour', 'gilbert', 'giocoso'],
      }),
    ).toBe('giaour, gilbert, giocoso');
  });

  it('rend les DEUX mots echangés pour « l’intrus »', () => {
    // Le serveur echange deux voisins : les deux sont hors de leur place, et entourer
    // l'un ou l'autre est juste. Un corrige qui n'en nommerait qu'un ferait compter
    // faux une reponse bonne.
    expect(
      corrige('intrus')({
        mots: ['urètre', 'urane', 'urne'],
        reponse: ['urètre', 'urane'],
      }),
    ).toBe('urètre ou urane');
  });

  it('replace le mot dans la liste pour « intercaler », y compris au tout debut', () => {
    // Le serveur rend un RANG, pas une liste : « 0 » seul obligerait l'adulte a
    // recompter la liste pour se corriger. Le rang 0 est le piege : une insertion mal
    // ecrite placerait le mot en deuxieme position.
    expect(
      corrige('intercaler')({
        mots: ['nécessaire', 'néfaste', 'néné'],
        aPlacer: 'nébuleux',
        reponse: ['0'],
      }),
    ).toBe('nébuleux, nécessaire, néfaste, néné');
  });

  it('replace le mot a la fin quand le rang vaut la longueur de la liste', () => {
    expect(
      corrige('intercaler')({
        mots: ['nébuleux', 'nécessaire', 'néfaste'],
        aPlacer: 'néné',
        reponse: ['3'],
      }),
    ).toBe('nébuleux, nécessaire, néfaste, néné');
  });
});
