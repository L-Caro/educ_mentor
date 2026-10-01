/**
 * Ce qu'on demande à l'enfant, et la bonne réponse.
 *
 * Tout est PUR : aucune de ces fonctions ne touche à l'écran ni au son. C'est ce qui
 * permet de vérifier qu'une mesure à compléter est toujours complétable, et qu'un rythme
 * tiré au sort tombe toujours juste, sans ouvrir un navigateur.
 *
 * Les exercices suivent sa méthode, relevée sur son cahier :
 *   - la LECTURE DE NOTES se fait en rondes, sans rythme ;
 *   - la LECTURE RYTHMIQUE se fait sur une seule ligne, sans hauteur.
 * Les deux ne se mélangent qu'une fois chacune acquise, et les mélanger trop tôt reviendrait
 * à demander deux choses à la fois.
 */

import {
  MESURES,
  NOTES,
  ORDRE_FIGURES,
  hauteurDe,
  nomDe,
  nomSilence,
  temps,
  type CleLue,
  type Evenement,
  type Figure,
  type Mesure,
  type Note,
} from './solfege';
import { frequence } from './rythme';
import { TIMBRES, type Timbre } from './audio';

export type Rand = (min: number, max: number) => number;

export interface Reglages {
  /** Les clés au programme. Deux clés mélangées, c'est le vrai saut : le même dessin
   * change de nom, et rien sur la page ne le dit à part la clé. */
  cles: CleLue[];
  /** Combien de lignes supplémentaires on s'autorise, de zéro à deux. */
  etendue: number;
  figures: Figure[];
  mesure: Mesure;
  tempo: number;
  /** La longueur d'une phrase rythmique, en TEMPS. Quatre temps, c'est deux mesures à
   * deux temps : de quoi montrer l'exercice, pas de quoi travailler. */
  longueur: number;
  /**
   * Les notes au programme.
   *
   * Sa méthode n'ouvre pas les sept d'un coup : on commence sur trois notes voisines, on
   * en ajoute une, puis une autre. Interroger `si` la première semaine ne mesurerait que
   * ce qu'elle n'a pas encore vu.
   */
  notes: Note[];
}

export const REGLAGES_DEFAUT: Reglages = {
  cles: ['sol'],
  etendue: 0,
  figures: ['blanche', 'noire'],
  mesure: 2,
  tempo: 72,
  longueur: 12,
  notes: [...NOTES],
};

/** Les positions qu'on s'autorise à écrire, bornes comprises. */
export function positionsPermises(etendue: number): number[] {
  const bas = -2 * etendue;
  const haut = 8 + 2 * etendue;
  return Array.from({ length: haut - bas + 1 }, (_, i) => bas + i);
}

/**
 * Les positions jouables : dans l'étendue ouverte, ET portant une note au programme.
 *
 * Jamais vide : si le réglage ne laissait aucune place, on rendrait l'étendue entière
 * plutôt qu'une question sans réponse. Un réglage trop serré doit donner un exercice
 * facile, pas un exercice cassé.
 */
export function positionsJouables(reglages: Reglages, cle: CleLue): number[] {
  const permises = positionsPermises(reglages.etendue);
  const retenues = permises.filter((p) =>
    reglages.notes.includes(nomDe(hauteurDe(p, cle))),
  );
  return retenues.length > 0 ? retenues : permises;
}

function tirer<T>(liste: readonly T[], rand: Rand): T {
  return liste[rand(0, liste.length - 1)];
}

// ─── Lire une note ───────────────────────────────────────────────────────────

export interface QuestionLire {
  type: 'lire';
  cle: CleLue;
  position: number;
  reponse: Note;
}

export function genererLire(reglages: Reglages, rand: Rand): QuestionLire {
  const cle = tirer(reglages.cles, rand);
  const position = tirer(positionsJouables(reglages, cle), rand);
  return {
    type: 'lire',
    cle,
    position,
    reponse: nomDe(hauteurDe(position, cle)),
  };
}

// ─── Placer une note ─────────────────────────────────────────────────────────

export interface QuestionPlacer {
  type: 'placer';
  cle: CleLue;
  note: Note;
  /** TOUTES les places qui conviennent : un do se pose à plusieurs hauteurs, et refuser
   * la seconde apprendrait qu'il n'y en a qu'une. */
  reponses: number[];
}

export function genererPlacer(reglages: Reglages, rand: Rand): QuestionPlacer {
  const cle = tirer(reglages.cles, rand);
  const permises = positionsJouables(reglages, cle);
  // On tire parmi les notes QUI ONT UNE PLACE, plutôt que de tirer au hasard et de
  // recommencer : poser une question sans réponse est la pire chose qu'un exercice
  // puisse faire, et recommencer indéfiniment en est la deuxième.
  const jouables = NOTES.filter((n) =>
    permises.some((p) => nomDe(hauteurDe(p, cle)) === n),
  );
  const note = tirer(jouables, rand);
  return {
    type: 'placer',
    cle,
    note,
    reponses: permises.filter((p) => nomDe(hauteurDe(p, cle)) === note),
  };
}

// ─── Lire une partition ──────────────────────────────────────────────────────

export interface QuestionPartition {
  type: 'partition';
  cle: CleLue;
  positions: number[];
  /** Les noms, dans l'ordre où ils se lisent. */
  reponse: Note[];
  /** Quatre suites, dont la bonne. */
  choix: Note[][];
}

/** Combien de notes dans une plage. Trois à cinq : c'est la longueur des groupes liés de
 * sa méthode, celle qu'on lit d'un coup d'oeil sans la relire note à note. */
const PLAGE = { minimum: 3, maximum: 5 };

/**
 * Une plage de notes à lire d'un trait.
 *
 * C'est la lecture GROUPÉE de son cahier, et ce n'est pas la même chose que nommer une
 * note isolée : on lit par paquets, on retient l'ordre, et on ne revient pas en arrière.
 * C'est ce qui fait gagner en vitesse, et la vitesse est tout l'objet de l'exercice.
 *
 * Les leurres ne diffèrent que d'UNE ou DEUX notes, et d'un seul degré : des suites qui
 * ne se ressemblent pas se départagent sur la première note, sans lire la suite.
 */
export function genererPartition(
  reglages: Reglages,
  rand: Rand,
): QuestionPartition {
  const cle = tirer(reglages.cles, rand);
  const jouables = positionsJouables(reglages, cle);
  const combien = rand(PLAGE.minimum, PLAGE.maximum);
  const positions = Array.from({ length: combien }, () =>
    tirer(jouables, rand),
  );
  const reponse = positions.map((p) => nomDe(hauteurDe(p, cle)));

  const choix: Note[][] = [reponse];
  for (let essai = 0; essai < 80 && choix.length < 4; essai++) {
    const leurre = [...reponse];
    const combienDeChangements = rand(1, 2);
    for (let c = 0; c < combienDeChangements; c++) {
      const rang = rand(0, leurre.length - 1);
      const depart = NOTES.indexOf(leurre[rang]);
      const pas = rand(0, 1) === 0 ? 1 : -1;
      leurre[rang] = NOTES[(depart + pas + 7) % 7];
    }
    if (!choix.some((suite) => memeSuite(suite, leurre))) choix.push(leurre);
  }

  return {
    type: 'partition',
    cle,
    positions,
    reponse,
    choix: melanger(choix, rand),
  };
}

export function memeSuite(a: readonly Note[], b: readonly Note[]): boolean {
  return a.length === b.length && a.every((note, i) => note === b[i]);
}

// ─── Nommer une figure ───────────────────────────────────────────────────────

export interface QuestionFigure {
  type: 'figure';
  figure: Figure;
  silence: boolean;
  reponse: string;
  choix: string[];
}

/** Le nom d'une figure ou de son silence, tel qu'on le prononce. */
export function nomDe2(figure: Figure, silence: boolean): string {
  return silence ? nomSilence(figure) : NOMS_FIGURES[figure];
}

const NOMS_FIGURES: Record<Figure, string> = {
  ronde: 'ronde',
  blanche: 'blanche',
  noire: 'noire',
  croche: 'croche',
  doubleCroche: 'double croche',
};

/** Jamais moins de trois propositions : une seule, c'est la réponse écrite en toutes
 * lettres, et l'exercice ne mesure plus rien. */
const MINIMUM_CHOIX = 3;

export function genererFigure(reglages: Reglages, rand: Rand): QuestionFigure {
  const figure = tirer(reglages.figures, rand);
  const silence = rand(0, 1) === 1;
  const reponse = nomDe2(figure, silence);

  // Les leurres sont de la MÊME famille : proposer « ronde » à côté de « soupir » se
  // devine sans rien savoir, puisque l'un est une note et l'autre un silence.
  //
  // Ils sont tirés de TOUTES les figures, et non des seules cochées au pré-jeu. Régler le
  // module sur une seule figure ne doit pas produire une question à une seule réponse :
  // le réglage dit ce qu'on lui DEMANDE de reconnaître, pas ce qu'elle a le droit de voir
  // écrit à côté.
  const prioritaires = reglages.figures.filter((f) => f !== figure);
  const reste = ORDRE_FIGURES.filter(
    (f) => f !== figure && !prioritaires.includes(f),
  );
  const leurres = [...melanger(prioritaires, rand), ...melanger(reste, rand)]
    .map((f) => nomDe2(f, silence))
    .filter((nom) => nom !== reponse)
    .slice(0, MINIMUM_CHOIX);

  return {
    type: 'figure',
    figure,
    silence,
    reponse,
    choix: melanger([reponse, ...leurres], rand),
  };
}

function melanger<T>(liste: T[], rand: Rand): T[] {
  const copie = [...liste];
  for (let i = copie.length - 1; i > 0; i--) {
    const j = rand(0, i);
    [copie[i], copie[j]] = [copie[j], copie[i]];
  }
  return copie;
}

// ─── Compléter une mesure ────────────────────────────────────────────────────

export interface QuestionMesure {
  type: 'mesure';
  mesure: Mesure;
  /** La mesure amputée : il manque une figure pour qu'elle tombe juste. */
  evenements: Evenement[];
  /** Où le trou se trouve. */
  trou: number;
  reponse: Figure;
  choix: Figure[];
}

export function genererMesure(reglages: Reglages, rand: Rand): QuestionMesure {
  const complete = remplirMesure(reglages, rand);
  const trou = rand(0, complete.length - 1);
  const reponse = complete[trou].figure;
  const evenements = complete.filter((_, i) => i !== trou);

  // Comme pour les figures : les leurres viennent de tout le catalogue, sinon une mesure
  // composée d'une seule sorte de figure n'offrirait qu'un seul bouton.
  const prioritaires = reglages.figures.filter((f) => f !== reponse);
  const reste = ORDRE_FIGURES.filter(
    (f) => f !== reponse && !prioritaires.includes(f),
  );
  const leurres = [
    ...melanger(prioritaires, rand),
    ...melanger(reste, rand),
  ].slice(0, MINIMUM_CHOIX);
  const choix = melanger([reponse, ...leurres], rand);
  return {
    type: 'mesure',
    mesure: reglages.mesure,
    evenements,
    trou,
    reponse,
    choix,
  };
}

/**
 * Une mesure qui tombe JUSTE, construite par le haut.
 *
 * On ne tire pas des figures au hasard en espérant que la somme tombe bien : elle ne
 * tombe presque jamais bien, et une boucle qui recommence jusqu'à ce que ça marche
 * s'arrête un jour au mauvais moment. On part du temps restant, et on ne propose que ce
 * qui y tient. La mesure est donc juste PAR CONSTRUCTION.
 */
export function remplirMesure(reglages: Reglages, rand: Rand): Evenement[] {
  const evenements: Evenement[] = [];
  let reste = reglages.mesure;
  // Les figures triées du plus long au plus court : on essaie d'abord les grandes, sinon
  // une mesure à quatre temps ne sort que des noires.
  const possibles = [...reglages.figures].sort((a, b) => temps(b) - temps(a));

  while (reste > 1e-9) {
    const tenables = possibles.filter((f) => temps(f) <= reste + 1e-9);
    // La noire en dernier recours. Certaines combinaisons ne peuvent PAS remplir la
    // mesure : une ronde et une blanche ne feront jamais trois temps. Sans ce filet, le
    // tirage se faisait sur une liste vide, rendait `undefined`, et l'exercice tombait
    // en panne sur « impossible de lire les propriétés de undefined ». La noire vaut un
    // temps, et un nombre de temps est toujours entier : elle comble toujours.
    const figure = tenables.length > 0 ? tirer(tenables, rand) : 'noire';
    // Un silence de temps en temps, jamais en premier : une mesure qui commence par un
    // silence se compte mal quand on débute, on ne sait pas quand partir.
    //
    // Et jamais plus long qu'un temps. La lecture rythmique s'écrit sur UNE ligne, où la
    // pause et la demi-pause sont le même rectangle : seule la ligne à laquelle il
    // s'accroche les distingue, et il n'y en a qu'une. Sa méthode n'y met d'ailleurs que
    // des soupirs.
    const silence =
      evenements.length > 0 && temps(figure) <= 1 && rand(0, 2) === 0;
    evenements.push({ figure, silence });
    reste -= temps(figure);
  }
  return evenements;
}

// ─── Lire et frapper un rythme ───────────────────────────────────────────────

export interface QuestionRythme {
  type: 'rythme';
  mesure: Mesure;
  evenements: Evenement[];
  /** Les index après lesquels tracer une barre de mesure. */
  barres: number[];
  tempo: number;
}

/**
 * Une phrase de plusieurs mesures, avec les barres qui les séparent.
 *
 * La longueur se donne en TEMPS et non en mesures : c'est ce qu'on compte quand on
 * frappe, et cela reste la même phrase qu'on soit à deux ou à quatre temps.
 */
export function remplirPhrase(
  reglages: Reglages,
  combienDeTemps: number,
  rand: Rand,
): Phrase {
  const mesures = Math.max(1, Math.round(combienDeTemps / reglages.mesure));
  const evenements: Evenement[] = [];
  const barres: number[] = [];
  for (let m = 0; m < mesures; m++) {
    evenements.push(...remplirMesure(reglages, rand));
    if (m < mesures - 1) barres.push(evenements.length - 1);
  }
  // Une phrase rythmique ne se termine pas sur un silence : on ne saurait pas si elle est
  // finie ou si l'on attend encore.
  const derniere = evenements[evenements.length - 1];
  if (derniere.silence) derniere.silence = false;
  return { evenements, barres };
}

export function genererRythme(reglages: Reglages, rand: Rand): QuestionRythme {
  const { evenements, barres } = remplirPhrase(
    reglages,
    reglages.longueur,
    rand,
  );
  return {
    type: 'rythme',
    mesure: reglages.mesure,
    evenements,
    barres,
    tempo: reglages.tempo,
  };
}

// ─── Dictée rythmique ────────────────────────────────────────────────────────

export interface Phrase {
  evenements: Evenement[];
  barres: number[];
}

export interface QuestionDictee {
  type: 'dictee';
  /** Ce qu'elle entend. */
  joue: Evenement[];
  /** Ce qu'elle voit : trois rythmes écrits, dont le bon. */
  propositions: Phrase[];
  reponse: number;
  tempo: number;
}

/**
 * Une dictée reste COURTE, même quand les phrases à frapper s'allongent.
 *
 * Elle doit se tenir en tête le temps de regarder trois propositions : au-delà de huit
 * temps, ce n'est plus l'oreille qu'on mesure, c'est la mémoire.
 */
const MAXIMUM_DICTEE = 8;

/**
 * Une dictée : un rythme joué, trois écrits, et un seul qui correspond.
 *
 * ── Pourquoi ça ne recommence JAMAIS tout seul ───────────────────────────────────────
 *
 * La première version se rappelait elle-même quand elle ne trouvait pas trois rythmes
 * différents. Avec une seule figure cochée dans une mesure à deux temps, il n'en existe
 * que deux : elle se rappelait indéfiniment et le navigateur tombait sur un « maximum
 * call stack size exceeded », une erreur qui ne dit rien de la cause.
 *
 * On fabrique donc les leurres en DÉFORMANT le rythme joué, ce qui garantit qu'ils en
 * diffèrent. Et si le vivier est trop pauvre pour en trouver trois, on en rend deux :
 * une question plus facile vaut mieux qu'une page blanche.
 */
export function genererDictee(reglages: Reglages, rand: Rand): QuestionDictee {
  const combien = Math.min(reglages.longueur, MAXIMUM_DICTEE);
  const phrase = remplirPhrase(reglages, combien, rand);
  const propositions: Phrase[] = [phrase];

  // Les leurres DÉFORMENT la phrase entendue : un silence qui sonne, ou l'inverse. C'est
  // le seul leurre intéressant, parce qu'il oblige à écouter le DÉTAIL au lieu de
  // reconnaître la silhouette. Et comme la suite de figures ne change pas, les trois
  // propositions s'alignent et se comparent vraiment.
  for (let essai = 0; essai < 120 && propositions.length < 3; essai++) {
    const deforme = deformer(phrase.evenements, rand);
    if (!deforme) break;
    if (!propositions.some((p) => memeRythme(p.evenements, deforme))) {
      propositions.push({ evenements: deforme, barres: phrase.barres });
    }
  }

  // Vivier trop pauvre pour trois : on complète par des phrases neuves, quitte à ce que
  // les barres tombent ailleurs.
  for (let essai = 0; essai < 60 && propositions.length < 3; essai++) {
    const autre = remplirPhrase(reglages, combien, rand);
    if (!propositions.some((p) => memeRythme(p.evenements, autre.evenements))) {
      propositions.push(autre);
    }
  }

  const melangees = melanger(propositions, rand);
  return {
    type: 'dictee',
    joue: phrase.evenements,
    propositions: melangees,
    reponse: melangees.findIndex((p) =>
      memeRythme(p.evenements, phrase.evenements),
    ),
    tempo: reglages.tempo,
  };
}

/**
 * Le même rythme, changé d'une seule chose : un silence qui sonne, ou l'inverse.
 *
 * C'est le leurre le plus intéressant, parce qu'il oblige à écouter le DÉTAIL plutôt que
 * la silhouette générale. Rend `null` quand rien ne peut changer.
 */
function deformer(rythme: Evenement[], rand: Rand): Evenement[] | null {
  // Jamais le premier : une mesure qui commencerait par un silence ne se compte pas.
  const changeables = rythme.map((_, i) => i).filter((i) => i > 0);
  if (changeables.length === 0) return null;
  const rang = tirer(changeables, rand);
  const copie = rythme.map((e) => ({ ...e }));
  copie[rang].silence = !copie[rang].silence;
  // Une mesure entièrement silencieuse après le premier temps ne s'entend pas comme un
  // rythme : on la refuse.
  return copie.some((e, i) => i > 0 && !e.silence) || rythme.length === 1
    ? copie
    : null;
}

/** Deux rythmes se ressemblent s'ils SONNENT pareil : mêmes durées, mêmes silences. */
export function memeRythme(a: Evenement[], b: Evenement[]): boolean {
  return (
    a.length === b.length &&
    a.every((e, i) => e.figure === b[i].figure && e.silence === b[i].silence)
  );
}

// ─── L'oreille ───────────────────────────────────────────────────────────────

export interface QuestionOreille {
  type: 'oreille';
  /** Les deux hauteurs jouées, en degrés. */
  hauteurs: [number, number];
  frequences: [number, number];
  timbre: Timbre;
  reponse: 'monte' | 'descend' | 'pareil';
}

/** Le do du milieu, autour duquel on tire : c'est le registre où une voix d'enfant
 * entend le mieux, et où les deux clés se rejoignent. */
const CENTRE = 4 * 7;

export function genererOreille(ecart: number, rand: Rand): QuestionOreille {
  // L'octave change aussi, pas seulement la note : reconnaître que ça monte toujours
  // dans le même registre finit par se jouer de mémoire plutôt qu'à l'oreille.
  const depart = CENTRE + rand(-3, 3) + 7 * rand(-1, 1);
  const sens = rand(0, 2);
  const pas = sens === 2 ? 0 : rand(1, ecart) * (sens === 0 ? 1 : -1);
  const arrivee = depart + pas;
  return {
    type: 'oreille',
    hauteurs: [depart, arrivee],
    frequences: [frequence(depart), frequence(arrivee)],
    timbre: tirer(TIMBRES, rand),
    reponse: pas > 0 ? 'monte' : pas < 0 ? 'descend' : 'pareil',
  };
}

export const TOUTES_MESURES = MESURES;
export const TOUTES_FIGURES = ORDRE_FIGURES;
