import { Outlet } from 'react-router-dom';
import TabNav from 'src/components/common/TabNav';

const TABS = [
  { to: '/admin/calcul-mental',           label: 'Progression', end: true  },
  { to: '/admin/calcul-mental/settings',  label: 'Paramètres',  end: false },
];

export default function CalculAdmin() {
  return (
    <div className="CalculAdmin">
      <h2 className="CalculAdmin__title">Calcul Mental</h2>
      <TabNav tabs={TABS} />
      <Outlet />
    </div>
  );
}
