import type { Fiche as FicheContent } from 'src/types/fiche.types';
import FicheSheet from './FicheSheet';

interface FicheProps {
  fiche: FicheContent;
  onClose: () => void;
  closeLabel?: string;
}

/**
 * Une fiche de leçon ouverte par-dessus une partie, présentée comme une page de cahier
 * Séyès.
 *
 * Le fond réglé n'est pas un ornement : il place l'explication dans un objet que l'enfant
 * reconnaît, et il donne au texte une grille de ligne de base : l'écriture repose sur les
 * lignes au lieu de flotter entre elles. La feuille reste claire en thème sombre, comme
 * une vraie feuille posée sur un bureau ; c'est aussi ce qui garde lisibles les
 * illustrations, dont l'encre est foncée.
 *
 * La feuille elle-même vit dans `<FicheSheet>` : la bibliothèque de cours l'affiche sans
 * dialogue ni bouton de fermeture.
 */
export default function Fiche({ fiche, onClose, closeLabel = 'Continuer' }: FicheProps) {
  return (
    <div className="Fiche" role="dialog" aria-modal="true" aria-label={`Leçon : ${fiche.titre}`}>
      <FicheSheet fiche={fiche} />

      <button type="button" className="Fiche__close" onClick={onClose} autoFocus>
        {closeLabel}
      </button>
    </div>
  );
}
