import { describe, expect, it } from 'vitest';
import {
  REGLAGES_DEFAUT,
  genererDictee,
  genererFigure,
  genererLire,
  genererMesure,
  genererOreille,
  genererPlacer,
  genererRythme,
  memeRythme,
  positionsPermises,
  remplirMesure,
  type Reglages,
} from './exercices';
import {
  dureeTotale,
  hauteurDe,
  mesureJuste,
  nomDe,
  type Figure,
} from './solfege';

const rand = (min: number, max: number) =>
  min + Math.floor(Math.random() * (max - min + 1));

const AVEC = (extra: Partial<Reglages>): Reglages => ({
  ...REGLAGES_DEFAUT,
  ...extra,
});

describe('l’étendue', () => {
  it('reste dans la portée quand aucune ligne supplémentaire n’est ouverte', () => {
    expect(positionsPermises(0)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it('s’ouvre d’une ligne de chaque côté à la fois', () => {
    expect(positionsPermises(1)[0]).toBe(-2);
    expect(positionsPermises(1).at(-1)).toBe(10);
    expect(positionsPermises(2)[0]).toBe(-4);
  });
});

describe('lire et placer une note', () => {
  it('ne pose jamais de note hors de l’étendue ouverte', () => {
    const reglages = AVEC({ cles: ['sol', 'fa'], etendue: 1 });
    for (let essai = 0; essai < 200; essai++) {
      const q = genererLire(reglages, rand);
      expect(q.position).toBeGreaterThanOrEqual(-2);
      expect(q.position).toBeLessThanOrEqual(10);
      expect(q.reponse).toBe(nomDe(hauteurDe(q.position, q.cle)));
    }
  });

  it('accepte TOUTES les places qui conviennent, pas seulement la première', () => {
    // Un do se pose à plusieurs hauteurs dès qu'on ouvre l'étendue. N'en accepter qu'une
    // apprendrait qu'il n'y en a qu'une, ce qui est faux.
    const reglages = AVEC({ cles: ['sol'], etendue: 2 });
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
    const reglages = AVEC({ cles: ['sol'], etendue: 0 });
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
    for (const etendue of [0, 1, 2]) {
      for (const cles of [['sol'], ['fa']] as ('sol' | 'fa')[][]) {
        for (let essai = 0; essai < 60; essai++) {
          const q = genererPlacer(AVEC({ cles, etendue }), rand);
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
