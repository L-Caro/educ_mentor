import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from 'src/hooks';
import { setModuleSetup, selectModuleSetup } from 'src/store/slice/gameSetupSlice.ts';
import GamePreSetup from 'src/components/game/setup/GamePreSetup.tsx';
import type { SetupOption, SetupValues } from 'src/types/game.types.ts';
import GameStateView from 'src/components/game/engine/GameStateView.tsx';
import type { ModuleManifest } from 'src/modules.manifest.tsx';

/**
 * Difficulté : option de pré-jeu commune à TOUS les modules (easy/medium/hard →
 * QCM 2 / QCM 4 / saisie libre côté backend). Injectée ici pour qu'aucun module ne l'oublie.
 */
const DIFFICULTY_OPTION: SetupOption = {
  key: 'difficulty',
  type: 'single',
  label: 'Quel niveau ?',
  choices: [
    { value: 'easy', icon: '🟢', label: 'Facile', description: '2 choix' },
    { value: 'medium', icon: '🟡', label: 'Moyen', description: '4 choix' },
    { value: 'hard', icon: '🔴', label: 'Difficile', description: 'Saisie libre' },
  ],
};

/**
 * Écran de pré-jeu générique, piloté par le manifest : résout les `loader` des options
 * (choix dynamiques, via le cache RTK Query), rend `GamePreSetup`, mémorise la sélection
 * dans `gameSetup` et lance la partie. Remplace les composants Home par module.
 */
export default function ModulePreSetup({ module }: { module: ModuleManifest }) {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const lastSetup = useAppSelector(selectModuleSetup(module.id));

  const options = module.setupOptions ?? [];
  const hasLoaders = options.some((option) => option.loader);
  const [resolved, setResolved] = useState<SetupOption[] | null>(hasLoaders ? null : options);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!hasLoaders) return;
    let isMounted = true;
    Promise.all(
      options.map(async (option) =>
        option.loader ? { ...option, choices: await option.loader() } : option,
      ),
    )
      .then((resolvedOptions) => { if (isMounted) setResolved(resolvedOptions); })
      .catch(() => { if (isMounted) setFailed(true); });
    return () => { isMounted = false; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleStart(values: SetupValues) {
    dispatch(setModuleSetup({ moduleId: module.id, setup: values }));
    navigate(`/module/${module.id}/play`);
  }

  if (failed) {
    return <GameStateView errorMessage="Impossible de charger les options." onBack={() => navigate('/')} />;
  }
  if (!resolved) {
    return <GameStateView loading onBack={() => navigate('/')} />;
  }

  // Ne pas injecter l'option commune si le module déclare déjà sa propre clé 'difficulty'.
  const hasDifficultyOption = options.some((option) => option.key === 'difficulty');
  const allOptions = hasDifficultyOption ? resolved : [DIFFICULTY_OPTION, ...resolved];

  return <GamePreSetup options={allOptions} initialValues={lastSetup} onStart={handleStart} />;
}
