import type { CompteQuestion, Etape, Operation } from './compte.type';

/**
 * Ce que l'enfant a le droit de faire, et comment sa recherche se sérialise.
 *
 * ── Pourquoi `appliquer` existe des deux côtés ───────────────────────────────────────
 *
 * Le serveur a la même fonction, et ce n'est pas une duplication par négligence : les
 * deux ne disent pas la même chose.
 *
 *   — côté serveur, `appliquer` décide ce que le GÉNÉRATEUR s'autorise à écrire dans une
 *     solution de référence. Il y refuse « × 1 » et « ÷ 1 » : l'opération est légale mais
 *     ne change rien, et une étape morte dans un chemin donné en exemple est absurde.
 *   — ici, elle décide ce que L'ENFANT peut poser. « 7 × 1 » est permis. Griser la touche
 *     parce qu'un coup est inutile lui apprendrait que l'application a un avis, pas que
 *     le coup est inutile — elle le découvre en le jouant.
 *
 * Ce qui est refusé des deux côtés l'est parce que le jeu ne sait pas le représenter :
 * les négatifs et les divisions inexactes n'ont pas de plaque.
 */
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
      return a * b;
    case '÷':
      if (b === 0) return null;
      if (a % b !== 0) return null;
      return a / b;
    default:
      return null;
  }
}

/** Une plaque en jeu. `obtenue` distingue celles qu'elle a FABRIQUÉES de celles qui ont
 * été distribuées : c'est ce qui rend le plateau lisible après trois étapes.
 *
 * L'origine est portée par la plaque, et non recalculée depuis le nombre d'étapes : une
 * étape peut consommer un résultat précédent, et le compte « six plaques moins deux par
 * étape » se trompait dès la deuxième. */
export interface Plaque {
  nombre: number;
  obtenue: boolean;
}

/** L'état du plateau : les plaques non consommées, puis les résultats obtenus.
 *
 * Quand plusieurs plaques portent le même nombre, on consomme la première rencontrée —
 * comme `rejouer`. Elles sont interchangeables : ce qui compte est qu'un même exemplaire
 * ne serve pas deux fois. */
export function disponibles(plaques: number[], etapes: Etape[]): Plaque[] {
  const restantes: Plaque[] = plaques.map((nombre) => ({
    nombre,
    obtenue: false,
  }));
  for (const etape of etapes) {
    for (const operande of [etape.a, etape.b]) {
      const index = restantes.findIndex((p) => p.nombre === operande);
      if (index !== -1) restantes.splice(index, 1);
    }
    restantes.push({ nombre: etape.resultat, obtenue: true });
  }
  return restantes;
}

/** Rejoue une suite d'étapes et rend le nombre atteint, ou `null` si elle est
 * injouable — une plaque employée deux fois, une division inexacte.
 *
 * On ne se contente pas de lire le dernier `resultat` : la chaîne arrive du navigateur,
 * et la relire est le seul moyen de savoir qu'elle tient debout. */
export function rejouer(plaques: number[], etapes: Etape[]): number | null {
  const stock = [...plaques];

  for (const etape of etapes) {
    const iA = stock.indexOf(etape.a);
    if (iA === -1) return null;
    stock.splice(iA, 1);

    const iB = stock.indexOf(etape.b);
    if (iB === -1) return null;
    stock.splice(iB, 1);

    const resultat = appliquer(etape.a, etape.operation, etape.b);
    if (resultat === null || resultat !== etape.resultat) return null;
    stock.push(resultat);
  }

  if (etapes.length === 0) return null;
  return etapes[etapes.length - 1].resultat;
}

// ─── Sérialisation ────────────────────────────────────────────────────────────
//
// Le moteur transporte les réponses en CHAÎNES, quel que soit le module : c'est ce qui
// lui permet d'ignorer ce que chaque module fait saisir. Une recherche est une liste
// d'étapes, donc elle voyage en JSON.

export function encode(etapes: Etape[]): string {
  return JSON.stringify(etapes);
}

export function decode(brut: string): Etape[] {
  try {
    const parsed = JSON.parse(brut) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(estEtape);
  } catch {
    return [];
  }
}

function estEtape(value: unknown): value is Etape {
  if (typeof value !== 'object' || value === null) return false;
  const etape = value as Record<string, unknown>;
  return (
    typeof etape.a === 'number' &&
    typeof etape.b === 'number' &&
    typeof etape.resultat === 'number' &&
    typeof etape.operation === 'string'
  );
}

/** Le compte est bon quand la dernière étape TOMBE SUR la cible.
 *
 * Rien d'« approché » n'est compté juste. Le moteur ne connaît que vrai ou faux, et le
 * tordre pour un module coûterait plus qu'il ne rapporte : à 348 pour une cible de 350,
 * l'écran de correction montre l'écart et un chemin qui y menait. C'est là que ça
 * s'apprend, pas dans une demi-étoile. */
export function estCorrecte(question: CompteQuestion, etapes: Etape[]): boolean {
  return rejouer(question.plaques, etapes) === question.cible;
}

/** Le nombre atteint, pour l'écran de résultats. */
export function atteint(question: CompteQuestion, brut: string): number | null {
  return rejouer(question.plaques, decode(brut));
}

/** L'écart à la cible — ce que la correction annonce quand ce n'est pas tombé juste. */
export function ecart(question: CompteQuestion, brut: string): number | null {
  const resultat = atteint(question, brut);
  return resultat === null ? null : Math.abs(resultat - question.cible);
}

export function ecrireEtape(etape: Etape): string {
  return `${etape.a} ${etape.operation} ${etape.b} = ${etape.resultat}`;
}
