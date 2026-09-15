/**
 * Ecrire un nombre entier en toutes lettres, a la francaise scolaire.
 *
 * Les pieges sont connus et tous orthographiques. Ils sont la raison d'etre de l'exercice
 * sur le papier, donc ils doivent etre justes :
 *
 *   - `vingt` et `cent` prennent un s quand ils sont MULTIPLIES et TERMINENT le nombre :
 *     quatre-vingts, deux cents ; mais quatre-vingt-un, deux cent trois.
 *   - `mille` est invariable, toujours.
 *   - `et` sans trait d'union devant un et onze : vingt et un, soixante et onze. Ailleurs,
 *     des traits d'union.
 *   - de 70 a 99, le francais compte par vingt : soixante-dix, quatre-vingt-dix.
 *
 * Orthographe TRADITIONNELLE et non rectifiee de 1990 : c'est celle qu'on lui enseigne, et
 * une feuille qui la contredirait lui ferait douter de son cahier.
 */

const UNITES = [
  'zéro',
  'un',
  'deux',
  'trois',
  'quatre',
  'cinq',
  'six',
  'sept',
  'huit',
  'neuf',
  'dix',
  'onze',
  'douze',
  'treize',
  'quatorze',
  'quinze',
  'seize',
];

const DIZAINES: Record<number, string> = {
  2: 'vingt',
  3: 'trente',
  4: 'quarante',
  5: 'cinquante',
  6: 'soixante',
};

/**
 * De 0 a 99.
 *
 * `suivi` dit qu'un autre mot suivra ce groupe. C'est ce qui decide de l'accord : `vingt`
 * ne prend son s que s'il TERMINE le nombre, et « mille » compte comme quelque chose qui
 * suit. D'ou `quatre-vingts` mais `quatre-vingt mille`.
 */
function souscent(n: number, suivi = false): string {
  if (n <= 16) return UNITES[n];
  if (n < 20) return `dix-${UNITES[n - 10]}`;

  if (n < 70) {
    const d = Math.floor(n / 10);
    const u = n % 10;
    if (u === 0) return DIZAINES[d];
    // `vingt et un`, sans trait d'union : la seule liaison que le francais ecrit ainsi.
    if (u === 1) return `${DIZAINES[d]} et un`;
    return `${DIZAINES[d]}-${UNITES[u]}`;
  }

  if (n < 80) {
    const reste = n - 60;
    if (reste === 11) return 'soixante et onze';
    return `soixante-${souscent(reste)}`;
  }

  const reste = n - 80;
  // `quatre-vingts` prend un s seulement quand rien ne le suit, dans le nombre ENTIER.
  if (reste === 0) return suivi ? 'quatre-vingt' : 'quatre-vingts';
  return `quatre-vingt-${souscent(reste)}`;
}

/** De 0 a 999. `suivi` a le meme role que dans `souscent`. */
function souscmille(n: number, suivi = false): string {
  if (n < 100) return souscent(n, suivi);
  const centaines = Math.floor(n / 100);
  const reste = n % 100;
  // `cent` prend un s quand il est multiplie ET termine le nombre entier.
  const accorde = reste === 0 && !suivi;
  const tete =
    centaines === 1 ? 'cent' : `${UNITES[centaines]} cent${accorde ? 's' : ''}`;
  return reste === 0 ? tete : `${tete} ${souscent(reste)}`;
}

export function nombreEnLettres(n: number): string {
  if (!Number.isInteger(n) || n < 0) {
    throw new Error('nombreEnLettres attend un entier positif');
  }
  if (n < 1000) return souscmille(n);

  if (n < 1_000_000) {
    const milliers = Math.floor(n / 1000);
    const reste = n % 1000;
    // `mille` est invariable : jamais de s, quel que soit le multiplicateur.
    const tete =
      milliers === 1 ? 'mille' : `${souscmille(milliers, true)} mille`;
    return reste === 0 ? tete : `${tete} ${souscmille(reste)}`;
  }

  const millions = Math.floor(n / 1_000_000);
  const reste = n % 1_000_000;
  // `million` est un NOM : il s'accorde, contrairement a mille.
  const tete =
    millions === 1 ? 'un million' : `${souscmille(millions)} millions`;
  return reste === 0 ? tete : `${tete} ${nombreEnLettres(reste)}`;
}
