import { createBrowserRouter } from 'react-router-dom';

// Layouts
import ChildLayout from 'src/components/layout/ChildLayout/ChildLayout';
import ModuleAdminLayout from 'src/components/layout/ModuleAdminLayout/ModuleAdminLayout';

// Auth
import PinGate from 'src/components/auth/PinGate';

// Error
import ErrorPage from 'src/components/Error/pages/ErrorPage';
import AdminLayout from "src/views/admin/AdminLayout.tsx";

// Vue enfant
import ChildHome from 'src/views/child/ChildHome';
import ImagierHome from 'src/components/modules/imagier/child/ImagierHome.tsx';
import ImagierGame from 'src/components/modules/imagier/child/ImagierGame.tsx';
import ImagierResult from 'src/components/modules/imagier/child/ImagierResult.tsx';

// Admin
import AdminDashboard from 'src/views/admin/AdminDashboard';
import ModuleCatalog from 'src/views/admin/ModuleCatalog';

import ImagierWordList from 'src/components/modules/imagier/admin/ImagierWordList.tsx';
import ImagierWordForm from 'src/components/modules/imagier/admin/ImagierWordForm.tsx';
import ImagierImport from 'src/components/modules/imagier/admin/ImagierImport.tsx';
import ImagierImageImport from 'src/components/modules/imagier/admin/ImagierImageImport.tsx';
import ImagierSettings from 'src/components/modules/imagier/admin/ImagierSettings.tsx';

import TablesHome from 'src/components/modules/tables/child/TablesHome.tsx';
import TablesGame from 'src/components/modules/tables/child/TablesGame.tsx';
import TablesResult from 'src/components/modules/tables/child/TablesResult.tsx';
import TablesSettings from 'src/components/modules/tables/admin/TablesSettings.tsx';

import CalculHome from 'src/components/modules/calcul/child/CalculHome.tsx';
import CalculGame from 'src/components/modules/calcul/child/CalculGame.tsx';
import CalculResult from 'src/components/modules/calcul/child/CalculResult.tsx';
import CalculSettings from 'src/components/modules/calcul/admin/CalculSettings.tsx';

import MonnaieHome from 'src/components/modules/monnaie/child/MonnaieHome.tsx';
import MonnaieGame from 'src/components/modules/monnaie/child/MonnaieGame.tsx';
import MonnaieResult from 'src/components/modules/monnaie/child/MonnaieResult.tsx';
import MonnaieSettings from 'src/components/modules/monnaie/admin/MonnaieSettings.tsx';

// Settings
import Settings from 'src/views/settings/Settings';

export const MAIN_TITLE = "Maëve"

const IMAGIER_TABS = [
  { to: '/admin/imagier', label: 'Mots', end: true },
  { to: '/admin/imagier/images', label: 'Images' },
  { to: '/admin/imagier/import', label: 'Import JSON' },
  { to: '/admin/imagier/settings', label: 'Paramètres' },
];

const TABLES_TABS = [
  { to: '/admin/tables', label: 'Paramètres', end: true },
];

const CALCUL_TABS = [
  { to: '/admin/calcul-mental', label: 'Paramètres', end: true },
];

const MONNAIE_TABS = [
  { to: '/admin/monnaie', label: 'Paramètres', end: true },
];

const Router = createBrowserRouter([
  // ── Vue enfant (ChildLayout : header contextuel + Outlet) ─────────────────
  {
    element: <ChildLayout />,
    errorElement: <ErrorPage />,
    children: [
      { path: '/', element: <ChildHome />, handle: { title: MAIN_TITLE } },
      { path: '/module/imagier', element: <ImagierHome />, handle: { title: 'Imagier Anglais' } },
      { path: '/module/imagier/play', element: <ImagierGame />, handle: { title: 'Imagier Anglais' } },
      { path: '/module/imagier/result', element: <ImagierResult />, handle: { title: 'Imagier Anglais' } },
      { path: '/module/tables', element: <TablesHome />, handle: { title: 'Tables de multiplication' } },
      { path: '/module/tables/play', element: <TablesGame />, handle: { title: 'Tables de multiplication' } },
      { path: '/module/tables/result', element: <TablesResult />, handle: { title: 'Tables de multiplication' } },
      { path: '/module/calcul-mental', element: <CalculHome />, handle: { title: 'Calcul Mental' } },
      { path: '/module/calcul-mental/play', element: <CalculGame />, handle: { title: 'Calcul Mental' } },
      { path: '/module/calcul-mental/result', element: <CalculResult />, handle: { title: 'Calcul Mental' } },
      { path: '/module/monnaie', element: <MonnaieHome />, handle: { title: 'Monnaie' } },
      { path: '/module/monnaie/play', element: <MonnaieGame />, handle: { title: 'Monnaie' } },
      { path: '/module/monnaie/result', element: <MonnaieResult />, handle: { title: 'Monnaie' } },
    ],
  },

  // ── Settings (protégé PIN) ─────────────────────────────────────────────────
  {
    path: '/settings',
    element: <PinGate><Settings /></PinGate>,
  },

  // ── Admin (protégé PIN, layout sidebar) ───────────────────────────────────
  {
    path: '/admin',
    element: <PinGate><AdminLayout /></PinGate>,
    children: [
      { index: true, element: <AdminDashboard />, handle: { title: 'Tableau de bord admin' } },
      { path: 'modules', element: <ModuleCatalog /> },
      {
        path: 'imagier',
        element: <ModuleAdminLayout title="Imagier Anglais" tabs={IMAGIER_TABS} />,
        children: [
          { index: true, element: <ImagierWordList /> },
          { path: 'import', element: <ImagierImport /> },
          { path: 'images', element: <ImagierImageImport /> },
          { path: 'settings', element: <ImagierSettings /> },
          { path: 'mots/:id', element: <ImagierWordForm /> },
        ],
      },
      {
        path: 'tables',
        element: <ModuleAdminLayout title="Tables de multiplication" tabs={TABLES_TABS} />,
        children: [
          { index: true, element: <TablesSettings /> },
        ],
      },
      {
        path: 'calcul-mental',
        element: <ModuleAdminLayout title="Calcul Mental" tabs={CALCUL_TABS} />,
        children: [
          { index: true, element: <CalculSettings /> },
        ],
      },
      {
        path: 'monnaie',
        element: <ModuleAdminLayout title="Monnaie" tabs={MONNAIE_TABS} />,
        children: [
          { index: true, element: <MonnaieSettings /> },
        ],
      },
    ],
  },
]);

export default Router;
