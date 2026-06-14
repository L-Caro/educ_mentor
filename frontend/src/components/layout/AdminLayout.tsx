import { Outlet } from 'react-router-dom';
import TabNav, { type Tab } from 'src/components/common/TabNav.tsx';

interface ModuleAdminLayoutProps {
  moduleId: string;
  tabs: Tab[];
}

export default function AdminLayout({ tabs }: ModuleAdminLayoutProps) {

  return (
    <div>
      <TabNav tabs={tabs} />
      <Outlet />
    </div>
  );
}
