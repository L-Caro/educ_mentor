/**
 * Les ecritures d'un nombre, et les collections de materiel qui le representent.
 *
 * Deux exercices s'appuient dessus, dans les deux sens : on montre des briques et l'enfant
 * barre les ECRITURES qui ne leur correspondent pas, ou l'inverse. Dans les deux cas le
 * travail est le meme : fabriquer des reponses justes de formes variees, et des fausses
 * qui ressemblent aux erreurs qu'un enfant fait vraiment.
 *
 * ── Le drapeau juste/faux est CALCULE, jamais suppose ────────────────────────────────
 *
 * Chaque candidat porte sa valeur, calculee depuis ce qu'il ecrit. « Juste » veut dire
 * « vaut le nombre », rien d'autre. Un piege fabrique par permutation des chiffres de 55
 * est identique a l'original : on ne s'en apercoit qu'en le comparant, et c'est le
 * calcul qui l'ecarte des fausses (il finit parmi les justes, ou nulle part).
 *
 * ── Ce qui est juste ────────────────────────────────────────────────────────────────
 *
 * Toute ecriture qui VAUT le nombre, y compris `4d 12u` pour 52. Elle n'est pas
 * canonique, mais c'est la decomposition qu'on manipule en echangeant une barre contre
 * dix cubes, et un enfant qui la barre s'est trompe.
 *
 * Les nombres restent sous 1 000 : c'est ce que le materiel dessine (voir
 * `MaterielBase10`, un millier n'est qu'une plaque marquee).
 */

export type Rang = 'c' | 'd' | 'u';

const RANGS: Rang[] = ['c', 'd', 'u'];
const VALEUR_DU_RANG: Record<Rang, number> = { c: 100, d: 10, u: 1 };

/** Au-dela, une collection n'est plus qu'un tas de carreaux qu'on ne compte pas : elle
 * ne tiendrait d'ailleurs pas a quatre sur une feuille. */
export const PIECES_MAXIMUM = 24;

export interface Composition {
  centaines: number;
  dizaines: number;
  unites: number;
}

export interface EcritureProposee {
  texte: string;
  juste: boolean;
}

export interface CollectionProposee extends Composition {
  juste: boolean;
}

interface Candidate {
  texte: string;
  valeur: number;
}

export function decomposer(valeur: number): Composition {
  return {
    centaines: Math.floor(valeur / 100) % 10,
    dizaines: Math.floor(valeur / 10) % 10,
    unites: valeur % 10,
  };
}

export function valeurDeLaComposition(composition: Composition): number {
  return (
    composition.centaines * 100 + composition.dizaines * 10 + composition.unites
  );
}

function nombreDePieces(composition: Composition): number {
  return composition.centaines + composition.dizaines + composition.unites;
}

/** Les rangs qui portent un chiffre : « 52 » n'a pas de centaines, et parler de
 * « 0c 5d 2u » a un enfant de CE1 n'est pas une erreur qu'il ferait, c'est du bruit. */
function rangsUtiles(valeur: number): Rang[] {
  if (valeur >= 100) return RANGS;
  if (valeur >= 10) return ['d', 'u'];
  return ['u'];
}

function quantitesDe(valeur: number, rangs: Rang[]): number[] {
  return rangs.map((rang) => Math.floor(valeur / VALEUR_DU_RANG[rang]) % 10);
}

function ecrireChiffres(nombre: number): Candidate {
  return { texte: String(nombre), valeur: nombre };
}

/** `5d 2u`. Une quantite nulle n'est pas ecrite : « 0d » est une ecriture legitime mais
 * rare, on la garde a part (voir `ecrituresJustes`). */
function ecrireTermes(
  quantites: number[],
  rangs: Rang[],
  { gardeLesZeros = false } = {},
): Candidate | null {
  const termes = quantites
    .map((quantite, index) => ({ quantite, rang: rangs[index] }))
    .filter((terme) => gardeLesZeros || terme.quantite > 0);
  if (termes.length === 0) return null;
  return {
    texte: termes.map((terme) => `${terme.quantite}${terme.rang}`).join(' '),
    valeur: termes.reduce(
      (somme, terme) => somme + terme.quantite * VALEUR_DU_RANG[terme.rang],
      0,
    ),
  };
}

function melanger<T>(elements: T[]): T[] {
  const copie = [...elements];
  for (let index = copie.length - 1; index > 0; index--) {
    const autreIndex = Math.floor(Math.random() * (index + 1));
    [copie[index], copie[autreIndex]] = [copie[autreIndex], copie[index]];
  }
  return copie;
}

function permutations<T>(elements: T[]): T[][] {
  if (elements.length <= 1) return [elements];
  return elements.flatMap((element, index) =>
    permutations([
      ...elements.slice(0, index),
      ...elements.slice(index + 1),
    ]).map((reste) => [element, ...reste]),
  );
}

function sansDoublons<T extends { texte: string }>(candidats: T[]): T[] {
  return [
    ...new Map(
      candidats.map((candidat) => [candidat.texte, candidat]),
    ).values(),
  ];
}

/**
 * Echanger une barre contre dix cubes : `4d 12u` pour 52.
 *
 * `retire` dit ce qu'on ote du rang qu'on vide. A 1, l'echange est honnete (la barre
 * part, dix cubes arrivent) ; a 0, on a oublie de retirer la barre : dix de trop.
 */
function echanges(quantites: number[], retire: number): number[][] {
  const resultat: number[][] = [];
  for (let index = 0; index < quantites.length - 1; index++) {
    if (retire > quantites[index]) continue;
    const modifiees = [...quantites];
    modifiees[index] -= retire;
    modifiees[index + 1] += 10;
    resultat.push(modifiees);
  }
  return resultat;
}

/** Les ecritures qui VALENT le nombre. */
export function ecrituresJustes(valeur: number): Candidate[] {
  const rangs = rangsUtiles(valeur);
  const quantites = quantitesDe(valeur, rangs);
  const candidats: (Candidate | null)[] = [
    ecrireChiffres(valeur),
    ecrireTermes(quantites, rangs),
    ecrireTermes(quantites, rangs, { gardeLesZeros: true }),
    // L'ordre inverse : `2u 5d`. Meme nombre, et l'enfant qui lit de gauche a droite
    // sans regarder la lettre se trompe ici.
    ecrireTermes([...quantites].reverse(), [...rangs].reverse()),
    ecrireTermes([valeur], ['u']),
    ...echanges(quantites, 1).map((modifiees) =>
      ecrireTermes(modifiees, rangs),
    ),
  ];
  if (rangs.length > 2) {
    // Toutes les dizaines d'un coup : `52d 3u` pour 523.
    candidats.push(
      ecrireTermes([Math.floor(valeur / 10), valeur % 10], ['d', 'u']),
    );
  }
  return sansDoublons(
    candidats.filter(
      (candidat): candidat is Candidate =>
        candidat !== null && candidat.valeur === valeur,
    ),
  );
}

/**
 * Les ecritures qui ressemblent au nombre sans le valoir : les erreurs qu'on fait.
 *
 * Chiffres echanges (25 pour 52), une barre de trop ou de moins, une unite de plus, un
 * zero oublie ou ajoute (502, 520), dix cubes echanges sans retirer la barre.
 */
export function ecrituresFausses(valeur: number): Candidate[] {
  const rangs = rangsUtiles(valeur);
  const quantites = quantitesDe(valeur, rangs);
  const chiffres = String(valeur);
  const candidats: (Candidate | null)[] = [];

  for (const permutation of permutations(quantites)) {
    for (const ordre of permutations(rangs)) {
      candidats.push(ecrireTermes(permutation, ordre));
    }
    candidats.push(
      ecrireChiffres(
        permutation.reduce(
          (somme, quantite, index) =>
            somme + quantite * VALEUR_DU_RANG[rangs[index]],
          0,
        ),
      ),
    );
  }

  for (const rang of rangs) {
    for (const ecart of [-1, 1]) {
      const nombre = valeur + ecart * VALEUR_DU_RANG[rang];
      if (nombre >= 0) candidats.push(ecrireChiffres(nombre));
    }
  }
  quantites.forEach((quantite, index) => {
    for (const ecart of [-1, 1]) {
      if (quantite + ecart < 0) continue;
      const modifiees = [...quantites];
      modifiees[index] += ecart;
      candidats.push(ecrireTermes(modifiees, rangs));
    }
  });

  for (const modifiees of echanges(quantites, 0)) {
    candidats.push(ecrireTermes(modifiees, rangs));
  }

  candidats.push(
    ecrireChiffres(Number(`${chiffres}0`)),
    ecrireChiffres(Number(`${chiffres.slice(0, -1)}0${chiffres.slice(-1)}`)),
    ecrireChiffres(Math.floor(valeur / 10)),
  );

  return sansDoublons(
    candidats.filter(
      (candidat): candidat is Candidate =>
        candidat !== null && candidat.valeur !== valeur && candidat.valeur > 0,
    ),
  );
}

/**
 * Huit ecritures, melangees, dont trois a cinq justes.
 *
 * Jamais « que des fausses » ni « que des justes » : un exercice ou tout est a barrer (ou
 * rien) ne demande plus de lire.
 */
export function ecrituresAProposer(
  valeur: number,
  total = 8,
): EcritureProposee[] {
  const justes = melanger(ecrituresJustes(valeur));
  const fausses = melanger(ecrituresFausses(valeur));
  const nombreDeJustes = Math.min(
    justes.length,
    3 + Math.floor(Math.random() * 3),
  );
  const nombreDeFausses = Math.min(fausses.length, total - nombreDeJustes);
  return melanger([
    ...justes
      .slice(0, nombreDeJustes)
      .map(({ texte }) => ({ texte, juste: true })),
    ...fausses
      .slice(0, nombreDeFausses)
      .map(({ texte }) => ({ texte, juste: false })),
  ]);
}

function cleDeLaComposition(composition: Composition): string {
  return `${composition.centaines}-${composition.dizaines}-${composition.unites}`;
}

function enComposition(quantites: number[], rangs: Rang[]): Composition {
  const parRang = new Map(rangs.map((rang, index) => [rang, quantites[index]]));
  return {
    centaines: parRang.get('c') ?? 0,
    dizaines: parRang.get('d') ?? 0,
    unites: parRang.get('u') ?? 0,
  };
}

function sansDoublonsDeComposition(compositions: Composition[]): Composition[] {
  return [
    ...new Map(
      compositions.map((composition) => [
        cleDeLaComposition(composition),
        composition,
      ]),
    ).values(),
  ];
}

/** Les collections qui VALENT le nombre : la canonique, et celles ou l'on a echange une
 * barre contre dix cubes (ou une plaque contre dix barres). */
export function collectionsJustes(valeur: number): Composition[] {
  const rangs = rangsUtiles(valeur);
  const quantites = quantitesDe(valeur, rangs);
  const [canonique, ...echangees] = [quantites, ...echanges(quantites, 1)].map(
    (modifiees) => enComposition(modifiees, rangs),
  );
  return sansDoublonsDeComposition([
    canonique,
    ...echangees.filter(
      (collection) => nombreDePieces(collection) <= PIECES_MAXIMUM,
    ),
  ]).filter((collection) => valeurDeLaComposition(collection) === valeur);
}

/** Les collections proches du nombre sans le valoir : chiffres echanges (25 pour 52),
 * une piece de trop ou de moins, dix cubes ajoutes sans retirer la barre. */
export function collectionsFausses(valeur: number): Composition[] {
  const rangs = rangsUtiles(valeur);
  const quantites = quantitesDe(valeur, rangs);
  const candidats: Composition[] = [];

  for (const permutation of permutations(quantites)) {
    candidats.push(enComposition(permutation, rangs));
  }
  quantites.forEach((quantite, index) => {
    for (const ecart of [-1, 1]) {
      if (quantite + ecart < 0) continue;
      const modifiees = [...quantites];
      modifiees[index] += ecart;
      candidats.push(enComposition(modifiees, rangs));
    }
  });
  for (const modifiees of echanges(quantites, 0)) {
    candidats.push(enComposition(modifiees, rangs));
  }

  return sansDoublonsDeComposition(candidats).filter(
    (collection) =>
      valeurDeLaComposition(collection) !== valeur &&
      nombreDePieces(collection) <= PIECES_MAXIMUM,
  );
}

/** Quatre collections, melangees, dont une ou deux justes : il en faut au moins une pour
 * que l'enfant ait quelque chose a quoi comparer, et au moins deux fausses pour qu'il y
 * ait un choix. */
export function collectionsAProposer(
  valeur: number,
  total = 4,
): CollectionProposee[] {
  const justes = melanger(collectionsJustes(valeur));
  const fausses = melanger(collectionsFausses(valeur));
  const nombreDeJustes = Math.min(
    justes.length,
    1 + Math.floor(Math.random() * 2),
  );
  const nombreDeFausses = Math.min(fausses.length, total - nombreDeJustes);
  return melanger([
    ...justes
      .slice(0, nombreDeJustes)
      .map((collection) => ({ ...collection, juste: true })),
    ...fausses
      .slice(0, nombreDeFausses)
      .map((collection) => ({ ...collection, juste: false })),
  ]);
}

/** Une ecriture juste au hasard, pour l'exercice « barre les collections ». */
export function ecritureJusteAuHasard(valeur: number): string {
  return melanger(ecrituresJustes(valeur))[0].texte;
}
