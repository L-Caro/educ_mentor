import { Outlet } from 'react-router-dom';
import TabNav, { type Tab } from 'src/components/common/TabNav';
import { useModuleMeta } from 'src/hooks/useModuleMeta';

interface ModuleAdminLayoutProps {
  moduleId: string;
  tabs: Tab[];
}

export default function ModuleAdminLayout({ moduleId, tabs }: ModuleAdminLayoutProps) {
  const getModuleMeta = useModuleMeta();
  const title = getModuleMeta(moduleId)?.name ?? '';

  return (
    <div className="ModuleAdminLayout">
      <h2 className="ModuleAdminLayout__title">{title}</h2>
      <TabNav tabs={tabs} />
      <Outlet />
    </div>
  );
}
