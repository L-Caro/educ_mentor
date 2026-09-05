/**
 * Génération des opérations posées.
 *
 * Séparé du service pour être testable sans base ni injection : c'est ici que se joue la
 * difficulté réelle, et une opération mal calibrée (une soustraction qui passe sous zéro,
 * une addition sans retenue quand on en demandait une) ne se verrait qu'à l'usage.
 */

export type PoseOperation = 'addition' | 'soustraction' | 'multiplication';

/**
 * Les deux méthodes de soustraction posée enseignées à l'école. Elles donnent le même
 * résultat mais s'écrivent différemment, et enseigner l'autre que celle de la maîtresse
 * dessert l'enfant. Le choix est un réglage d'administration : il ne change pas d'une
 * partie à l'autre.
 *
 * `compensation` : quand la soustraction est impossible, on ajoute 10 aux unités du HAUT
 *   et 1 dizaine au chiffre suivant du BAS. C'est la méthode du corpus Kartable.
 * `cassage` : on emprunte une dizaine au chiffre suivant du HAUT, qui est barré et réécrit
 *   diminué de 1. Rien n'est ajouté en bas.
 */
export type MethodeSoustraction = 'compensation' | 'cassage';

/** Marques de retenue d'une colonne, indexées depuis la DROITE (colonne des unités = 0). */
export interface Retenues {
  /** Écrit au-dessus du premier nombre. Compensation : la valeur augmentée de 10.
   *  Cassage : la valeur augmentée de 10, ou le chiffre diminué après emprunt. */
  haut: (number | null)[];
  /** Écrit sous le second nombre. Compensation uniquement : la dizaine ajoutée. */
  bas: (number | null)[];
}

/** Un produit partiel de la multiplication posée : la valeur, et de combien de rangs elle
 * se décale vers la gauche. 247 × 36 en donne deux : 1482 sans décalage, 741 décalé d'un
 * rang — c'est le décalage qui fait toute la difficulté de l'opération. */
export interface ProduitPartiel {
  valeur: number;
  decalage: number;
}

/** Les produits partiels d'une multiplication posée, du chiffre des unités du
 * multiplicateur vers la gauche. Un multiplicateur à un chiffre n'en donne qu'un, égal au
 * résultat : la grille n'affiche alors aucune ligne intermédiaire. */
export function produitsPartiels(a: number, b: number): ProduitPartiel[] {
  return String(b)
    .split('')
    .reverse()
    .map((chiffre, decalage) => ({ valeur: a * Number(chiffre), decalage }))
    .filter((partiel, _, tous) => tous.length === 1 || partiel.valeur > 0);
}

export interface PoseQuestion {
  /** Clé de progression : « soustraction_3_retenue ». Le grain auquel la difficulté se joue. */
  skill_key: string;
  operation: PoseOperation;
  /** Opérandes, dans l'ordre où elles se posent (la plus grande en haut pour une soustraction). */
  operands: number[];
  answer: number;
  /** Nombre de cases de saisie : la longueur du résultat attendu. */
  answer_length: number;
  /** Y a-t-il au moins une retenue ? Sert à l'explication de la fiche. */
  has_carry: boolean;
  /** Les produits partiels — multiplication seulement, vide ailleurs. */
  partiels: ProduitPartiel[];
}

/** Une retenue apparaît dès qu'une colonne dépasse 9 (addition) ou passe sous 0 (soustraction). */
export function hasCarry(
  operation: PoseOperation,
  a: number,
  b: number,
): boolean {
  const chiffresA = String(a).split('').reverse().map(Number);
  const chiffresB = String(b).split('').reverse().map(Number);
  const rangs = Math.max(chiffresA.length, chiffresB.length);

  // Une multiplication pose une retenue dès qu'un produit chiffre × chiffre dépasse 9.
  // Le parcours colonne par colonne des deux autres opérations n'a pas de sens ici.
  if (operation === 'multiplication') {
    return chiffresA.some((x) => chiffresB.some((y) => x * y > 9));
  }

  let retenue = 0;
  for (let i = 0; i < rangs; i++) {
    const x = chiffresA[i] ?? 0;
    const y = chiffresB[i] ?? 0;

    if (operation === 'addition') {
      const somme = x + y + retenue;
      if (somme > 9) return true;
      retenue = 0;
    } else {
      const diff = x - y - retenue;
      if (diff < 0) return true;
      retenue = 0;
    }
  }
  return false;
}

interface Options {
  /** Nombre de chiffres de la plus grande opérande. */
  digits: number;
  /** Veut-on une opération AVEC retenue, SANS, ou peu importe ? */
  carry: 'with' | 'without' | 'any';
  rand: (min: number, max: number) => number;
}

/**
 * Tire une opération respectant les contraintes. Renvoie `null` si elle est impossible à
 * satisfaire — par exemple une soustraction à un chiffre sans retenue existe, mais une
 * addition à un chiffre AVEC retenue impose des tirages contraints : plutôt que de boucler
 * indéfiniment, on abandonne et l'appelant retire un autre type.
 */
export function generatePose(
  operation: PoseOperation,
  options: Options,
): PoseQuestion | null {
  const { digits, carry, rand } = options;
  const min = digits === 1 ? 1 : 10 ** (digits - 1);
  const max = 10 ** digits - 1;

  for (let essai = 0; essai < 80; essai++) {
    let a = rand(min, max);
    // Le multiplicateur reste court : une multiplication posée s'apprend à un puis deux
    // chiffres. Tirer un multiplicateur aussi long que le multiplicande donnerait des
    // grilles de dix colonnes, injouables sur un téléphone et hors programme.
    let b =
      operation === 'multiplication'
        ? rand(2, digits >= 3 ? 99 : 9)
        : rand(1, max);

    // Une soustraction posée ne descend pas sous zéro à ce niveau : on ordonne les opérandes.
    if (operation === 'soustraction' && b > a) [a, b] = [b, a];
    if (operation === 'soustraction' && a === b) continue;

    const retenue = hasCarry(operation, a, b);
    if (carry === 'with' && !retenue) continue;
    if (carry === 'without' && retenue) continue;

    const answer =
      operation === 'addition'
        ? a + b
        : operation === 'soustraction'
          ? a - b
          : a * b;

    return {
      skill_key: `${operation}_${digits}_${retenue ? 'retenue' : 'simple'}`,
      operation,
      operands: [a, b],
      answer,
      answer_length: String(answer).length,
      has_carry: retenue,
      partiels: operation === 'multiplication' ? produitsPartiels(a, b) : [],
    };
  }

  return null;
}

/** Chiffres d'un nombre, indexés depuis la droite. */
function chiffres(n: number, taille: number): number[] {
  const s = String(n).padStart(taille, '0');
  return s.split('').reverse().map(Number);
}

/**
 * Calcule les marques de retenue attendues, telles que l'enfant doit les écrire.
 *
 * C'est le cœur pédagogique du module : ce sont ces cases qu'elle remplit en difficulté
 * moyenne, et que la fiche montre remplies en difficulté facile. Une marque au mauvais
 * endroit enseignerait une méthode que sa maîtresse ne reconnaîtrait pas.
 */
export function computeRetenues(
  operation: PoseOperation,
  a: number,
  b: number,
  methode: MethodeSoustraction,
): Retenues {
  const taille = Math.max(String(a).length, String(b).length) + 1;
  const ca = chiffres(a, taille);
  const cb = chiffres(b, taille);
  // `Array(n).fill(null)` est typé `any[]` : on construit le tableau typé directement.
  const haut: (number | null)[] = Array.from({ length: taille }, () => null);
  const bas: (number | null)[] = Array.from({ length: taille }, () => null);

  // La multiplication posée n'affiche pas de rangée de retenue : à l'école elles
  // s'écrivent petit et s'effacent d'une ligne à l'autre, et une rangée par produit
  // partiel rendrait la grille illisible. Ce qui est demandé, ce sont les produits
  // partiels eux-mêmes et leur décalage.
  if (operation === 'multiplication') {
    return { haut, bas };
  }

  if (operation === 'addition') {
    // La retenue s'écrit au-dessus de la colonne SUIVANTE, comme on l'apprend.
    let retenue = 0;
    for (let i = 0; i < taille; i++) {
      const somme = ca[i] + cb[i] + retenue;
      retenue = somme >= 10 ? 1 : 0;
      if (retenue) haut[i + 1] = 1;
    }
    return { haut, bas };
  }

  if (methode === 'compensation') {
    let ajoutBas = 0;
    for (let i = 0; i < taille; i++) {
      const enBas = cb[i] + ajoutBas;
      if (ca[i] < enBas) {
        haut[i] = ca[i] + 10; // on écrit 17 au-dessus du 7
        bas[i + 1] = (cb[i + 1] ?? 0) + 1; // et on ajoute une dizaine au chiffre du bas
        ajoutBas = 1;
      } else {
        ajoutBas = 0;
      }
    }
    return { haut, bas };
  }

  // Cassage : on emprunte au chiffre suivant du haut, qui est barré et réécrit.
  const travail = [...ca];
  for (let i = 0; i < taille; i++) {
    if (travail[i] < cb[i]) {
      travail[i] += 10;
      travail[i + 1] -= 1;
      haut[i] = travail[i]; // 17 écrit au-dessus du 7
      haut[i + 1] = travail[i + 1]; // 3 écrit au-dessus du 4 barré
    }
  }
  return { haut, bas };
}
