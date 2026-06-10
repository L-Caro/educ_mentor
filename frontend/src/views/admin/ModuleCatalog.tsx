import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getModules, updateModule } from 'src/api/catalog.api';
import Spinner from 'src/components/common/Spinner';
import Toggle from 'src/components/common/Toggle';
import type { AppModule } from 'src/types';
import { MODULES } from 'src/modules.manifest';

export default function ModuleCatalog() {
  const [modules, setModules] = useState<AppModule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { getModules().then(setModules).finally(() => setLoading(false)); }, []);

  async function toggleActive(mod: AppModule) {
    const updated = await updateModule(mod.id, { is_active: !mod.is_active });
    setModules((prev) => prev.map((m) => (m.id === mod.id ? updated : m)));
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
