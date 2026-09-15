import { ANGLE, type But, type Personnage, type Sol } from '../themes';
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
  perso,
  cible,
  terrain,
}: {
  niveau: Niveau;
  etat: Etat;
  perso: Personnage;
  cible: But;
  terrain: Sol;
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
          style={{ background: pair ? terrain.fond : terrain.fondAlterne }}
        >
          {/* Le motif du sol, seme une case sur deux : sur toutes, il ferait un tapis
              charge qui concurrence ce qu'on doit y voir. */}
          {pair && !mur && (
            <svg viewBox="0 0 100 100" className="Prog__dessin Prog__motif">
              {terrain.motif}
            </svg>
          )}
          {mur && (
            <svg viewBox="0 0 100 100" className="Prog__dessin">
              {terrain.obstacle}
            </svg>
          )}
          {memeCase(c, niveau.but) && (
            <svg viewBox="0 0 100 100" className="Prog__dessin Prog__but">
              {cible.trace}
            </svg>
          )}
          {etat.graines.some((graine) => memeCase(graine, c)) && (
            <svg viewBox="0 0 100 100" className="Prog__dessin Prog__graine">
              {terrain.graine}
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
        {/* Tous les traces regardent vers l'est : une rotation suffit a les orienter, et
            c'est le personnage LUI-MEME qui tourne. Un repere pose a cote finirait par
            contredire le dessin, ce qui est fatal dans un jeu dont le sujet est la
            direction. */}
        <g
          style={{
            transform: `rotate(${String(ANGLE[etat.direction])}deg)`,
            transformOrigin: '50% 50%',
            transition: 'transform 0.25s ease',
          }}
        >
          {perso.trace}
        </g>
      </svg>
    </div>
  );
}
