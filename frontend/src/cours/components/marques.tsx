import type { ReactNode } from 'react';

/**
 * Le balisage des exemples de la bibliothèque, partagé par `Phrases` et `Paires`.
 *
 * Presque toute la grammaire se montre plutôt qu'elle ne se dit : « le déterminant
 * s'accorde avec le nom » ne veut rien dire pour un enfant de CE1, alors que « les
 * petites maisons » avec les trois s en évidence se lit d'un coup d'oeil. C'est d'autant
 * plus nécessaire que le corpus met 75 % de ses exemples dans des images : il n'y avait
 * rien à reprendre, tout est à montrer autrement.
 *
 * Deux marques, parce que deux suffisent et qu'une troisième ne se distinguerait plus :
 *   `[mot]` surligne un mot entier, pour désigner sa nature ou sa fonction ;
 *   `{s}` met une terminaison en évidence, pour montrer une marque d'accord.
 *
 * Un crochet non fermé s'affiche tel quel plutôt que d'échouer. `cours.test.tsx` vérifie
 * l'équilibre des marques, parce que personne ne verrait le défaut avant l'enfant.
 */

const MARQUES = /(\[[^\]]*\]|\{[^}]*\})/g;

export function rendre(ligne: string): ReactNode[] {
  return ligne.split(MARQUES).map((morceau, i) => {
    if (morceau.startsWith('[') && morceau.endsWith(']')) {
      return (
        <mark className="Phrases__mot" key={i}>
          {morceau.slice(1, -1)}
        </mark>
      );
    }
    if (morceau.startsWith('{') && morceau.endsWith('}')) {
      return (
        <b className="Phrases__marque" key={i}>
          {morceau.slice(1, -1)}
        </b>
      );
    }
    return morceau;
  });
}
