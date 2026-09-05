import {
  appliquer,
  genererCompte,
  isOperation,
  rejouer,
  type Etape,
  type Operation,
  type Options,
} from './compte.generator';

/**
 * Le générateur du Compte est bon.
 *
 * Ce qu'il faut tenir, et qui ne se voit pas en jouant : **tout tirage doit être
 * solvable**. Tirer six plaques et une cible au hasard donne le plus souvent un compte
 * impossible, et un enfant qui cherche vingt minutes une solution qui n'existe pas
 * n'apprend pas à chercher — il apprend que le jeu triche.
 *
 * D'où la construction à l'envers, et d'où ces tests : ils rejouent la solution de
 * référence sur les plaques et vérifient qu'elle mène bien à la cible. Vérifier par
 * relecture plutôt que par recalcul est le point : recalculer avec le code qui a produit
 * la solution ne vérifierait rien.
 */

const randReel = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const options = (over: Partial<Options> = {}): Options => ({
  operations: ['+', '-', '×', '÷'],
  etapes: 3,
  grandesPlaques: true,
  cibleMin: 20,
  cibleMax: 999,
  rand: randReel,
  ...over,
});

describe('appliquer', () => {
  it('additionne et multiplie sans réserve', () => {
    expect(appliquer(7, '+', 5)).toBe(12);
    expect(appliquer(25, '×', 8)).toBe(200);
  });

  it('refuse une soustraction qui ne reste pas positive', () => {
    // Hors du jeu, et une plaque à 0 ne sert plus à rien ensuite.
    expect(appliquer(3, '-', 7)).toBeNull();
    expect(appliquer(5, '-', 5)).toBeNull();
    expect(appliquer(9, '-', 4)).toBe(5);
  });

  it('refuse une division inexacte', () => {
    expect(appliquer(10, '÷', 3)).toBeNull();
    expect(appliquer(100, '÷', 4)).toBe(25);
  });

  it('refuse les opérations qui ne font rien', () => {
    // « 7 × 1 = 7 » est légal et ne change rien : dans une solution de référence, c'est
    // une étape absurde.
    expect(appliquer(7, '×', 1)).toBeNull();
    expect(appliquer(1, '×', 7)).toBeNull();
    expect(appliquer(7, '÷', 1)).toBeNull();
  });

  it('refuse la division par zéro', () => {
    expect(appliquer(7, '÷', 0)).toBeNull();
  });

  it('reconnaît ses opérations', () => {
    for (const op of ['+', '-', '×', '÷']) expect(isOperation(op)).toBe(true);
    expect(isOperation('*')).toBe(false);
    expect(isOperation(null)).toBe(false);
  });
});

describe('rejouer', () => {
  it('rend le nombre atteint et les plaques restantes', () => {
    const etapes: Etape[] = [
      { a: 25, operation: '×', b: 8, resultat: 200 },
      { a: 200, operation: '+', b: 7, resultat: 207 },
    ];
    const controle = rejouer([25, 8, 7, 3, 1, 100], etapes)!;
    expect(controle.resultat).toBe(207);
    expect(controle.restantes.sort((a, b) => a - b)).toEqual([1, 3, 100, 207]);
  });

  it('refuse d’utiliser une plaque qu’on n’a pas', () => {
    // Le garde-fou qui empêche « 100 × 100 » quand il n'y a qu'un seul 100.
    const etapes: Etape[] = [
      { a: 100, operation: '×', b: 100, resultat: 10000 },
    ];
    expect(rejouer([100, 5, 3, 2, 1, 7], etapes)).toBeNull();
  });

  it('accepte une plaque en double quand elle est réellement en double', () => {
    const etapes: Etape[] = [{ a: 4, operation: '+', b: 4, resultat: 8 }];
    expect(rejouer([4, 4, 1, 2, 3, 5], etapes)?.resultat).toBe(8);
  });

  it('refuse une étape dont le résultat annoncé est faux', () => {
    const etapes: Etape[] = [{ a: 7, operation: '+', b: 5, resultat: 13 }];
    expect(rejouer([7, 5, 1, 2, 3, 4], etapes)).toBeNull();
  });

  it('refuse une étape interdite, même bien calculée', () => {
    const etapes: Etape[] = [{ a: 3, operation: '-', b: 7, resultat: -4 }];
    expect(rejouer([3, 7, 1, 2, 4, 5], etapes)).toBeNull();
  });

  it('refuse une suite vide : rien n’a été tenté', () => {
    expect(rejouer([1, 2, 3, 4, 5, 6], [])).toBeNull();
  });

  it('enchaîne sur le résultat de l’étape précédente', () => {
    const etapes: Etape[] = [
      { a: 10, operation: '+', b: 2, resultat: 12 },
      { a: 12, operation: '×', b: 3, resultat: 36 },
    ];
    expect(rejouer([10, 2, 3, 5, 7, 9], etapes)?.resultat).toBe(36);
  });
});

describe('genererCompte', () => {
  it('rend toujours un tirage SOLVABLE', () => {
    // Le test central. On ne fait pas confiance au calcul qui a produit la solution : on
    // la rejoue sur les plaques distribuées.
    for (let n = 0; n < 200; n++) {
      const q = genererCompte(options())!;
      expect(q).not.toBeNull();
      const controle = rejouer(q.plaques, q.solution);
      expect({
        cible: q.cible,
        atteinte: controle?.resultat ?? null,
      }).toEqual({ cible: q.cible, atteinte: q.cible });
    }
  });

  it('enchaîne une CHAÎNE UNIQUE, sans étape morte', () => {
    // Défaut trouvé en lisant la sortie réelle, qu'aucun test ne voyait : le chemin se
    // scindait en branches séparées dont la cible ne dépendait pas.
    //
    //     6 × 9    = 54     ← ne sert à rien
    //     3 + 54   = 57     ← ne sert à rien
    //     100 + 25 = 125    ← la cible, atteinte sans les deux premières
    //
    // Le tirage restait solvable — les tests passaient — mais la solution de référence
    // était inutilisable comme aide. Chaque étape après la première doit consommer le
    // résultat de la précédente.
    for (let n = 0; n < 200; n++) {
      const q = genererCompte(options({ etapes: 4 }))!;
      const mortes = q.solution.flatMap((etape, i) => {
        if (i === 0) return [];
        const precedent = q.solution[i - 1].resultat;
        return etape.a === precedent || etape.b === precedent ? [] : [i];
      });
      expect({ cible: q.cible, etapesMortes: mortes }).toEqual({
        cible: q.cible,
        etapesMortes: [],
      });
    }
  });

  it('fait dépendre la cible de toutes les étapes', () => {
    // Corollaire : retirer la dernière étape ne doit jamais donner la cible.
    for (let n = 0; n < 100; n++) {
      const q = genererCompte(options({ etapes: 3 }))!;
      const sansLaDerniere = q.solution.slice(0, -1);
      expect(rejouer(q.plaques, sansLaDerniere)?.resultat).not.toBe(q.cible);
    }
  });

  it('distribue six plaques', () => {
    for (let n = 0; n < 50; n++) {
      expect(genererCompte(options())!.plaques).toHaveLength(6);
    }
  });

  it('respecte le nombre d’étapes demandé', () => {
    for (const etapes of [2, 3, 4]) {
      const q = genererCompte(options({ etapes }))!;
      expect(q.solution).toHaveLength(etapes);
      expect(q.skill_key).toBe(`compte_${etapes}_etapes`);
    }
  });

  it('n’utilise QUE les opérations autorisées', () => {
    // C'est la porte : une division servie à un CE1 alors qu'elle n'est pas ouverte
    // rendrait le tirage insoluble pour elle, tout en étant solvable sur le papier.
    for (const operations of [
      ['+'],
      ['+', '-'],
      ['+', '-', '×'],
    ] as Operation[][]) {
      for (let n = 0; n < 60; n++) {
        const q = genererCompte(options({ operations, etapes: 2 }))!;
        expect(q).not.toBeNull();
        for (const etape of q.solution) {
          expect(operations).toContain(etape.operation);
        }
      }
    }
  });

  it('garde la cible dans les bornes', () => {
    for (let n = 0; n < 100; n++) {
      const q = genererCompte(options({ cibleMin: 50, cibleMax: 300 }))!;
      expect(q.cible).toBeGreaterThanOrEqual(50);
      expect(q.cible).toBeLessThanOrEqual(300);
    }
  });

  it('n’emploie que de petites plaques quand les grandes sont fermées', () => {
    for (let n = 0; n < 60; n++) {
      const q = genererCompte(
        options({ grandesPlaques: false, cibleMin: 20, cibleMax: 200 }),
      )!;
      for (const plaque of q.plaques) {
        expect(plaque).toBeLessThanOrEqual(10);
      }
    }
  });

  it('ne distribue jamais plus de deux fois la même petite plaque', () => {
    // Le vivier en contient deux exemplaires, comme à la télévision.
    for (let n = 0; n < 100; n++) {
      const q = genererCompte(options())!;
      const compte = new Map<number, number>();
      for (const p of q.plaques) compte.set(p, (compte.get(p) ?? 0) + 1);
      for (const [plaque, fois] of compte) {
        expect({ plaque, fois }).toEqual({ plaque, fois: Math.min(fois, 2) });
        expect(fois).toBeLessThanOrEqual(2);
      }
    }
  });

  it('abandonne proprement quand les contraintes sont inatteignables', () => {
    // Une cible à cinq chiffres avec l'addition seule et de petites plaques : impossible.
    // Mieux vaut `null` — l'appelant retire — qu'une boucle sans fin.
    expect(
      genererCompte(
        options({
          operations: ['+'],
          grandesPlaques: false,
          etapes: 2,
          cibleMin: 10_000,
          cibleMax: 99_999,
        }),
      ),
    ).toBeNull();
  });

  it('rend null sans aucune opération autorisée', () => {
    expect(genererCompte(options({ operations: [] }))).toBeNull();
  });
});
