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
import Settings from 'src/components/admin/settings/Settings';

import ModulePreSetup from 'src/components/game/ModulePreSetup';
import LazyGame from 'src/components/game/LazyGame';
import Peage from 'src/components/game/Peage';
import GameResultView from 'src/components/game/result/GameResultView.tsx';

// Source unique des modules
import { MODULES, type ModuleManifest } from 'src/modules.manifest';

export const MAIN_TITLE = 'Maëve';

const TITRE_COURS = { title: 'Fiches de cours' };

const coursRoutes: RouteObject[] = [
  {
    path: '/cours',
    handle: TITRE_COURS,
    lazy: async () => ({ Component: (await import('src/cours/pages/CoursHomePage')).default }),
  },
  ...['/cours/:matiere/:notion', '/cours/:matiere/:notion/:concept'].map((path) => ({
    path,
    handle: TITRE_COURS,
    lazy: async () => ({ Component: (await import('src/cours/pages/NotionPage')).default }),
  })),
];

/** Routes enfant d'un module : sélection (ou jeu direct), jeu, résultats. */
function buildChildRoutes(module: ModuleManifest): RouteObject[] {
  const Game = module.child?.Game;
  const handle = { moduleId: module.id };

  // Jeu : spec chargée en lazy via <LazyGame> (code-splitting), sinon composant game dédié.
  const playElement = module.loadGameSpec
    ? <LazyGame load={module.loadGameSpec} moduleId={module.id} />
    : Game
      ? <Game />
      : null;

  // Péage : quelques questions d'un autre module avant d'ouvrir un plateau, si l'adulte
  // l'a réglé. Il n'enveloppe QUE les jeux, et il laisse passer par défaut : le composant
  // décide, pas la route, parce que le réglage se lit à l'exécution.
  const jouable =
    module.category === 'jeux' && playElement ? (
      <Peage moduleId={module.id}>{playElement}</Peage>
    ) : (
      playElement
    );

  // Pré-jeu : écran générique piloté par setupOptions, ou direct vers le jeu si aucune option.
  const homeElement = module.setupOptions
    ? <ModulePreSetup module={module} />
    : jouable;

  // Résultats : tous les modules avec un jeu (spec ou composant dédié) passent par GameResultView.
  const resultElement = (module.loadGameSpec || Game)
    ? <GameResultView moduleId={module.id} />
    : null;

  return [
    { path: `/module/${module.id}`, element: homeElement, handle },
    { path: `/module/${module.id}/play`, element: jouable, handle },
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

      // ── Bibliothèque de cours ────────────────────────────────────────────
      // Le concept est dans l'URL : une fiche précise se met en signet.
      // Chargée en `lazy` : la bibliothèque embarque ses illustrations (donc des morceaux
      // des modules pose et tables) et grossira à mesure qu'on écrit. Elle n'a rien à
      // faire dans le bundle d'ouverture, que l'enfant paie à chaque visite.
      ...coursRoutes,
    ],
  },

  // ── Routes publiques, sans layout, sans AccessGate ──────────────────────
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
      ...MODULES.map(buildAdminRoute),
    ],
  },
]);

export default Router;
