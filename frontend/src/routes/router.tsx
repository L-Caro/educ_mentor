import { createBrowserRouter, type RouteObject } from 'react-router-dom';

// Layouts
import ChildLayout from 'src/components/layout/ChildLayout/ChildLayout';
import ModuleAdminLayout from 'src/components/layout/ModuleAdminLayout/ModuleAdminLayout';
import AdminLayout from 'src/views/admin/AdminLayout';

// Auth
import PinGate from 'src/components/auth/PinGate';
import InvitePage from 'src/views/invite/InvitePage';
import AdminAccessPage from 'src/views/invite/AdminAccessPage';

// Error
import ErrorPage from 'src/components/Error/pages/ErrorPage';

// Vues
import ChildHome from 'src/views/child/ChildHome';
import AdminDashboard from 'src/views/admin/AdminDashboard';
import ModuleCatalog from 'src/views/admin/ModuleCatalog';
import Settings from 'src/views/settings/Settings';

import ModulePreSetup from 'src/components/common/Game/ModulePreSetup';

// Source unique des modules
import { MODULES, type ModuleManifest } from 'src/modules.manifest';

export const MAIN_TITLE = 'Maëve';

/** Routes enfant d'un module : sélection (ou jeu direct), jeu, résultats. */
function buildChildRoutes(module: ModuleManifest): RouteObject[] {
  const Home = module.child.Home;
  const Game = module.child.Game;
  const Result = module.child.Result;
  const handle = { title: module.label };

  // Home dédié si déclaré, sinon écran de pré-jeu générique piloté par setupOptions.
  const homeElement = Home ? <Home /> : module.setupOptions ? <ModulePreSetup module={module} /> : <Game />;

  return [
    { path: `/module/${module.id}`, element: homeElement, handle },
    { path: `/module/${module.id}/play`, element: <Game />, handle },
    { path: `/module/${module.id}/result`, element: <Result />, handle },
  ];
}

/** Route admin d'un module : layout à onglets + sous-routes déclarées dans le manifest. */
function buildAdminRoute(module: ModuleManifest): RouteObject {
  return {
    path: module.id,
    element: <ModuleAdminLayout title={module.label} tabs={module.adminTabs} />,
    children: module.adminRoutes,
  };
}

const Router = createBrowserRouter([
  // ── Vue enfant (ChildLayout : header contextuel + Outlet) ─────────────────
  {
    element: <ChildLayout />,
    errorElement: <ErrorPage />,
    children: [
      { path: '/', element: <ChildHome />, handle: { title: MAIN_TITLE } },
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
    element: <PinGate><AdminLayout /></PinGate>,
    children: [
      { index: true, element: <AdminDashboard />, handle: { title: 'Tableau de bord admin' } },
      { path: 'modules', element: <ModuleCatalog /> },
      ...MODULES.map(buildAdminRoute),
    ],
  },
]);

export default Router;
