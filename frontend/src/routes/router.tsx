import { createBrowserRouter, type RouteObject } from 'react-router-dom';

// Layouts
import HomePage from 'src/pages/HomePage.tsx';
import AdminLayout from 'src/components/layout/AdminLayout.tsx';
import AdminPage from 'src/pages/AdminPage.tsx';

// Auth
import PinGate from 'src/components/auth/PinGate';
import InvitePage from 'src/pages/invite/InvitePage';
import AdminAccessPage from 'src/pages/invite/AdminAccessPage';

// Error
import ErrorRouter from 'src/components/error/ErrorRouter';

// Vues
import HomeLayout from 'src/components/layout/HomeLayout.tsx';
import AdminDashboard from 'src/components/admin/AdminDashboard';
import ModuleCatalog from 'src/components/admin/ModuleCatalog';
import Settings from 'src/components/admin/settings/Settings';

import ModulePreSetup from 'src/components/game/ModulePreSetup';
import LazyGame from 'src/components/game/LazyGame';
import GameResultView from 'src/components/game/GameResultView';

// Source unique des modules
import { MODULES, type ModuleManifest } from 'src/modules.manifest';

export const MAIN_TITLE = 'Maëve';

/** Routes enfant d'un module : sélection (ou jeu direct), jeu, résultats. */
function buildChildRoutes(module: ModuleManifest): RouteObject[] {
  const Home = module.child?.Home;
  const Game = module.child?.Game;
  const Result = module.child?.Result;
  const handle = { moduleId: module.id };

  // Jeu : spec chargée en lazy via <LazyGame> (code-splitting), sinon composant game dédié.
  const playElement = module.loadGameSpec
    ? <LazyGame load={module.loadGameSpec} moduleId={module.id} />
    : Game
      ? <Game />
      : null;

  // Pré-jeu : Home dédié si déclaré, sinon écran générique piloté par setupOptions.
  const homeElement = Home
    ? <Home />
    : module.setupOptions
      ? <ModulePreSetup module={module} />
      : playElement;

  // Résultats : composant dédié si déclaré, sinon écran générique piloté par la spec.
  const resultElement = Result
    ? <Result />
    : module.loadGameSpec
      ? <GameResultView moduleId={module.id} />
      : null;

  return [
    { path: `/module/${module.id}`, element: homeElement, handle },
    { path: `/module/${module.id}/play`, element: playElement, handle },
    { path: `/module/${module.id}/result`, element: resultElement, handle },
  ];
}

/** Route admin d'un module : layout à onglets + sous-routes déclarées dans le manifest. */
function buildAdminRoute(module: ModuleManifest): RouteObject {
  return {
    path: module.id,
    element: <AdminLayout moduleId={module.id} tabs={module.adminTabs} />,
    children: module.adminRoutes,
  };
}

const Router = createBrowserRouter([
  // ── Vue enfant (HomePage : header contextuel + Outlet) ─────────────────
  {
    element: <HomePage />,
    errorElement: <ErrorRouter />,
    children: [
      { path: '/', element: <HomeLayout />, handle: { title: MAIN_TITLE } },
      ...MODULES.flatMap(buildChildRoutes),
    ],
  },

  // ── Routes publiques — sans layout, sans AccessGate ──────────────────────
  { path: '/invite/:token', element: <InvitePage /> },
  { path: '/admin-access', element: <AdminAccessPage /> },

  // ── Settings (protégé PIN) ─────────────────────────────────────────────────
  {
    path: '/settings',
    element: <PinGate><Settings /></PinGate>,
    handle: { title: 'Paramètres' },
  },

  // ── Admin (protégé PIN, layout sidebar) ───────────────────────────────────
  {
    path: '/admin',
    element: <PinGate><AdminPage /></PinGate>,
    children: [
      { index: true, element: <AdminDashboard />, handle: { title: 'Tableau de bord admin' } },
      { path: 'modules', element: <ModuleCatalog /> },
      ...MODULES.map(buildAdminRoute),
    ],
  },
]);

export default Router;
