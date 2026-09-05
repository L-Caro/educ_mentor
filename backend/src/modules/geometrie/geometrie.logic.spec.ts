import { generateQuestion, generateQuestions } from './geometrie.logic';
import { SHAPES, getShape } from './geometrie.shapes';

/**
 * La génération des questions de géométrie se joue entièrement ici, sans base ni NestJS :
 * quelle forme est interrogée, quelle propriété, et quels distracteurs. Une paire
 * « propriétés » qui ne se départage pas réellement (les deux ont un angle droit) rendrait
 * la question sans réponse juste possible ; un décompte de côtés qui propose un nombre
 * négatif se verrait immédiatement à l'écran.
 */

/** Générateur déterministe : les tests ne doivent pas dépendre du hasard. */
function randSeq(valeurs: number[]) {
  let i = 0;
  return (min: number, max: number) => {
    const v = valeurs[i++ % valeurs.length];
    return Math.min(max, Math.max(min, v));
  };
}
const randReel = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const shape = (key: string) => getShape(key);
const CE1_ACTIVE = [
  'triangle',
  'triangleRectangle',
  'carre',
  'rectangle',
  'cercle',
  'cube',
  'pave',
  'pyramide',
  'cone',
].map(shape);

describe('generateQuestion : nom_figure / nom_solide', () => {
  it('interroge une forme active et propose son nom parmi les choix', () => {
    for (let n = 0; n < 40; n++) {
      const q = generateQuestion('nom_figure', CE1_ACTIVE, 4, randReel)!;
      expect(q).not.toBeNull();
      expect(q.choices).toContain(q.answer);
      expect(new Set(q.choices).size).toBe(q.choices.length); // pas de doublon
    }
  });

  it("ne propose jamais un solide comme réponse à 'quelle est cette figure ?'", () => {
    for (let n = 0; n < 40; n++) {
      const q = generateQuestion('nom_figure', CE1_ACTIVE, 4, randReel)!;
      expect(getShape(q.shape).type).toBe('plane');
    }
  });

  it("nom_solide n'interroge que des solides", () => {
    for (let n = 0; n < 40; n++) {
      const q = generateQuestion('nom_solide', CE1_ACTIVE, 4, randReel)!;
      expect(getShape(q.shape).type).toBe('solide');
    }
  });

  it("renvoie null si aucune forme du type demandé n'est active", () => {
    const solidesSeuls = CE1_ACTIVE.filter((s) => s.type === 'solide');
    expect(
      generateQuestion('nom_figure', solidesSeuls, 4, randReel),
    ).toBeNull();
  });

  it('en saisie libre (0 choix), ne construit aucun distracteur', () => {
    const q = generateQuestion('nom_figure', CE1_ACTIVE, 0, randReel)!;
    expect(q.choices).toEqual([]);
    expect(q.answer).toBe(getShape(q.shape).nom);
  });
});

describe('generateQuestion : cotes_sommets', () => {
  it('interroge côtés ou sommets pour une figure plane, jamais un nombre négatif', () => {
    for (let n = 0; n < 60; n++) {
      const q = generateQuestion('cotes_sommets', CE1_ACTIVE, 4, randReel)!;
      const count = Number(q.answer);
      expect(count).toBeGreaterThanOrEqual(0);
      for (const choice of q.choices)
        expect(Number(choice)).toBeGreaterThanOrEqual(0);
    }
  });

  it('le cercle (0 côté, 0 sommet) reste une question valide', () => {
    // Force le tirage sur 'cotes_sommets' puis le cercle (seul actif ici).
    const q = generateQuestion(
      'cotes_sommets',
      [shape('cercle')],
      4,
      randReel,
    )!;
    expect(q.answer).toBe('0');
    expect(q.choices).toContain('0');
  });
});

describe('generateQuestion : angle_droit', () => {
  it('exclut le cercle (angle droit non pertinent)', () => {
    for (let n = 0; n < 40; n++) {
      const q = generateQuestion('angle_droit', CE1_ACTIVE, 2, randReel)!;
      expect(q.shape).not.toBe('cercle');
    }
  });

  it('répond Oui pour le carré, Non pour le triangle (rendu) quelconque', () => {
    const carre = generateQuestion(
      'angle_droit',
      [shape('carre')],
      2,
      randReel,
    )!;
    expect(carre.answer).toBe('Oui');
    const triangle = generateQuestion(
      'angle_droit',
      [shape('triangle')],
      2,
      randReel,
    )!;
    expect(triangle.answer).toBe('Non');
  });

  it('propose toujours exactement Oui/Non, quelle que soit la difficulté', () => {
    const q = generateQuestion('angle_droit', [shape('carre')], 6, randReel)!;
    expect(q.choices.sort()).toEqual(['Non', 'Oui']);
  });
});

describe('generateQuestion : proprietes', () => {
  it('carré vs losange se départagent sur l’angle droit', () => {
    const pool = [shape('carre'), shape('losange')];
    const q = generateQuestion('proprietes', pool, 2, randReel);
    expect(q).not.toBeNull();
    expect(q!.answer).toBe('carré');
    expect(q!.choices.sort()).toEqual(['carré', 'losange'].sort());
  });

  it('deux formes non ambiguës (mêmes propriétés) ne produisent pas de question', () => {
    // carré vs carré équilatéral… n'existe pas ; on prend deux triangles identiques en propriétés :
    // triangle quelconque et triangle isocèle ont exactement les mêmes booléens ici.
    const pool = [shape('triangle'), shape('triangleIsocele')];
    expect(generateQuestion('proprietes', pool, 2, randReel)).toBeNull();
  });

  it('renvoie null avec une seule forme active', () => {
    expect(
      generateQuestion('proprietes', [shape('carre')], 2, randReel),
    ).toBeNull();
  });

  it('la clé de compétence identifie la paire, triée pour être stable', () => {
    const q = generateQuestion(
      'proprietes',
      [shape('rectangle'), shape('carre')],
      2,
      randReel,
    )!;
    expect(q.skill_key).toBe('carre_rectangle');
  });
});

describe('generateQuestions', () => {
  it('compose une séance sans jamais répéter la même question', () => {
    const rand = randSeq([0, 1, 2, 3, 1, 0, 2]);
    const questions = generateQuestions(
      15,
      ['nom_figure', 'cotes_sommets'],
      CE1_ACTIVE,
      4,
      rand,
    );
    const keys = questions.map((q) => q.item_key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("renvoie un tableau vide plutôt que de boucler à l'infini si aucun type n'est jouable", () => {
    const questions = generateQuestions(
      10,
      ['proprietes'],
      [shape('carre')],
      4,
      randReel,
    );
    expect(questions).toEqual([]);
  });

  it('sait mélanger plusieurs types dans une même séance', () => {
    const types = ['nom_figure', 'nom_solide', 'angle_droit'] as const;
    const questions = generateQuestions(
      30,
      [...types],
      CE1_ACTIVE,
      4,
      randReel,
    );
    const typesVus = new Set(questions.map((q) => q.type));
    expect(typesVus.size).toBeGreaterThan(1);
  });
});

describe('cohérence des données SHAPES utilisées ici', () => {
  it('chaque forme active du test existe bien dans le catalogue', () => {
    for (const key of ['triangle', 'carre', 'losange', 'cercle', 'cube']) {
      expect(SHAPES.some((s) => s.key === key)).toBe(true);
    }
  });
});
