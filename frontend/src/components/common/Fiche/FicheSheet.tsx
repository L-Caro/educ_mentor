import type { Fiche as FicheContent } from 'src/types/fiche.types';

/** Une règle d'une seule ligne et une règle multiligne se rendent pareil : un tableau. */
function lignes(regle: string | string[]): string[] {
  return Array.isArray(regle) ? regle : [regle];
}

/**
 * La feuille seule, sans dialogue ni bouton.
 *
 * Extraite de `<Fiche>` parce qu'elle sert dans deux situations qui n'ont rien à voir :
 * une aide qui s'ouvre par-dessus une partie et qu'on referme, et une page de la
 * bibliothèque de cours qu'on lit posément. La feuille, elle, est la même : c'est le
 * même objet reconnaissable, et le dupliquer aurait fait diverger deux mises en page
 * que la grille de ligne de base a coûté cher à régler.
 */
export default function FicheSheet({ fiche }: { fiche: FicheContent }) {
  return (
    <article className="Fiche__sheet">
      <p className="Fiche__tag">{fiche.titre}</p>

      <p className="Fiche__idee">{fiche.idee}</p>

      {fiche.regle && (
        <div className="Fiche__regle">
          {lignes(fiche.regle).map((ligne) => (
            <span key={ligne}>{ligne}</span>
          ))}
        </div>
      )}

      {fiche.exemple && <div className="Fiche__exemple">{fiche.exemple}</div>}

      {fiche.piege && (
        <p className="Fiche__piege">
          <span className="Fiche__piegeMark" aria-hidden="true">!</span>
          <span>{fiche.piege}</span>
        </p>
      )}
    </article>
  );
}
