import './tables.impression.scss';

/**
 * La table de Pythagore, trouee.
 *
 * Ce n'est pas un exercice de plus, c'est un AUTRE regard sur ce que les autres
 * travaillent ligne par ligne : la table entiere d'un coup, ou l'on voit que 6 x 8 et
 * 8 x 6 sont la meme case lue dans deux sens, et ou la diagonale des carres saute aux
 * yeux.
 *
 * ── Noir et blanc, alors que le modele est en couleurs ───────────────────────────────
 *
 * Les grilles qu'on trouve en ligne colorient chaque case. C'est joli a l'ecran et ca ne
 * sort pas d'une imprimante : un fond CSS ne s'imprime pas tant que « graphiques
 * d'arriere-plan » n'est pas coche, et cette case est decochee par defaut. La grille
 * serait sortie sans la moindre couleur, et surtout : cent aplats de couleur, c'est une
 * cartouche par feuille.
 *
 * Ce que la couleur apportait d'utile, le TRAIT le rend : l'en-tete est separe du corps
 * par un filet epais, qui dit ou sont les facteurs et ou commence la table. La diagonale
 * des carres, elle, a ete essayee et abandonnee (voir `tables.impression.scss`).
 */
export default function TableauPythagore({
  d,
  memo = false,
}: {
  d: Record<string, unknown>;
  /** La grille REMPLIE, pour le corrige. */
  memo?: boolean;
}) {
  const jusqua = Number(d.jusqua);
  const trous = new Set((d.trous as string[]) ?? []);
  const rangs = Array.from({ length: jusqua }, (_, i) => i + 1);

  return (
    <table className="Pythagore">
      <thead>
        <tr>
          <th className="Pythagore__coin">×</th>
          {rangs.map((colonne) => (
            <th key={colonne} className="Pythagore__entete">
              {colonne}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rangs.map((ligne) => (
          <tr key={ligne}>
            <th className="Pythagore__entete Pythagore__entete--ligne">
              {ligne}
            </th>
            {rangs.map((colonne) => {
              const troue = trous.has(`${String(ligne)},${String(colonne)}`);
              return (
                <td key={colonne} className="Pythagore__case">
                  {troue && !memo ? '' : ligne * colonne}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
