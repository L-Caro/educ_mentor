import { ANGLE, type Theme } from '../themes';
import { memeCase } from '../programmation.interprete';
import type { Case, Etat, Niveau } from '../programmation.types';

/**
 * Le plateau : une tuile par case, et le personnage POSE par-dessus.
 *
 * Le personnage n'est pas dans une case, il est place en absolu sur la grille et glisse
 * d'une case a l'autre par une transition. C'est ce qui permet de VOIR le deplacement :
 * un personnage qui saute d'une case a l'autre ne montre pas le chemin parcouru, et c'est
 * justement le chemin qu'on cherche a lui faire lire.
 */
export default function Grille({
  niveau,
  etat,
  theme,
}: {
  niveau: Niveau;
  etat: Etat;
  theme: Theme;
}) {
  const cases: { c: Case; mur: boolean; pair: boolean }[] = [];
  for (let y = 0; y < niveau.lignes; y++) {
    for (let x = 0; x < niveau.colonnes; x++) {
      cases.push({
        c: { x, y },
        mur: niveau.murs.some((mur) => memeCase(mur, { x, y })),
        pair: (x + y) % 2 === 0,
      });
    }
  }

  const pourcent = (valeur: number, total: number) =>
    `${String((valeur * 100) / total)}%`;

  return (
    <div
      className="Prog__grille"
      style={{
        gridTemplateColumns: `repeat(${String(niveau.colonnes)}, 1fr)`,
        aspectRatio: `${String(niveau.colonnes)} / ${String(niveau.lignes)}`,
      }}
    >
      {cases.map(({ c, mur, pair }) => (
        <div
          key={`${String(c.x)}-${String(c.y)}`}
          className="Prog__case"
          style={{ background: pair ? theme.sol : theme.solAlterne }}
        >
          {mur && (
            <svg viewBox="0 0 100 100" className="Prog__dessin">
              {theme.mur}
            </svg>
          )}
          {memeCase(c, niveau.but) && (
            <svg viewBox="0 0 100 100" className="Prog__dessin Prog__but">
              {theme.but}
            </svg>
          )}
          {etat.graines.some((graine) => memeCase(graine, c)) && (
            <svg viewBox="0 0 100 100" className="Prog__dessin Prog__graine">
              {theme.graine}
            </svg>
          )}
        </div>
      ))}

      <svg
        viewBox="0 0 100 100"
        className="Prog__personnage"
        style={{
          width: pourcent(1, niveau.colonnes),
          height: pourcent(1, niveau.lignes),
          left: pourcent(etat.position.x, niveau.colonnes),
          top: pourcent(etat.position.y, niveau.lignes),
        }}
        aria-label="personnage"
      >
        <g
          style={{
            transform: `rotate(${String(ANGLE[etat.direction])}deg)`,
            transformOrigin: '50% 50%',
            transition: 'transform 0.25s ease',
          }}
        >
          {theme.personnage}
        </g>
      </svg>
    </div>
  );
}
