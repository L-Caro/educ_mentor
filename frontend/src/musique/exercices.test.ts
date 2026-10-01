import { describe, expect, it } from 'vitest';
import {
  REGLAGES_DEFAUT,
  genererDictee,
  genererFigure,
  genererLire,
  genererMesure,
  genererOreille,
  genererPlacer,
  genererPartition,
  genererRythme,
  memeRythme,
  memeSuite,
  positionsJouables,
  remplirMesure,
  type Reglages,
} from './exercices';
import {
  dureeTotale,
  hauteurDe,
  mesureJuste,
  nomDe,
  type Figure,
  type Note,
} from './solfege';

const rand = (min: number, max: number) =>
  min + Math.floor(Math.random() * (max - min + 1));

const AVEC = (extra: Partial<Reglages>): Reglages => ({
  ...REGLAGES_DEFAUT,
  ...extra,
});

describe('l’intervalle de notes', () => {
  it('se règle en HAUTEURS, et traverse donc les deux clés', () => {
    // Les deux portées se chevauchent : compter en lignes supplémentaires depuis chacune
    // laissait ouvrir d'un côté ce qu'on croyait fermé de l'autre. Le do du milieu est
    // une ligne sous la clé de sol et une ligne au-dessus de la clé de fa : c'est la même
    // note, et un seul réglage doit la décrire.
    const doDuMilieu = hauteurDe(-2, 'sol');
    expect(hauteurDe(10, 'fa')).toBe(doDuMilieu);

    const serre = AVEC({ grave: doDuMilieu, aigu: doDuMilieu });
    for (const cle of ['sol', 'fa'] as const) {
      for (const p of positionsJouables(serre, cle)) {
        expect(hauteurDe(p, cle)).toBe(doDuMilieu);
      }
    }
  });

  it('ne laisse sortir aucune note de l’intervalle ouvert', () => {
    const reglages = AVEC({
      cles: ['sol', 'fa'],
      grave: hauteurDe(0, 'fa'),
      aigu: hauteurDe(8, 'sol'),
    });
    for (let essai = 0; essai < 200; essai++) {
      for (const note of genererPartition(reglages, rand).notes) {
        const hauteur = hauteurDe(note.position, note.cle);
        expect(hauteur).toBeGreaterThanOrEqual(reglages.grave);
        expect(hauteur).toBeLessThanOrEqual(reglages.aigu);
      }
    }
  });
});

describe('lire et placer une note', () => {
  it('ne pose jamais de note hors de l’intervalle ouvert', () => {
    const reglages = AVEC({ cles: ['sol', 'fa'] });
    for (let essai = 0; essai < 200; essai++) {
      const q = genererLire(reglages, rand);
      const hauteur = hauteurDe(q.position, q.cle);
      expect(hauteur).toBeGreaterThanOrEqual(reglages.grave);
      expect(hauteur).toBeLessThanOrEqual(reglages.aigu);
      expect(q.reponse).toBe(nomDe(hauteur));
    }
  });

  it('écrit chaque note sur la portée où elle TOMBE, sans empiler les lignes', () => {
    // Une note grave peut s'écrire en clé de sol avec trois lignes supplémentaires, mais
    // personne ne l'écrit comme ça : on l'écrit en clé de fa. C'est même à ça que servent
    // deux clés, et c'est ce qui fait descendre les graves sur la portée du bas.
    const reglages = AVEC({ cles: ['sol', 'fa'] });
    for (let essai = 0; essai < 200; essai++) {
      for (const note of genererPartition(reglages, rand).notes) {
        expect(note.position).toBeGreaterThanOrEqual(-3);
        expect(note.position).toBeLessThanOrEqual(11);
      }
    }
  });

  it('accepte TOUTES les places qui conviennent, pas seulement la première', () => {
    // Un do se pose à plusieurs hauteurs dès qu'on ouvre l'étendue. N'en accepter qu'une
    // apprendrait qu'il n'y en a qu'une, ce qui est faux.
    const reglages = AVEC({ cles: ['sol'], grave: 0, aigu: 99 });
    let vuPlusieurs = false;
    for (let essai = 0; essai < 300; essai++) {
      const q = genererPlacer(reglages, rand);
      expect(q.reponses.length).toBeGreaterThan(0);
      for (const position of q.reponses) {
        expect(nomDe(hauteurDe(position, q.cle))).toBe(q.note);
      }
      if (q.reponses.length > 1) vuPlusieurs = true;
    }
    expect(vuPlusieurs).toBe(true);
  });

  it('ne pose jamais une question sans réponse', () => {
    // Dans une étendue étroite, une note peut n'avoir aucune place : la question serait
    // alors impossible, et c'est la pire chose qu'un exercice puisse faire.
    const reglages = AVEC({ cles: ['sol'] });
    for (let essai = 0; essai < 200; essai++) {
      expect(genererPlacer(reglages, rand).reponses.length).toBeGreaterThan(0);
    }
  });
});

describe('nommer une figure', () => {
  it('ne mélange pas les notes et les silences dans les propositions', () => {
    // « Ronde » à côté de « soupir » se devine sans rien savoir : l'un est une note,
    // l'autre un silence, et la question ne mesure plus rien.
    const reglages = AVEC({ figures: ['ronde', 'blanche', 'noire'] });
    // Tous les silences, pas seulement ceux du réglage : depuis que les leurres sont
    // tirés de tout le catalogue, « demi-soupir » peut sortir face à un soupir.
    const silences = [
      'pause',
      'demi-pause',
      'soupir',
      'demi-soupir',
      'quart de soupir',
    ];
    for (let essai = 0; essai < 100; essai++) {
      const q = genererFigure(reglages, rand);
      expect(q.choix).toContain(q.reponse);
      const tousSilences = q.choix.every((c) => silences.includes(c));
      const aucunSilence = q.choix.every((c) => !silences.includes(c));
      expect(tousSilences || aucunSilence).toBe(true);
    }
  });
});

describe('la mesure', () => {
  const figuresPossibles: Figure[][] = [
    ['blanche', 'noire'],
    ['ronde', 'blanche', 'noire'],
    ['noire', 'croche'],
    ['ronde', 'blanche', 'noire', 'croche', 'doubleCroche'],
  ];

  it('tombe TOUJOURS juste, quelles que soient les figures et la mesure', () => {
    // Construite par le haut, à partir du temps restant : une mesure fausse ne peut pas
    // sortir, et l'on n'a pas besoin d'une boucle qui recommence jusqu'à ce que ça marche.
    for (const figures of figuresPossibles) {
      for (const mesure of [2, 3, 4] as const) {
        for (let essai = 0; essai < 60; essai++) {
          const evenements = remplirMesure(AVEC({ figures, mesure }), rand);
          expect(mesureJuste(evenements, mesure)).toBe(true);
          expect(evenements.length).toBeGreaterThan(0);
        }
      }
    }
  });

  it('ne commence jamais par un silence', () => {
    // On ne saurait pas quand partir : le premier temps doit s'entendre.
    for (let essai = 0; essai < 200; essai++) {
      const evenements = remplirMesure(
        AVEC({ figures: ['blanche', 'noire'], mesure: 4 }),
        rand,
      );
      expect(evenements[0].silence).toBe(false);
    }
  });

  it('laisse un trou que la bonne figure comble EXACTEMENT', () => {
    for (let essai = 0; essai < 200; essai++) {
      const q = genererMesure(
        AVEC({ figures: ['ronde', 'blanche', 'noire'], mesure: 4 }),
        rand,
      );
      const manquant = q.mesure - dureeTotale(q.evenements);
      expect(manquant).toBeCloseTo(
        { ronde: 4, blanche: 2, noire: 1, croche: 0.5, doubleCroche: 0.25 }[
          q.reponse
        ],
        9,
      );
      expect(q.choix).toContain(q.reponse);
    }
  });
});

describe('le rythme à frapper', () => {
  it('découpe en mesures justes, et pose les barres au bon endroit', () => {
    for (let essai = 0; essai < 60; essai++) {
      const q = genererRythme(
        AVEC({ figures: ['blanche', 'noire'], mesure: 2, longueur: 8 }),
        rand,
      );
      expect(q.barres).toHaveLength(3);
      // Chaque tranche entre deux barres doit faire exactement une mesure.
      const coupes = [0, ...q.barres.map((b) => b + 1), q.evenements.length];
      for (let i = 0; i < coupes.length - 1; i++) {
        const tranche = q.evenements.slice(coupes[i], coupes[i + 1]);
        expect(mesureJuste(tranche, 2)).toBe(true);
      }
    }
  });

  it('ne finit jamais sur un silence', () => {
    // On ne saurait pas si la phrase est finie ou si l'on attend encore.
    for (let essai = 0; essai < 200; essai++) {
      const q = genererRythme(
        AVEC({ figures: ['blanche', 'noire'], mesure: 3, longueur: 6 }),
        rand,
      );
      expect(q.evenements.at(-1)!.silence).toBe(false);
    }
  });
});

describe('la dictée rythmique', () => {
  it('propose trois rythmes DIFFÉRENTS, dont celui qu’on joue', () => {
    // Deux propositions identiques rendraient la question sans réponse, et on ne s'en
    // apercevrait qu'en jouant.
    for (let essai = 0; essai < 150; essai++) {
      const q = genererDictee(
        AVEC({ figures: ['blanche', 'noire'], mesure: 3 }),
        rand,
      );
      expect(q.propositions).toHaveLength(3);
      expect(memeRythme(q.propositions[q.reponse].evenements, q.joue)).toBe(
        true,
      );
      for (let i = 0; i < 3; i++) {
        for (let j = i + 1; j < 3; j++) {
          expect(
            memeRythme(
              q.propositions[i].evenements,
              q.propositions[j].evenements,
            ),
          ).toBe(false);
        }
      }
    }
  });
});

describe('l’oreille', () => {
  it('dit juste si ça monte, si ça descend, ou si c’est pareil', () => {
    for (let essai = 0; essai < 300; essai++) {
      const q = genererOreille(4, rand);
      const [a, b] = q.hauteurs;
      const attendu = b > a ? 'monte' : b < a ? 'descend' : 'pareil';
      expect(q.reponse).toBe(attendu);
      // Et les fréquences suivent les hauteurs : deux notes pareilles sonnent pareil.
      if (q.reponse === 'pareil')
        expect(q.frequences[0]).toBeCloseTo(q.frequences[1], 9);
      if (q.reponse === 'monte')
        expect(q.frequences[1]).toBeGreaterThan(q.frequences[0]);
      if (q.reponse === 'descend')
        expect(q.frequences[1]).toBeLessThan(q.frequences[0]);
    }
  });
});

describe('les garde-fous ajoutés après les premiers essais avec Maëve', () => {
  it('propose TOUJOURS plusieurs figures, même si une seule est au programme', () => {
    // Vécu : le pré-jeu réglé sur une seule figure ne donnait qu'un bouton, donc la
    // réponse écrite en toutes lettres. Le réglage dit ce qu'on lui demande de
    // reconnaître, pas ce qu'elle a le droit de voir écrit à côté.
    for (const figures of [['noire'], ['blanche'], ['ronde']] as Figure[][]) {
      for (let essai = 0; essai < 40; essai++) {
        const q = genererFigure(AVEC({ figures }), rand);
        expect(q.choix.length).toBeGreaterThanOrEqual(3);
        expect(new Set(q.choix).size).toBe(q.choix.length);
        expect(q.choix).toContain(q.reponse);
      }
    }
  });

  it('propose TOUJOURS plusieurs figures pour compléter une mesure', () => {
    for (const figures of [['noire'], ['blanche', 'noire']] as Figure[][]) {
      for (let essai = 0; essai < 40; essai++) {
        const q = genererMesure(AVEC({ figures, mesure: 4 }), rand);
        expect(q.choix.length).toBeGreaterThanOrEqual(3);
        expect(new Set(q.choix).size).toBe(q.choix.length);
      }
    }
  });

  it('ne part JAMAIS en récursion quand le vivier est trop pauvre', () => {
    // Vécu : « Maximum call stack size exceeded » sur la dictée. Avec une seule figure
    // dans une mesure à deux temps, il n'existe que deux rythmes : la fonction se
    // rappelait indéfiniment. Elle rend maintenant ce qu'elle a.
    for (const mesure of [2, 3, 4] as const) {
      for (let essai = 0; essai < 60; essai++) {
        const q = genererDictee(AVEC({ figures: ['noire'], mesure }), rand);
        expect(q.propositions.length).toBeGreaterThanOrEqual(2);
        expect(q.reponse).toBeGreaterThanOrEqual(0);
        expect(memeRythme(q.propositions[q.reponse].evenements, q.joue)).toBe(
          true,
        );
      }
    }
  });

  it('ne part pas en récursion non plus pour placer une note', () => {
    for (const [grave, aigu] of [
      [hauteurDe(0, 'sol'), hauteurDe(8, 'sol')],
      [hauteurDe(0, 'fa'), hauteurDe(8, 'sol')],
      [0, 99],
    ]) {
      for (const cles of [['sol'], ['fa']] as ('sol' | 'fa')[][]) {
        for (let essai = 0; essai < 60; essai++) {
          const q = genererPlacer(AVEC({ cles, grave, aigu }), rand);
          expect(q.reponses.length).toBeGreaterThan(0);
        }
      }
    }
  });
});

describe('ce qui ne se lit pas sur une seule ligne', () => {
  it('n’écrit jamais de silence plus long qu’un temps dans un rythme', () => {
    // Sur la ligne unique de la lecture rythmique, la pause et la demi-pause sont le
    // même rectangle : seule la ligne à laquelle il s'accroche les distingue, et il n'y
    // en a qu'une. Les proposer rendrait la lecture impossible, pas difficile.
    for (const figures of [
      ['ronde', 'blanche', 'noire'],
      ['ronde', 'blanche'],
    ] as Figure[][]) {
      for (const mesure of [2, 3, 4] as const) {
        for (let essai = 0; essai < 60; essai++) {
          for (const e of remplirMesure(AVEC({ figures, mesure }), rand)) {
            if (e.silence) {
              expect(['noire', 'croche', 'doubleCroche']).toContain(e.figure);
            }
          }
        }
      }
    }
  });
});

describe('les combinaisons impossibles', () => {
  it('remplit quand même une mesure que les figures choisies ne peuvent pas faire', () => {
    // Une ronde et une blanche ne feront jamais trois temps. Le tirage se faisait alors
    // sur une liste vide et l'exercice tombait en panne. La noire comble.
    for (const figures of [
      ['ronde'],
      ['ronde', 'blanche'],
      ['blanche'],
    ] as Figure[][]) {
      for (const mesure of [2, 3, 4] as const) {
        for (let essai = 0; essai < 30; essai++) {
          const evenements = remplirMesure(AVEC({ figures, mesure }), rand);
          expect(evenements.every((e) => e.figure !== undefined)).toBe(true);
          expect(mesureJuste(evenements, mesure)).toBe(true);
        }
      }
    }
  });
});

describe('la longueur des phrases', () => {
  it('suit le réglage, et compte en TEMPS et non en mesures', () => {
    for (const mesure of [2, 3, 4] as const) {
      for (const longueur of [4, 8, 12, 16]) {
        const q = genererRythme(
          AVEC({ figures: ['noire'], mesure, longueur }),
          rand,
        );
        const attendu = Math.max(1, Math.round(longueur / mesure));
        expect(q.barres).toHaveLength(attendu - 1);
        expect(dureeTotale(q.evenements)).toBeCloseTo(attendu * mesure, 9);
      }
    }
  });

  it('SORT DES SOUPIRS, et pas seulement des noires', () => {
    // Vécu : une dizaine de dictées d'affilée sans un seul silence. Une mesure à deux
    // temps ne laisse qu'UN évènement où un silence puisse tomber ; une phrase plus
    // longue en offre bien davantage, et c'est ce qui donne son intérêt à l'exercice.
    // Le seuil est LARGE devant le hasard : sur deux cents tirages on en attend environ
    // cent quarante, et un seuil à cent tient à plus de six écarts-types. Un seuil serré
    // aurait fait tomber la suite un jour sur deux sans qu'aucun code n'ait bougé.
    let avecSilence = 0;
    for (let essai = 0; essai < 200; essai++) {
      const q = genererDictee(
        AVEC({ figures: ['noire'], mesure: 2, longueur: 8 }),
        rand,
      );
      if (q.joue.some((e) => e.silence)) avecSilence++;
    }
    expect(avecSilence).toBeGreaterThan(100);
  });

  it('garde la dictée COURTE même quand les phrases à frapper s’allongent', () => {
    // Au-delà de huit temps, ce n'est plus l'oreille qu'on mesure mais la mémoire.
    for (const longueur of [12, 16]) {
      const q = genererDictee(
        AVEC({ figures: ['noire'], mesure: 2, longueur }),
        rand,
      );
      expect(dureeTotale(q.joue)).toBeLessThanOrEqual(8);
    }
  });

  it('aligne les trois propositions sur la même suite de figures quand il le peut', () => {
    // Des leurres qui ne diffèrent QUE par les silences obligent à écouter le détail au
    // lieu de reconnaître la silhouette.
    let alignees = 0;
    for (let essai = 0; essai < 40; essai++) {
      const q = genererDictee(
        AVEC({ figures: ['blanche', 'noire'], mesure: 2, longueur: 8 }),
        rand,
      );
      const tailles = new Set(q.propositions.map((p) => p.evenements.length));
      if (tailles.size === 1) alignees++;
    }
    expect(alignees).toBeGreaterThan(30);
  });
});

describe('les notes au programme', () => {
  it('n’interroge que les notes ouvertes', () => {
    // Sa méthode n'ouvre pas les sept d'un coup : interroger « si » la première semaine
    // ne mesurerait que ce qu'elle n'a pas encore vu.
    const notes: Note[] = ['do', 'ré', 'mi'];
    for (const cles of [['sol'], ['fa']] as ('sol' | 'fa')[][]) {
      for (let essai = 0; essai < 150; essai++) {
        expect(notes).toContain(
          genererLire(AVEC({ cles, notes }), rand).reponse,
        );
        expect(notes).toContain(
          genererPlacer(AVEC({ cles, notes }), rand).note,
        );
        for (const n of genererPartition(AVEC({ cles, notes }), rand).reponse) {
          expect(notes).toContain(n);
        }
      }
    }
  });

  it('retombe sur l’étendue entière plutôt que de poser une question sans réponse', () => {
    // Un réglage trop serré doit donner un exercice facile, pas un exercice cassé : avec
    // une seule note ouverte et aucune place pour elle, on préfère élargir que planter.
    const q = genererLire(AVEC({ notes: [] }), rand);
    expect(q.reponse).toBeTruthy();
  });
});

describe('lire une partition', () => {
  it('propose 4 à 6 notes, et quatre suites dont la bonne', () => {
    for (let essai = 0; essai < 200; essai++) {
      const q = genererPartition(AVEC({}), rand);
      expect(q.notes.length).toBeGreaterThanOrEqual(4);
      expect(q.notes.length).toBeLessThanOrEqual(6);
      expect(q.choix).toHaveLength(4);
      expect(q.choix.filter((s) => memeSuite(s, q.reponse))).toHaveLength(1);
      for (const suite of q.choix) expect(suite).toHaveLength(q.reponse.length);
    }
  });

  it('ne propose JAMAIS deux fois la même suite', () => {
    // Deux propositions identiques rendraient la question sans réponse unique, et on ne
    // s'en apercevrait qu'en tombant dessus.
    for (let essai = 0; essai < 200; essai++) {
      const { choix } = genererPartition(AVEC({}), rand);
      for (let i = 0; i < choix.length; i++) {
        for (let j = i + 1; j < choix.length; j++) {
          expect(memeSuite(choix[i], choix[j])).toBe(false);
        }
      }
    }
  });

  it('fait des leurres qui SE RESSEMBLENT : une ou deux notes d’écart, jamais plus', () => {
    // Des suites qui ne se ressemblent pas se départagent sur la première note, sans lire
    // la suite : l'exercice ne mesurerait plus la lecture groupée.
    for (let essai = 0; essai < 200; essai++) {
      const q = genererPartition(AVEC({}), rand);
      for (const suite of q.choix) {
        if (memeSuite(suite, q.reponse)) continue;
        const ecarts = suite.filter((n, i) => n !== q.reponse[i]).length;
        expect(ecarts).toBeGreaterThan(0);
        expect(ecarts).toBeLessThanOrEqual(2);
      }
    }
  });
});

describe('la lecture groupée', () => {
  const DEUX_CLES = { cles: ['sol', 'fa'] as ('sol' | 'fa')[] };

  it('fait PASSER la suite d’une portée à l’autre', () => {
    // C'est tout l'objet de l'exercice : on lit de gauche à droite en changeant de
    // portée, et non le haut puis le bas. Avec une seule clé ouverte, rien ne change.
    let aChange = 0;
    for (let essai = 0; essai < 60; essai++) {
      const { notes } = genererPartition(AVEC(DEUX_CLES), rand);
      if (notes.some((n, i) => i > 0 && n.cle !== notes[i - 1].cle)) aChange++;
    }
    expect(aChange).toBe(60);
  });

  it('reste sur UNE portée quand une seule clé est ouverte', () => {
    // On ne force pas la clé de fa à quelqu'un qui ne l'a pas encore vue.
    for (let essai = 0; essai < 60; essai++) {
      const { notes } = genererPartition(AVEC({ cles: ['sol'] }), rand);
      expect(notes.every((n) => n.cle === 'sol')).toBe(true);
    }
  });

  it('couvre toutes les notes par un groupe lié, sans trou ni chevauchement', () => {
    // Un arc manquant laisserait des notes sans groupe, et l'enfant ne saurait pas où
    // s'arrête la plage qu'elle doit lire d'un trait.
    for (let essai = 0; essai < 100; essai++) {
      const { notes, groupes } = genererPartition(AVEC(DEUX_CLES), rand);
      const couverts = groupes.flatMap(([a, b]) =>
        Array.from({ length: b - a + 1 }, (_, i) => a + i),
      );
      expect([...couverts].sort((a, b) => a - b)).toEqual(
        notes.map((_, i) => i),
      );
    }
  });

  it('garde un groupe sur UNE SEULE portée', () => {
    // Un arc à cheval sur les deux portées ne se dessine pas : il appartient à l'une.
    for (let essai = 0; essai < 100; essai++) {
      const { notes, groupes } = genererPartition(AVEC(DEUX_CLES), rand);
      for (const [a, b] of groupes) {
        const cles = new Set(notes.slice(a, b + 1).map((n) => n.cle));
        expect(cles.size).toBe(1);
      }
    }
  });

  it('garde les notes d’un groupe VOISINES sur la portée', () => {
    // Sa méthode appelle ces groupes des secondes puis des tricordes : l'intérêt est de
    // lire un mouvement, pas une suite de notes sans rapport.
    for (let essai = 0; essai < 100; essai++) {
      const { notes, groupes } = genererPartition(AVEC(DEUX_CLES), rand);
      for (const [a, b] of groupes) {
        for (let i = a + 1; i <= b; i++) {
          expect(
            Math.abs(notes[i].position - notes[i - 1].position),
          ).toBeLessThanOrEqual(3);
        }
      }
    }
  });
});

describe('le mouvement des notes', () => {
  /** Le plus grand saut entre deux notes VOISINES de la suite, sur la même portée. Un
   * changement de portée n'est pas un saut : les deux notes ne se comparent pas en cases. */
  function plusGrandSaut(
    notes: { cle: 'sol' | 'fa'; position: number }[],
  ): number {
    let maximum = 0;
    for (let i = 1; i < notes.length; i++) {
      if (notes[i].cle !== notes[i - 1].cle) continue;
      maximum = Math.max(
        maximum,
        Math.abs(notes[i].position - notes[i - 1].position),
      );
    }
    return maximum;
  }

  it('facile : les notes SE SUIVENT, une case à la fois', () => {
    for (let essai = 0; essai < 200; essai++) {
      const { notes } = genererPartition(AVEC({ mouvement: 'facile' }), rand);
      expect(plusGrandSaut(notes)).toBeLessThanOrEqual(1);
    }
  });

  it('facile : ça monte ou ça descend, ça ne zigzague pas à chaque note', () => {
    // Une suite qui changerait de sens à chaque note ne se lirait plus comme un mouvement,
    // ce qui est pourtant tout ce que l'exercice cherche à faire travailler.
    let suites = 0;
    for (let essai = 0; essai < 200; essai++) {
      const { notes } = genererPartition(AVEC({ mouvement: 'facile' }), rand);
      const memeCle = notes.filter(
        (n, i) => i > 0 && n.cle === notes[i - 1].cle,
      );
      if (memeCle.length < 2) continue;
      let virages = 0;
      for (let i = 2; i < notes.length; i++) {
        if (
          notes[i].cle !== notes[i - 1].cle ||
          notes[i - 1].cle !== notes[i - 2].cle
        )
          continue;
        const avant = notes[i - 1].position - notes[i - 2].position;
        const apres = notes[i].position - notes[i - 1].position;
        if (avant * apres < 0) virages++;
      }
      if (virages <= 1) suites++;
    }
    expect(suites).toBeGreaterThan(150);
  });

  it('moyen : jamais plus d’une tierce, soit deux cases', () => {
    for (let essai = 0; essai < 200; essai++) {
      const { notes } = genererPartition(AVEC({ mouvement: 'moyen' }), rand);
      expect(plusGrandSaut(notes)).toBeLessThanOrEqual(2);
    }
  });

  it('difficile : des sauts que les deux autres réglages ne produisent jamais', () => {
    // Sans ça, « difficile » pourrait être identique à « moyen » sans qu'on le voie.
    let grandsSauts = 0;
    for (let essai = 0; essai < 200; essai++) {
      const { notes } = genererPartition(
        AVEC({ mouvement: 'difficile' }),
        rand,
      );
      if (plusGrandSaut(notes) > 2) grandsSauts++;
    }
    expect(grandsSauts).toBeGreaterThan(100);
  });
});
