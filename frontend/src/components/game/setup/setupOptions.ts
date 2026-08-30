import type { SetupChoice, SetupOption, SetupValues } from 'src/types/game.types.ts';

/** Choix visibles d'une option : filtrés par parent pour une option dépendante, tels quels sinon. */
export function visibleChoices(option: SetupOption, values: SetupValues): SetupChoice[] {
  const choices = option.choices ?? [];
  if (option.type === 'multi' && option.dependsOn) {
    const parentKey = option.dependsOn;
    return choices.filter((choice) => choice.parent === values[parentKey]);
  }
  return choices;
}

/** Sélectionne une valeur `single` et vide les options qui dépendaient de l'ancienne. */
export function applySingleSelection(
  options: SetupOption[],
  values: SetupValues,
  key: string,
  value: string,
): SetupValues {
  const next: SetupValues = { ...values, [key]: value };
  for (const option of options) {
    if (option.type === 'multi' && option.dependsOn === key) next[option.key] = [];
  }
  return next;
}

/** Valeurs initiales : `single` vide (ou seed), `multi` tout sélectionné (opt-out),
 * `multi` dépendante vide (= tout le parent) sauf seed cohérent avec le parent mémorisé. */
export function buildInitialValues(options: SetupOption[], initial?: SetupValues): SetupValues {
  const values: SetupValues = {};
  for (const option of options) {
    const seed = initial?.[option.key];
    if (option.type === 'single') {
      values[option.key] = typeof seed === 'string' ? seed : '';
    } else if (option.dependsOn) {
      const parentSeed = initial?.[option.dependsOn];
      const valid = new Set(
        (option.choices ?? [])
          .filter((choice) => choice.parent === parentSeed)
          .map((choice) => choice.value),
      );
      values[option.key] = Array.isArray(seed)
        ? (seed as string[]).filter((entry) => valid.has(entry))
        : [];
    } else {
      const available = (option.choices ?? []).map((choice) => choice.value);
      // Les types désactivés en admin ne sont plus dans `choices` : on filtre le seed.
      const filtered = Array.isArray(seed) ? (seed as string[]).filter((value) => available.includes(value)) : [];
      values[option.key] = filtered.length > 0 ? filtered : available;
    }
  }
  return values;
}
