import { describe, expect, it } from 'vitest';
import { DICTEE_SETUP_OPTIONS } from 'src/modules/dictee/dictee.setup.ts';
import { buildInitialValues } from 'src/components/game/setup/setupOptions.ts';

/**
 * Le pré-jeu de la dictée : niveau, longueur, notion (chargée dynamiquement) et dictée
 * préparée. Les valeurs de `niveau` et `longueur` sont exactement celles que le backend
 * accepte (`StartDicteeSessionDto`) — un libellé qui diverge casse le démarrage de partie.
 */

const byKey = Object.fromEntries(
  DICTEE_SETUP_OPTIONS.map((option) => [option.key, option]),
);

describe('DICTEE_SETUP_OPTIONS', () => {
  it('déclare les quatre réglages attendus', () => {
    expect(Object.keys(byKey).sort()).toEqual([
      'longueur',
      'niveau',
      'notion',
      'preparee',
    ]);
  });

  it('propose les niveaux du backend', () => {
    expect(byKey.niveau.choices?.map((choice) => choice.value)).toEqual([
      'debutant',
      'normal',
      'difficile',
    ]);
  });

  it('propose les longueurs du backend', () => {
    expect(byKey.longueur.choices?.map((choice) => choice.value)).toEqual([
      'courte',
      'moyenne',
      'longue',
    ]);
  });

  it('charge les notions dynamiquement, avec un choix « toutes »', () => {
    expect(byKey.notion.loader).toBeTypeOf('function');
    expect(byKey.notion.choices).toBeUndefined();
  });

  it('laisse chaque réglage à renseigner (aucune valeur par défaut)', () => {
    const values = buildInitialValues(DICTEE_SETUP_OPTIONS);
    expect(values).toEqual({
      niveau: '',
      longueur: '',
      notion: '',
      preparee: '',
    });
  });
});
