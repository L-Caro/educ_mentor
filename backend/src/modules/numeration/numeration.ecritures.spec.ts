import {
  PIECES_MAXIMUM,
  collectionsAProposer,
  collectionsFausses,
  collectionsJustes,
  ecritureJusteAuHasard,
  ecrituresAProposer,
  ecrituresFausses,
  ecrituresJustes,
  valeurDeLaComposition,
} from './numeration.ecritures';

/**
 * Relit une ecriture SANS passer par le code teste : « 523 » ou « 5c 2d 3u ». Si le
 * generateur se trompait de valeur en meme temps qu'il se trompe de texte, comparer sa
 * valeur a la sienne ne verrait rien.
 */
function valeurDuTexte(texte: string): number {
  if (/^\d+$/.test(texte)) return Number(texte);
  const valeurDuRang = { c: 100, d: 10, u: 1 } as const;
  return texte.split(' ').reduce((somme, terme) => {
    const [, quantite, rang] = terme.match(/^(\d+)([cdu])$/)!;
    return somme + Number(quantite) * valeurDuRang[rang as 'c' | 'd' | 'u'];
  }, 0);
}

const VALEURS = [11, 40, 52, 100, 101, 110, 305, 500, 488];

/** Ce que tire l'impression : le materiel doit tenir sur la feuille, donc les chiffres
 * sont bornes (voir `tirerCompositions`). */
function valeurImprimable(): number {
  for (;;) {
    const valeur =
      Math.floor(Math.random() * 5) * 100 +
      Math.floor(Math.random() * 9) * 10 +
      Math.floor(Math.random() * 9);
    if (valeur >= 11) return valeur;
  }
}

describe('ecritures d’un nombre', () => {
  it.each(VALEURS)(
    'toutes les ecritures justes de %i valent leur nombre',
    (valeur) => {
      const justes = ecrituresJustes(valeur);
      expect(justes.length).toBeGreaterThanOrEqual(3);
      for (const { texte } of justes) {
        expect(valeurDuTexte(texte)).toBe(valeur);
      }
    },
  );

  it.each(VALEURS)(
    'aucune ecriture fausse de %i ne vaut son nombre',
    (valeur) => {
      const fausses = ecrituresFausses(valeur);
      expect(fausses.length).toBeGreaterThanOrEqual(5);
      for (const { texte } of fausses) {
        expect(valeurDuTexte(texte)).not.toBe(valeur);
      }
    },
  );

  it('compte l’echange d’une barre contre dix cubes comme JUSTE', () => {
    const textes = ecrituresJustes(52).map(({ texte }) => texte);
    expect(textes).toContain('4d 12u');
    expect(textes).toContain('2u 5d');
  });

  it('propose le piege du chiffre echange et celui du zero', () => {
    const textes = ecrituresFausses(52).map(({ texte }) => texte);
    expect(textes).toContain('25');
    expect(textes).toContain('502');
    expect(textes).toContain('5u 2d');
  });

  it('ne parle pas de centaines pour un nombre qui n’en a pas', () => {
    for (const { texte } of ecrituresJustes(52)) {
      expect(texte).not.toMatch(/c/);
    }
  });

  it('rend un melange de justes et de fausses, sans doublon, et le bon drapeau', () => {
    for (let essai = 0; essai < 200; essai++) {
      const valeur = valeurImprimable();
      const proposees = ecrituresAProposer(valeur);
      expect(proposees.length).toBeGreaterThan(0);
      expect(proposees.some((ecriture) => ecriture.juste)).toBe(true);
      expect(proposees.some((ecriture) => !ecriture.juste)).toBe(true);
      expect(new Set(proposees.map(({ texte }) => texte)).size).toBe(
        proposees.length,
      );
      for (const { texte, juste } of proposees) {
        expect(valeurDuTexte(texte) === valeur).toBe(juste);
      }
    }
  });

  it('choisit pour l’exercice inverse une ecriture qui vaut le nombre', () => {
    for (const valeur of VALEURS) {
      expect(valeurDuTexte(ecritureJusteAuHasard(valeur))).toBe(valeur);
    }
  });
});

describe('collections de materiel d’un nombre', () => {
  it.each(VALEURS)(
    'toutes les collections justes de %i valent leur nombre',
    (valeur) => {
      const justes = collectionsJustes(valeur);
      expect(justes.length).toBeGreaterThanOrEqual(1);
      for (const collection of justes) {
        expect(valeurDeLaComposition(collection)).toBe(valeur);
      }
    },
  );

  it('compte une barre echangee contre dix cubes comme la meme collection', () => {
    expect(collectionsJustes(52)).toContainEqual({
      centaines: 0,
      dizaines: 4,
      unites: 12,
    });
  });

  it.each(VALEURS)(
    'aucune collection fausse de %i ne vaut son nombre',
    (valeur) => {
      for (const collection of collectionsFausses(valeur)) {
        expect(valeurDeLaComposition(collection)).not.toBe(valeur);
        expect(
          collection.centaines + collection.dizaines + collection.unites,
        ).toBeLessThanOrEqual(PIECES_MAXIMUM);
      }
    },
  );

  it('propose au moins une juste et deux fausses, toutes distinctes', () => {
    for (let essai = 0; essai < 200; essai++) {
      const valeur = valeurImprimable();
      const proposees = collectionsAProposer(valeur);
      expect(
        proposees.filter((collection) => collection.juste).length,
      ).toBeGreaterThanOrEqual(1);
      expect(
        proposees.filter((collection) => !collection.juste).length,
      ).toBeGreaterThanOrEqual(2);
      expect(
        new Set(
          proposees.map(
            (collection) =>
              `${collection.centaines}-${collection.dizaines}-${collection.unites}`,
          ),
        ).size,
      ).toBe(proposees.length);
      for (const collection of proposees) {
        expect(valeurDeLaComposition(collection) === valeur).toBe(
          collection.juste,
        );
      }
    }
  });
});
