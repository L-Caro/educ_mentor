import { describe, expect, it } from 'vitest';
import { grammaireGameSpec } from 'src/modules/grammaire/grammaire.game';
import PhraseCliquable from 'src/modules/grammaire/PhraseCliquable';
import type { GrammaireQuestion } from 'src/modules/grammaire/grammaire.type';

/**
 * L'aiguillage du descripteur, et lui seul : `nature_mot` passe par le QCM du moteur, les
 * trois autres types par la sélection multiple sur la phrase (`spec.map` +
 * `isMultiSelect`). C'est ce qui permet de ne pas réécrire un moteur de jeu — le même
 * mécanisme sert déjà aux régions de `france`.
 *
 * Deux pannes silencieuses sont visées :
 *   — un `isMapQuestion` trop large enverrait `nature_mot` dans la zone de sélection, où
 *     l'enfant devrait toucher un mot au lieu de choisir sa nature. Rien ne planterait.
 *   — un `getComponent` qui renvoie une fonction créée à l'appel donne un type de
 *     composant neuf à chaque rendu, et React remonte la phrase entière à chaque clic.
 *     Le symptôme est purement visuel, cf. `map-components-stable.test.ts`.
 */

const MOTS = [
  { mot: 'Le', apres: '', colle: false },
  { mot: 'petit', apres: '', colle: false },
  { mot: 'chat', apres: '', colle: false },
  { mot: 'dort', apres: '.', colle: false },
];

const question = (over: Partial<GrammaireQuestion> = {}): GrammaireQuestion => ({
  item_key: 'k',
  type: 'trouver_mots',
  skill_key: 'nom_commun',
  display: 'Touche le nom commun.',
  mots: MOTS,
  cible: null,
  choices: [],
  answer: 'chat',
  answer_indices: [2],
  ...over,
});

const natureMot = question({
  type: 'nature_mot',
  skill_key: 'verbe',
  display: 'Quelle est la nature du mot souligné ?',
  cible: 3,
  choices: ['un verbe', 'un nom commun'],
  answer: 'un verbe',
  answer_indices: [3],
});

describe('aiguillage QCM / sélection', () => {
  it('envoie les trois types de sélection dans la zone touchable', () => {
    for (const type of [
      'trouver_mots',
      'trouver_fonction',
      'groupe_nominal',
    ] as const) {
      expect(grammaireGameSpec.map!.isMapQuestion(question({ type }))).toBe(true);
    }
  });

  it('laisse nature_mot au QCM du moteur', () => {
    expect(grammaireGameSpec.map!.isMapQuestion(natureMot)).toBe(false);
    expect(grammaireGameSpec.qcm!.getChoices(natureMot)).toEqual([
      { key: 'un verbe', label: 'un verbe' },
      { key: 'un nom commun', label: 'un nom commun' },
    ]);
    expect(grammaireGameSpec.qcm!.correctKey!(natureMot)).toBe('un verbe');
  });

  it('est toujours en sélection multiple : un sujet fait plusieurs mots', () => {
    expect(grammaireGameSpec.map!.isMultiSelect(question())).toBe(true);
  });
});

describe('composant de phrase', () => {
  it('renvoie une référence stable, sans fermeture par question', () => {
    const composants = new Set(
      [question(), question({ type: 'groupe_nominal' })].map((q) =>
        grammaireGameSpec.map!.getComponent(q),
      ),
    );
    expect(composants).toEqual(new Set([PhraseCliquable]));
  });

  it('fait passer la phrase par les props, pas par une fermeture', () => {
    expect(grammaireGameSpec.map!.getComponentProps!(question())).toEqual({
      mots: MOTS,
    });
  });
});

describe('bonne réponse', () => {
  it('exprime les mots attendus en clés de chaîne, comme le veut le moteur', () => {
    const q = question({ answer_indices: [0, 1, 2] });
    expect(grammaireGameSpec.map!.correctKeys(q)).toEqual(['0', '1', '2']);
  });

  it("compte juste un mot attendu, faux un mot en trop", () => {
    const q = question({ answer_indices: [2] });
    expect(grammaireGameSpec.map!.isCorrect(q, '2')).toBe(true);
    expect(grammaireGameSpec.map!.isCorrect(q, '1')).toBe(false);
  });
});

describe('liste d’erreurs de fin de partie', () => {
  it('affiche les mots touchés, pas leurs index', () => {
    const q = question({ answer_indices: [0, 1, 2] });
    const entry = grammaireGameSpec.buildResultEntry(q, ['1', '0'], false, false);
    // Remis dans l'ordre de la phrase, quel que soit l'ordre des clics.
    expect(entry.given).toBe('Le petit');
  });

  it('ne recolle pas un mot élidé avec une espace', () => {
    const q = question({
      mots: [
        { mot: 'L’', apres: '', colle: false },
        { mot: 'oiseau', apres: '', colle: true },
        { mot: 'chante', apres: '.', colle: false },
      ],
      answer_indices: [0, 1],
    });
    expect(grammaireGameSpec.buildResultEntry(q, ['0', '1'], true, false).given).toBe(
      'L’oiseau',
    );
  });

  it('rend null quand rien n’a été touché — pas un tableau vide affiché brut', () => {
    expect(
      grammaireGameSpec.buildResultEntry(question(), [], false, true).given,
    ).toBeNull();
  });

  it('laisse la nature telle quelle pour un QCM', () => {
    expect(
      grammaireGameSpec.buildResultEntry(natureMot, 'un nom commun', false, false)
        .given,
    ).toBe('un nom commun');
  });
});

describe('correction affichée', () => {
  it('montre la phrase marquée pour une sélection, le libellé pour un QCM', () => {
    expect(typeof grammaireGameSpec.correctionLabel(question())).toBe('object');
    expect(grammaireGameSpec.correctionLabel(natureMot)).toBe('un verbe');
  });
});
