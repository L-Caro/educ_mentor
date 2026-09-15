import type {
  Case,
  Direction,
  Etat,
  Instruction,
  Niveau,
  SorteBloc,
} from './programmation.types';

/** Le pas de chaque direction, dans un repere ou `y` augmente vers le bas : c'est celui
 * de l'ecran, et le seul endroit du module ou le nord vaut moins un. */
const PAS: Record<Direction, Case> = {
  nord: { x: 0, y: -1 },
  est: { x: 1, y: 0 },
  sud: { x: 0, y: 1 },
  ouest: { x: -1, y: 0 },
};

const HORAIRE: Direction[] = ['nord', 'est', 'sud', 'ouest'];

export function tourner(
  direction: Direction,
  sens: 'gauche' | 'droite',
): Direction {
  const rang = HORAIRE.indexOf(direction);
  const pas = sens === 'droite' ? 1 : -1;
  return HORAIRE[(rang + pas + HORAIRE.length) % HORAIRE.length];
}

export function memeCase(a: Case, b: Case): boolean {
  return a.x === b.x && a.y === b.y;
}

/** La direction qu'un bloc `aller_*` demande. `null` pour tous les autres. */
function directionDe(sorte: SorteBloc): Direction | null {
  switch (sorte) {
    case 'aller_nord':
      return 'nord';
    case 'aller_est':
      return 'est';
    case 'aller_sud':
      return 'sud';
    case 'aller_ouest':
      return 'ouest';
    default:
      return null;
  }
}

/**
 * Au-dela, on arrete. Un programme peut boucler beaucoup sans etre faux, mais il faut
 * bien une borne : sans elle, une repetition imbriquee fige l'onglet, et l'enfant ne
 * comprend pas que c'est SON programme qui tourne trop, elle croit que le jeu est casse.
 */
const MAXIMUM_PAS = 500;

/**
 * Deroule le programme et rend la TRACE : un etat par pas.
 *
 * On rend la trace entiere, et non le seul resultat. C'est ce qui permet de rejouer le
 * programme lentement devant elle : voir le personnage entrer dans le mur au quatrieme
 * ordre apprend ou corriger, alors qu'un « perdu » n'apprend rien.
 */
export function executer(niveau: Niveau, programme: Instruction[]): Etat[] {
  const etats: Etat[] = [];
  let etat: Etat = {
    position: { ...niveau.depart },
    direction: niveau.directionDepart,
    graines: niveau.graines.map((graine) => ({ ...graine })),
  };
  etats.push(etat);

  let pas = 0;
  let arrete = false;

  const estMur = (c: Case) =>
    niveau.murs.some((mur) => memeCase(mur, c));
  const dehors = (c: Case) =>
    c.x < 0 || c.y < 0 || c.x >= niveau.colonnes || c.y >= niveau.lignes;

  function poser(suivant: Etat) {
    etat = suivant;
    etats.push(suivant);
    if (suivant.incident) arrete = true;
  }

  function deplacer(direction: Direction) {
    const cible = {
      x: etat.position.x + PAS[direction].x,
      y: etat.position.y + PAS[direction].y,
    };
    if (dehors(cible)) {
      poser({ ...etat, direction, incident: 'dehors' });
      return;
    }
    if (estMur(cible)) {
      poser({ ...etat, direction, incident: 'mur' });
      return;
    }
    poser({ ...etat, position: cible, direction });
  }

  function derouler(instructions: Instruction[]) {
    for (const instruction of instructions) {
      if (arrete) return;
      if (pas >= MAXIMUM_PAS) {
        poser({ ...etat, incident: 'trop_long' });
        return;
      }
      pas++;

      const direction = directionDe(instruction.sorte);
      if (direction) {
        deplacer(direction);
        continue;
      }

      switch (instruction.sorte) {
        case 'avancer':
          deplacer(etat.direction);
          break;

        case 'tourner_gauche':
        case 'tourner_droite':
          poser({
            ...etat,
            direction: tourner(
              etat.direction,
              instruction.sorte === 'tourner_droite' ? 'droite' : 'gauche',
            ),
          });
          break;

        case 'ramasser': {
          const restantes = etat.graines.filter(
            (graine) => !memeCase(graine, etat.position),
          );
          // Ramasser ou il n'y a rien n'est pas une faute : c'est un ordre sans effet,
          // et une condition mal placee doit pouvoir se voir sans faire perdre.
          poser({ ...etat, graines: restantes });
          break;
        }

        case 'repeter': {
          const fois = Math.max(1, instruction.fois ?? 2);
          for (let tour = 0; tour < fois && !arrete; tour++) {
            derouler(instruction.corps ?? []);
          }
          break;
        }

        case 'si_graine':
          if (etat.graines.some((graine) => memeCase(graine, etat.position))) {
            derouler(instruction.corps ?? []);
          }
          break;

        case 'si_mur': {
          const devant = {
            x: etat.position.x + PAS[etat.direction].x,
            y: etat.position.y + PAS[etat.direction].y,
          };
          if (dehors(devant) || estMur(devant)) {
            derouler(instruction.corps ?? []);
          }
          break;
        }
      }
    }
  }

  derouler(programme);
  return etats;
}

/** Combien de blocs un programme compte, corps compris. C'est cette mesure que
 * `maximumBlocs` borne, et c'est elle qui rend la repetition necessaire. */
export function compterBlocs(programme: Instruction[]): number {
  return programme.reduce(
    (total, instruction) =>
      total + 1 + compterBlocs(instruction.corps ?? []),
    0,
  );
}

/** Gagne : arrive sur le but, toutes les graines ramassees, et aucun incident. */
export function reussi(niveau: Niveau, trace: Etat[]): boolean {
  const fin = trace[trace.length - 1];
  return (
    !fin.incident &&
    fin.graines.length === 0 &&
    memeCase(fin.position, niveau.but)
  );
}
