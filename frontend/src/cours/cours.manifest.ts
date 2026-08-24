import type { Matiere } from './cours.types';
import { calculer } from './mathematiques/calculer';
import { mesures } from './mathematiques/mesures';
import { nombres } from './mathematiques/nombres';
import { problemes } from './mathematiques/problemes';
import { accords } from './francais/accords';
import { fonctionDesMots } from './francais/fonction-des-mots';
import { laConjugaison } from './francais/la-conjugaison';
import { laPhrase } from './francais/la-phrase';
import { natureDesMots } from './francais/nature-des-mots';
import { vocabulaire } from './francais/vocabulaire';
import { eau } from './monde/l-eau';
import { temps } from './monde/le-temps';
import { vivant } from './monde/le-vivant';
import { vivreIciEtAilleurs } from './monde/vivre-ici-et-ailleurs';

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
    notions: [nombres, calculer, mesures, problemes],
  },
  {
    slug: 'francais',
    titre: 'Français',
    emoji: '✍️',
    notions: [laPhrase, natureDesMots, accords, fonctionDesMots, laConjugaison, vocabulaire],
  },
  {
    slug: 'questionner-le-monde',
    titre: 'Questionner le monde',
    emoji: '🔎',
    notions: [eau, vivant, temps, vivreIciEtAilleurs],
  },
];

export function matiereParSlug(slug: string): Matiere | undefined {
  return MATIERES.find((m) => m.slug === slug);
}

export function notionParSlug(matiere: Matiere, slug: string) {
  return matiere.notions.find((n) => n.slug === slug);
}
