import { formatCents } from './constants/denominations';

/**
 * Une piece ou un billet, au TRAIT.
 *
 * Le jeu montre des photographies des vraies pieces, et c'est ce qu'il faut a l'ecran.
 * Sur le papier elles sortiraient en gris indistincts : une piece de vingt centimes et
 * une de cinquante deviendraient le meme rond sale, ce qui est exactement ce que
 * l'exercice demande de distinguer. Un dessin au trait, avec la valeur ecrite dedans,
 * s'imprime toujours et se lit toujours. C'est aussi ce que font les fichiers de classe.
 *
 * Les tailles suivent l'ordre des vraies pieces sans en copier les millimetres : ce qui
 * compte est qu'une piece de deux euros soit visiblement plus grosse qu'une de cinq
 * centimes, comme dans la main.
 */

/** Diametre en millimetres selon la valeur. Les billets sont rectangulaires. */
const DIAMETRE: Record<number, number> = {
  1: 9,
  2: 10,
  5: 11,
  10: 10,
  20: 11,
  50: 12,
  100: 12.5,
  200: 13.5,
};

export default function PieceImprimee({ valeur }: { valeur: number }) {
  const estBillet = valeur >= 500;

  if (estBillet) {
    return (
      <span className="Piece Piece--billet">
        <span className="Piece__valeur">{formatCents(valeur)}</span>
      </span>
    );
  }

  const diametre = DIAMETRE[valeur] ?? 11;
  return (
    <span
      className="Piece"
      style={{
        width: `${String(diametre)}mm`,
        height: `${String(diametre)}mm`,
      }}
    >
      <span className="Piece__valeur">{formatCents(valeur)}</span>
    </span>
  );
}
