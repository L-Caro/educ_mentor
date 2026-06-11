import { useMemo } from 'react';
import { useGetModulesQuery } from 'src/store/api/api';
import ModuleCard from 'src/components/common/ModuleCard.tsx';
import Spinner from 'src/components/common/Spinner';
import SessionTimerDisplay from 'src/components/common/SessionTimerDisplay';

export default function ChildHome() {
  const { data: modules = [], isLoading: loading } = useGetModulesQuery({ onlyActive: true });

  const hasModules = useMemo(() => modules.length > 0, [modules]);

  if (loading) {
    return (
      <div className="ChildHome">
        <div className="ChildHome__loading">
          <Spinner />
        </div>
      </div>
    );
  }

  if (!hasModules) {
    return (
      <div className="ChildHome">
        <p className="ChildHome__empty">
          Aucun module activé pour l&apos;instant.
        </p>
      </div>
    );
  }

  return (
    <div className="ChildHome">
      <div className="ChildHome__timerRow">
        <SessionTimerDisplay />
      </div>
      <div className="ChildHome__grid">
        {modules.map((mod) => (
          <div key={mod.id} className="ChildHome__col">
            <ModuleCard module={mod} />
          </div>
        ))}
      </div>
    </div>
  );
}