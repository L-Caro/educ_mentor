import { Outlet } from 'react-router-dom';
import TabNav from 'src/components/common/TabNav';

const TABS = [
  { to: '/admin/imagier',             label: 'Mots',        end: true  },
  { to: '/admin/imagier/images',      label: 'Images',      end: false },
  { to: '/admin/imagier/import',      label: 'Import JSON', end: false },
  { to: '/admin/imagier/progression', label: 'Progression', end: false },
  { to: '/admin/imagier/settings',    label: 'Paramètres',  end: false },
];

export default function ImagierAdmin() {
  return (
    <div className="ImagierAdmin">
      <h2 className="ImagierAdmin__title">Imagier Anglais</h2>
      <TabNav tabs={TABS} />
      <Outlet />
    </div>
  );
}
