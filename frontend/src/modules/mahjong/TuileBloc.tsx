import type { CSSProperties } from 'react';
import type { TuileFace } from './mahjong.types';
import TuileFaceSvg from './TuileFaceSvg';
import {
  EPAISSEUR,
  HAUTEUR_TUILE,
  LARGEUR_TUILE,
  eclairementEncre,
  eclairementFace,
} from './mahjong.geometrie';
import './mahjong.scss';

interface TuileBlocProps {
  face: TuileFace;
  /** L'etage, et le sommet du plateau : ensemble ils donnent la profondeur. */
  z: number;
  zSommet: number;
  libre: boolean;
  selectionnee: boolean;
  enEchec: boolean;
  libelle: string;
  onClick: () => void;
}

/**
 * Une tuile vue en projection oblique : sa face, et le bloc qui la relie a l'etage du
 * dessous. Voir `mahjong.geometrie.ts` pour la projection elle-meme.
 *
 * Le relief ne tient pas au dessin du bloc, qui ne fait que quelques pixels de large. Il
 * tient a QUATRE indices, et c'est leur cumul qui rend un plateau lisible :
 *
 *   1. une ombre portee vers le bas-droite, qui grandit avec la hauteur : c'est elle,
 *      plus que le reste, qui DETACHE une tuile surelevee de ce qu'il y a dessous ;
 *   2. un cote en degrade, clair contre la face eclairee, sombre a sa base ;
 *   3. un assombrissement par etage, pour que les etages bas reculent ;
 *   4. un contour franc, seul separateur entre deux voisines du meme etage, qui ne
 *      projettent aucune ombre l'une sur l'autre.
 *
 * L'ombre passe par `filter: drop-shadow` et non `box-shadow` : elle doit epouser la
 * silhouette en L du bloc, pas son rectangle englobant.
 */
export default function TuileBloc({
  face,
  z,
  zSommet,
  libre,
  selectionnee,
  enEchec,
  libelle,
  onClick,
}: TuileBlocProps) {
  const style: CSSProperties = {
    width: LARGEUR_TUILE + EPAISSEUR,
    height: HAUTEUR_TUILE + EPAISSEUR,
    // L'ombre s'allonge avec la hauteur : une tuile au sol est posee sur la table et
    // garde une ombre courte, une tuile surelevee flotte au-dessus de l'etage du dessous.
    filter: `drop-shadow(3px 4px ${3 + 2 * z}px rgba(0, 0, 0, 0.45))`,
  };

  return (
    <button
      type="button"
      className={[
        'TuileBloc',
        selectionnee ? 'TuileBloc--selectionnee' : '',
        enEchec ? 'TuileBloc--echec' : '',
        !libre ? 'TuileBloc--verrouillee' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={style}
      disabled={!libre}
      aria-label={libelle}
      aria-pressed={selectionnee}
      onClick={onClick}
    >
      <span className="TuileBloc__cote" />
      <span
        className="TuileBloc__face"
        style={{
          width: LARGEUR_TUILE,
          height: HAUTEUR_TUILE,
          filter: `brightness(${eclairementFace(z, zSommet)})`,
        }}
      >
        <span
          className="TuileBloc__encre"
          style={{ filter: `brightness(${eclairementEncre(z, zSommet)})` }}
        >
          <TuileFaceSvg face={face} />
        </span>
      </span>
    </button>
  );
}
