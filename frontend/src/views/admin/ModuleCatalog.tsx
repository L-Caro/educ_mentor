import { Link } from 'react-router-dom';
import { useGetModulesQuery, useUpdateModuleMutation } from 'src/store/api/sharedApi';
import Spinner from 'src/components/common/Spinner';
import Toggle from 'src/components/common/Toggle';
import type { AppModule } from 'src/types';
import { MODULES } from 'src/modules.manifest';

export default function ModuleCatalog() {
  const { data: modules = [], isLoading: loading } = useGetModulesQuery();
  const [updateModule] = useUpdateModuleMutation();

  async function toggleActive(mod: AppModule) {
    await updateModule({ id: mod.id, payload: { is_active: !mod.is_active } });
  }

  if (loading) return <Spinner size="sm" />;

  return (
    <div className="ModuleCatalog">
      <h2 className="ModuleCatalog__title">Modules</h2>
      <p className="ModuleCatalog__subtitle">Activez les modules visibles sur la tablette.</p>

      <div className="ModuleCatalog__list">
        {modules.map((mod) => {
          const manifest = MODULES.find((entry) => entry.id === mod.id);
          return (
            <div key={mod.id} className="ModuleCatalog__item">
              <span className="ModuleCatalog__icon">{mod.icon}</span>
              <div className="ModuleCatalog__info">
                <p className="ModuleCatalog__name">{mod.name}</p>
                {mod.description && <p className="ModuleCatalog__desc">{mod.description}</p>}
              </div>
              <Toggle checked={mod.is_active} onChange={() => toggleActive(mod)} />
              {manifest && (
                <Link to={`/admin/${manifest.id}`} className="ModuleCatalog__configure">
                  Configurer →
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
