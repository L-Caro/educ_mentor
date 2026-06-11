import type { ComponentType } from 'react';
import type { RouteObject } from 'react-router-dom';
import type { Tab } from 'src/components/common/TabNav';
import type { SetupOption } from 'src/components/common/Game/GamePreSetup';
import type { GameModuleSpec } from 'src/components/common/Game/GameEngine';

/** Forme normalisée d'une ligne de progression, telle que consommée par le tableau de bord. */
export interface ProgressionStat {
  is_mastered: boolean;
  correct_count: number;
  incorrect_count: number;
}

export interface ModuleManifest {
  id: string;            // = AppModule.id (backend) et segment d'URL
  label: string;         // titre affiché (header enfant + admin) — single-source backend reporté à EM-5.3
  icon: string;
  setupOptions?: SetupOption[];   // options de pré-jeu déclaratives (rendues par <ModulePreSetup>)
  // Spec de jeu déclarative (rendue par <GameEngine>). Registre hétérogène de specs → `any`
  // assumé/documenté : chaque spec est typée concrètement dans son fichier `<id>.game.tsx`.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  gameSpec?: GameModuleSpec<any, any>;
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
