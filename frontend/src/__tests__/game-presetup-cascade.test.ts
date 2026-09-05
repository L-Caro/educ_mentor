import { describe, expect, it } from 'vitest';
import {
  applySingleSelection,
  buildInitialValues,
  visibleChoices,
} from 'src/components/game/setup/setupOptions.ts';
import type { SetupOption } from 'src/types/game.types.ts';

/**
 * Pré-jeu imagier : menu « thème » (single) puis menu « sous-catégorie » (multi) qui ne
 * montre que les sous-catégories du thème choisi. Le contrat vit dans trois fonctions
 * pures de GamePreSetup ; changer le thème doit vider la sélection de sous-catégories,
 * sinon on lancerait une partie avec des sous-catégories d'un autre thème.
 */

const OPTIONS: SetupOption[] = [
  { key: 'category', type: 'single', label: 'Thème', choices: [
    { value: 'animaux', label: 'Animaux' },
    { value: 'nourriture', label: 'Nourriture' },
  ] },
  { key: 'subcategories', type: 'multi', label: 'Précise', dependsOn: 'category', choices: [
    { value: 'animaux-de-la-ferme', label: 'Ferme', parent: 'animaux' },
    { value: 'insectes', label: 'Insectes', parent: 'animaux' },
    { value: 'fruits', label: 'Fruits', parent: 'nourriture' },
  ] },
];

const subOption = OPTIONS[1];

describe('pré-jeu : cascade thème → sous-catégorie', () => {
  it('ne montre que les sous-catégories du thème sélectionné', () => {
    expect(visibleChoices(subOption, { category: 'animaux' }).map((c) => c.value)).toEqual([
      'animaux-de-la-ferme',
      'insectes',
    ]);
    expect(visibleChoices(subOption, { category: 'nourriture' }).map((c) => c.value)).toEqual(['fruits']);
  });

  it('ne montre rien tant qu\'aucun thème n\'est choisi', () => {
    expect(visibleChoices(subOption, {})).toEqual([]);
  });

  it('vide la sélection de sous-catégories quand le thème change', () => {
    const before = { category: 'animaux', subcategories: ['insectes'] };
    expect(applySingleSelection(OPTIONS, before, 'category', 'nourriture')).toEqual({
      category: 'nourriture',
      subcategories: [],
    });
  });

  it('initialise les sous-catégories à vide (= tout le thème)', () => {
    const values = buildInitialValues(OPTIONS);
    expect(values.category).toBe('');
    expect(values.subcategories).toEqual([]);
  });

  it('ne restaure un seed de sous-catégories que s\'il colle au thème mémorisé', () => {
    const coherent = buildInitialValues(OPTIONS, { category: 'animaux', subcategories: ['insectes'] });
    expect(coherent.subcategories).toEqual(['insectes']);

    const stale = buildInitialValues(OPTIONS, { category: 'nourriture', subcategories: ['insectes'] });
    expect(stale.subcategories).toEqual([]);
  });
});
