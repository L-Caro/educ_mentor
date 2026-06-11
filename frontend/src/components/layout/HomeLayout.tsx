import { useMemo } from 'react';
import { useGetModulesQuery } from 'src/store/api/sharedApi.ts';
import ModuleCard from 'src/components/common/ModuleCard.tsx';
import Spinner from 'src/components/common/Spinner.tsx';
import SessionTimerDisplay from 'src/components/common/SessionTimerDisplay.tsx';

export default function HomeLayout() {
  const { data: modules = [], isLoading: loading } = useGetModulesQuery({ onlyActive: true });

  const hasModules = useMemo(() => modules.length > 0, [modules]);

  if (loading) {
    return (
      <div className="HomeLayout">
        <div className="HomeLayout__loading">
          <Spinner />
        </div>
      </div>
    );
  }

  if (!hasModules) {
    return (
      <div className="HomeLayout">
        <p className="HomeLayout__empty">
          Aucun module activé pour l&apos;instant.
        </p>
      </div>
    );
  }

  return (
    <div className="HomeLayout">
      <div className="HomeLayout__timerRow">
        <SessionTimerDisplay />
      </div>
      <div className="HomeLayout__grid">
        {modules.map((mod) => (
          <div key={mod.id} className="HomeLayout__col">
            <ModuleCard module={mod} />
          </div>
        ))}
      </div>
    </div>
  );
}