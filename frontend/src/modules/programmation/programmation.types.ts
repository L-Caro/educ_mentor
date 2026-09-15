/**
 * Programmer un deplacement : le vocabulaire.
 *
 * ── Deux parcours, deux facons de tourner ────────────────────────────────────────────
 *
 * `enfant` donne des ordres ABSOLUS : « va vers le haut », et le personnage se tourne
 * tout seul. `robot` donne des ordres RELATIFS : « avance », « tourne a gauche », ou la
 * gauche est celle du personnage et non celle de l'enfant.
 *
 * Ce n'est pas un reglage de confort, c'est le coeur de la difficulte. Tourner a gauche
 * quand le personnage regarde vers le bas demande de se mettre a sa place et de faire
 * pivoter mentalement un repere : c'est de la geometrie, et elle arrive bien apres l'idee
 * de suite d'ordres. Les jeux du genre imposent le relatif d'emblee et perdent les plus
 * jeunes sur une difficulte qui n'est pas celle qu'ils pretendent enseigner.
 */

export type Direction = 'nord' | 'est' | 'sud' | 'ouest';

export const PARCOURS = ['enfant', 'robot'] as const;
export type Parcours = (typeof PARCOURS)[number];

export type SorteBloc =
  | 'aller_nord'
  | 'aller_est'
  | 'aller_sud'
  | 'aller_ouest'
  | 'avancer'
  | 'tourner_gauche'
  | 'tourner_droite'
  | 'ramasser'
  | 'repeter'
  | 'si_graine'
  | 'si_mur'
  | 'tant_que'
  | 'appel';

/** Les blocs qui portent un CORPS : d'autres instructions a l'interieur. */
export const BLOCS_A_CORPS: SorteBloc[] = [
  'repeter',
  'si_graine',
  'si_mur',
  'tant_que',
];

/** Les blocs qui portent un SINON, c'est-a-dire un second corps. */
export const BLOCS_A_SINON: SorteBloc[] = ['si_graine', 'si_mur'];

export interface Case {
  x: number;
  y: number;
}

export interface Instruction {
  /** Identite propre, stable tant que l'instruction vit : c'est elle qui sert de cle de
   * rendu et de cible de suppression. Deux « avance » se ressemblent trop pour qu'un
   * index suffise, et un index change des qu'on retire une instruction avant lui. */
  id: string;
  sorte: SorteBloc;
  /** `repeter` seulement. */
  fois?: number;
  /** `repeter`, `si_graine`, `si_mur` et `tant_que`. */
  corps?: Instruction[];
  /** Ce qu'on fait QUAND CE N'EST PAS le cas. Le `sinon` d'une condition : sans lui, il
   * faut deux conditions contraires pour dire une seule chose. */
  sinon?: Instruction[];
}

/** Le bloc qu'on se fabrique : une suite d'ordres a laquelle on donne un nom, et qu'on
 * rappelle ensuite d'un seul geste. C'est la notion la plus puissante du module, et la
 * seule qui demande de PENSER une suite avant de s'en servir. */
export interface Fonction {
  /** Les ordres que le bloc contient. */
  corps: Instruction[];
}

export interface Niveau {
  /** Le rang de l'etape : c'est ce qui est memorise entre deux venues. */
  etape: number;
  titre: string;
  consigne: string;
  colonnes: number;
  lignes: number;
  depart: Case;
  directionDepart: Direction;
  but: Case;
  murs: Case[];
  /** Les graines a ramasser avant d'atteindre le but. */
  graines: Case[];
  /** Les blocs poses dans la palette. Rien d'autre n'est disponible : une palette qui
   * offrirait tout des le premier niveau noierait ce qu'on cherche a montrer. */
  blocs: SorteBloc[];
  /** Un programme qui resout le niveau. Il n'est jamais montre a l'enfant : il est la
   * preuve que le niveau EST soluble, verifiee a l'engendrement (voir le generateur). */
  solution: Instruction[];
  /** Le niveau donne-t-il acces au bloc qu'on se fabrique ? */
  avecFonction?: boolean;
  /** Au-dela, le programme est refuse : c'est ce qui rend la repetition necessaire
   * plutot que facultative. Absent, pas de limite. */
  maximumBlocs?: number;
}

/** L'etat du personnage a un instant. La trace d'execution en est une suite, et c'est
 * elle qu'on anime : rejouer pas a pas est la seule facon de voir OU son programme a
 * derape, ce qu'un simple « perdu » ne dit pas. */
export interface Etat {
  position: Case;
  direction: Direction;
  /** Ce qui reste a ramasser. */
  graines: Case[];
  /** Ce qui vient de se passer, pour le raconter. */
  incident?: 'mur' | 'dehors' | 'trop_long';
}
