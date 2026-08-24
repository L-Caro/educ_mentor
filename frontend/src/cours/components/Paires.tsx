import { rendre } from './marques';
import './etapes.scss';

interface Props {
  /** Les deux en-têtes : « masculin » et « féminin », « singulier » et « pluriel »… */
  colonnes: [string, string];
  lignes: [string, string][];
}

/**
 * Deux colonnes de formes qui se répondent.
 *
 * La moitié des leçons de grammaire du CE1 est une opposition à deux termes : masculin
 * contre féminin, singulier contre pluriel, avant contre après. Les écrire en phrase
 * oblige à retenir laquelle est laquelle ; côte à côte, la différence saute aux yeux et
 * c'est tout ce qu'il y a à voir.
 *
 * Rendu en grille et non en `<table>` : une bordure de cellule ajoute un pixel par ligne
 * et sort la figure de la réglure du cahier.
 *
 * Les formes acceptent le même balisage que `Phrases` : `{s}` met une terminaison en
 * évidence, ce qui est tout l'intérêt sur une colonne de pluriels.
 */
export default function Paires({ colonnes, lignes }: Props) {
  return (
    <div className="Paires" role="table">
      <div className="Paires__ligne Paires__ligne--tete" role="row">
        <span role="columnheader">{colonnes[0]}</span>
        <span role="columnheader">{colonnes[1]}</span>
      </div>
      {lignes.map(([gauche, droite]) => (
        <div className="Paires__ligne" role="row" key={gauche + droite}>
          <span role="cell">{rendre(gauche)}</span>
          <span role="cell">{rendre(droite)}</span>
        </div>
      ))}
    </div>
  );
}
