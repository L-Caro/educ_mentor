import { SIGNE } from './pose.signes';
import './pose.impression.scss';

/**
 * Une operation posee, telle qu'on l'ecrit sur un cahier.
 *
 * ── Pas de cases de retenue ──────────────────────────────────────────────────────────
 *
 * Decision de Lionel, et elle se tient : sur le papier, l'enfant pose ses retenues ou
 * elle veut, comme en classe. Des cases imprimees lui imposeraient une facon d'ecrire,
 * et surtout elles lui diraient COMBIEN il y en a, ce qui est la moitie de l'exercice.
 *
 * ── La taille ────────────────────────────────────────────────────────────────────────
 *
 * Une colonne de chiffre fait 6 mm : une operation a quatre chiffres en occupe 30, plus
 * le signe. On tient donc deux operations dans la largeur d'une A4, ce qui etait la
 * demande. Le grand blanc du dessous est la zone de reponse, generee a la hauteur du
 * nombre de lignes qu'il faudra : une soustraction en demande une, une multiplication a
 * deux chiffres en demande trois.
 */
function chiffres(valeur: number, colonnes: number): (string | null)[] {
  const texte = String(valeur).padStart(colonnes, ' ');
  return [...texte].map((c) => (c === ' ' ? null : c));
}

export default function Posee({
  donnees,
  resultat,
}: {
  donnees: Record<string, unknown>;
  /** Un resultat deja pose, pour l'exercice ou l'on cherche l'erreur. */
  resultat?: number;
}) {
  const operandes = donnees.operandes as number[];
  const colonnes = donnees.colonnes as number;
  const signe = SIGNE[donnees.operation as string] ?? '+';
  // Une multiplication demande une ligne par produit partiel, plus la ligne de total.
  const lignesReponse =
    donnees.operation === 'multiplication' ? String(operandes[1]).length + 1 : 1;

  return (
    <div className="Posee" style={{ ['--colonnes' as string]: colonnes }}>
      {operandes.map((valeur, rang) => (
        <div key={rang} className="Posee__ligne">
          <span className="Posee__signe">{rang === operandes.length - 1 ? signe : ''}</span>
          {chiffres(valeur, colonnes).map((c, i) => (
            <span key={i} className="Posee__chiffre">
              {c}
            </span>
          ))}
        </div>
      ))}
      <div className="Posee__barre" />
      {resultat === undefined ? (
        Array.from({ length: lignesReponse }, (_, i) => (
          <div key={i} className="Posee__ligne Posee__ligne--vide">
            <span className="Posee__signe" />
            {Array.from({ length: colonnes }, (_, j) => (
              <span key={j} className="Posee__chiffre" />
            ))}
          </div>
        ))
      ) : (
        <div className="Posee__ligne">
          <span className="Posee__signe" />
          {chiffres(resultat, colonnes).map((c, i) => (
            <span key={i} className="Posee__chiffre">
              {c}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

