import {
  compterBlocs,
  executer,
  reussi,
  tourner,
} from './programmation.interprete';
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
  /** Combien de niveaux reussir avant de passer a la suite. Un seul, et six etapes se
   * traversent en six coups : on a fait le tour du module avant d'avoir rien installe.
   * Trois laissent le temps de comprendre, et le chemin s'allonge a chaque fois. */
  reussites: number;
  /** La longueur du chemin a engendrer. */
  pas: [number, number];
  /** Combien de virages au plus : zero donne une ligne droite. */
  virages: number;
  /** Combien de rochers SEMES, quand le terrain reste ouvert. */
  murs: number;
  /** Quelle part du terrain hors chemin est MUREE, de zero a un.
   *
   * C'est ce qui separe une plaine d'un couloir. Des rochers semes au hasard ne ferment
   * rien : il reste toujours mille facons d'aller au but, et l'enfant avance a peu pres
   * dans la bonne direction jusqu'a tomber dessus. En murant une proportion du reste, le
   * chemin devient le passage, et chaque ordre compte.
   *
   * Le chemin, lui, n'est jamais touche : les murs se posent sur les cases qu'il
   * n'emprunte pas, donc le niveau reste soluble quelle que soit la fermeture. */
  fermeture: number;
  graines: number;
  /** Les blocs ajoutes a ceux du deplacement. */
  blocsEnPlus: SorteBloc[];
  /** Impose la repetition en bornant le nombre de blocs. */
  bride?: boolean;
  /** Un chemin en MOTIF (avancer k fois, tourner) repete plusieurs fois, au lieu d'une
   * marche au hasard. C'est ce qui rend la repetition imbriquee necessaire : sans motif,
   * une boucle simple suffit toujours. */
  motif?: boolean;
  /** Donne acces au bloc qu'on se fabrique. */
  fonction?: boolean;
}

export const ETAPES: Etape[] = [
  {
    rang: 1,
    titre: 'Tout droit',
    consigne: 'Mets les ordres à la suite, puis lance.',
    reussites: 3,
    pas: [2, 4],
    virages: 0,
    murs: 0,
    fermeture: 0,
    graines: 0,
    blocsEnPlus: [],
  },
  {
    rang: 2,
    titre: 'Le détour',
    consigne: 'Il va falloir tourner.',
    reussites: 3,
    pas: [4, 6],
    virages: 2,
    murs: 5,
    fermeture: 0.15,
    graines: 0,
    blocsEnPlus: [],
  },
  {
    rang: 3,
    titre: 'Encore et encore',
    consigne: 'Trop d’ordres ? Répète-les.',
    reussites: 3,
    pas: [7, 10],
    virages: 1,
    murs: 7,
    fermeture: 0.3,
    graines: 0,
    blocsEnPlus: ['repeter'],
    bride: true,
  },
  {
    rang: 4,
    titre: 'La récolte',
    consigne: 'Ramasse tout avant d’arriver.',
    reussites: 3,
    pas: [6, 9],
    virages: 2,
    murs: 7,
    fermeture: 0.4,
    graines: 2,
    blocsEnPlus: ['repeter', 'ramasser'],
  },
  {
    rang: 5,
    titre: 'Si tu vois quelque chose',
    consigne: 'Ramasse seulement s’il y a quelque chose.',
    reussites: 3,
    pas: [8, 12],
    virages: 2,
    murs: 7,
    fermeture: 0.5,
    graines: 3,
    blocsEnPlus: ['repeter', 'ramasser', 'si_graine'],
    bride: true,
  },
  {
    rang: 6,
    titre: 'Si ça bloque',
    consigne: 'Que faire quand le chemin est barré ?',
    reussites: 3,
    pas: [8, 12],
    virages: 4,
    murs: 9,
    fermeture: 0.62,
    graines: 2,
    blocsEnPlus: ['repeter', 'ramasser', 'si_graine', 'si_mur'],
    bride: true,
  },
  {
    rang: 7,
    titre: 'Une boucle dans une boucle',
    consigne: 'Le chemin se répète. Trouve le motif.',
    reussites: 3,
    pas: [9, 12],
    virages: 3,
    murs: 6,
    fermeture: 0.5,
    graines: 0,
    blocsEnPlus: ['repeter'],
    bride: true,
    motif: true,
  },
  {
    rang: 8,
    titre: 'Sinon',
    consigne: 'Une chose quand c’est vrai, une autre quand ça ne l’est pas.',
    reussites: 3,
    pas: [8, 12],
    virages: 2,
    murs: 7,
    fermeture: 0.7,
    graines: 3,
    blocsEnPlus: ['repeter', 'ramasser', 'si_graine', 'si_mur'],
    bride: true,
  },
  {
    rang: 9,
    titre: 'Mon bloc à moi',
    consigne: 'Range une suite d’ordres dans ton bloc, puis appelle-le.',
    reussites: 3,
    pas: [9, 12],
    virages: 3,
    murs: 6,
    fermeture: 0.6,
    graines: 0,
    blocsEnPlus: ['repeter', 'appel'],
    bride: true,
    motif: true,
    fonction: true,
  },
  {
    rang: 10,
    titre: 'Jusqu’au but',
    consigne: 'Répète sans savoir combien de fois : jusqu’à être arrivé.',
    reussites: 3,
    pas: [8, 13],
    virages: 3,
    murs: 8,
    fermeture: 0.78,
    graines: 2,
    blocsEnPlus: ['repeter', 'ramasser', 'si_graine', 'si_mur', 'tant_que'],
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

/**
 * Un chemin en MOTIF : `k` pas tout droit, un quart de tour, et on recommence.
 *
 * C'est ce qui rend la repetition imbriquee necessaire. Sur une marche au hasard, une
 * boucle simple suffit toujours a tenir dans la bride, et l'imbrication reste une
 * curiosite qu'on n'a aucune raison d'essayer. Ici le chemin EST un motif repete : le
 * programme le plus court l'est aussi.
 *
 * Le sens de rotation ne change pas d'un tour a l'autre : un motif qui alterne ne se
 * repete plus, il se decrit.
 */
function tracerMotif(
  colonnes: number,
  lignes: number,
  depart: Case,
  longueur: number,
): { chemin: Case[]; directions: Direction[] } | null {
  for (let essai = 0; essai < 40; essai++) {
    // Au plus QUATRE segments : au cinquieme, un motif qui tourne toujours du meme cote
    // revient sur son point de depart et se recoupe. C'est ce qui faisait echouer l'etape
    // du motif des que la grille grandissait, la longueur demandee augmentant avec elle :
    // on cherchait neuf tours la ou un carre n'en a que quatre. La longueur se gagne donc
    // sur le COTE du motif, pas sur le nombre de tours.
    const tours = 2 + Math.floor(Math.random() * 3);
    const cote = Math.max(
      2,
      Math.min(colonnes - 1, Math.round(longueur / tours)),
    );
    const sens = Math.random() < 0.5 ? 'droite' : 'gauche';
    let direction = TOUTES[Math.floor(Math.random() * TOUTES.length)];

    const chemin: Case[] = [depart];
    const directions: Direction[] = [];
    let valide = true;

    for (let tour = 0; tour < tours && valide; tour++) {
      for (let pas = 0; pas < cote; pas++) {
        const derniere = chemin[chemin.length - 1];
        const cible = {
          x: derniere.x + PAS_DIRECTION[direction].x,
          y: derniere.y + PAS_DIRECTION[direction].y,
        };
        if (
          cible.x < 0 ||
          cible.y < 0 ||
          cible.x >= colonnes ||
          cible.y >= lignes ||
          chemin.some((c) => c.x === cible.x && c.y === cible.y)
        ) {
          valide = false;
          break;
        }
        directions.push(direction);
        chemin.push(cible);
      }
      // Pas de quart de tour apres le dernier segment : il ferait un ordre de plus qui
      // ne sert a rien, et la solution la plus courte cesserait d'etre un motif pur.
      if (valide && tour < tours - 1) direction = tourner(direction, sens);
    }

    if (valide && chemin.length > 3) return { chemin, directions };
  }
  return null;
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
 * Regroupe les ordres identiques consecutifs en repetitions.
 *
 * C'est la factorisation la plus simple qui soit, celle qu'un enfant trouve : « trois
 * fois la meme fleche, donc repete trois fois cette fleche ». Elle sert a calculer la
 * BRIDE, et c'est tout son interet : bornee a un pourcentage de la solution a plat, la
 * bride pouvait devenir impossible a tenir sur certains tirages, et rien ne l'aurait
 * signale avant qu'un enfant ne bloque sans recours. Calculee ici, elle est atteignable
 * par construction, tout en refusant la solution a plat.
 */
export function compacter(programme: Instruction[]): Instruction[] {
  const sortie: Instruction[] = [];
  let rang = 0;

  while (rang < programme.length) {
    const courante = programme[rang];
    let combien = 1;
    while (
      rang + combien < programme.length &&
      programme[rang + combien].sorte === courante.sorte &&
      !programme[rang + combien].corps
    ) {
      combien++;
    }
    // A deux, la repetition coute autant qu'elle rapporte : deux blocs pour deux blocs.
    if (combien >= 3 && !courante.corps) {
      sortie.push(bloc('repeter', { fois: combien, corps: [courante] }));
    } else {
      for (let i = 0; i < combien; i++) sortie.push(programme[rang + i]);
    }
    rang += combien;
  }

  return sortie;
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
  /** Le resserrement dans l'etape, de zero a un : les niveaux suivants d'une meme etape
   * ferment un peu plus que le premier. Trois niveaux identiques a la suite ne font pas
   * progresser, ils font patienter. */
  serrage = 0,
): Niveau | null {
  for (let essai = 0; essai < 60; essai++) {
    const depart: Case = {
      x: Math.floor(Math.random() * cote),
      y: Math.floor(Math.random() * cote),
    };
    // La longueur voulue, RAMENEE a ce que la grille permet. Un chemin de dix pas avec un
    // seul virage ne tient pas sur cinq cases de cote : il faudrait se recouper. Sans ce
    // calcul, l'etape trois ne produisait aucun niveau en cinq sur cinq, et l'enfant y
    // restait bloquee sans autre explication qu'un message lui demandant d'agrandir la
    // grille : une facon de dire que le jeu ne sait pas faire ce qu'il propose.
    // Les longueurs des etapes sont donnees pour une grille de huit : sur vingt, le meme
    // chemin de dix pas laisserait le but a un coin d'un terrain quatre fois plus grand,
    // et les trois quarts de la grille ne serviraient a rien. Elles suivent donc la
    // taille.
    const echelle = cote / 8;
    const tenable = Math.max(
      2,
      Math.min(cote * cote - 1, (etape.virages + 1) * (cote - 1)),
    );
    const bas = Math.min(Math.round(etape.pas[0] * echelle), tenable);
    const haut = Math.min(Math.round(etape.pas[1] * echelle), tenable);
    const longueur = bas + Math.floor(Math.random() * (haut - bas + 1));
    const trace = etape.motif
      ? tracerMotif(cote, cote, depart, longueur)
      : tracerChemin(cote, cote, depart, longueur, etape.virages);
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
    // Les murs suivent la SURFACE, pas le cote. Quatre rochers sur soixante-quatre cases
    // font un terrain accidente ; les memes multiplies par deux et demi, soit dix sur
    // quatre cents cases, font une plaine ou l'on passe partout. La densite est ce qui
    // rend un detour necessaire, et elle se mesure au carre.
    // Deux facons de poser les murs, et c'est la fermeture qui tranche. A zero, on SEME
    // quelques rochers : un decor, sur un terrain ou tout reste possible. Au-dela, on MURE
    // une proportion de ce qui n'est pas le chemin, et le terrain devient un couloir.
    const fermeture = Math.min(0.88, etape.fermeture + serrage * 0.12);
    const murs =
      fermeture <= 0
        ? melanger(libres).slice(0, Math.round(etape.murs * echelle * echelle))
        : melanger(libres).slice(0, Math.round(libres.length * fermeture));

    // Les graines se posent SUR le chemin, jamais sur le but : ramasser et arriver au
    // meme instant demande de comprendre deux choses a la fois.
    const interieur = chemin.slice(1, -1);
    // Les graines, elles, restent proportionnelles a la LONGUEUR du chemin : elles sont
    // posees dessus, et c'est lui qui s'allonge, pas la surface.
    const graines = melanger(interieur).slice(
      0,
      Math.round(etape.graines * echelle),
    );

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
      avecFonction: etape.fonction,
      // La bride se cale sur la solution la plus courte : assez serree pour que la
      // repetition soit necessaire, assez large pour ne pas exiger LA solution optimale.
      // Une etape a motif se bride plus serre : a soixante-dix pour cent, une boucle
      // simple passe encore, et l'imbrication reste une curiosite qu'on n'essaie pas.
      // La bride se cale sur la solution FACTORISEE, plus une marge d'un bloc. Elle
      // refuse donc la suite a plat et reste atteignable par construction : un
      // pourcentage de la longueur pouvait tomber sous le minimum realisable, et l'enfant
      // se serait retrouve devant un niveau que rien ne permettait de finir.
      maximumBlocs: etape.bride
        ? compterBlocs(compacter(solution)) + 1
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
