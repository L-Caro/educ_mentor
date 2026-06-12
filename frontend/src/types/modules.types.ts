import type { ComponentType } from 'react';
import type { RouteObject } from 'react-router-dom';
import type { Tab } from 'src/components/common/TabNav.tsx';
import type { SetupOption, GameModuleSpec } from 'src/types/game.types.ts';

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
  /** Composants de rendu dédiés. Tous les champs sont optionnels ; `child` lui-même peut
   * être omis pour les modules entièrement pilotés par `loadGameSpec`.
   * `Game` est la porte de sortie pour les modules hors-moule (ex : Snake) : déclarer un
   * composant ici court-circuite <LazyGame> + <GameEngine> — c'est un composant de route libre. */
  child?: {
    Home?: ComponentType;
    Game?: ComponentType;
    Result?: ComponentType;
  };
  adminTabs: Tab[];
  adminRoutes: RouteObject[];
  progression?: {
    getStats: () => Promise<ProgressionStat[]>;
    reset: () => Promise<void>;
  };
}
