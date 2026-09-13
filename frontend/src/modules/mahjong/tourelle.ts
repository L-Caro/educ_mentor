import type { TuileFace } from './mahjong.types';
import type { TuileJeu } from './moteur';
import { construireFaces, identifiantFace } from './tuiles';

/**
 * Position en demi-unites (voir ATTRIBUTIONS.md) : l'empreinte au sol d'une tuile est un
 * carre [x, x+2) x [y, y+2), donc deux tuiles cote a cote sont espacees de 2. Les
 * coordonnees impaires existent : c'est ce qui permet a une tuile de l'etage du dessus de
 * chevaucher deux tuiles du dessous a moitie chacune (le motif "brique" des vraies
 * dispositions Mahjong), plutot que de reposer exactement sur une seule.
 */
export interface PositionTourelle {
  x: number;
  y: number;
  z: number;
}

export interface CaseTourelle extends PositionTourelle {
  tuile: TuileJeu;
}

/** Une disposition importee (voir formes/*.json) : un identifiant, un nom affichable, et
 * la liste des positions du plateau plein (144 cases pour les dix dispositions livrees). */
export interface Forme {
  id: string;
  name: string;
  slots: PositionTourelle[];
}

function melanger<T>(valeurs: T[]): T[] {
  const melange = [...valeurs];
  for (let index = melange.length - 1; index > 0; index--) {
    const indexTire = Math.floor(Math.random() * (index + 1));
    [melange[index], melange[indexTire]] = [melange[indexTire], melange[index]];
  }
  return melange;
}

function seChevauchent(a: { x: number; y: number }, b: { x: number; y: number }): boolean {
  return Math.abs(a.x - b.x) < 2 && Math.abs(a.y - b.y) < 2;
}

function occupeVers(occupees: PositionTourelle[], position: PositionTourelle, decalageX: number): boolean {
  return occupees.some(
    (p) => p.z === position.z && seChevauchent(p, { x: position.x + decalageX, y: position.y }),
  );
}

/**
 * Une tuile est libre si rien n'est pose juste au-dessus (chevauchement avec une case de
 * l'etage suivant) et qu'au moins un des deux cotes (gauche ou droite, meme etage) est
 * degage. Le dessous ne compte jamais.
 */
export function estLibre(occupees: PositionTourelle[], position: PositionTourelle): boolean {
  const dessus = occupees.some((p) => p.z === position.z + 1 && seChevauchent(p, position));
  if (dessus) return false;
  return !occupeVers(occupees, position, -2) || !occupeVers(occupees, position, 2);
}

/**
 * Pourquoi une tuile n'est pas jouable, et QUI la bloque.
 *
 * Repondre « c'est la regle » ne suffit pas ici. Dans ces dispositions compactes, les
 * tuiles sont posees en quinconce : mesure sur les dix dispositions livrees, 81 % des
 * voisines qui bloquent sont decalees d'une DEMI-tuile, donc en diagonale. L'enfant voit
 * une tuile qui n'a « rien a droite », et la regle la refuse parce qu'une voisine en
 * bas-a-droite touche quand meme son bord. Le jeu doit donc montrer laquelle.
 *
 * Rend les positions fautives, jamais un simple booleen : c'est ce qui permet de les
 * designer a l'ecran.
 */
export function raisonDuBlocage<T extends PositionTourelle>(
  occupees: T[],
  position: PositionTourelle,
): { cause: 'dessus' | 'cotes' | null; bloqueurs: T[] } {
  const dessus = occupees.filter((p) => p.z === position.z + 1 && seChevauchent(p, position));
  if (dessus.length > 0) return { cause: 'dessus', bloqueurs: dessus };

  const aGauche = occupees.filter(
    (p) => p.z === position.z && seChevauchent(p, { x: position.x - 2, y: position.y }),
  );
  const aDroite = occupees.filter(
    (p) => p.z === position.z && seChevauchent(p, { x: position.x + 2, y: position.y }),
  );
  // Un seul cote degage suffit a rendre la tuile jouable : elle n'est bloquee que si les
  // DEUX sont pris, et les deux sont alors fautifs.
  if (aGauche.length > 0 && aDroite.length > 0) {
    return { cause: 'cotes', bloqueurs: [...aGauche, ...aDroite] };
  }
  return { cause: null, bloqueurs: [] };
}

/** Les cases de l'etage du dessous qui soutiennent physiquement `position` (une seule si
 * elle est alignee dessus, deux si elle chevauche a moitie chacune, comme le motif
 * "brique" des vraies dispositions). */
function supports(forme: PositionTourelle[], position: PositionTourelle): PositionTourelle[] {
  if (position.z === 0) return [];
  return forme.filter((p) => p.z === position.z - 1 && seChevauchent(p, position));
}

/** Une disposition est valide si aucune tuile ne flotte : a etage > 0, chaque case
 * repose sur au moins une case de l'etage du dessous. Verifie une fois, a l'import des
 * dispositions (voir mahjong-tourelle.test.ts) : les dix dispositions livrees passent
 * toutes ce controle. */
export function formeEstValide(forme: PositionTourelle[]): boolean {
  return forme.every((position) => position.z === 0 || supports(forme, position).length > 0);
}

/** Nombre de cotes deja occupes : 0, 1 ou 2. Une position a 1 ne tient plus que par un
 * fil et doit etre retiree en priorite, avant qu'une autre paire ne consomme aussi ce
 * dernier cote et ne la bloque pour de bon. */
function niveauDeRisque(occupees: PositionTourelle[], position: PositionTourelle): number {
  let risque = 0;
  if (occupeVers(occupees, position, -2)) risque++;
  if (occupeVers(occupees, position, 2)) risque++;
  return risque;
}

/**
 * Simule une vraie partie en avant, en retirant a chaque etape les deux tuiles
 * actuellement libres les plus a risque (voir `niveauDeRisque`) : sans cette priorite,
 * une tuile au milieu d'une rangee peut se retrouver bloquee des deux cotes avant d'avoir
 * jamais ete choisie. Comme les deux tuiles retirees ensemble sont toutes les deux
 * verifiees libres sur le VRAI plateau restant (celui qui les contient encore toutes les
 * deux), aucune verification croisee supplementaire n'est necessaire : si le retrait
 * atteint un plateau vide, la partie qu'on vient de jouer est, par construction, une
 * partie valide.
 */
function tenterConstruction(forme: PositionTourelle[]): [PositionTourelle, PositionTourelle][] | null {
  let restantes = melanger(forme);
  const paires: [PositionTourelle, PositionTourelle][] = [];

  while (restantes.length > 0) {
    const libres = restantes
      .filter((position) => estLibre(restantes, position))
      .sort((a, b) => niveauDeRisque(restantes, b) - niveauDeRisque(restantes, a));
    if (libres.length < 2) return null;

    const [positionA, positionB] = libres;
    paires.push([positionA, positionB]);
    restantes = restantes.filter((position) => position !== positionA && position !== positionB);
  }

  return paires;
}

const TENTATIVES_MAX = 300;

/** Genere une disposition de paires garantie solvable, dans l'ordre ou elles peuvent
 * etre retirees (`paires[0]` en premier). */
export function genererDispositionTourelle(forme: PositionTourelle[]): [PositionTourelle, PositionTourelle][] {
  for (let tentative = 0; tentative < TENTATIVES_MAX; tentative++) {
    const resultat = tenterConstruction(forme);
    if (resultat) return resultat;
  }
  throw new Error('impossible de generer un plateau tourelle solvable apres plusieurs tentatives');
}

/**
 * Une face par paire demandee, 34 faces disponibles : un vrai jeu physique a 4
 * exemplaires par face (136 tuiles). Les dispositions classiques en ont 144 (136 + 8
 * tuiles bonus fleurs/saisons, absentes de notre set d'images et dotees en vrai d'une
 * regle d'appariement a part - "n'importe quelle fleur avec n'importe quelle fleur").
 * Plutot que cette regle en plus, les paires en trop reprennent quelques faces une
 * troisieme fois : simplification assumee, sans changer la mecanique d'appariement.
 */
function construirePairesDeFaces(nombrePaires: number): TuileFace[] {
  const facesDeBase = construireFaces();
  const pairesParFace = Math.floor(nombrePaires / facesDeBase.length);
  const restePaires = nombrePaires - pairesParFace * facesDeBase.length;
  const facesSupplementaires = melanger(facesDeBase).slice(0, restePaires);

  const paires: TuileFace[] = [];
  for (const face of facesDeBase) {
    for (let copie = 0; copie < pairesParFace; copie++) paires.push(face);
  }
  paires.push(...facesSupplementaires);

  return melanger(paires);
}

/** Pipeline complet : disposition solvable sur la forme choisie, puis attribution des
 * faces (voir `construirePairesDeFaces`). */
export function genererPlateauTourelle(forme: Forme): CaseTourelle[] {
  const paires = genererDispositionTourelle(forme.slots);
  const faces = construirePairesDeFaces(paires.length);

  const cases: CaseTourelle[] = [];
  paires.forEach(([positionA, positionB], index) => {
    const face = faces[index];
    cases.push({ ...positionA, tuile: { id: `${index}-a`, face } });
    cases.push({ ...positionB, tuile: { id: `${index}-b`, face } });
  });
  return cases;
}

/** Tente d'apparier deux tuiles du plateau : memes faces, et toutes deux libres. */
export function tenterAppariementTourelle(
  cases: CaseTourelle[],
  idA: string,
  idB: string,
): { reussi: boolean; cases: CaseTourelle[] } {
  if (idA === idB) return { reussi: false, cases };
  const caseA = cases.find((c) => c.tuile.id === idA);
  const caseB = cases.find((c) => c.tuile.id === idB);
  if (!caseA || !caseB) return { reussi: false, cases };
  if (identifiantFace(caseA.tuile.face) !== identifiantFace(caseB.tuile.face)) return { reussi: false, cases };
  if (!estLibre(cases, caseA) || !estLibre(cases, caseB)) return { reussi: false, cases };
  return { reussi: true, cases: cases.filter((c) => c.tuile.id !== idA && c.tuile.id !== idB) };
}
