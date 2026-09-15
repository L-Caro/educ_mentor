import { formatCents, getMonnaieImageUrl } from './constants/denominations';

/**
 * Une piece ou un billet : la vraie image, comme dans le jeu.
 *
 * Une premiere version les dessinait au trait, par crainte qu'une photographie sorte en
 * gris indistinct sur une imprimante noir et blanc. C'etait se tromper de contrainte :
 * l'imprimante est en couleurs, et surtout l'exercice consiste a RECONNAITRE une piece.
 * Un rond portant « 20c » ne demande plus de la reconnaitre, il demande de lire un
 * nombre, ce que l'exercice d'a cote fait deja. Avec la vraie piece, la feuille et
 * l'ecran montrent la meme chose, et c'est ce qu'elle trouvera dans un porte-monnaie.
 *
 * Les tailles suivent l'ordre des vraies pieces sans en copier les millimetres : ce qui
 * compte est qu'une piece de deux euros soit visiblement plus grosse qu'une de cinq
 * centimes, comme dans la main.
 */

/** Diametre en millimetres selon la valeur. Les billets sont rectangulaires. */
const DIAMETRE: Record<number, number> = {
  1: 7,
  2: 7.5,
  5: 8.5,
  10: 8,
  20: 9,
  50: 10,
  100: 10.5,
  200: 11.5,
};

export default function PieceImprimee({ valeur }: { valeur: number }) {
  const source = getMonnaieImageUrl(valeur);
  const estBillet = valeur >= 500;

  // Une valeur sans image reste dessinee : mieux vaut un rond chiffre qu'un trou dans la
  // feuille le jour ou une denomination s'ajoute sans son fichier.
  if (!source) {
    return (
      <span className={`Piece${estBillet ? ' Piece--billet' : ''}`}>
        <span className="Piece__valeur">{formatCents(valeur)}</span>
      </span>
    );
  }

  return (
    <img
      src={source}
      alt={formatCents(valeur)}
      className={`Piece__image${estBillet ? ' Piece__image--billet' : ''}`}
      style={estBillet ? undefined : { width: `${String(DIAMETRE[valeur] ?? 12)}mm` }}
    />
  );
}
