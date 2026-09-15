/**
 * Le nom lisible d'une nature, sur le papier.
 *
 * Le catalogue des libelles vit en administration et n'arrive pas jusqu'ici. Ces sept-la
 * ne bougeront pas, et un en-tete de colonne doit etre court pour tenir dans un tiers de
 * largeur : « nom commun » devient « noms », au pluriel, parce qu'une colonne en contient
 * plusieurs.
 */
export const ENTETES: Record<string, string> = {
  nom_commun: 'noms',
  nom_propre: 'noms propres',
  verbe: 'verbes',
  determinant: 'déterminants',
  adjectif: 'adjectifs',
  pronom_sujet: 'pronoms',
  invariable: 'invariables',
};
