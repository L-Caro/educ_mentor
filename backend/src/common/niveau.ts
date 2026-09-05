/** Le niveau scolaire, comme ÉTIQUETTE d'un contenu.
 *
 * L'application vise CP → CM2 : chaque catalogue de module contient donc les notions de
 * toutes les classes, et non celles d'une seule année. Le niveau sert à dire, dans
 * l'écran d'administration, à quelle classe une notion appartient — « passé simple · CM1 »
 * — pour qu'on sache quand l'ouvrir.
 *
 * Ce n'est PAS une porte. Ce qui est jouable reste décidé par la liste des notions actives
 * du module, comme pour les figures de la géométrie : on ouvre ce qu'on veut, quand la
 * classe l'a vu, module par module. Le niveau n'est qu'une indication pour décider.
 */

export type Niveau = 'cp' | 'ce1' | 'ce2' | 'cm1' | 'cm2';

/** Du plus petit au plus grand : l'ordre sert à trier l'affichage. */
export const NIVEAUX: Niveau[] = ['cp', 'ce1', 'ce2', 'cm1', 'cm2'];

export const NIVEAU_LABEL: Record<Niveau, string> = {
  cp: 'CP',
  ce1: 'CE1',
  ce2: 'CE2',
  cm1: 'CM1',
  cm2: 'CM2',
};

export function isNiveau(value: unknown): value is Niveau {
  return (
    typeof value === 'string' && (NIVEAUX as readonly string[]).includes(value)
  );
}

export function rangNiveau(niveau: Niveau): number {
  return NIVEAUX.indexOf(niveau);
}

/** Trie des entrées par niveau croissant, en gardant l'ordre d'origine à niveau égal.
 * L'administration se lit dans l'ordre du programme, pas dans l'ordre alphabétique. */
export function trierParNiveau<T extends { niveau: Niveau }>(
  entrees: T[],
): T[] {
  return [...entrees].sort(
    (a, b) => rangNiveau(a.niveau) - rangNiveau(b.niveau),
  );
}
