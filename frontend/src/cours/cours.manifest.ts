import type { Matiere } from './cours.types';
import { calculer } from './mathematiques/calculer';

/**
 * La bibliothèque, matière par matière.
 *
 * Une seule grande notion pour l'instant : « Calculer » sert de pilote. Le découpage du
 * CE1 entier (16 grandes notions, 76 concepts) est consigné dans CHANTIERS.md § B.4 ; il
 * n'est pas déroulé tant que celle-ci n'a pas été lue et validée, parce qu'un découpage
 * mal posé se paie sur toutes les fiches qui le suivent.
 */
export const MATIERES: Matiere[] = [
  {
    slug: 'mathematiques',
    titre: 'Mathématiques',
    emoji: '🔢',
    notions: [calculer],
  },
];

export function matiereParSlug(slug: string): Matiere | undefined {
  return MATIERES.find((m) => m.slug === slug);
}

export function notionParSlug(matiere: Matiere, slug: string) {
  return matiere.notions.find((n) => n.slug === slug);
}
