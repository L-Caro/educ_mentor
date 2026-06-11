import type { ComponentType } from 'react';
import type { RouteObject } from 'react-router-dom';
import type { Tab } from 'src/components/common/TabNav';
import type { SetupOption } from 'src/components/common/Game/GamePreSetup';
import type { GameModuleSpec } from 'src/components/common/Game/GameEngine';
import { IMAGIER_SETUP_OPTIONS } from 'src/components/modules/imagier/imagier.setup';
import { TABLES_SETUP_OPTIONS } from 'src/components/modules/tables/tables.setup';
import { tablesGameSpec } from 'src/components/modules/tables/tables.game';
import { imagierGameSpec } from 'src/components/modules/imagier/imagier.game';
import { calculGameSpec } from 'src/components/modules/calcul/calcul.game';
import { monnaieGameSpec } from 'src/components/modules/monnaie/monnaie.game';

// ─── Composants admin ─────────────────────────────────────────────────────────
import ImagierWordList from 'src/components/modules/imagier/admin/ImagierWordList';
import ImagierWordForm from 'src/components/modules/imagier/admin/ImagierWordForm';
import ImagierImageImport from 'src/components/modules/imagier/admin/ImagierImageImport';
import ImagierSettings from 'src/components/modules/imagier/admin/ImagierSettings';
import TablesSettings from 'src/components/modules/tables/admin/TablesSettings';
import CalculSettings from 'src/components/modules/calcul/admin/CalculSettings';
import MonnaieSettings from 'src/components/modules/monnaie/admin/MonnaieSettings';

// ─── Sources de progression (pour le tableau de bord) ─────────────────────────
import { getProgression as getImagierProgression, resetProgression as resetImagierProgression } from 'src/api/module/imagier.api.ts';
import { getCalculProgression, resetCalculProgression } from 'src/api/module/calcul.api.ts';
import { getTablesProgression, resetTablesProgression } from 'src/api/module/tables.api.ts';
import { getMonnaieProgression, resetMonnaieProgression } from 'src/api/module/monnaie.api.ts';

/** Forme normalisée d'une ligne de progression, telle que consommée par le tableau de bord. */
export interface ProgressionStat {
  is_mastered: boolean;
  correct_count: number;
  incorrect_count: number;
}

export interface ModuleManifest {
  id: string;            // = AppModule.id (backend) et segment d'URL
  label: string;         // titre affiché (header enfant + admin)
  icon: string;
  setupOptions?: SetupOption[];   // options de pré-jeu déclaratives (rendues par <ModulePreSetup>)
  // Spec de jeu déclarative (remplace child.Game, rendue par <GameEngine>). Registre hétérogène de
  // specs → `any` assumé/documenté : chaque spec est typée concrètement dans son fichier `<id>.game.tsx`.
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

const MONNAIE_SETUP_OPTIONS: SetupOption[] = [
  {
    key: 'exerciseType',
    type: 'single',
    label: 'Quel exercice veux-tu faire ?',
    choices: [
      { value: 'reconnaitre', icon: '👀', label: 'Reconnaître', description: 'Compte les pièces et les billets' },
      { value: 'total', icon: '🛒', label: "Total d'achat", description: 'Calcule le prix de tous les articles' },
      { value: 'rendre', icon: '💸', label: 'Rendre la monnaie', description: "Calcule ce qu'on te rend" },
    ],
  },
];

const CALCUL_SETUP_OPTIONS: SetupOption[] = [
  {
    key: 'operationTypes',
    type: 'multi',
    label: 'Quoi travailler ?',
    choices: [
      { value: 'complement', label: 'Compléments', description: '3 + ? = 10' },
      { value: 'addition', label: 'Additions', description: '3 + 4 = ?' },
      { value: 'soustraction', label: 'Soustractions', description: '10 − 3 = ?' },
      { value: 'double', label: 'Doubles', description: 'Double de 6 = ?' },
      { value: 'moitie', label: 'Moitiés', description: 'Moitié de 12 = ?' },
    ],
  },
];

export const MODULES: ModuleManifest[] = [
  {
    id: 'imagier',
    label: 'Imagier Anglais',
    icon: '🇬🇧',
    setupOptions: IMAGIER_SETUP_OPTIONS,
    gameSpec: imagierGameSpec,
    child: {},
    adminTabs: [
      { to: '/admin/imagier', label: 'Mots', end: true },
      { to: '/admin/imagier/images', label: 'Images' },
      { to: '/admin/imagier/settings', label: 'Paramètres' },
    ],
    adminRoutes: [
      { index: true, element: <ImagierWordList /> },
      { path: 'images', element: <ImagierImageImport /> },
      { path: 'settings', element: <ImagierSettings /> },
      { path: 'mots/:id', element: <ImagierWordForm /> },
    ],
    progression: {
      getStats: async () =>
        (await getImagierProgression())
          .filter((word) => word.progression !== null)
          .map((word) => word.progression!),
      reset: resetImagierProgression,
    },
  },
  {
    id: 'tables',
    label: 'Tables de multiplication',
    icon: '✖️',
    setupOptions: TABLES_SETUP_OPTIONS,
    gameSpec: tablesGameSpec,
    child: {},
    adminTabs: [{ to: '/admin/tables', label: 'Paramètres', end: true }],
    adminRoutes: [{ index: true, element: <TablesSettings /> }],
    progression: { getStats: getTablesProgression, reset: resetTablesProgression },
  },
  {
    id: 'calcul-mental',
    label: 'Calcul Mental',
    icon: '🧮',
    setupOptions: CALCUL_SETUP_OPTIONS,
    gameSpec: calculGameSpec,
    child: {},
    adminTabs: [{ to: '/admin/calcul-mental', label: 'Paramètres', end: true }],
    adminRoutes: [{ index: true, element: <CalculSettings /> }],
    progression: { getStats: getCalculProgression, reset: resetCalculProgression },
  },
  {
    id: 'monnaie',
    label: 'Monnaie',
    icon: '💶',
    setupOptions: MONNAIE_SETUP_OPTIONS,
    gameSpec: monnaieGameSpec,
    child: {},
    adminTabs: [{ to: '/admin/monnaie', label: 'Paramètres', end: true }],
    adminRoutes: [{ index: true, element: <MonnaieSettings /> }],
    progression: { getStats: getMonnaieProgression, reset: resetMonnaieProgression },
  },
];
