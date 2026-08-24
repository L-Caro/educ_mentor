import type { Matiere } from './cours.types';
import { calculer } from './mathematiques/calculer';
import { nombres } from './mathematiques/nombres';
import { accords } from './francais/accords';
import { natureDesMots } from './francais/nature-des-mots';

/**
 * La bibliothèque, matière par matière.
 *
 * L'ordre des grandes notions n'est pas alphabétique, il est pédagogique : à l'intérieur
 * d'une matière, une notion vient après celles dont elle a besoin. « Les accords » suit
 * « La nature des mots », parce qu'on n'accorde pas ce qu'on ne sait pas nommer.
 *
 * Le découpage complet du CE1 (16 grandes notions, 76 concepts) est dans CHANTIERS.md
 * § B.4. Il se remplit notion par notion, chacune lue avant qu'on écrive la suivante.
 */
export const MATIERES: Matiere[] = [
  {
    slug: 'mathematiques',
    titre: 'Mathématiques',
    emoji: '🔢',
    notions: [nombres, calculer],
  },
  {
    slug: 'francais',
    titre: 'Français',
    emoji: '✍️',
    notions: [natureDesMots, accords],
  },
];

export function matiereParSlug(slug: string): Matiere | undefined {
  return MATIERES.find((m) => m.slug === slug);
}

export function notionParSlug(matiere: Matiere, slug: string) {
  return matiere.notions.find((n) => n.slug === slug);
}
