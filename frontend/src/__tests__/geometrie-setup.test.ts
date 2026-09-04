import { describe, expect, it } from 'vitest';
import { GEOMETRIE_SETUP_OPTIONS } from 'src/modules/geometrie/geometrie.setup.ts';
import { buildInitialValues } from 'src/components/game/setup/setupOptions.ts';

/**
 * Le pré-jeu de géométrie : un seul réglage (`questionTypes`), les cinq types du backend.
 * `difficulty` n'est PAS déclarée ici : c'est l'option commune injectée par
 * `ModulePreSetup`, elle pilote le nombre de choix du QCM.
 */

describe('GEOMETRIE_SETUP_OPTIONS', () => {
  it('ne déclare que questionTypes (difficulty reste la commune)', () => {
    expect(GEOMETRIE_SETUP_OPTIONS.map((option) => option.key)).toEqual(['questionTypes']);
  });

  it('propose les cinq types de questions du backend', () => {
    const option = GEOMETRIE_SETUP_OPTIONS[0];
    expect(option.choices?.map((choice) => choice.value).sort()).toEqual(
      [
        'angle_droit',
        'cotes_sommets',
        'nom_figure',
        'nom_solide',
        'proprietes',
      ].sort(),
    );
  });

  it('tous les types sont sélectionnés par défaut (opt-out, pas opt-in)', () => {
    const values = buildInitialValues(GEOMETRIE_SETUP_OPTIONS);
    const option = GEOMETRIE_SETUP_OPTIONS[0];
    expect((values.questionTypes as string[]).sort()).toEqual(
      (option.choices ?? []).map((choice) => choice.value).sort(),
    );
  });
});
