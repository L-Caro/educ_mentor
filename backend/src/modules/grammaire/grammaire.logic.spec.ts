import {
  generateQuestion,
  generateQuestions,
  difficultesPour,
  nombreDeChoix,
  notionsRequises,
} from './grammaire.logic';
import { CORPUS, DEFAULT_ACTIVE_CLASSES, texteDe } from './grammaire.corpus';
import {
  NATURES,
  NOTION_KEYS,
  getNotion,
  type NotionKey,
} from './grammaire.notions';

/**
 * La génération se joue entièrement ici, sans base ni NestJS : quelle notion est
 * interrogée, sur quelle phrase, et quels mots comptent comme la bonne réponse.
 *
 * Deux pannes silencieuses sont visées en particulier :
 *   - une question dont la réponse est vide (« touche les adjectifs » sur une phrase qui
 *     n'en a pas), qui rendrait la validation impossible ;
 *   - un distracteur pris dans une notion NON activée, qui divulgue par le QCM une
 *     notion que l'enfant n'a pas encore vue en classe.
 */

const randReel = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const TOUTES = NOTION_KEYS;
const SOCLE: NotionKey[] = [
  'nom_commun',
  'nom_propre',
  'verbe',
  'determinant',
  'adjectif',
];

describe('difficultesPour / nombreDeChoix', () => {
  it('ouvre les phrases progressivement', () => {
    expect(difficultesPour('easy')).toEqual(['simple']);
    expect(difficultesPour('medium')).toEqual(['simple', 'moyen']);
    expect(difficultesPour('hard')).toEqual(['simple', 'moyen', 'complexe']);
  });

  it('ne bascule jamais en saisie libre, même en difficile', () => {
    // `qcmChoiceCount` de common/difficulty renvoie 0 en `hard` au sens « saisie libre ».
    // Ici 0 veut dire « toutes les natures actives », jamais « fais-la taper ».
    expect(nombreDeChoix('easy')).toBe(2);
    expect(nombreDeChoix('medium')).toBe(4);
    expect(nombreDeChoix('hard')).toBe(0);
  });
});

describe('generateQuestion : nature_mot', () => {
  it('souligne un mot de la phrase et propose sa nature parmi les choix', () => {
    for (let n = 0; n < 60; n++) {
      const q = generateQuestion('nature_mot', CORPUS, TOUTES, 4, randReel)!;
      expect(q).not.toBeNull();
      expect(q.cible).not.toBeNull();
      expect(q.cible!).toBeGreaterThanOrEqual(0);
      expect(q.cible!).toBeLessThan(q.mots.length);
      expect(q.choices).toContain(q.answer);
      expect(new Set(q.choices).size).toBe(q.choices.length);
      expect(q.choices.length).toBe(4);
      expect(q.answer_indices).toEqual([q.cible]);
    }
  });

  it("ne propose jamais un distracteur d'une notion non activée", () => {
    const actives: NotionKey[] = SOCLE.filter(
      (notion) => notion !== 'adjectif',
    );
    const interdits = NATURES.filter((n) => !actives.includes(n)).map(
      (n) => getNotion(n).label,
    );
    for (let n = 0; n < 80; n++) {
      const q = generateQuestion('nature_mot', CORPUS, actives, 4, randReel)!;
      expect(q.choices.filter((choix) => interdits.includes(choix))).toEqual(
        [],
      );
    }
  });

  it("n'interroge que des mots dont la nature est activée", () => {
    for (let n = 0; n < 80; n++) {
      const q = generateQuestion(
        'nature_mot',
        CORPUS,
        ['verbe', 'nom_commun'],
        4,
        randReel,
      )!;
      expect(['verbe', 'nom_commun']).toContain(q.skill_key);
      expect(q.choices.sort()).toEqual(['un nom commun', 'un verbe']);
    }
  });

  it('ne pose pas la question quand une seule nature est activée', () => {
    // Un QCM à une proposition offre la réponse, et la question ne testerait rien :
    // classer un mot suppose d'avoir plus d'une case où le ranger.
    expect(
      generateQuestion('nature_mot', CORPUS, ['verbe'], 4, randReel),
    ).toBeNull();
  });

  it('ouvre tous les choix actifs en difficile', () => {
    const q = generateQuestion('nature_mot', CORPUS, SOCLE, 0, randReel)!;
    expect(q.choices.length).toBe(SOCLE.length);
  });
});

describe('generateQuestion : trouver_mots', () => {
  it('vise au moins un mot, et exactement ceux de la nature demandée', () => {
    for (let n = 0; n < 80; n++) {
      const q = generateQuestion('trouver_mots', CORPUS, TOUTES, 4, randReel)!;
      expect(q).not.toBeNull();
      expect(q.answer_indices.length).toBeGreaterThan(0);
      expect(q.choices).toEqual([]);
      expect(q.cible).toBeNull();
      expect(NATURES).toContain(q.skill_key);
    }
  });

  it('accorde la consigne au nombre de mots visés', () => {
    for (let n = 0; n < 80; n++) {
      const q = generateQuestion('trouver_mots', CORPUS, TOUTES, 4, randReel)!;
      const notion = getNotion(q.skill_key);
      const attendu =
        q.answer_indices.length === 1 ? notion.singulier : notion.pluriel;
      expect(q.display).toBe(`Touche ${attendu}.`);
    }
  });

  it('ne demande rien si aucune nature n’est activée', () => {
    expect(
      generateQuestion('trouver_mots', CORPUS, ['sujet'], 4, randReel),
    ).toBeNull();
  });
});

describe('generateQuestion : trouver_fonction', () => {
  it('vise un seul bloc de mots, contigu', () => {
    for (let n = 0; n < 80; n++) {
      const q = generateQuestion(
        'trouver_fonction',
        CORPUS,
        ['sujet', 'complement'],
        4,
        randReel,
      )!;
      expect(q).not.toBeNull();
      expect(q.answer_indices.length).toBeGreaterThan(0);
      const contigus = q.answer_indices.every(
        (index, rang) => rang === 0 || index === q.answer_indices[rang - 1] + 1,
      );
      expect({ display: q.display, contigus }).toMatchObject({
        contigus: true,
      });
    }
  });

  it('trouve le sujet même quand il est derrière le verbe', () => {
    const phrase = CORPUS.find((p) => p.key === 'sous-la-table-dort-le-chat')!;
    const q = generateQuestion(
      'trouver_fonction',
      [phrase],
      ['sujet'],
      4,
      randReel,
    )!;
    expect(texteDe(phrase)).toBe('Sous la table dort le chat.');
    expect(q.answer).toBe('le chat');
    expect(q.display).toBe('Touche le sujet du verbe.');
  });

  it('ne demande rien si aucune fonction n’est activée', () => {
    expect(
      generateQuestion('trouver_fonction', CORPUS, ['verbe'], 4, randReel),
    ).toBeNull();
  });
});

describe('generateQuestion : groupe_nominal', () => {
  it('vise un groupe contigu, et nomme son nom dans la consigne', () => {
    for (let n = 0; n < 80; n++) {
      const q = generateQuestion(
        'groupe_nominal',
        CORPUS,
        ['groupe_nominal'],
        4,
        randReel,
      )!;
      expect(q).not.toBeNull();
      expect(q.skill_key).toBe('groupe_nominal');
      expect(q.answer_indices.length).toBeGreaterThan(0);
      expect(q.display).toMatch(/^Touche le groupe nominal du nom « .+ »\.$/);
      // Le nom cité fait partie du groupe visé.
      const nom = /« (.+) »/.exec(q.display)![1];
      expect(q.answer_indices.map((index) => q.mots[index].mot)).toContain(nom);
    }
  });

  it("reste muet si la notion n'est pas activée", () => {
    expect(
      generateQuestion('groupe_nominal', CORPUS, SOCLE, 4, randReel),
    ).toBeNull();
  });
});

describe('generateQuestions', () => {
  it('sert le nombre demandé sans répéter la même question', () => {
    const questions = generateQuestions(
      10,
      ['nature_mot', 'trouver_mots'],
      'medium',
      TOUTES,
      randReel,
    );
    expect(questions).toHaveLength(10);
    const keys = questions.map((q) => q.item_key);
    expect(new Set(keys).size).toBe(10);
  });

  it('ne sert que des phrases du niveau autorisé', () => {
    const simples = new Set(
      CORPUS.filter((p) => p.difficulte === 'simple').map((p) => texteDe(p)),
    );
    const questions = generateQuestions(
      10,
      ['nature_mot'],
      'easy',
      TOUTES,
      randReel,
    );
    for (const q of questions) {
      const texte = q.mots
        .map(
          (mot, index) =>
            `${index === 0 || mot.colle ? '' : ' '}${mot.mot}${mot.apres}`,
        )
        .join('');
      expect(simples).toContain(texte);
    }
  });

  it('rend une liste vide quand rien n’est possible, sans boucler', () => {
    expect(
      generateQuestions(10, ['groupe_nominal'], 'easy', ['verbe'], randReel),
    ).toEqual([]);
  });
});

describe('notionsRequises', () => {
  it('nomme ce qu’il faudrait activer pour chaque type', () => {
    expect(notionsRequises(['groupe_nominal'])).toEqual(['groupe_nominal']);
    expect(notionsRequises(['trouver_fonction']).sort()).toEqual([
      'complement',
      'sujet',
    ]);
  });
});

// ─── La porte des classes ───────────────────────────────────────────────────

describe('classes actives', () => {
  it('ne sert aucune phrase de grande classe tant qu’elle est fermée', () => {
    const grandes = CORPUS.filter(
      (p) => !DEFAULT_ACTIVE_CLASSES.includes(p.niveau),
    ).map((p) => texteDe(p));
    expect(grandes.length).toBeGreaterThan(0);

    for (let n = 0; n < 40; n++) {
      const questions = generateQuestions(
        10,
        ['nature_mot'],
        'hard',
        TOUTES,
        randReel,
      );
      for (const q of questions) {
        const texte = q.mots
          .map(
            (mot, i) =>
              `${i === 0 || mot.colle ? '' : ' '}${mot.mot}${mot.apres}`,
          )
          .join('');
        expect(grandes).not.toContain(texte);
      }
    }
  });

  it('sert les phrases de CM2 une fois la classe ouverte', () => {
    const attendues = CORPUS.filter((p) => p.niveau === 'cm2').map((p) =>
      texteDe(p),
    );
    const vues = new Set<string>();
    for (let n = 0; n < 40; n++) {
      for (const q of generateQuestions(
        10,
        ['nature_mot'],
        'hard',
        TOUTES,
        randReel,
        CORPUS,
        ['cp', 'ce1', 'ce2', 'cm1', 'cm2'],
      )) {
        vues.add(
          q.mots
            .map(
              (mot, i) =>
                `${i === 0 || mot.colle ? '' : ' '}${mot.mot}${mot.apres}`,
            )
            .join(''),
        );
      }
    }
    expect(attendues.some((t) => vues.has(t))).toBe(true);
  });

  it('interroge l’attribut du sujet quand la notion et la classe sont ouvertes', () => {
    const q = generateQuestion(
      'trouver_fonction',
      CORPUS.filter((p) => p.niveau === 'cm1'),
      ['attribut'],
      4,
      randReel,
    );
    expect(q).not.toBeNull();
    expect(q!.skill_key).toBe('attribut');
    expect(q!.answer_indices.length).toBeGreaterThan(0);
  });

  it('interroge le complément d’objet, distinct du circonstanciel', () => {
    const q = generateQuestion(
      'trouver_fonction',
      CORPUS.filter((p) => p.niveau === 'ce2'),
      ['complement_objet'],
      4,
      randReel,
    )!;
    expect(q.skill_key).toBe('complement_objet');
    expect(q.display).toContain("complément d'objet");
  });
});
