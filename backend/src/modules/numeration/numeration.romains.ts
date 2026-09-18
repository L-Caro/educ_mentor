/**
 * Les chiffres romains : conversion dans les deux sens, et fabrication de reponses justes
 * et de pieges.
 *
 * Meme principe que `numeration.ecritures.ts` : le drapeau juste/faux est CALCULE en
 * relisant le texte, jamais suppose. « Juste » veut dire « se lit comme le nombre ».
 *
 * ── Ce qui est juste ────────────────────────────────────────────────────────────────
 *
 * La forme moderne (IV, XL, CM), et aussi la forme additive du quatre : IIII, XXXX, CCCC.
 * C'est celle des cadrans et des horloges, l'enfant la rencontre partout, et on prefere
 * IV en classe sans faire de IIII une faute. Les autres formes additives (VIIII pour 9,
 * LXXXX pour 90) ne sont NI justes NI proposees comme fausses : elles se lisent, mais
 * ce n'est pas ce qu'on enseigne, et les presenter comme des erreurs serait discutable.
 *
 * ── Les paliers ──────────────────────────────────────────────────────────────────────
 *
 * 39 (I, V, X), 100 (+ L, C), 1000 (+ D, M). Un palier n'est pas seulement un maximum :
 * c'est aussi l'alphabet. Un piege qui glisse un L dans un exercice de CE2 qui n'a vu que
 * I, V et X n'est pas un piege, c'est un signe inconnu.
 */

export const PALIERS_ROMAINS = [39, 100, 1000] as const;
export type PalierRomain = (typeof PALIERS_ROMAINS)[number];
export const PALIER_ROMAIN_PAR_DEFAUT: PalierRomain = 39;

export function estUnPalierRomain(valeur: unknown): valeur is PalierRomain {
  return PALIERS_ROMAINS.includes(valeur as PalierRomain);
}

const SIGNES_DU_PALIER: Record<PalierRomain, string> = {
  39: 'IVX',
  100: 'IVXLC',
  1000: 'IVXLCDM',
};

const VALEUR_DU_SIGNE: Record<string, number> = {
  I: 1,
  V: 5,
  X: 10,
  L: 50,
  C: 100,
  D: 500,
  M: 1000,
};

const MAXIMUM_ROMAIN = 3999;

/** Les ecritures d'un chiffre (0 a 9) dans un rang, la forme moderne en premier. Le quatre
 * a deux ecritures : `IV` et `IIII`. */
function ecrituresDuChiffre(
  chiffre: number,
  unite: string,
  cinq: string,
  dix: string,
): string[] {
  if (chiffre === 0) return [''];
  if (chiffre === 4) return [unite + cinq, unite.repeat(4)];
  if (chiffre === 9) return [unite + dix];
  if (chiffre === 5) return [cinq];
  if (chiffre > 5) return [cinq + unite.repeat(chiffre - 5)];
  return [unite.repeat(chiffre)];
}

/** Toutes les ecritures acceptees d'un nombre, la forme moderne en premier. */
export function romainsJustes(valeur: number): string[] {
  if (!Number.isInteger(valeur) || valeur < 1 || valeur > MAXIMUM_ROMAIN) {
    throw new RangeError(`Pas d'ecriture romaine pour ${valeur}`);
  }
  // Les milliers ne s'ecrivent que par repetition : pas de quatre mille en romain courant.
  let ecritures = ['M'.repeat(Math.floor(valeur / 1000))];
  const rangs: [number, string, string, string][] = [
    [Math.floor(valeur / 100) % 10, 'C', 'D', 'M'],
    [Math.floor(valeur / 10) % 10, 'X', 'L', 'C'],
    [valeur % 10, 'I', 'V', 'X'],
  ];
  for (const [chiffre, unite, cinq, dix] of rangs) {
    const formes = ecrituresDuChiffre(chiffre, unite, cinq, dix);
    ecritures = ecritures.flatMap((debut) =>
      formes.map((forme) => debut + forme),
    );
  }
  return ecritures;
}

/** L'ecriture qu'on enseigne : la forme moderne. */
export function enRomain(valeur: number): string {
  return romainsJustes(valeur)[0];
}

const ECRITURE_ACCEPTEE =
  /^M{0,3}(CM|CD|CCCC|D?C{0,3})(XC|XL|XXXX|L?X{0,3})(IX|IV|IIII|V?I{0,3})$/;

/** La valeur d'une ecriture romaine acceptee, `null` si elle ne s'ecrit pas comme ca
 * (`IC`, `VX`, `IIIII`, `VV`). */
export function lireRomain(texte: string): number | null {
  const propre = texte.trim().toUpperCase();
  if (propre === '' || !ECRITURE_ACCEPTEE.test(propre)) return null;
  let somme = 0;
  for (let index = 0; index < propre.length; index++) {
    const valeur = VALEUR_DU_SIGNE[propre[index]];
    const suivante = VALEUR_DU_SIGNE[propre[index + 1]] ?? 0;
    somme += valeur < suivante ? -valeur : valeur;
  }
  return somme;
}

/** Ce que vaut le texte si on additionne ses signes sans jamais soustraire : `VIIII` fait
 * 9. Sert a ecarter des pieges les formes additives, qui se lisent (voir plus haut). */
function sommeDesSignes(texte: string): number {
  return [...texte].reduce(
    (somme, signe) => somme + (VALEUR_DU_SIGNE[signe] ?? 0),
    0,
  );
}

function melanger<T>(elements: T[]): T[] {
  const copie = [...elements];
  for (let index = copie.length - 1; index > 0; index--) {
    const autreIndex = Math.floor(Math.random() * (index + 1));
    [copie[index], copie[autreIndex]] = [copie[autreIndex], copie[index]];
  }
  return copie;
}

/** Les ecritures qui ressemblent au nombre sans le valoir : les erreurs qu'on fait. */
export function romainsFaux(valeur: number, palier: PalierRomain): string[] {
  const signes = SIGNES_DU_PALIER[palier];
  const canonique = enRomain(valeur);
  const candidats = new Set<string>();

  // Le voisin : un nombre bien ecrit, mais pas le bon. C'est la faute de lecture.
  for (const ecart of [1, 10, 100]) {
    for (const sens of [-1, 1]) {
      const voisin = valeur + sens * ecart;
      if (voisin >= 1 && voisin <= palier) candidats.add(enRomain(voisin));
    }
  }

  // L'ecriture abimee : deux signes echanges (VI pour IV), un signe de trop, de moins ou
  // change. Ce sont les fautes de copie et de logique de soustraction (IC, VX, IIIII).
  for (let index = 0; index < canonique.length; index++) {
    if (index < canonique.length - 1) {
      const echange = [...canonique];
      [echange[index], echange[index + 1]] = [
        echange[index + 1],
        echange[index],
      ];
      candidats.add(echange.join(''));
    }
    candidats.add(canonique.slice(0, index) + canonique.slice(index + 1));
    for (const signe of signes) {
      candidats.add(canonique.slice(0, index) + signe + canonique.slice(index));
      candidats.add(
        canonique.slice(0, index) + signe + canonique.slice(index + 1),
      );
    }
  }
  for (const signe of signes) candidats.add(canonique + signe);

  return [...candidats].filter(
    (texte) =>
      texte !== '' &&
      texte.length <= canonique.length + 3 &&
      [...texte].every((signe) => signes.includes(signe)) &&
      lireRomain(texte) !== valeur &&
      sommeDesSignes(texte) !== valeur,
  );
}

export interface RomainPropose {
  texte: string;
  juste: boolean;
}

/**
 * Six ecritures melangees : l'ecriture qu'on enseigne, une variante juste quand il y en a
 * une (`IIII` pour quatre), et des fausses.
 *
 * Pas TOUTES les justes : 444 s'ecrit de huit facons, et huit bonnes reponses sur une
 * ligne de six cases ne laisseraient rien a barrer. Celles qu'on montre restent justes,
 * et les fausses ne contiennent jamais une juste, quelle qu'elle soit.
 */
export function romainsAProposer(
  valeur: number,
  palier: PalierRomain,
  total = 6,
): RomainPropose[] {
  const [enseignee, ...variantes] = romainsJustes(valeur);
  const justes = [enseignee, ...melanger(variantes).slice(0, 1)];
  const fausses = melanger(romainsFaux(valeur, palier)).slice(
    0,
    total - justes.length,
  );
  return melanger([
    ...justes.map((texte) => ({ texte, juste: true })),
    ...fausses.map((texte) => ({ texte, juste: false })),
  ]);
}

/** Quatre choix pour un QCM : l'ecriture qu'on enseigne, et des fausses. Jamais `IIII`
 * parmi les fausses du quatre (elle est juste), donc jamais deux bonnes reponses. */
export function choixRomains(
  valeur: number,
  palier: PalierRomain,
  total = 4,
): { bonne: string; choix: string[] } {
  const bonne = enRomain(valeur);
  const fausses = melanger(romainsFaux(valeur, palier)).slice(0, total - 1);
  return { bonne, choix: melanger([bonne, ...fausses]) };
}
