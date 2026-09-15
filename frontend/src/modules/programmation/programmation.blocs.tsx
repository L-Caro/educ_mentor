import type { SorteBloc } from './programmation.types';

/** Ce que chaque bloc montre et ce qu'il dit.
 *
 * Un symbole ET un mot. Le symbole seul se confond (deux fleches courbes pour les deux
 * sens de rotation se distinguent mal a sept ans), le mot seul ne se repere pas dans une
 * file de quinze elements qu'on relit vite.
 *
 * Des symboles TYPOGRAPHIQUES, jamais d'emoji. Une main ou une fleche emoji sort en carre
 * vide des que la police de la machine ne la porte pas, et un bloc dont le symbole manque
 * ne se distingue plus de son voisin.
 */
export interface Modele {
  signe: string;
  mot: string;
  /** La famille decide de la couleur : deplacement, action, structure. Trois couleurs
   * suffisent, et elles portent un sens, alors qu'une couleur par bloc n'en porterait
   * aucun. */
  famille: 'deplacement' | 'action' | 'structure';
}

export const MODELES: Record<SorteBloc, Modele> = {
  aller_nord: { signe: '↑', mot: 'haut', famille: 'deplacement' },
  aller_est: { signe: '→', mot: 'droite', famille: 'deplacement' },
  aller_sud: { signe: '↓', mot: 'bas', famille: 'deplacement' },
  aller_ouest: { signe: '←', mot: 'gauche', famille: 'deplacement' },
  avancer: { signe: '▲', mot: 'avance', famille: 'deplacement' },
  tourner_gauche: { signe: '↰', mot: 'à gauche', famille: 'deplacement' },
  tourner_droite: { signe: '↱', mot: 'à droite', famille: 'deplacement' },
  ramasser: { signe: '↧', mot: 'ramasse', famille: 'action' },
  repeter: { signe: '↻', mot: 'répète', famille: 'structure' },
  si_graine: { signe: '?', mot: 'si je vois', famille: 'structure' },
  si_mur: { signe: '?', mot: 'si ça bloque', famille: 'structure' },
};
