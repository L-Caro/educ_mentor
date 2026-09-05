import {
  FAMILLES,
  familleDuNom,
  famillesDeLAdjectif,
} from './accords.familles';
import {
  ADJECTIFS,
  NOMS,
  VERBES,
  adjectifsCompatibles,
  determinant,
  estAnime,
  feminimInvariable,
  groupeNominal,
  plurielIrregulier,
} from './accords.corpus';

/**
 * Les invariants du corpus morphologique.
 *
 * Ici le typage ne protège de rien : `nom('cheval', 'cheval', 'chevals', 'masculin')`
 * compile, et la faute devient la bonne réponse attendue de l'enfant. C'est le risque le
 * plus élevé des deux modules de français, parce que la réponse EST une orthographe.
 *
 * Deux familles de tests :
 *   - la forme des entrées (pas de doublon, quatre formes cohérentes) ;
 *   - le RESPECT DU PÉRIMÈTRE des fiches : rien dans le corpus ne doit sortir de ce que
 *     `cours/francais/accords.tsx` explique. Un enfant qui rate une question doit pouvoir
 *     trouver la réponse dans la fiche.
 */

function doublons(clefs: string[]): string[] {
  return clefs.filter((cle, index) => clefs.indexOf(cle) !== index);
}

describe('noms', () => {
  it("n'a aucune clé en doublon", () => {
    expect(doublons(NOMS.map((nom) => nom.key))).toEqual([]);
  });

  it('couvre les trois familles de pluriel de la fiche', () => {
    const enS = NOMS.filter((nom) => nom.pluriel === `${nom.singulier}s`);
    const enX = NOMS.filter((nom) => nom.pluriel === `${nom.singulier}x`);
    const invariables = NOMS.filter((nom) => nom.pluriel === nom.singulier);
    expect(enS.length).toBeGreaterThanOrEqual(15);
    expect(enX.length).toBeGreaterThanOrEqual(5);
    expect(invariables.length).toBeGreaterThanOrEqual(3);
  });

  it('range chaque nom dans une famille de pluriel déclarée', () => {
    // Le corpus va jusqu'au CM2 : il contient les pluriels en -aux et en -oux. Ce qui
    // doit rester vrai n'est plus « rien hors du CE1 », c'est « rien hors des familles
    // déclarées » : un pluriel fantaisiste tomberait dans `pluriel_s` par défaut et
    // deviendrait jouable sans avoir jamais été décidé.
    const mauvais = NOMS.filter((nom) => {
      switch (familleDuNom(nom)) {
        case 'pluriel_invariable':
          return nom.pluriel !== nom.singulier;
        case 'pluriel_aux':
          return !(nom.singulier.endsWith('al') && nom.pluriel.endsWith('aux'));
        case 'pluriel_oux':
          return !(nom.singulier.endsWith('ou') && nom.pluriel.endsWith('oux'));
        case 'pluriel_x':
          return nom.pluriel !== `${nom.singulier}x`;
        default:
          return nom.pluriel !== `${nom.singulier}s`;
      }
    }).map((nom) => nom.key);
    expect(mauvais).toEqual([]);
  });

  it('ne met le x du pluriel que sur les noms en -eau, -au ou -eu', () => {
    // Les noms en -ou qui prennent un x ont leur propre famille : ce test ne parle que
    // de `pluriel_x`.
    const mauvais = NOMS.filter(
      (nom) =>
        familleDuNom(nom) === 'pluriel_x' &&
        !/(eau|au|eu)$/.test(nom.singulier),
    ).map((nom) => nom.key);
    expect(mauvais).toEqual([]);
  });

  it('couvre chaque famille de pluriel par au moins un nom', () => {
    // Une famille ouverte en administration mais vide dans le corpus donnerait un
    // exercice qui ne produit rien, sans rien dire.
    const vides = FAMILLES.filter((f) => f.porte === 'nom')
      .filter((f) => !NOMS.some((nom) => familleDuNom(nom) === f.key))
      .map((f) => f.key);
    expect(vides).toEqual([]);
  });

  it('ne rend invariables que les noms en -s, -x ou -z', () => {
    const mauvais = NOMS.filter(
      (nom) => nom.pluriel === nom.singulier && !/[sxz]$/.test(nom.singulier),
    ).map((nom) => nom.key);
    expect(mauvais).toEqual([]);
  });

  it('pose l’élision sur tous les noms à voyelle initiale', () => {
    const oublies = NOMS.filter(
      (nom) => /^[aeiouàâäéèêëîïôöùûü]/i.test(nom.singulier) && !nom.elision,
    ).map((nom) => nom.key);
    expect(oublies).toEqual([]);
  });

  it('ne pose l’élision sur une consonne que pour un h muet, explicitement', () => {
    const surprenants = NOMS.filter(
      (nom) => nom.elision && !/^[aeiouàâäéèêëîïôöùûüh]/i.test(nom.singulier),
    ).map((nom) => nom.key);
    expect(surprenants).toEqual([]);
  });

  it('a de quoi faire un sujet de phrase sensé', () => {
    // « La table dort sur le tapis » est correct et absurde : l'absurdité déplace
    // l'attention de l'accord vers la phrase.
    expect(NOMS.filter(estAnime).length).toBeGreaterThanOrEqual(5);
  });

  it('donne au moins un adjectif compatible à chaque nom', () => {
    // Sans ça, `accord_adjectif` ne pourrait jamais interroger ce nom : silencieusement.
    const orphelins = NOMS.filter(
      (nom) => adjectifsCompatibles(nom).length === 0,
    ).map((nom) => nom.key);
    expect(orphelins).toEqual([]);
  });

  it('donne deux adjectifs de familles différentes à la plupart des noms', () => {
    // `accord_gn` en difficile veut la forme de la fiche : « le petit chat noir ».
    const assezRiches = NOMS.filter((nom) => {
      const compatibles = adjectifsCompatibles(nom);
      return (
        compatibles.some((adj) => adj.place === 'avant') &&
        compatibles.some((adj) => adj.place === 'apres')
      );
    });
    expect(assezRiches.length).toBeGreaterThanOrEqual(NOMS.length - 2);
  });
});

describe('adjectifs', () => {
  it("n'a aucune clé en doublon", () => {
    expect(doublons(ADJECTIFS.map((adj) => adj.key))).toEqual([]);
  });

  it('range chaque adjectif dans une famille de féminin déclarée', () => {
    const mauvais = ADJECTIFS.filter((adj) => {
      const familles = famillesDeLAdjectif(adj);
      if (familles.includes('feminin_identique')) return adj.fs !== adj.ms;
      if (familles.includes('feminin_e')) return adj.fs !== `${adj.ms}e`;
      if (familles.includes('feminin_double'))
        return adj.fs !== `${adj.ms}${adj.ms.slice(-1)}e`;
      // Irrégulier : rien à vérifier par règle, c'est justement sa définition. On exige
      // seulement qu'il diffère du masculin, sinon il serait « identique ».
      return adj.fs === adj.ms;
    }).map((adj) => adj.key);
    expect(mauvais).toEqual([]);
  });

  it('forme toujours le féminin pluriel en +s sur le féminin singulier', () => {
    // Aucune exception en français : « belle → belles », « grosse → grosses ». Le
    // masculin pluriel, lui, peut être invariable : c'est sa propre famille.
    const mauvais = ADJECTIFS.filter((adj) => adj.fp !== `${adj.fs}s`).map(
      (adj) => adj.key,
    );
    expect(mauvais).toEqual([]);
  });

  it('ne rend le masculin pluriel invariable que sur un -s ou un -x final', () => {
    const mauvais = ADJECTIFS.filter(
      (adj) => adj.mp === adj.ms && !/[sx]$/.test(adj.ms),
    ).map((adj) => adj.key);
    expect(mauvais).toEqual([]);
  });

  it('couvre chaque famille d’adjectif par au moins un mot', () => {
    const vides = FAMILLES.filter((f) => f.porte === 'adjectif')
      .filter(
        (f) =>
          !ADJECTIFS.some((adj) => famillesDeLAdjectif(adj).includes(f.key)),
      )
      .map((f) => f.key);
    expect(vides).toEqual([]);
  });

  it('ne garde un féminin identique que si le masculin finit déjà par e', () => {
    const mauvais = ADJECTIFS.filter(
      (adj) => feminimInvariable(adj) && !adj.ms.endsWith('e'),
    ).map((adj) => adj.key);
    expect(mauvais).toEqual([]);
  });

  it('couvre le piège de la fiche : des adjectifs invariables au féminin', () => {
    expect(ADJECTIFS.filter(feminimInvariable).length).toBeGreaterThanOrEqual(
      4,
    );
  });

  it('place ses adjectifs des deux côtés du nom', () => {
    expect(
      ADJECTIFS.filter((adj) => adj.place === 'avant').length,
    ).toBeGreaterThan(0);
    expect(
      ADJECTIFS.filter((adj) => adj.place === 'apres').length,
    ).toBeGreaterThan(0);
  });
});

describe('verbes', () => {
  it("n'a aucune clé en doublon", () => {
    expect(doublons(VERBES.map((verbe) => verbe.key))).toEqual([]);
  });

  it('met toujours le pluriel en -nt, comme le dit la fiche', () => {
    const mauvais = VERBES.filter((verbe) => !verbe.p3.endsWith('nt')).map(
      (verbe) => verbe.key,
    );
    expect(mauvais).toEqual([]);
  });

  it('distingue toujours le singulier du pluriel', () => {
    const mauvais = VERBES.filter((verbe) => verbe.s3 === verbe.p3).map(
      (verbe) => verbe.key,
    );
    expect(mauvais).toEqual([]);
  });

  it('a de quoi remplir les trois difficultés', () => {
    expect(
      VERBES.filter((verbe) => verbe.homophone).length,
    ).toBeGreaterThanOrEqual(4);
    expect(
      VERBES.filter((verbe) => !verbe.homophone).length,
    ).toBeGreaterThanOrEqual(4);
  });

  it('trouve toujours un sujet possible dans le corpus', () => {
    // Un verbe dont aucun nom ne peut être sujet ne produirait jamais de question, sans
    // que rien ne le signale.
    const sansSujet = VERBES.filter(
      (verbe) =>
        !NOMS.some(
          (nom) => estAnime(nom) && verbe.sujets.includes(nom.categorie),
        ),
    ).map((verbe) => verbe.key);
    expect(sansSujet).toEqual([]);
  });

  it('donne à chaque verbe une suite de phrase, pour rester grammatical', () => {
    // « les chats prennent dans le jardin » ne se dit pas : la suite est portée par le
    // verbe, jamais tirée au hasard.
    const sansSuite = VERBES.filter((verbe) => !verbe.suite.trim()).map(
      (verbe) => verbe.key,
    );
    expect(sansSuite).toEqual([]);
  });
});

describe('determinant', () => {
  it('révèle le genre au singulier indéfini', () => {
    expect(determinant('masculin', 'singulier', 'indefini', false)).toBe('un');
    expect(determinant('feminin', 'singulier', 'indefini', false)).toBe('une');
  });

  it('cache le genre dès qu’il y a élision : le piège de la fiche', () => {
    expect(determinant('masculin', 'singulier', 'defini', true)).toBe('l’');
    expect(determinant('feminin', 'singulier', 'defini', true)).toBe('l’');
  });

  it('perd le genre au pluriel, dans les deux articles', () => {
    expect(determinant('masculin', 'pluriel', 'defini', false)).toBe('les');
    expect(determinant('feminin', 'pluriel', 'defini', false)).toBe('les');
    expect(determinant('masculin', 'pluriel', 'indefini', false)).toBe('des');
  });
});

describe('groupeNominal', () => {
  const chat = NOMS.find((nom) => nom.key === 'chat')!;
  const ecole = NOMS.find((nom) => nom.key === 'ecole')!;
  const souris = NOMS.find((nom) => nom.key === 'souris')!;
  const gateau = NOMS.find((nom) => nom.key === 'gateau')!;
  const petit = ADJECTIFS.find((adj) => adj.key === 'petit')!;
  const noir = ADJECTIFS.find((adj) => adj.key === 'noir')!;
  const rouge = ADJECTIFS.find((adj) => adj.key === 'rouge')!;

  it('accorde tout le groupe sur le nom', () => {
    expect(groupeNominal(chat, [petit, noir], 'singulier')).toBe(
      'le petit chat noir',
    );
    expect(groupeNominal(chat, [petit, noir], 'pluriel')).toBe(
      'les petits chats noirs',
    );
  });

  it('accorde au féminin, adjectif invariable compris', () => {
    expect(groupeNominal(ecole, [petit], 'singulier')).toBe('la petite école');
    expect(groupeNominal(ecole, [rouge], 'pluriel')).toBe('les écoles rouges');
  });

  it('fait porter l’élision au premier mot du groupe, pas au nom', () => {
    // « l’école » mais « la petite école » : c'est l'adjectif qui prend la place.
    expect(groupeNominal(ecole, [], 'singulier')).toBe('l’école');
    expect(groupeNominal(ecole, [petit], 'singulier')).toBe('la petite école');
  });

  it('ne met pas d’espace après une élision', () => {
    expect(groupeNominal(ecole, [], 'singulier')).not.toMatch(/’ /);
  });

  it('laisse le déterminant seul porter le nombre d’un nom invariable', () => {
    expect(groupeNominal(souris, [], 'singulier')).toBe('la souris');
    expect(groupeNominal(souris, [], 'pluriel')).toBe('les souris');
  });

  it('met le x du pluriel sur les noms en -eau', () => {
    expect(groupeNominal(gateau, [], 'pluriel')).toBe('les gâteaux');
  });

  it('classe correctement les pluriels réguliers et irréguliers', () => {
    expect(plurielIrregulier(chat)).toBe(false);
    expect(plurielIrregulier(gateau)).toBe(true);
    expect(plurielIrregulier(souris)).toBe(true);
  });
});
