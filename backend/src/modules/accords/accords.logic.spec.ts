import {
  generateQuestion,
  generateQuestions,
  normaliseReponse,
  reponseCorrecte,
} from './accords.logic';
import { NOTION_KEYS, type NotionKey } from './accords.notions';
import { ADJECTIFS, NOMS, VERBES, plurielIrregulier } from './accords.corpus';
import {
  DEFAULT_ACTIVE_FAMILLES,
  FAMILLE_KEYS,
  familleDuNom,
  famillesDeLAdjectif,
} from './accords.familles';

/**
 * La génération et la validation. Deux familles de pannes silencieuses sont visées.
 *
 * **Un QCM qui n'interroge plus l'accord.** À deux choix, si le distracteur retenu est
 * l'infinitif plutôt que la forme opposée, « La fille ⬚ un gâteau (faire) » propose
 * `faire / fait` : la question devient de la conjugaison. C'est arrivé, et rien ne le
 * signalait — la réponse restait juste.
 *
 * **Une réponse correcte refusée.** L'énoncé et la réponse attendue doivent sortir de la
 * même fonction. Un « des gâteaux » construit à la main d'un côté et par règle de l'autre
 * finit par diverger, et l'enfant a raison contre la machine.
 */

const randReel = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const TOUTES = NOTION_KEYS;

/** Le nom du corpus présent dans un énoncé, repéré par JETON et non par sous-chaîne.
 * `'les gâteaux'.includes('eau')` est vrai, et faisait désigner « eau » là où il y avait
 * « gâteau » — le test échouait sur une incompatibilité qui n'existait pas. */
function nomDeLenonce(...morceaux: string[]) {
  const jetons = morceaux
    .join(' ')
    .split(/[\s’']+/)
    .filter(Boolean);
  return NOMS.find((candidat) =>
    jetons.some(
      (jeton) => jeton === candidat.singulier || jeton === candidat.pluriel,
    ),
  );
}

describe('generateQuestion — genre_nom', () => {
  it('interroge toujours avec un déterminant indéfini, qui révèle le genre', () => {
    for (let n = 0; n < 60; n++) {
      const q = generateQuestion('genre_nom', 'medium', TOUTES, randReel)!;
      expect(q.choices.sort()).toEqual(['un', 'une']);
      expect(['un', 'une']).toContain(q.answer);
    }
  });

  it('sépare le trou du nom par une espace', () => {
    // Sans elle, l'énoncé s'affiche « ⬚pomme » : le trou devient un préfixe.
    const q = generateQuestion('genre_nom', 'medium', TOUTES, randReel)!;
    expect(q.apres.startsWith(' ')).toBe(true);
  });
});

describe('generateQuestion — nombre_nom', () => {
  it('demande une saisie, dans les deux sens, et attend la forme du corpus', () => {
    for (let n = 0; n < 80; n++) {
      const q = generateQuestion('nombre_nom', 'medium', TOUTES, randReel)!;
      expect(q.choices).toEqual([]);
      expect(q.depart).toBeTruthy();
      const nomMeta = NOMS.find(
        (candidat) =>
          candidat.singulier === q.answer || candidat.pluriel === q.answer,
      );
      expect({
        reponse: q.answer,
        trouve: nomMeta !== undefined,
      }).toMatchObject({
        trouve: true,
      });
    }
  });

  it("n'expose que des pluriels réguliers en facile", () => {
    for (let n = 0; n < 80; n++) {
      const q = generateQuestion('nombre_nom', 'easy', TOUTES, randReel)!;
      const nomMeta = NOMS.find(
        (candidat) =>
          candidat.singulier === q.answer || candidat.pluriel === q.answer,
      )!;
      expect({
        nom: nomMeta.key,
        irregulier: plurielIrregulier(nomMeta),
      }).toEqual({
        nom: nomMeta.key,
        irregulier: false,
      });
    }
  });
});

describe('generateQuestion — accord_adjectif', () => {
  it('propose toujours la bonne forme, sans doublon', () => {
    for (let n = 0; n < 100; n++) {
      const q = generateQuestion(
        'accord_adjectif',
        'medium',
        TOUTES,
        randReel,
      )!;
      expect(q.choices).toContain(q.answer);
      expect(new Set(q.choices).size).toBe(q.choices.length);
      expect(q.choices.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("oppose d'abord la marque du nombre quand il n'y a que deux choix", () => {
    // À deux choix, le distracteur doit être la forme qui ne diffère QUE par le nombre :
    // c'est la marque que la fiche enseigne.
    for (let n = 0; n < 100; n++) {
      const q = generateQuestion('accord_adjectif', 'easy', TOUTES, randReel)!;
      expect(q.choices).toHaveLength(2);
      const adj = ADJECTIFS.find((candidat) =>
        [candidat.ms, candidat.fs, candidat.mp, candidat.fp].includes(q.answer),
      )!;
      // Les deux choix appartiennent au même adjectif, et l'un est la réponse.
      const formes = [adj.ms, adj.fs, adj.mp, adj.fp];
      for (const choix of q.choices) expect(formes).toContain(choix);
    }
  });

  it("n'accole jamais un adjectif à un nom qu'il ne peut pas qualifier", () => {
    // « les chapeaux sucrés » est grammaticalement juste et absurde : l'enfant s'arrête
    // sur l'absurdité au lieu de compter les s.
    for (let n = 0; n < 200; n++) {
      const q = generateQuestion('accord_adjectif', 'hard', TOUTES, randReel)!;
      const nomMeta = nomDeLenonce(q.avant, q.apres);
      expect(nomMeta).toBeDefined();
      const adj = ADJECTIFS.find((candidat) => candidat.ms === q.indice)!;
      expect({
        nom: nomMeta!.key,
        adj: adj.key,
        compatible: adj.sappliqueA.includes(nomMeta!.categorie),
      }).toMatchObject({ compatible: true });
    }
  });
});

describe('generateQuestion — accord_gn', () => {
  it('donne un départ et attend le groupe entier accordé', () => {
    for (let n = 0; n < 80; n++) {
      const q = generateQuestion('accord_gn', 'medium', TOUTES, randReel)!;
      expect(q.choices).toEqual([]);
      expect(q.depart).toBeTruthy();
      expect(q.answer).not.toBe(q.depart);
      expect(q.answer.split(' ').length).toBeGreaterThanOrEqual(2);
    }
  });

  it('ne met aucun adjectif en facile, deux au plus en difficile', () => {
    for (let n = 0; n < 40; n++) {
      const facile = generateQuestion('accord_gn', 'easy', TOUTES, randReel)!;
      expect(facile.answer.replace('l’', 'l ').split(' ')).toHaveLength(2);

      const dur = generateQuestion('accord_gn', 'hard', TOUTES, randReel)!;
      expect(
        dur.answer.replace('l’', 'l ').split(' ').length,
      ).toBeLessThanOrEqual(4);
    }
  });

  it('ne met jamais deux adjectifs de la même famille — « le chapeau vert rouge »', () => {
    for (let n = 0; n < 200; n++) {
      const q = generateQuestion('accord_gn', 'hard', TOUTES, randReel)!;
      const familles = ADJECTIFS.filter((adj) =>
        [adj.ms, adj.fs, adj.mp, adj.fp].some((forme) =>
          q.answer.split(' ').includes(forme),
        ),
      ).map((adj) => adj.famille);
      expect(familles.length).toBe(new Set(familles).size);
    }
  });

  it('ne laisse pas d’espace après une élision', () => {
    for (let n = 0; n < 80; n++) {
      const q = generateQuestion('accord_gn', 'medium', TOUTES, randReel)!;
      expect(q.answer).not.toMatch(/’ /);
      expect(q.depart!).not.toMatch(/’ /);
    }
  });
});

describe('generateQuestion — accord_sujet_verbe', () => {
  it('oppose toujours le singulier et le pluriel du même verbe', () => {
    // Le cœur de la notion. À deux choix, l'infinitif ne doit JAMAIS remplacer la forme
    // opposée : la question deviendrait de la conjugaison.
    for (let n = 0; n < 150; n++) {
      const q = generateQuestion(
        'accord_sujet_verbe',
        'easy',
        TOUTES,
        randReel,
      )!;
      const verbeMeta = VERBES.find(
        (candidat) => candidat.infinitif === q.indice,
      )!;
      expect(q.choices.sort()).toEqual([verbeMeta.p3, verbeMeta.s3].sort());
    }
  });

  it('ajoute l’infinitif seulement quand il y a de la place', () => {
    for (let n = 0; n < 80; n++) {
      const q = generateQuestion(
        'accord_sujet_verbe',
        'medium',
        TOUTES,
        randReel,
      )!;
      const verbeMeta = VERBES.find(
        (candidat) => candidat.infinitif === q.indice,
      )!;
      expect(q.choices).toContain(verbeMeta.s3);
      expect(q.choices).toContain(verbeMeta.p3);
    }
  });

  it('ne prend que des sujets capables de faire cette action', () => {
    // « Les chiens dessinent un soleil » est correct et faux.
    for (let n = 0; n < 200; n++) {
      const q = generateQuestion(
        'accord_sujet_verbe',
        'medium',
        TOUTES,
        randReel,
      )!;
      const verbeMeta = VERBES.find(
        (candidat) => candidat.infinitif === q.indice,
      )!;
      const sujet = q.avant.trim().toLowerCase();
      const nomMeta = nomDeLenonce(sujet);
      // Sujet coordonné (« Maëve et Léa ») : aucun nom du corpus, mais toujours animé.
      if (!nomMeta) {
        expect(sujet).toMatch(/ et /);
        continue;
      }
      expect({
        verbe: verbeMeta.key,
        nom: nomMeta.key,
        compatible: verbeMeta.sujets.includes(nomMeta.categorie),
      }).toMatchObject({ compatible: true });
    }
  });

  it('garde les verbes audibles pour le facile et les homophones pour le difficile', () => {
    // La fiche : « il dort et ils dorment se prononcent presque pareil ». C'est ça qui est
    // difficile, pas l'irrégularité — « est / sont » s'entend.
    for (let n = 0; n < 60; n++) {
      const facile = generateQuestion(
        'accord_sujet_verbe',
        'easy',
        TOUTES,
        randReel,
      )!;
      expect(VERBES.find((v) => v.infinitif === facile.indice)!.homophone).toBe(
        false,
      );

      const dur = generateQuestion(
        'accord_sujet_verbe',
        'hard',
        TOUTES,
        randReel,
      )!;
      expect(VERBES.find((v) => v.infinitif === dur.indice)!.homophone).toBe(
        true,
      );
    }
  });

  it('met une majuscule au sujet et une ponctuation à la fin', () => {
    const q = generateQuestion(
      'accord_sujet_verbe',
      'medium',
      TOUTES,
      randReel,
    )!;
    expect(q.avant[0]).toBe(q.avant[0].toUpperCase());
    expect(q.apres.trimEnd()).toMatch(/[.!?]$/);
  });
});

describe('porte des notions actives', () => {
  it('ne produit rien pour une notion inactive', () => {
    const actives: NotionKey[] = ['genre_nom'];
    expect(
      generateQuestion('accord_sujet_verbe', 'medium', actives, randReel),
    ).toBeNull();
    expect(
      generateQuestion('genre_nom', 'medium', actives, randReel),
    ).not.toBeNull();
  });

  it('rend une liste vide sans boucler quand rien n’est activé', () => {
    expect(generateQuestions(10, TOUTES, 'medium', [], randReel)).toEqual([]);
  });
});

describe('generateQuestions', () => {
  it('sert le nombre demandé sans répéter la même question', () => {
    const questions = generateQuestions(10, TOUTES, 'medium', TOUTES, randReel);
    expect(questions).toHaveLength(10);
    expect(new Set(questions.map((q) => q.item_key)).size).toBe(10);
  });
});

describe('validation de la saisie', () => {
  it("n'enlève JAMAIS les accents — l'orthographe est la réponse", () => {
    // `geometrie` accepte « decagone » parce qu'il évalue la géométrie. Ici, accepter
    // « des gateaux » enseignerait l'inverse de la leçon.
    expect(reponseCorrecte('des gâteaux', 'des gateaux')).toBe(false);
    expect(reponseCorrecte('les écoles', 'les ecoles')).toBe(false);
  });

  it('exige la marque du pluriel', () => {
    expect(reponseCorrecte('les petits chats', 'les petit chats')).toBe(false);
    expect(reponseCorrecte('les petits chats', 'les petits chat')).toBe(false);
    expect(reponseCorrecte('les petits chats', 'les petits chats')).toBe(true);
  });

  it('tolère ce qui ne concerne pas l’accord : casse, espaces, apostrophe', () => {
    expect(reponseCorrecte('l’école', "l'école")).toBe(true);
    expect(reponseCorrecte('l’école', "  L'École  ")).toBe(true);
    expect(reponseCorrecte('les petits chats', 'les   petits  chats')).toBe(
      true,
    );
  });

  it('normalise de façon idempotente', () => {
    const brut = "  L'ÉCOLE   Propre ";
    expect(normaliseReponse(normaliseReponse(brut))).toBe(
      normaliseReponse(brut),
    );
  });
});

// ─── La porte des familles ──────────────────────────────────────────────────

describe('familles morphologiques', () => {
  const SOCLE = DEFAULT_ACTIVE_FAMILLES;
  const TOUT = FAMILLE_KEYS;

  it('ne sert jamais un pluriel dont la famille est fermée', () => {
    // « cheval / chevaux » est dans le corpus mais fermé au départ : le servir
    // enseignerait un pluriel qui n'a pas été vu en classe.
    const fermes = NOMS.filter((nom) => !SOCLE.includes(familleDuNom(nom))).map(
      (nom) => nom.pluriel,
    );
    expect(fermes.length).toBeGreaterThan(0);

    for (let n = 0; n < 200; n++) {
      const q = generateQuestion(
        'nombre_nom',
        'hard',
        TOUTES,
        randReel,
        SOCLE,
      )!;
      expect(fermes).not.toContain(q.answer);
    }
  });

  it('sert le pluriel en -aux une fois la famille ouverte', () => {
    const ouvertes = [...SOCLE, 'pluriel_aux' as const];
    const attendus = NOMS.filter(
      (nom) => familleDuNom(nom) === 'pluriel_aux',
    ).map((nom) => nom.pluriel);

    const vus = new Set<string>();
    for (let n = 0; n < 400; n++) {
      const q = generateQuestion(
        'nombre_nom',
        'hard',
        TOUTES,
        randReel,
        ouvertes,
      )!;
      vus.add(q.answer);
    }
    expect(attendus.some((forme) => vus.has(forme))).toBe(true);
  });

  it("n'utilise un adjectif que si TOUTES ses familles sont ouvertes", () => {
    // « gros » demande la consonne doublée (CE2) ET le pluriel invariable (CM1). Ouvrir
    // seulement la première ne doit pas le rendre jouable : « les gros chats »
    // enseignerait le pluriel invariable au passage.
    const ouvertes = [...SOCLE, 'feminin_double' as const];
    const interdits = ADJECTIFS.filter(
      (adj) => !famillesDeLAdjectif(adj).every((f) => ouvertes.includes(f)),
    ).map((adj) => adj.ms);
    expect(interdits).toContain('gros');

    for (let n = 0; n < 300; n++) {
      const q = generateQuestion(
        'accord_adjectif',
        'hard',
        TOUTES,
        randReel,
        ouvertes,
      )!;
      expect(interdits).not.toContain(q.indice);
    }
  });

  it('rend le corpus entier jouable quand tout est ouvert', () => {
    const vus = new Set<string>();
    for (let n = 0; n < 600; n++) {
      const q = generateQuestion(
        'accord_adjectif',
        'hard',
        TOUTES,
        randReel,
        TOUT,
      )!;
      if (q.indice) vus.add(q.indice);
    }
    // Au moins un adjectif de chaque famille fermée au départ doit finir par sortir.
    expect(vus.has('beau') || vus.has('vieux') || vus.has('blanc')).toBe(true);
  });

  it('ne casse pas quand une famille ouverte n’a aucun mot compatible', () => {
    // Ouvrir `pluriel_oux` seul laisse quatre noms, tous masculins : la génération doit
    // rendre une question ou `null`, jamais planter.
    for (let n = 0; n < 50; n++) {
      expect(() =>
        generateQuestion('accord_gn', 'hard', TOUTES, randReel, [
          'pluriel_oux',
        ]),
      ).not.toThrow();
    }
  });
});
