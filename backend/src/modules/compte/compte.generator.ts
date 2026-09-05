/**
 * Génération d'un tirage du Compte est bon.
 *
 * ── La règle qui décide de tout : on construit À L'ENVERS ────────────────────────────
 *
 * Tirer six plaques et une cible au hasard donne, la plupart du temps, un compte
 * IMPOSSIBLE. On peut s'en sortir en acceptant « le plus proche », mais un enfant qui
 * cherche vingt minutes une solution qui n'existe pas n'apprend rien — il apprend que le
 * jeu triche.
 *
 * On part donc d'une suite d'opérations valides tirée au sort, et la cible est ce qu'elle
 * produit. Le tirage est solvable PAR CONSTRUCTION, et la solution est connue : elle sert
 * à montrer un chemin quand l'enfant abandonne.
 *
 * C'est le même principe que les divisions du calcul mental, bâties depuis leur quotient,
 * et que les groupes nominaux des accords, dont l'énoncé et la réponse sortent de la même
 * fonction : construire depuis la réponse rend le faux impossible.
 */

export type Operation = '+' | '-' | '×' | '÷';

export const OPERATIONS: Operation[] = ['+', '-', '×', '÷'];

export function isOperation(value: unknown): value is Operation {
  return (
    typeof value === 'string' &&
    (OPERATIONS as readonly string[]).includes(value)
  );
}

/** Une étape de la solution de référence : « 25 × 8 = 200 ». */
export interface Etape {
  a: number;
  operation: Operation;
  b: number;
  resultat: number;
}

export interface CompteQuestion {
  item_key: string;
  /** Le grain de progression : le nombre d'opérations qu'il faut enchaîner. C'est ça qui
   * distingue une recherche facile d'une recherche difficile, pas la taille des nombres. */
  skill_key: string;
  cible: number;
  /** Les six plaques, dans l'ordre où elles s'affichent. */
  plaques: number[];
  /** Une solution — pas LA solution, il y en a souvent plusieurs. */
  solution: Etape[];
}

export type Rand = (min: number, max: number) => number;

/** Les petites plaques : deux exemplaires de 1 à 10, comme à la télévision. */
const PETITES = Array.from({ length: 10 }, (_, i) => i + 1).flatMap((n) => [
  n,
  n,
]);

/** Les grandes plaques. Elles changent la nature du jeu : sans elles, atteindre 348
 * demande beaucoup d'étapes ; avec 100 et 25, deux suffisent souvent. */
const GRANDES = [25, 50, 75, 100];

export interface Options {
  /** Les opérations autorisées. Au moins une, et `+` seul suffit à jouer. */
  operations: Operation[];
  /** Combien d'opérations la solution de référence enchaîne. */
  etapes: number;
  /** Les grandes plaques entrent-elles dans le tirage ? */
  grandesPlaques: boolean;
  /** Bornes de la cible. Une cible à 3 n'a aucun intérêt, une cible à 40 000 non plus. */
  cibleMin: number;
  cibleMax: number;
  rand: Rand;
}

function melanger<T>(items: T[], rand: Rand): T[] {
  const copie = [...items];
  for (let i = copie.length - 1; i > 0; i--) {
    const j = rand(0, i);
    [copie[i], copie[j]] = [copie[j], copie[i]];
  }
  return copie;
}

/** Le résultat d'une opération, ou `null` si elle n'a pas sa place dans le jeu.
 *
 * Trois refus, et chacun a sa raison :
 *   — une soustraction qui passe sous zéro ou tombe à zéro : hors du jeu, et une plaque
 *     à 0 ne sert plus à rien ensuite ;
 *   — une division inexacte : on ne joue qu'avec des entiers ;
 *   — une multiplication ou une division PAR 1 : elle est légale mais ne fait rien, et
 *     une étape qui ne change pas le nombre donne une solution de référence absurde
 *     (« 7 × 1 = 7 »). */
export function appliquer(
  a: number,
  operation: Operation,
  b: number,
): number | null {
  switch (operation) {
    case '+':
      return a + b;
    case '-':
      return a - b > 0 ? a - b : null;
    case '×':
      return a === 1 || b === 1 ? null : a * b;
    case '÷':
      if (b === 0 || b === 1) return null;
      if (a % b !== 0) return null;
      return a / b;
  }
}

/** Rejoue une suite d'étapes sur un jeu de plaques et rend le nombre atteint.
 *
 * Sert à VÉRIFIER une solution — la sienne comme celle de référence — plutôt qu'à la
 * croire. Rend `null` dès qu'une étape utilise un nombre indisponible ou une opération
 * refusée : c'est ce qui empêche de valider « 100 × 100 » quand il n'y a qu'un 100. */
export function rejouer(
  plaques: number[],
  etapes: Etape[],
): { resultat: number; restantes: number[] } | null {
  const disponibles = [...plaques];

  for (const etape of etapes) {
    const iA = disponibles.indexOf(etape.a);
    if (iA === -1) return null;
    disponibles.splice(iA, 1);

    const iB = disponibles.indexOf(etape.b);
    if (iB === -1) return null;
    disponibles.splice(iB, 1);

    const resultat = appliquer(etape.a, etape.operation, etape.b);
    if (resultat === null || resultat !== etape.resultat) return null;
    disponibles.push(resultat);
  }

  if (etapes.length === 0) return null;
  return {
    resultat: etapes[etapes.length - 1].resultat,
    restantes: disponibles,
  };
}

/** Tire un compte solvable, ou `null` si les contraintes sont inatteignables — une cible
 * à quatre chiffres avec seulement l'addition et de petites plaques, par exemple. */
export function genererCompte(options: Options): CompteQuestion | null {
  const { operations, etapes, grandesPlaques, cibleMin, cibleMax, rand } =
    options;
  if (operations.length === 0) return null;

  const vivier = grandesPlaques ? [...PETITES, ...GRANDES] : PETITES;

  for (let essai = 0; essai < 400; essai++) {
    const plaques = melanger(vivier, rand).slice(0, 6);
    let disponibles = [...plaques];
    const chemin: Etape[] = [];

    for (let pas = 0; pas < etapes; pas++) {
      // On cherche une opération faisable parmi les nombres encore en jeu. Les paires
      // sont parcourues dans un ordre mélangé pour que la solution ne suive pas toujours
      // la même forme.
      //
      // À partir de la deuxième étape, l'une des deux opérandes DOIT être le résultat de
      // l'étape précédente. Sans cette contrainte, le chemin se scinde en branches
      // séparées dont la cible ne dépend pas, et le générateur produisait des solutions
      // de référence à étapes MORTES :
      //
      //     6 × 9   = 54     ← ne sert à rien
      //     3 + 54  = 57     ← ne sert à rien
      //     100 + 25 = 125   ← la cible, atteinte sans les deux premières
      //
      // Le tirage restait solvable, mais montrer ça à un enfant comme « voici un chemin »
      // est pire que ne rien montrer. Une chaîne unique fait compter chaque étape.
      const precedent = pas === 0 ? null : chemin[pas - 1].resultat;
      const paires: [number, number][] = [];
      for (let i = 0; i < disponibles.length; i++) {
        for (let j = 0; j < disponibles.length; j++) {
          if (i === j) continue;
          if (
            precedent !== null &&
            disponibles[i] !== precedent &&
            disponibles[j] !== precedent
          ) {
            continue;
          }
          paires.push([i, j]);
        }
      }

      let trouvee: Etape | null = null;
      for (const [i, j] of melanger(paires, rand)) {
        for (const operation of melanger(operations, rand)) {
          const a = disponibles[i];
          const b = disponibles[j];
          const resultat = appliquer(a, operation, b);
          if (resultat === null) continue;
          trouvee = { a, operation, b, resultat };
          disponibles = disponibles.filter((_, k) => k !== i && k !== j);
          disponibles.push(resultat);
          break;
        }
        if (trouvee) break;
      }

      if (!trouvee) break; // impasse : on repart d'un autre tirage
      chemin.push(trouvee);
    }

    if (chemin.length !== etapes) continue;

    const cible = chemin[chemin.length - 1].resultat;
    if (cible < cibleMin || cible > cibleMax) continue;

    // Vérification par relecture : la solution de référence doit réellement mener à la
    // cible depuis ces plaques. Se fier au calcul qui vient de la produire ne vérifie
    // rien — c'est le même code.
    const controle = rejouer(plaques, chemin);
    if (!controle || controle.resultat !== cible) continue;

    return {
      item_key: `compte_${cible}_${plaques.join('-')}`,
      skill_key: `compte_${etapes}_etapes`,
      cible,
      plaques,
      solution: chemin,
    };
  }

  return null;
}
