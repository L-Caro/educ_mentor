import { Outlet } from 'react-router-dom';
import TabNav from 'src/components/common/TabNav';

const TABS = [
  { to: '/admin/tables',            label: 'Progression', end: true  },
  { to: '/admin/tables/settings',   label: 'Paramètres',  end: false },
];

export default function TablesAdmin() {
  return (
    <div className="TablesAdmin">
      <h2 className="TablesAdmin__title">Tables de multiplication</h2>
      <TabNav tabs={TABS} />
      <Outlet />
    </div>
  );
}
