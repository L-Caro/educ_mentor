export type TuileFamille = 'bambou' | 'cercle' | 'caractere' | 'vent' | 'dragon';

export type TuileValeurSimple = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export type TuileVent = 'est' | 'sud' | 'ouest' | 'nord';

export type TuileDragon = 'rouge' | 'vert' | 'blanc';

/**
 * Une face de tuile Mahjong. Union discriminante sur `famille` : bambou/cercle/caractere
 * portent une valeur de 1 à 9, vent une direction, dragon une couleur.
 */
export type TuileFace =
  | { famille: 'bambou'; valeur: TuileValeurSimple }
  | { famille: 'cercle'; valeur: TuileValeurSimple }
  | { famille: 'caractere'; valeur: TuileValeurSimple }
  | { famille: 'vent'; direction: TuileVent }
  | { famille: 'dragon'; couleur: TuileDragon };

/** Une tuile POSEE sur un plateau : sa face, et une identite stable pour React et pour la
 * selection. Deux tuiles peuvent porter la meme face, jamais le meme identifiant. */
export interface TuileJeu {
  id: string;
  face: TuileFace;
}
