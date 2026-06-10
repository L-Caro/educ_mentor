import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from 'src/hook';
import { setModuleSetup, selectModuleSetup } from 'src/store/slice/gameSetupSlice';
import GamePreSetup, { type SetupValues } from 'src/components/common/Game/GamePreSetup';
import type { ModuleManifest } from 'src/modules.manifest';

/**
 * Écran de pré-jeu générique, piloté par le manifest : rend les `setupOptions` du
 * module, mémorise la sélection dans `gameSetup` et lance la partie. Remplace les
 * composants Home par module.
 *
 * TODO(Imagier/Tables) : résoudre les `loader?()` des options à choix dynamiques
 * (avec état de chargement) — câblé avec le premier module dynamique.
 */
export default function ModulePreSetup({ module }: { module: ModuleManifest }) {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const lastSetup = useAppSelector(selectModuleSetup(module.id));

  function handleStart(values: SetupValues) {
    dispatch(setModuleSetup({ moduleId: module.id, setup: values }));
    navigate(`/module/${module.id}/play`);
  }

  return <GamePreSetup options={module.setupOptions ?? []} initialValues={lastSetup} onStart={handleStart} />;
}
