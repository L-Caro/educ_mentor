import type { CSSProperties } from 'react';
import type { TuileFace } from './mahjong.types';
import TuileFaceSvg from './TuileFaceSvg';
import {
  ombrePortee,
  COULEUR_BLOQUEE,
  ECLAIRAGE_BLOQUEE,
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
  /** Cette tuile est l'une de celles qui bloquent la tuile qu'on vient de refuser. */
  bloqueur: boolean;
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
 *   1. une ombre portee vers le bas-droite, dont le DECALAGE grandit avec la hauteur :
 *      c'est elle, plus que le reste, qui detache une tuile surelevee de ce qu'il y a
 *      dessous, et le seul indice qui distingue une tuile posee dessus d'une tuile haute
 *      posee a cote (voir `ombrePortee`) ;
 *   2. un cote en degrade, clair contre la face eclairee, sombre a sa base ;
 *   3. un assombrissement par etage, pour que les etages bas reculent ;
 *   4. un contour franc, seul separateur entre deux voisines du meme etage, qui ne
 *      projettent aucune ombre l'une sur l'autre.
 *
 * Et un cinquieme indice, qui ne dit pas la hauteur mais la LIBERTE : une tuile bloquee
 * est desaturee et legerement assombrie, de sorte que les jouables sont les SEULES tuiles
 * colorees du plateau (voir `ECLAIRAGE_BLOQUEE`). Sans lui, la plupart des tuiles ne
 * repondent pas au clic et rien n'explique pourquoi.
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
  bloqueur,
  libelle,
  onClick,
}: TuileBlocProps) {
  const ombre = ombrePortee(z);
  const style: CSSProperties = {
    width: LARGEUR_TUILE + EPAISSEUR,
    height: HAUTEUR_TUILE + EPAISSEUR,
    // L'assombrissement des bloquees vient APRES l'ombre, donc il porte aussi sur elle :
    // une tuile en retrait projette une ombre en retrait.
    filter:
      `drop-shadow(${ombre.x}px ${ombre.y}px ${ombre.flou}px rgba(0, 0, 0, 0.45))` +
      (libre
        ? ''
        : ` grayscale(${1 - COULEUR_BLOQUEE}) brightness(${ECLAIRAGE_BLOQUEE})`),
  };

  return (
    <button
      type="button"
      className={[
        'TuileBloc',
        selectionnee ? 'TuileBloc--selectionnee' : '',
        enEchec ? 'TuileBloc--echec' : '',
        bloqueur ? 'TuileBloc--bloqueur' : '',
        !libre ? 'TuileBloc--verrouillee' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={style}
      // Pas `disabled` : une tuile bloquee doit rester cliquable pour pouvoir expliquer
      // ce qui la bloque. `aria-disabled` porte l'information sans couper l'interaction.
      aria-disabled={!libre}
      aria-label={libre ? libelle : `${libelle}, bloquée`}
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
