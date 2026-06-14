import { useState } from 'react';
import Button from 'src/components/common/Button.tsx';
import PageContainer from 'src/components/layout/PageContainer/PageContainer.tsx';
import type { SetupOption, SetupValues } from 'src/types/game.types.ts';

interface GamePreSetupProps {
  subtitle?: string;
  options: SetupOption[];
  initialValues?: SetupValues;
  onStart: (values: SetupValues) => void;
  startLabel?: string;
}

/**
 * Écran de pré-jeu générique, partagé par tous les modules. Rend les `setupOptions`
 * déclarées par le module, mémorise la sélection et lance la partie via `onStart`.
 * Le titre du module est déjà porté par le Header — on n'affiche ici que les options.
 */
export default function GamePreSetup({
  subtitle,
  options,
  initialValues,
  onStart,
  startLabel = 'Jouer',
}: GamePreSetupProps) {
  const [values, setValues] = useState<SetupValues>(() => buildInitialValues(options, initialValues));

  function selectSingle(key: string, value: string) {
    setValues((previous) => ({ ...previous, [key]: value }));
  }

  function toggleMulti(key: string, value: string) {
    setValues((previous) => {
      const current = (previous[key] as string[] | undefined) ?? [];
      const next = current.includes(value)
        ? current.filter((entry) => entry !== value)
        : [...current, value];
      return { ...previous, [key]: next };
    });
  }

  // Une option `single` doit être renseignée ; une `multi` vide = « tous » (interprété par le module).
  const ready = options.every(
    (option) => option.type !== 'single' || (typeof values[option.key] === 'string' && values[option.key] !== ''),
  );

  return (
    <PageContainer className="GamePreSetup">
      {subtitle && <p className="GamePreSetup__subtitle">{subtitle}</p>}

      <div className="GamePreSetup__groups">
        {options.map((option) => (
          <section key={option.key} className="GamePreSetup__group">
            <p className="GamePreSetup__groupLabel">{option.label}</p>
            <div className="GamePreSetup__choices">
              {(option.choices ?? []).map((choice) => {
                const isSelected =
                  option.type === 'single'
                    ? values[option.key] === choice.value
                    : ((values[option.key] as string[] | undefined) ?? []).includes(choice.value);
                return (
                  <button
                    key={choice.value}
                    type="button"
                    className={`GamePreSetup__choice${isSelected ? ' GamePreSetup__choice--selected' : ''}`}
                    onClick={() =>
                      option.type === 'single'
                        ? selectSingle(option.key, choice.value)
                        : toggleMulti(option.key, choice.value)
                    }
                    aria-pressed={isSelected}
                  >
                    {choice.icon && <span className="GamePreSetup__choiceIcon">{choice.icon}</span>}
                    <span className="GamePreSetup__choiceLabel">{choice.label}</span>
                    {choice.description && (
                      <span className="GamePreSetup__choiceDesc">{choice.description}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <Button
        className="GamePreSetup__start"
        title={startLabel}
        onClick={() => onStart(values)}
        disabled={!ready}
      />
    </PageContainer>
  );
}

function buildInitialValues(options: SetupOption[], initial?: SetupValues): SetupValues {
  const values: SetupValues = {};
  for (const option of options) {
    const seed = initial?.[option.key];
    if (option.type === 'single') {
      values[option.key] = typeof seed === 'string' ? seed : '';
    } else {
      values[option.key] = Array.isArray(seed) ? seed : [];
    }
  }
  return values;
}
