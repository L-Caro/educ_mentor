import type { CSSProperties } from 'react';
import type { TuileFace } from './mahjong.types';
import TuileFaceSvg from './TuileFaceSvg';
import './mahjong.scss';

interface TuileCube3DProps {
  face: TuileFace;
  largeur: number;
  profondeur: number;
  epaisseur: number;
  libre: boolean;
  selectionnee: boolean;
  enEchec: boolean;
  libelle: string;
  onClick: () => void;
}

/**
 * Un vrai cube (3 faces visibles : dessus, avant, droite), place dans l'espace 3D partage
 * de <MahjongTourelle> via `transform-style: preserve-3d`. Formule standard d'un cube CSS
 * (voir n'importe quel tutoriel "css 3d cube") : chaque face est tournee puis poussee de
 * la moitie de la troisieme dimension le long de son propre axe Z, deja tourne.
 *
 * Toutes les tuiles ont les trois faces, y compris l'etage 0 (le sol) : une premiere
 * version ne donnait des faces laterales qu'aux tuiles surelevees, ce qui melangeait des
 * tuiles a bord et des tuiles sans bord sur un meme plateau.
 */
export default function TuileCube3D({
  face,
  largeur,
  profondeur,
  epaisseur,
  libre,
  selectionnee,
  enEchec,
  libelle,
  onClick,
}: TuileCube3DProps) {
  // Chaque face part centree sur le milieu du cube (translate(-50%,-50%), sur ses PROPRES
  // dimensions puisque avant/droite ne font pas la taille du cube) avant de tourner puis
  // de se pousser le long de son axe Z deja tourne : sans ce centrage prealable, la
  // rotation se ferait autour du coin de la face, pas du centre du cube.
  const styleDessus: CSSProperties = {
    width: largeur,
    height: profondeur,
    transform: `translate(-50%, -50%) rotateX(-90deg) translateZ(${epaisseur / 2}px)`,
  };
  const styleAvant: CSSProperties = {
    width: largeur,
    height: epaisseur,
    transform: `translate(-50%, -50%) translateZ(${profondeur / 2}px)`,
  };
  const styleDroite: CSSProperties = {
    width: profondeur,
    height: epaisseur,
    transform: `translate(-50%, -50%) rotateY(90deg) translateZ(${largeur / 2}px)`,
  };

  return (
    <button
      type="button"
      className={[
        'TuileCube3D',
        selectionnee ? 'TuileCube3D--selectionnee' : '',
        enEchec ? 'TuileCube3D--echec' : '',
        !libre ? 'TuileCube3D--verrouillee' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{ width: largeur, height: profondeur }}
      disabled={!libre}
      aria-label={libelle}
      aria-pressed={selectionnee}
      onClick={onClick}
    >
      <span className="TuileCube3D__face TuileCube3D__dessus" style={styleDessus}>
        <TuileFaceSvg face={face} />
      </span>
      <span className="TuileCube3D__face TuileCube3D__avant" style={styleAvant} />
      <span className="TuileCube3D__face TuileCube3D__droite" style={styleDroite} />
    </button>
  );
}
