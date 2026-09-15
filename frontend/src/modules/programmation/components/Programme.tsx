import { MODELES } from '../programmation.blocs';
import { BLOCS_A_CORPS, type Instruction } from '../programmation.types';

/**
 * La file d'ordres, telle qu'elle sera executee.
 *
 * ── On TAPE, on ne glisse pas ────────────────────────────────────────────────────────
 *
 * Taper un bloc de la palette l'ajoute au bout, taper un bloc de la file le retire. Le
 * glisser-deposer serait plus proche de Scratch, mais il demande deux implementations,
 * une a la souris et une au doigt, et il rate souvent a sept ans : on attrape, on lache
 * a cote, le bloc disparait, et on ne sait pas pourquoi. Taper ne rate jamais.
 *
 * ── Les blocs a corps ────────────────────────────────────────────────────────────────
 *
 * `repete` et `si` contiennent d'autres ordres. Plutot qu'un emboitement a la souris, on
 * DESIGNE le dedans : la zone s'allume, et les blocs suivants y tombent. Une seule regle
 * a comprendre, et elle se voit.
 */
export default function Programme({
  programme,
  cible,
  surRetrait,
  surCible,
  surFois,
  rangActif,
}: {
  programme: Instruction[];
  /** L'identite du bloc dont le dedans est ouvert, `null` pour la racine. */
  cible: string | null;
  surRetrait: (id: string) => void;
  surCible: (id: string | null) => void;
  surFois: (id: string, fois: number) => void;
  /** Le bloc en cours d'execution, pour le suivre du regard pendant que ca tourne. */
  rangActif: string | null;
}) {
  function rendre(instructions: Instruction[], profondeur: number) {
    return instructions.map((instruction) => {
      const modele = MODELES[instruction.sorte];
      const aCorps = BLOCS_A_CORPS.includes(instruction.sorte);
      return (
        <li key={instruction.id} className="Prog__ligne">
          <div
            className={`Prog__bloc Prog__bloc--${modele.famille}${
              rangActif === instruction.id ? ' Prog__bloc--actif' : ''
            }`}
          >
            <button
              type="button"
              className="Prog__blocCorps"
              onClick={() => surRetrait(instruction.id)}
              aria-label={`Retirer ${modele.mot}`}
            >
              <span className="Prog__signe">{modele.signe}</span>
              <span className="Prog__mot">{modele.mot}</span>
            </button>

            {instruction.sorte === 'repeter' && (
              <span className="Prog__fois">
                {[2, 3, 4, 5, 6, 8, 10].map((fois) => (
                  <button
                    key={fois}
                    type="button"
                    className={`Prog__foisChoix${
                      (instruction.fois ?? 2) === fois
                        ? ' Prog__foisChoix--actif'
                        : ''
                    }`}
                    onClick={() => surFois(instruction.id, fois)}
                  >
                    {fois}
                  </button>
                ))}
                <span className="Prog__mot">fois</span>
              </span>
            )}
          </div>

          {aCorps && (
            // Une DIV, pas un bouton. Un `<button>` ne peut pas contenir de liste : le
            // navigateur ejecte alors les elements hors du bouton, et le programme se
            // repandait sous la grille. Le bouton reste, mais comme etiquette a cote.
            <div
              className={`Prog__dedans${
                cible === instruction.id ? ' Prog__dedans--ouvert' : ''
              }`}
            >
              <ul className="Prog__liste">
                {rendre(instruction.corps ?? [], profondeur + 1)}
              </ul>
              <button
                type="button"
                className="Prog__ouvrir"
                onClick={() =>
                  surCible(cible === instruction.id ? null : instruction.id)
                }
              >
                {cible === instruction.id
                  ? '\u2713 on remplit ici'
                  : (instruction.corps ?? []).length === 0
                    ? '+ touche pour remplir'
                    : '+ ajouter ici'}
              </button>
            </div>
          )}
        </li>
      );
    });
  }

  return (
    <div className="Prog__programme">
      <p className="Prog__titre">Ton programme</p>
      {programme.length === 0 ? (
        <p className="Prog__vide">Touche les ordres pour les ajouter.</p>
      ) : (
        <ul className="Prog__liste">{rendre(programme, 0)}</ul>
      )}
      {cible !== null && (
        <button
          type="button"
          className="Prog__sortir"
          onClick={() => surCible(null)}
        >
          ↰ revenir au programme
        </button>
      )}
    </div>
  );
}
