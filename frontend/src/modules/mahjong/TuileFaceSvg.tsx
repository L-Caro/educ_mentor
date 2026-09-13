import type { TuileFace } from './mahjong.types';
import { libelleFace } from './tuiles';
import { cheminImageFace, CHEMIN_FOND_TUILE } from './tuiles-images';
import './mahjong.scss';

/** Face d'une tuile Mahjong : fond commun + symbole superpose, images du domaine public
 * (voir ATTRIBUTIONS.md). Le nom du composant reste `TuileFaceSvg` (l'existant l'appelle
 * ainsi), meme si le rendu est desormais des images plutot qu'un SVG genere. */
export default function TuileFaceSvg({ face }: { face: TuileFace }) {
  const libelle = libelleFace(face);
  // Le fichier source du dragon blanc (Haku.svg, Regular ET Black) est vide chez l'auteur
  // d'origine : aucun trait dedans, verifie directement dans le fichier. Plutot qu'une
  // image qui semble cassee, un cadre dessine en CSS : c'est aussi la convention reelle
  // de cette tuile dans de nombreux jeux physiques (pas de caractere, juste un cadre).
  const estDragonBlanc = face.famille === 'dragon' && face.couleur === 'blanc';

  return (
    <span
      className={estDragonBlanc ? 'TuileFaceSvg TuileFaceSvg--dragonBlanc' : 'TuileFaceSvg'}
      role="img"
      aria-label={libelle}
    >
      <img className="TuileFaceSvg__fond" src={CHEMIN_FOND_TUILE} alt="" draggable={false} />
      {!estDragonBlanc && (
        <img className="TuileFaceSvg__symbole" src={cheminImageFace(face)} alt="" draggable={false} />
      )}
    </span>
  );
}
