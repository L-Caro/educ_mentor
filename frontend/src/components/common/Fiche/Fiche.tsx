import type { Fiche as FicheContent } from 'src/types/fiche.types';

interface FicheProps {
  fiche: FicheContent;
  onClose: () => void;
  closeLabel?: string;
}

/**
 * Une fiche de leçon, présentée comme une page de cahier Séyès.
 *
 * Le fond réglé n'est pas un ornement : il place l'explication dans un objet que l'enfant
 * reconnaît, et il donne au texte une grille de ligne de base — l'écriture repose sur les
 * lignes au lieu de flotter entre elles. La feuille reste claire en thème sombre, comme
 * une vraie feuille posée sur un bureau ; c'est aussi ce qui garde lisibles les
 * illustrations, dont l'encre est foncée.
 */
export default function Fiche({ fiche, onClose, closeLabel = 'Continuer' }: FicheProps) {
  return (
    <div className="Fiche" role="dialog" aria-modal="true" aria-label={`Leçon : ${fiche.titre}`}>
      <article className="Fiche__sheet">
        <p className="Fiche__tag">{fiche.titre}</p>

        <p className="Fiche__idee">{fiche.idee}</p>

        {fiche.regle && <p className="Fiche__regle">{fiche.regle}</p>}

        {fiche.exemple && <div className="Fiche__exemple">{fiche.exemple}</div>}

        {fiche.piege && (
          <p className="Fiche__piege">
            <span className="Fiche__piegeMark" aria-hidden="true">!</span>
            <span>{fiche.piege}</span>
          </p>
        )}
      </article>

      <button type="button" className="Fiche__close" onClick={onClose} autoFocus>
        {closeLabel}
      </button>
    </div>
  );
}
