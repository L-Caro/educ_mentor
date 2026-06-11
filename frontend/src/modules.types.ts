import type { ComponentType } from 'react';
import type { RouteObject } from 'react-router-dom';
import type { Tab } from 'src/components/common/TabNav';
import type { SetupOption } from 'src/components/game/GamePreSetup';
import type { GameModuleSpec } from 'src/components/game/GameEngine';

/** Forme normalisée d'une ligne de progression, telle que consommée par le tableau de bord. */
export interface ProgressionStat {
  is_mastered: boolean;
  correct_count: number;
  incorrect_count: number;
}

export interface ModuleManifest {
  id: string;            // = AppModule.id (backend) et segment d'URL ; label/icon = catalogue backend (useModuleMeta)
  setupOptions?: SetupOption[];   // options de pré-jeu déclaratives (rendues par <ModulePreSetup>)
  // Import dynamique de la spec de jeu (code-splitting) : la spec n'est chargée qu'à l'entrée en jeu,
  // pas dans le bundle initial. Registre hétérogène → `any` assumé (spec typée dans `<id>.game.tsx`).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  loadGameSpec?: () => Promise<GameModuleSpec<any, any>>;
  child: {
    Home?: ComponentType;   // page de sélection optionnelle (sinon <ModulePreSetup> générique)
    Game?: ComponentType;   // composant de jeu dédié (sinon gameSpec via <GameEngine>)
    Result?: ComponentType; // écran de résultats dédié (sinon <GameResultView> générique)
  };
  adminTabs: Tab[];
  adminRoutes: RouteObject[];
  progression?: {
    getStats: () => Promise<ProgressionStat[]>;
    reset: () => Promise<void>;
  };
}
