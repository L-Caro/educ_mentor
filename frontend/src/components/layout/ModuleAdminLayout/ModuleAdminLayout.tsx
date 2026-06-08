import { Outlet } from 'react-router-dom';
import TabNav, { type Tab } from 'src/components/common/TabNav';

interface ModuleAdminLayoutProps {
  title: string;
  tabs: Tab[];
}

export default function ModuleAdminLayout({ title, tabs }: ModuleAdminLayoutProps) {
  return (
    <div className="ModuleAdminLayout">
      <h2 className="ModuleAdminLayout__title">{title}</h2>
      <TabNav tabs={tabs} />
      <Outlet />
    </div>
  );
}
