import { executer, reussi, tourner } from './programmation.interprete';
import type {
  Case,
  Direction,
  Instruction,
  Niveau,
  Parcours,
  SorteBloc,
} from './programmation.types';

/**
 * Les etapes du parcours, et le generateur qui les remplit.
 *
 * ── Engendres, pas ecrits ────────────────────────────────────────────────────────────
 *
 * Vingt niveaux ecrits a la main s'epuisent en deux soirees, et il faudrait les reecrire
 * pour chaque taille de grille. Ils sont donc ENGENDRES, avec la regle du compte est
 * bon : soluble PAR CONSTRUCTION. On part du depart, on marche au hasard sans se
 * recouper, on pose le but a l'arrivee, et les murs se placent sur des cases que le
 * chemin n'emprunte pas. Le chemin existe donc avant le niveau.
 *
 * Et par securite, la solution de reference est REJOUEE dans l'interprete avant de
 * rendre le niveau. Un generateur qui se croit correct et une verification qui le
 * constate ne coutent pas le meme prix le jour ou l'un des deux se trompe.
 *
 * ── La progression ───────────────────────────────────────────────────────────────────
 *
 * Elle ne suit pas les notions informatiques, elle suit ce qui MANQUE. La repetition
 * n'arrive pas parce qu'elle est au programme, mais quand la file devient penible a
 * composer : la boucle doit se presenter comme un soulagement, sinon c'est une contrainte
 * gratuite qu'on subit. Meme chose pour la condition, qui n'apparait qu'une fois qu'il y
 * a quelque chose a decider.
 */

export interface Etape {
  rang: number;
  titre: string;
  consigne: string;
  /** La longueur du chemin a engendrer. */
  pas: [number, number];
  /** Combien de virages au plus : zero donne une ligne droite. */
  virages: number;
  murs: number;
  graines: number;
  /** Les blocs ajoutes a ceux du deplacement. */
  blocsEnPlus: SorteBloc[];
  /** Impose la repetition en bornant le nombre de blocs. */
  bride?: boolean;
}

export const ETAPES: Etape[] = [
  {
    rang: 1,
    titre: 'Tout droit',
    consigne: 'Mets les ordres à la suite, puis lance.',
    pas: [2, 4],
    virages: 0,
    murs: 0,
    graines: 0,
    blocsEnPlus: [],
  },
  {
    rang: 2,
    titre: 'Le détour',
    consigne: 'Il va falloir tourner.',
    pas: [4, 6],
    virages: 2,
    murs: 3,
    graines: 0,
    blocsEnPlus: [],
  },
  {
    rang: 3,
    titre: 'Encore et encore',
    consigne: 'Trop d’ordres ? Répète-les.',
    pas: [7, 10],
    virages: 1,
    murs: 4,
    graines: 0,
    blocsEnPlus: ['repeter'],
    bride: true,
  },
  {
    rang: 4,
    titre: 'La récolte',
    consigne: 'Ramasse tout avant d’arriver.',
    pas: [6, 9],
    virages: 2,
    murs: 4,
    graines: 2,
    blocsEnPlus: ['repeter', 'ramasser'],
  },
  {
    rang: 5,
    titre: 'Si tu vois quelque chose',
    consigne: 'Ramasse seulement s’il y a quelque chose.',
    pas: [8, 12],
    virages: 2,
    murs: 4,
    graines: 3,
    blocsEnPlus: ['repeter', 'ramasser', 'si_graine'],
    bride: true,
  },
  {
    rang: 6,
    titre: 'Si ça bloque',
    consigne: 'Que faire quand le chemin est barré ?',
    pas: [8, 12],
    virages: 4,
    murs: 6,
    graines: 2,
    blocsEnPlus: ['repeter', 'ramasser', 'si_graine', 'si_mur'],
    bride: true,
  },
];

const DEPLACEMENTS: Record<Parcours, SorteBloc[]> = {
  enfant: ['aller_nord', 'aller_est', 'aller_sud', 'aller_ouest'],
  robot: ['avancer', 'tourner_gauche', 'tourner_droite'],
};

const PAS_DIRECTION: Record<Direction, Case> = {
  nord: { x: 0, y: -1 },
  est: { x: 1, y: 0 },
  sud: { x: 0, y: 1 },
  ouest: { x: -1, y: 0 },
};

const TOUTES: Direction[] = ['nord', 'est', 'sud', 'ouest'];

let compteur = 0;
/** Une identite par instruction posee. Un compteur suffit : elles ne vivent que le temps
 * d'une partie, et deux parties ne se melangent jamais. */
export function nouvelId(): string {
  compteur += 1;
  return `i${String(compteur)}`;
}

export function bloc(sorte: SorteBloc, extra: Partial<Instruction> = {}): Instruction {
  return { id: nouvelId(), sorte, ...extra };
}

function melanger<T>(items: T[]): T[] {
  const copie = [...items];
  for (let i = copie.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copie[i], copie[j]] = [copie[j], copie[i]];
  }
  return copie;
}

/** Le chemin : une marche qui ne se recoupe pas, avec un nombre de virages voulu. Rendre
 * `null` plutot que de forcer : l'appelant reessaie, ce qui est plus simple et plus sur
 * que de deboucher une impasse a coups de cas particuliers. */
function tracerChemin(
  colonnes: number,
  lignes: number,
  depart: Case,
  longueur: number,
  viragesVoulus: number,
): { chemin: Case[]; directions: Direction[] } | null {
  const chemin: Case[] = [depart];
  const directions: Direction[] = [];
  let direction: Direction | null = null;
  let virages = 0;

  for (let pas = 0; pas < longueur; pas++) {
    const candidates = melanger(TOUTES).filter((essai) => {
      const cible = {
        x: chemin[chemin.length - 1].x + PAS_DIRECTION[essai].x,
        y: chemin[chemin.length - 1].y + PAS_DIRECTION[essai].y,
      };
      if (cible.x < 0 || cible.y < 0 || cible.x >= colonnes || cible.y >= lignes)
        return false;
      if (chemin.some((c) => c.x === cible.x && c.y === cible.y)) return false;
      // Le nombre de virages est ce qui distingue « tout droit » du « detour » : on ne
      // s'autorise a tourner que tant qu'il en reste a faire.
      if (direction && essai !== direction && virages >= viragesVoulus)
        return false;
      return true;
    });
    if (candidates.length === 0) return null;

    // Continuer tout droit quand c'est possible : une marche qui zigzague a chaque pas
    // consommerait tous les virages des le debut et donnerait un chemin illisible.
    const choix: Direction =
      direction && candidates.includes(direction) && Math.random() < 0.6
        ? direction
        : candidates[0];
    if (direction && choix !== direction) virages++;
    direction = choix;
    directions.push(choix);
    chemin.push({
      x: chemin[chemin.length - 1].x + PAS_DIRECTION[choix].x,
      y: chemin[chemin.length - 1].y + PAS_DIRECTION[choix].y,
    });
  }

  return { chemin, directions };
}

/** Le programme de reference : la suite d'ordres qui refait exactement le chemin. */
function solutionDe(
  parcours: Parcours,
  directions: Direction[],
  directionDepart: Direction,
  graines: Case[],
  chemin: Case[],
): Instruction[] {
  const programme: Instruction[] = [];
  let orientation = directionDepart;

  directions.forEach((voulue, rang) => {
    if (parcours === 'enfant') {
      programme.push(
        bloc(
          (
            {
              nord: 'aller_nord',
              est: 'aller_est',
              sud: 'aller_sud',
              ouest: 'aller_ouest',
            } as const
          )[voulue],
        ),
      );
    } else {
      // Tourner d'abord, avancer ensuite : au plus deux quarts de tour, et on prend le
      // sens le plus court pour que la solution reste celle qu'un humain ecrirait.
      while (orientation !== voulue) {
        const droite = tourner(orientation, 'droite');
        const sens =
          droite === voulue || tourner(droite, 'droite') === voulue
            ? 'droite'
            : 'gauche';
        programme.push(
          bloc(sens === 'droite' ? 'tourner_droite' : 'tourner_gauche'),
        );
        orientation = tourner(orientation, sens);
      }
      programme.push(bloc('avancer'));
    }
    // Ramasser des qu'on pose le pied sur une graine.
    const arrivee = chemin[rang + 1];
    if (graines.some((g) => g.x === arrivee.x && g.y === arrivee.y)) {
      programme.push(bloc('ramasser'));
    }
  });

  return programme;
}

/**
 * Engendre un niveau pour une etape, une taille et un parcours.
 *
 * Borne les essais : si la grille est trop petite pour le chemin demande, on rend le
 * meilleur niveau possible plutot que de tourner sans fin. Une grille de cinq cases de
 * cote ne portera jamais un chemin de douze pas sans se recouper.
 */
export function engendrerNiveau(
  etape: Etape,
  cote: number,
  parcours: Parcours,
): Niveau | null {
  for (let essai = 0; essai < 60; essai++) {
    const depart: Case = {
      x: Math.floor(Math.random() * cote),
      y: Math.floor(Math.random() * cote),
    };
    const longueur =
      etape.pas[0] +
      Math.floor(Math.random() * (etape.pas[1] - etape.pas[0] + 1));
    const trace = tracerChemin(cote, cote, depart, longueur, etape.virages);
    if (!trace) continue;

    const { chemin, directions } = trace;
    const but = chemin[chemin.length - 1];
    const surLeChemin = (c: Case) =>
      chemin.some((etape2) => etape2.x === c.x && etape2.y === c.y);

    // Les murs ne tombent que sur des cases INUTILISEES : le chemin reste praticable, et
    // c'est ce qui rend le niveau soluble par construction.
    const libres: Case[] = [];
    for (let x = 0; x < cote; x++) {
      for (let y = 0; y < cote; y++) {
        if (!surLeChemin({ x, y })) libres.push({ x, y });
      }
    }
    const murs = melanger(libres).slice(0, etape.murs);

    // Les graines se posent SUR le chemin, jamais sur le but : ramasser et arriver au
    // meme instant demande de comprendre deux choses a la fois.
    const interieur = chemin.slice(1, -1);
    const graines = melanger(interieur).slice(0, etape.graines);

    const directionDepart: Direction =
      parcours === 'robot' ? directions[0] : 'est';

    const solution = solutionDe(
      parcours,
      directions,
      directionDepart,
      graines,
      chemin,
    );

    const niveau: Niveau = {
      etape: etape.rang,
      titre: etape.titre,
      consigne: etape.consigne,
      colonnes: cote,
      lignes: cote,
      depart,
      directionDepart,
      but,
      murs,
      graines,
      blocs: [...DEPLACEMENTS[parcours], ...etape.blocsEnPlus],
      solution,
      // La bride se cale sur la solution la plus courte : assez serree pour que la
      // repetition soit necessaire, assez large pour ne pas exiger LA solution optimale.
      maximumBlocs: etape.bride
        ? Math.max(4, Math.ceil(solution.length * 0.7))
        : undefined,
    };

    // La verification : on REJOUE la solution. Le generateur se croit correct, l'interprete
    // le constate. Le jour ou l'un des deux se trompe, c'est ici qu'on l'apprend, et non
    // devant un enfant bloque sur un niveau impossible.
    if (!reussi(niveau, executer(niveau, solution))) continue;

    return niveau;
  }
  return null;
}
